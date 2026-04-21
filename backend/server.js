import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { XMLParser, XMLValidator, XMLBuilder } from "fast-xml-parser";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 3000;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json({ limit: "5mb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Demasiadas solicitudes. Intenta más tarde."
  }
});

app.use(limiter);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false
});

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true,
  suppressEmptyNode: false
});

function cleanJson(obj) {
  if (Array.isArray(obj)) {
    return obj.map(cleanJson);
  }

  if (typeof obj === "object" && obj !== null) {
    const newObj = {};

    for (const key in obj) {
      if (key.startsWith("@_")) continue;

      const cleanKey = key.includes(":") ? key.split(":")[1] : key;
      newObj[cleanKey] = cleanJson(obj[key]);
    }

    return newObj;
  }

  return obj;
}

function countSeparatorOccurrences(line, separator) {
  if (!separator) return 0;
  return line.split(separator).length - 1;
}

function detectAlternativeSeparator(headerLine, selectedSeparator) {
  const commonSeparators = [",", ";", "|", "\t"];
  const candidates = commonSeparators.filter((sep) => sep !== selectedSeparator);

  let bestSeparator = null;
  let bestCount = 0;

  for (const sep of candidates) {
    const count = countSeparatorOccurrences(headerLine, sep);
    if (count > bestCount) {
      bestCount = count;
      bestSeparator = sep;
    }
  }

  return bestCount > 0 ? bestSeparator : null;
}

function splitCsvLine(line, separator = ",") {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === separator && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseCsv(csvText, separator = ",") {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error("El CSV debe tener encabezados y al menos una fila.");
  }

  if (typeof separator !== "string" || separator.length !== 1) {
    throw new Error("El separador debe ser un solo carácter.");
  }

  const headerLine = lines[0];
  const selectedSeparatorCount = countSeparatorOccurrences(headerLine, separator);

  if (selectedSeparatorCount === 0) {
    const alternative = detectAlternativeSeparator(headerLine, separator);

    if (alternative) {
      throw new Error(
        `El CSV no coincide con el separador '${separator}'. Parece que el archivo usa '${alternative}' como separador.`
      );
    }

    throw new Error(
      `El CSV no contiene el separador '${separator}' en el encabezado.`
    );
  }

  const headers = splitCsvLine(headerLine, separator);

  if (headers.length < 2) {
    throw new Error("El CSV debe tener al menos 2 columnas en el encabezado.");
  }

  if (headers.some((h) => !h)) {
    throw new Error("Hay encabezados vacíos en el CSV.");
  }

  const rows = lines.slice(1).map((line, rowIndex) => {
    const values = splitCsvLine(line, separator);

    if (values.length !== headers.length) {
      throw new Error(
        `La fila ${rowIndex + 2} no tiene el mismo número de columnas que el encabezado. Encabezados: ${headers.length}, fila: ${values.length}.`
      );
    }

    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    return row;
  });

  return rows;
}

function jsonToCsv(data, separator = ",") {
  let rows = data;

  if (!Array.isArray(rows)) {
    if (typeof rows === "object" && rows !== null) {
      rows = [rows];
    } else {
      throw new Error("El JSON debe ser un objeto o arreglo de objetos.");
    }
  }

  if (rows.length === 0) {
    throw new Error("El arreglo JSON está vacío.");
  }

  if (typeof separator !== "string" || separator.length !== 1) {
    throw new Error("El separador debe ser un solo carácter.");
  }

  const headersSet = new Set();

  rows.forEach((row) => {
    if (typeof row !== "object" || row === null || Array.isArray(row)) {
      throw new Error("Cada fila del JSON debe ser un objeto plano.");
    }

    Object.keys(row).forEach((key) => headersSet.add(key));
  });

  const headers = Array.from(headersSet);

  const escapeCsvValue = (value) => {
    if (value === null || value === undefined) return "";
    let stringValue =
      typeof value === "object" ? JSON.stringify(value) : String(value);

    if (
      stringValue.includes(separator) ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      stringValue = `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  };

  const lines = [
    headers.join(separator),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(separator)
    )
  ];

  return lines.join("\n");
}

function jsonToXml(jsonData, rootName = "root") {
  let payload;

  if (Array.isArray(jsonData)) {
    payload = {
      [rootName]: {
        item: jsonData
      }
    };
  } else if (typeof jsonData === "object" && jsonData !== null) {
    payload = {
      [rootName]: jsonData
    };
  } else {
    throw new Error("El JSON debe ser un objeto o arreglo.");
  }

  return builder.build(payload);
}

function csvToXml(csvText, separator = ",", rootName = "items", itemName = "item") {
  const rows = parseCsv(csvText, separator);

  const payload = {
    [rootName]: {
      [itemName]: rows
    }
  };

  return builder.build(payload);
}

function isPrimitiveValue(value) {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function findBestArrayForCsv(node, currentPath = "") {
  if (Array.isArray(node)) {
    const allObjects = node.every(
      (item) => typeof item === "object" && item !== null && !Array.isArray(item)
    );

    if (allObjects && node.length > 0) {
      return {
        array: node,
        path: currentPath || "/"
      };
    }

    for (let i = 0; i < node.length; i++) {
      const found = findBestArrayForCsv(node[i], `${currentPath}[${i}]`);
      if (found) return found;
    }
  }

  if (typeof node === "object" && node !== null) {
    for (const key of Object.keys(node)) {
      const nextPath = currentPath ? `${currentPath}/${key}` : `/${key}`;
      const found = findBestArrayForCsv(node[key], nextPath);
      if (found) return found;
    }
  }

  return null;
}

function flattenObjectForCsv(obj) {
  const flat = {};

  for (const [key, value] of Object.entries(obj)) {
    if (isPrimitiveValue(value)) {
      flat[key] = value ?? "";
    } else if (Array.isArray(value)) {
      flat[key] = JSON.stringify(value);
    } else if (typeof value === "object" && value !== null) {
      flat[key] = JSON.stringify(value);
    } else {
      flat[key] = String(value);
    }
  }

  return flat;
}

function xmlToCsv(xmlText, separator = ",") {
  const validation = XMLValidator.validate(xmlText);

  if (validation !== true) {
    throw new Error("XML inválido.");
  }

  const parsed = parser.parse(xmlText);
  const cleaned = cleanJson(parsed);

  const found = findBestArrayForCsv(cleaned);

  if (!found) {
    throw new Error(
      "No se pudo convertir XML a CSV porque el XML no tiene una estructura tabular simple con nodos repetidos."
    );
  }

  const flattenedRows = found.array.map(flattenObjectForCsv);
  const csv = jsonToCsv(flattenedRows, separator);

  return {
    csv,
    detectedPath: found.path
  };
}

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    app: "PayloadLab API",
    version: "2.5.0"
  });
});

app.post("/xml-to-json", (req, res) => {
  try {
    const body = req.body || {};
    const xml = body.xml;

    if (!xml || typeof xml !== "string") {
      return res.status(400).json({
        success: false,
        error: "Debes enviar un campo 'xml' como texto."
      });
    }

    const validation = XMLValidator.validate(xml);

    if (validation !== true) {
      return res.status(400).json({
        success: false,
        error: "XML inválido",
        details: validation.err
      });
    }

    const result = parser.parse(xml);
    const cleaned = cleanJson(result);

    return res.json({
      success: true,
      data: cleaned
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "No se pudo convertir XML a JSON.",
      details: error.message
    });
  }
});

app.post("/json-to-xml", (req, res) => {
  try {
    const body = req.body || {};
    const jsonText = body.jsonText;
    const rootName = body.rootName || "root";

    if (!jsonText || typeof jsonText !== "string") {
      return res.status(400).json({
        success: false,
        error: "Debes enviar un campo 'jsonText' como texto."
      });
    }

    const parsed = JSON.parse(jsonText);
    const xml = jsonToXml(parsed, rootName);

    return res.json({
      success: true,
      data: xml
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: "No se pudo convertir JSON a XML.",
      details: error.message
    });
  }
});

app.post("/csv-to-json", (req, res) => {
  try {
    const body = req.body || {};
    const csvText = body.csvText;
    const separator = body.separator || ",";

    if (!csvText || typeof csvText !== "string") {
      return res.status(400).json({
        success: false,
        error: "Debes enviar un campo 'csvText' como texto."
      });
    }

    const rows = parseCsv(csvText, separator);

    return res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: "No se pudo convertir CSV a JSON.",
      details: error.message
    });
  }
});

app.post("/json-to-csv", (req, res) => {
  try {
    const body = req.body || {};
    const jsonText = body.jsonText;
    const separator = body.separator || ",";

    if (!jsonText || typeof jsonText !== "string") {
      return res.status(400).json({
        success: false,
        error: "Debes enviar un campo 'jsonText' como texto."
      });
    }

    const parsed = JSON.parse(jsonText);
    const csv = jsonToCsv(parsed, separator);

    return res.json({
      success: true,
      data: csv
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: "No se pudo convertir JSON a CSV.",
      details: error.message
    });
  }
});

app.post("/csv-to-xml", (req, res) => {
  try {
    const body = req.body || {};
    const csvText = body.csvText;
    const separator = body.separator || ",";
    const rootName = body.rootName || "items";
    const itemName = body.itemName || "item";

    if (!csvText || typeof csvText !== "string") {
      return res.status(400).json({
        success: false,
        error: "Debes enviar un campo 'csvText' como texto."
      });
    }

    const xml = csvToXml(csvText, separator, rootName, itemName);

    return res.json({
      success: true,
      data: xml
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: "No se pudo convertir CSV a XML.",
      details: error.message
    });
  }
});

app.post("/xml-to-csv", (req, res) => {
  try {
    const body = req.body || {};
    const xml = body.xml;
    const separator = body.separator || ",";

    if (!xml || typeof xml !== "string") {
      return res.status(400).json({
        success: false,
        error: "Debes enviar un campo 'xml' como texto."
      });
    }

    const result = xmlToCsv(xml, separator);

    return res.json({
      success: true,
      data: result.csv,
      meta: {
        detectedPath: result.detectedPath
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: "No se pudo convertir XML a CSV.",
      details: error.message
    });
  }
});

app.post("/validate-xml", (req, res) => {
  try {
    const body = req.body || {};
    const xml = body.xml;

    if (!xml || typeof xml !== "string") {
      return res.status(400).json({
        success: false,
        error: "Debes enviar un campo 'xml' como texto."
      });
    }

    const validation = XMLValidator.validate(xml);

    if (validation === true) {
      return res.json({
        success: true,
        valid: true
      });
    }

    return res.status(400).json({
      success: false,
      valid: false,
      error: "XML inválido",
      details: validation.err
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error validando XML.",
      details: error.message
    });
  }
});

app.post("/validate-json", (req, res) => {
  try {
    const body = req.body || {};
    const jsonText = body.jsonText;

    if (!jsonText || typeof jsonText !== "string") {
      return res.status(400).json({
        success: false,
        error: "Debes enviar un campo 'jsonText' como texto."
      });
    }

    const parsed = JSON.parse(jsonText);

    return res.json({
      success: true,
      valid: true,
      data: parsed
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      valid: false,
      error: "JSON inválido",
      details: error.message
    });
  }
});

app.post("/format-xml", (req, res) => {
  try {
    const body = req.body || {};
    const xml = body.xml;

    if (!xml || typeof xml !== "string") {
      return res.status(400).json({
        success: false,
        error: "Debes enviar un campo 'xml' como texto."
      });
    }

    const validation = XMLValidator.validate(xml);

    if (validation !== true) {
      return res.status(400).json({
        success: false,
        error: "XML inválido",
        details: validation.err
      });
    }

    const parsed = parser.parse(xml);
    const formatted = builder.build(parsed);

    return res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "No se pudo formatear el XML.",
      details: error.message
    });
  }
});

app.post("/format-json", (req, res) => {
  try {
    const body = req.body || {};
    const jsonText = body.jsonText;

    if (!jsonText || typeof jsonText !== "string") {
      return res.status(400).json({
        success: false,
        error: "Debes enviar un campo 'jsonText' como texto."
      });
    }

    const parsed = JSON.parse(jsonText);
    const formatted = JSON.stringify(parsed, null, 2);

    return res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: "JSON inválido",
      details: error.message
    });
  }
});

app.post("/extract-xpaths", (req, res) => {
  try {
    const body = req.body || {};
    const xml = body.xml;

    if (!xml || typeof xml !== "string") {
      return res.status(400).json({
        success: false,
        error: "Debes enviar un campo 'xml'."
      });
    }

    const validation = XMLValidator.validate(xml);

    if (validation !== true) {
      return res.status(400).json({
        success: false,
        error: "XML inválido",
        details: validation.err
      });
    }

    const parsed = parser.parse(xml);
    const cleaned = cleanJson(parsed);
    const paths = [];

    function traverse(obj, currentPath) {
      if (typeof obj !== "object" || obj === null) return;

      for (const key of Object.keys(obj)) {
        const newPath = `${currentPath}/${key}`;
        paths.push(newPath);
        traverse(obj[key], newPath);
      }
    }

    traverse(cleaned, "");

    return res.json({
      success: true,
      paths
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "No se pudieron extraer los XPaths.",
      details: error.message
    });
  }
});

app.post("/base64/encode", (req, res) => {
  try {
    const body = req.body || {};
    const text = body.text;

    if (typeof text !== "string") {
      return res.status(400).json({
        success: false,
        error: "Debes enviar un campo 'text' como texto."
      });
    }

    const encoded = Buffer.from(text, "utf-8").toString("base64");

    return res.json({
      success: true,
      data: encoded
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "No se pudo codificar en Base64.",
      details: error.message
    });
  }
});

app.post("/base64/decode", (req, res) => {
  try {
    const body = req.body || {};
    const text = body.text;

    if (typeof text !== "string") {
      return res.status(400).json({
        success: false,
        error: "Debes enviar un campo 'text' como texto."
      });
    }

    const decoded = Buffer.from(text, "base64").toString("utf-8");

    return res.json({
      success: true,
      data: decoded
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "No se pudo decodificar Base64.",
      details: error.message
    });
  }
});

app.post("/ai/explain", async (req, res) => {
  try {
    const { content, format } = req.body;

    if (!content || !String(content).trim()) {
      return res.status(400).json({
        success: false,
        error: "No se recibió contenido para analizar."
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "Falta configurar OPENAI_API_KEY en el backend."
      });
    }

    const prompt = `
Analiza el siguiente payload de integración.

Formato declarado: ${format || "auto"}

Responde en español claro y profesional con estas secciones:

1. Resumen funcional
2. Estructura técnica
3. Observaciones relevantes

Reglas:
- No inventes información que no esté en el payload.
- Si detectas posibles campos vacíos, estructuras repetidas, ids, fechas o riesgos, menciónalos.
- Sé útil para alguien que trabaja con integraciones, APIs y debugging técnico.

Payload:
${content}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "Eres un experto en payloads, APIs, integraciones y debugging técnico."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const text = completion.choices?.[0]?.message?.content || "No se pudo generar la explicación.";

    return res.json({
      success: true,
      data: text
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Error interno al analizar con IA."
    });
  }
});

app.listen(PORT, () => {
  console.log(`PayloadLab API corriendo en http://localhost:${PORT}`);
});