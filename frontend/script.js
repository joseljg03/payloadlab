const API = "https://payloadlab-backend.onrender.com";

function trackEvent(name, params = {}) {
  if (typeof gtag !== "undefined") {
    gtag("event", name, params);
  }
}


const SNIPPETS_KEY = "payloadlab_snippets_v1";

const toolButtons = document.querySelectorAll(".tool-btn");
const toolSections = document.querySelectorAll(".tool-section");

let pendingSnippetContent = "";
let pendingSnippetType = "text";
let snippetPickerTarget = null;

/* =========================
   Navegación
========================= */
function activateTool(target) {
  toolButtons.forEach((btn) => btn.classList.remove("active"));
  toolSections.forEach((section) => section.classList.remove("active"));

  const targetButton = document.querySelector(`.tool-btn[data-tool="${target}"]`);
  const targetSection = document.getElementById(target);

  if (targetButton) targetButton.classList.add("active");
  if (targetSection) targetSection.classList.add("active");

  updateContextTip(target);
  closeSidebar();
}

document.querySelectorAll("[data-go]").forEach((element) => {
  element.addEventListener("click", (event) => {
    event.stopPropagation();
    const target = element.getAttribute("data-go");
    if (!target) return;
    activateTool(target);
  });
});

const homeSearchInput = document.getElementById("homeToolSearch");
const homeTabs = document.querySelectorAll(".home-tab");
const toolCards = document.querySelectorAll(".tool-card");

let activeHomeFilter = "all";

function filterHomeTools() {
  const search = (homeSearchInput?.value || "").trim().toLowerCase();

  toolCards.forEach((card) => {
    const category = (card.getAttribute("data-category") || "").toLowerCase();
    const content = card.textContent.toLowerCase();

    const matchesFilter =
      activeHomeFilter === "all" || category.includes(activeHomeFilter);

    const matchesSearch = content.includes(search);

    card.style.display = matchesFilter && matchesSearch ? "flex" : "none";
  });
}

homeSearchInput?.addEventListener("input", filterHomeTools);

homeTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    homeTabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    activeHomeFilter = tab.getAttribute("data-filter") || "all";
    filterHomeTools();
  });
});

filterHomeTools();

toolButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activateTool(button.dataset.tool);
  });
});

/* =========================
   Sidebar / Brand / Tips
========================= */
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const menuToggle = document.getElementById("menuToggle");
const closeSidebarBtn = document.getElementById("closeSidebarBtn");
const brandHomeBtn = document.getElementById("brandHomeBtn");
const sidebarBrandBtn = document.getElementById("sidebarBrandBtn");


function openSidebar() {
  sidebar?.classList.remove("collapsed");
  sidebarOverlay?.classList.remove("hidden");
  menuToggle?.classList.add("is-active");
}

function closeSidebar() {
  sidebar?.classList.add("collapsed");
  sidebarOverlay?.classList.add("hidden");
  menuToggle?.classList.remove("is-active");
}

menuToggle?.addEventListener("click", openSidebar);
closeSidebarBtn?.addEventListener("click", closeSidebar);
sidebarOverlay?.addEventListener("click", closeSidebar);

brandHomeBtn?.addEventListener("click", () => activateTool("home"));

const btnToggleJsonAiModal = document.getElementById("btnToggleJsonAiModal");
const btnCloseJsonAiModal = document.getElementById("btnCloseJsonAiModal");
const jsonAiModal = document.getElementById("jsonAiModal");
const jsonAiModalBackdrop = document.getElementById("jsonAiModalBackdrop");

function openJsonAiModal() {
  jsonAiModal?.classList.remove("hidden");
}

function closeJsonAiModal() {
  jsonAiModal?.classList.add("hidden");
}

btnToggleJsonAiModal?.addEventListener("click", openJsonAiModal);
btnCloseJsonAiModal?.addEventListener("click", closeJsonAiModal);
jsonAiModalBackdrop?.addEventListener("click", closeJsonAiModal);

const btnToggleXmlAiModal = document.getElementById("btnToggleXmlAiModal");
const btnCloseXmlAiModal = document.getElementById("btnCloseXmlAiModal");
const xmlAiModal = document.getElementById("xmlAiModal");
const xmlAiModalBackdrop = document.getElementById("xmlAiModalBackdrop");

function openXmlAiModal() {
  xmlAiModal?.classList.remove("hidden");
}

function closeXmlAiModal() {
  xmlAiModal?.classList.add("hidden");
}

btnToggleXmlAiModal?.addEventListener("click", openXmlAiModal);
btnCloseXmlAiModal?.addEventListener("click", closeXmlAiModal);
xmlAiModalBackdrop?.addEventListener("click", closeXmlAiModal);


sidebarBrandBtn?.addEventListener("click", () => activateTool("home"));

function updateContextTip(tool) {
  const tipMap = {
    home: "",
    xmlTools: "Tip: valida primero y luego usa Extraer XPaths para ubicar rápido nodos útiles dentro de XML grandes.",
    jsonTools: "Tip: valida antes de formatear; así detectas errores de estructura antes de limpiar el contenido.",
    convertersTools: "Tip: antes de convertir, revisa origen, destino, root y separador para evitar salidas incorrectas.",
    snippetsTools: "Tip: guarda inputs y resultados frecuentes para reutilizarlos en pruebas, debugging o demos.",
    textCounter: "Tip: usa esta vista para medir rápidamente caracteres, palabras y líneas antes de pegar texto en otra herramienta.",
    textDiff: "Tip: compara versión original vs nueva para detectar exactamente qué cambió línea por línea.",
    base64Tools: "Tip: si algo falla al decodificar, revisa que el contenido no tenga espacios extra ni texto truncado."
  };

  const tipsByElement = {
    xmlTools: document.getElementById("inlineToolTipXml"),
    jsonTools: document.getElementById("inlineToolTipJson"),
    convertersTools: document.getElementById("inlineToolTipConverters"),
    snippetsTools: document.getElementById("inlineToolTipSnippets"),
    textCounter: document.getElementById("inlineToolTipCounter"),
    textDiff: document.getElementById("inlineToolTipDiff"),
    base64Tools: document.getElementById("inlineToolTipBase64")
  };

  Object.values(tipsByElement).forEach((el) => {
    if (el) el.textContent = "";
  });

  if (tipsByElement[tool]) {
    tipsByElement[tool].textContent = tipMap[tool] || "";
  }
}

updateContextTip("home");


/* =========================
   Utilidades UI
========================= */
function setStatus(message) {
  const el = document.getElementById("globalStatus");
  if (el) el.textContent = message;
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 250);
  }, 1800);
}

function getOutputLanguage(id, value = "") {
  const text = String(value || "").trim();

  if (id === "diffOutput") return "language-plaintext";
  if (id === "counterOutput") return "language-plaintext";
  if (id === "base64Output") return "language-plaintext";

  // Detectar por contenido primero
  if (text.startsWith("<")) return "language-xml";
  if (text.startsWith("{") || text.startsWith("[")) return "language-json";

  // Fallback por output
  if (id === "xmlOutput") return "language-xml";
  if (id === "jsonOutput") return "language-json";
  if (id === "converterOutput") return "language-plaintext";

  return "language-plaintext";
}

function setOutput(id, value) {
  const el = document.getElementById(id);
  if (!el) return;

  const isError = String(value).toLowerCase().includes("error");

  el.parentElement.classList.remove("output-error", "output-success");

  if (isError) {
    el.parentElement.classList.add("output-error");
  } else {
    el.parentElement.classList.add("output-success");
  }

  const safeValue = value == null ? "" : String(value);

  el.className = getOutputLanguage(id, safeValue);
  el.removeAttribute("data-highlighted");
  el.textContent = safeValue;

  if (window.hljs) {
    hljs.highlightElement(el);
  }
}

async function copyOutput(id) {
  const el = document.getElementById(id);
  const text = el ? el.textContent.trim() : "";

  if (!text) {
    setStatus("No hay salida para copiar");
    showToast("No hay salida para copiar", "error");
    return;
  }

  await navigator.clipboard.writeText(text);
  setStatus("Salida copiada");
  showToast("Salida copiada ✅", "success");
}

async function postJson(endpoint, payload) {
  const response = await fetch(`${API}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!isJson) {
    const text = await response.text();
    throw new Error(
      `El backend no respondió JSON. Revisa si reiniciaste el servidor o si el endpoint existe. Respuesta: ${text.slice(0, 120)}`
    );
  }

  const result = await response.json();
  return { response, result };
}
async function explainPayload(content, format) {
  return postJson("/ai/explain", { content, format });
}

/* =========================
   Snippets storage
========================= */
function getSnippets() {
  try {
    return JSON.parse(localStorage.getItem(SNIPPETS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveSnippets(snippets) {
  localStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));
}

function saveSnippetFromTool(content, suggestedType, defaultName = "") {
  const cleanContent = (content || "").trim();

  if (!cleanContent) {
    setStatus("No hay contenido para guardar");
    showToast("No hay contenido para guardar", "error");
    return;
  }

  openSaveSnippetModal(cleanContent, suggestedType, defaultName);
}

function openSaveSnippetModal(content, type, defaultName = "") {
  pendingSnippetContent = content;
  pendingSnippetType = type;

  document.getElementById("saveSnippetName").value = defaultName;
  document.getElementById("saveSnippetType").value = type;

  document.getElementById("saveSnippetModal").classList.remove("hidden");
}

function closeSaveSnippetModal() {
  document.getElementById("saveSnippetModal").classList.add("hidden");
}


/* =========================
   Snippet picker modal
========================= */
function getSuggestedSnippetType(target) {
  if (target === "xmlInput") return "xml";
  if (target === "jsonInput") return "json";

  if (target === "converterInput") {
    const source = document.getElementById("converterSource")?.value;
    if (source === "xml") return "xml";
    if (source === "json") return "json";
    if (source === "csv") return "csv";
    return "all";
  }

  if (target === "counterInput") return "text";
  if (target === "textDiff") return "text";
  if (target === "base64Input") return "base64";

  return "all";
}

function openSnippetPicker(target) {

  snippetPickerTarget = target;

  document.getElementById("snippetPickerModal").classList.remove("hidden");

  document.getElementById("snippetPickerSearch").value = "";

  const typeFilter = document.getElementById("snippetPickerTypeFilter");

  if (typeFilter) {

    typeFilter.value = getSuggestedSnippetType(target);

  }

  renderSnippetPickerList();

}

function closeSnippetPicker() {
  snippetPickerTarget = null;
  document.getElementById("snippetPickerModal").classList.add("hidden");
}

function applySnippetToTarget(snippet, target) {
  if (!target) return;

  if (target === "xmlInput") {
    activateTool("xmlTools");
    document.getElementById("xmlInput").value = snippet.content;
    setStatus("Snippet cargado en XML Tools");
    showToast("Snippet cargado en XML Tools ✅", "success");
    return;
  }

  if (target === "jsonInput") {
    activateTool("jsonTools");
    document.getElementById("jsonInput").value = snippet.content;
    setStatus("Snippet cargado en JSON Tools");
    showToast("Snippet cargado en JSON Tools ✅", "success");
    return;
  }

  if (target === "converterInput") {
    activateTool("convertersTools");
    document.getElementById("converterInput").value = snippet.content;
    setStatus("Snippet cargado en Convertidores");
    showToast("Snippet cargado en Convertidores ✅", "success");
    return;
  }

  if (target === "counterInput") {
    activateTool("textCounter");
    document.getElementById("counterInput").value = snippet.content;
    setStatus("Snippet cargado en Contador de texto");
    showToast("Snippet cargado en Contador de texto ✅", "success");
    return;
  }

  if (target === "textA") {
    activateTool("textDiff");
    document.getElementById("textA").value = snippet.content;
    updateCounter();
    setStatus("Snippet cargado en Texto A");
    showToast("Snippet cargado en Texto A ✅", "success");
    return;
  }

  if (target === "textB") {
    activateTool("textDiff");
    document.getElementById("textB").value = snippet.content;
    updateCounter();
    setStatus("Snippet cargado en Texto B");
    showToast("Snippet cargado en Texto B ✅", "success");
    return;
  }

  if (target === "base64Input") {
    activateTool("base64Tools");
    document.getElementById("base64Input").value = snippet.content;
    setStatus("Snippet cargado en Base64");
    showToast("Snippet cargado en Base64 ✅", "success");
    return;
  }

  if (target === "snippetEditor") {
    activateTool("snippetsTools");
    document.getElementById("snippetName").value = snippet.name;
    document.getElementById("snippetType").value = snippet.type;
    document.getElementById("snippetContent").value = snippet.content;
    setStatus("Snippet cargado en editor");
    showToast("Snippet cargado en editor ✅", "success");
  }
}

function renderSnippetPickerList() {
  const list = document.getElementById("snippetPickerList");
  const search = document.getElementById("snippetPickerSearch").value.trim().toLowerCase();
  const selectedType = document.getElementById("snippetPickerTypeFilter").value;
  const snippets = getSnippets();

  const filtered = snippets
    .slice()
    .reverse()
    .filter((snippet) => {
      const haystack = `${snippet.name} ${snippet.type} ${snippet.content}`.toLowerCase();
      const matchesSearch = haystack.includes(search);
      const matchesType = selectedType === "all" || snippet.type === selectedType;
      return matchesSearch && matchesType;
    });

  list.innerHTML = "";

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-snippets">No se encontraron snippets.</div>`;
    return;
  }

  filtered.forEach((snippet) => {
    const item = document.createElement("div");
    item.className = "snippet-picker-item";

    const info = document.createElement("div");
    info.className = "snippet-picker-info";

    const title = document.createElement("div");
    title.className = "snippet-title";
    title.textContent = snippet.name;

    const meta = document.createElement("div");
    meta.className = "snippet-meta";
    meta.textContent = `${snippet.type.toUpperCase()} · ${new Date(snippet.createdAt).toLocaleString()}`;

    const preview = document.createElement("div");
    preview.className = "snippet-picker-preview";
    preview.textContent =
      snippet.content.length > 140
        ? snippet.content.slice(0, 140) + "..."
        : snippet.content;

    info.appendChild(title);
    info.appendChild(meta);
    info.appendChild(preview);

    const action = document.createElement("div");
    action.className = "snippet-picker-action";

    if (snippetPickerTarget === "textDiff") {
      const btnA = document.createElement("button");
      btnA.textContent = "Cargar en A";
      btnA.addEventListener("click", () => {
        applySnippetToTarget(snippet, "textA");
        closeSnippetPicker();
      });

      const btnB = document.createElement("button");
      btnB.textContent = "Cargar en B";
      btnB.addEventListener("click", () => {
        applySnippetToTarget(snippet, "textB");
        closeSnippetPicker();
      });

      action.appendChild(btnA);
      action.appendChild(btnB);
    } else {
      const btn = document.createElement("button");
      btn.textContent = "Usar";
      btn.addEventListener("click", () => {
        applySnippetToTarget(snippet, snippetPickerTarget);
        closeSnippetPicker();
      });

      action.appendChild(btn);
    }

    item.appendChild(info);
    item.appendChild(action);

    list.appendChild(item);
  });
}

/* listeners modal */
document.getElementById("btnCloseSnippetPicker")?.addEventListener("click", closeSnippetPicker);
document.getElementById("snippetPickerBackdrop")?.addEventListener("click", closeSnippetPicker);
document.getElementById("snippetPickerSearch")?.addEventListener("input", renderSnippetPickerList);
document.getElementById("snippetPickerTypeFilter")?.addEventListener("change", renderSnippetPickerList);
document.getElementById("btnCloseSaveSnippet")?.addEventListener("click", closeSaveSnippetModal);
document.getElementById("saveSnippetBackdrop")?.addEventListener("click", closeSaveSnippetModal);

/* =========================
   Snippets manager
========================= */
function renderSnippets() {
  const list = document.getElementById("snippetsList");
  const snippets = getSnippets();

  if (!list) return;

  list.innerHTML = "";

  if (snippets.length === 0) {
    list.innerHTML = `<div class="empty-snippets">No hay snippets guardados todavía.</div>`;
    return;
  }

  snippets
    .slice()
    .reverse()
    .forEach((snippet) => {
      const card = document.createElement("div");
      card.className = "snippet-card";

      const header = document.createElement("div");
      header.className = "snippet-card-header";

      const titleWrap = document.createElement("div");
      titleWrap.className = "snippet-title-wrap";

      const title = document.createElement("div");
      title.className = "snippet-title";
      title.textContent = snippet.name;

      const meta = document.createElement("div");
      meta.className = "snippet-meta";
      meta.textContent = `${snippet.type.toUpperCase()} · ${new Date(snippet.createdAt).toLocaleString()}`;

      titleWrap.appendChild(title);
      titleWrap.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "snippet-actions";

      const openBtn = document.createElement("button");
      openBtn.textContent = "Abrir";
      openBtn.className = "secondary";
      openBtn.addEventListener("click", () => applySnippetToTarget(snippet, "snippetEditor"));

      const copyBtn = document.createElement("button");
      copyBtn.textContent = "Copiar";
      copyBtn.className = "secondary";
      copyBtn.addEventListener("click", async () => {
        await navigator.clipboard.writeText(snippet.content);
        setStatus("Snippet copiado");
        showToast("Snippet copiado ✅", "success");
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Eliminar";
      deleteBtn.className = "secondary danger";
      deleteBtn.addEventListener("click", () => deleteSnippet(snippet.id));

      actions.appendChild(openBtn);
      actions.appendChild(copyBtn);
      actions.appendChild(deleteBtn);

      header.appendChild(titleWrap);
      header.appendChild(actions);

      const preview = document.createElement("pre");
      preview.className = "snippet-preview";
      preview.textContent =
        snippet.content.length > 300
          ? snippet.content.slice(0, 300) + "\n..."
          : snippet.content;

      card.appendChild(header);
      card.appendChild(preview);
      list.appendChild(card);
    });
}

function deleteSnippet(id) {
  const snippets = getSnippets().filter((item) => item.id !== id);
  saveSnippets(snippets);
  renderSnippets();
  setStatus("Snippet eliminado");
  showToast("Snippet eliminado", "info");
}

document.getElementById("btnSaveSnippet")?.addEventListener("click", () => {
  const name = document.getElementById("snippetName").value.trim();
  const type = document.getElementById("snippetType").value;
  const content = document.getElementById("snippetContent").value.trim();

  if (!name) {
    setStatus("Ponle nombre al snippet");
    showToast("Ponle nombre al snippet", "error");
    return;
  }

  if (!content) {
    setStatus("Pega contenido para guardar");
    showToast("Pega contenido para guardar", "error");
    return;
  }

  const snippets = getSnippets();

  snippets.push({
    id: crypto.randomUUID(),
    name,
    type,
    content,
    createdAt: new Date().toISOString()
  });

  saveSnippets(snippets);
  renderSnippets();

  setStatus("Snippet guardado");
  showToast("Snippet guardado ✅", "success");
});

document.getElementById("btnClearSnippetForm")?.addEventListener("click", () => {
  document.getElementById("snippetName").value = "";
  document.getElementById("snippetType").value = "xml";
  document.getElementById("snippetContent").value = "";
  setStatus("Formulario limpio");
  showToast("Formulario limpio", "info");
});

document.getElementById("btnDeleteAllSnippets")?.addEventListener("click", () => {
  const snippets = getSnippets();

  if (snippets.length === 0) {
    showToast("No hay snippets para eliminar", "info");
    return;
  }

  const confirmed = window.confirm("¿Seguro que quieres eliminar todos los snippets?");
  if (!confirmed) return;

  localStorage.removeItem(SNIPPETS_KEY);
  renderSnippets();
  setStatus("Todos los snippets fueron eliminados");
  showToast("Snippets eliminados", "info");
});

renderSnippets();

/* =========================
   Load snippet buttons per tool
========================= */
document.getElementById("btnLoadSnippetXml")?.addEventListener("click", () => openSnippetPicker("xmlInput"));
document.getElementById("btnLoadSnippetJson")?.addEventListener("click", () => openSnippetPicker("jsonInput"));
document.getElementById("btnLoadSnippetConverter")?.addEventListener("click", () => openSnippetPicker("converterInput"));
document.getElementById("btnLoadSnippetCounter")?.addEventListener("click", () => openSnippetPicker("counterInput"));
document.getElementById("btnLoadSnippetDiff")?.addEventListener("click", () => openSnippetPicker("textDiff"));
document.getElementById("btnLoadSnippetBase64")?.addEventListener("click", () => openSnippetPicker("base64Input"));
document.getElementById("btnSaveSnippetXml")?.addEventListener("click", () => {
  const content = document.getElementById("xmlInput").value;
  saveSnippetFromTool(content, "xml", "XML snippet");
});

document.getElementById("btnSaveSnippetJson")?.addEventListener("click", () => {
  const content = document.getElementById("jsonInput").value;
  saveSnippetFromTool(content, "json", "JSON snippet");
});

document.getElementById("btnSaveSnippetConverter")?.addEventListener("click", () => {
  const content = document.getElementById("converterInput").value;
  const sourceType = document.getElementById("converterSource")?.value || "other";
  saveSnippetFromTool(content, sourceType, `Converter ${sourceType.toUpperCase()} snippet`);
});

document.getElementById("btnSaveSnippetCounter")?.addEventListener("click", () => {
  const content = document.getElementById("counterInput").value;
  saveSnippetFromTool(content, "text", "Texto contador");
});

document.getElementById("btnSaveSnippetTextA")?.addEventListener("click", () => {
  const content = document.getElementById("textA").value;
  saveSnippetFromTool(content, "text", "Texto A");
});

document.getElementById("btnSaveSnippetTextB")?.addEventListener("click", () => {
  const content = document.getElementById("textB").value;
  saveSnippetFromTool(content, "text", "Texto B");
});

document.getElementById("btnSaveSnippetBase64")?.addEventListener("click", () => {
  const content = document.getElementById("base64Input").value;
  saveSnippetFromTool(content, "base64", "Base64 snippet");
});

document.getElementById("btnSaveXmlOutputSnippet")?.addEventListener("click", () => {
  const content = document.getElementById("xmlOutput").textContent || "";
  saveSnippetFromTool(content, "json", "Resultado XML Tools");
});

document.getElementById("btnSaveJsonOutputSnippet")?.addEventListener("click", () => {
  const content = document.getElementById("jsonOutput").textContent || "";
  saveSnippetFromTool(content, "json", "Resultado JSON Tools");
});

document.getElementById("btnSaveConverterOutputSnippet")?.addEventListener("click", () => {
  const content = document.getElementById("converterOutput").textContent || "";
  const targetType = document.getElementById("converterTarget")?.value || "other";
  saveSnippetFromTool(content, targetType, `Resultado convertidor ${targetType.toUpperCase()}`);
});

document.getElementById("btnSaveCounterOutputSnippet")?.addEventListener("click", () => {
  const content = document.getElementById("counterOutput").textContent || "";
  saveSnippetFromTool(content, "text", "Resultado contador");
});

document.getElementById("btnSaveDiffOutputSnippet")?.addEventListener("click", () => {
  const content = document.getElementById("diffOutput").textContent || "";
  saveSnippetFromTool(content, "text", "Resultado comparador");
});

document.getElementById("btnSaveBase64OutputSnippet")?.addEventListener("click", () => {
  const content = document.getElementById("base64Output").textContent || "";
  saveSnippetFromTool(content, "base64", "Resultado Base64");
});
/* =========================
   Convertidores: campos dinámicos
========================= */
function updateConverterDynamicFields() {
  const source = document.getElementById("converterSource")?.value;
  const target = document.getElementById("converterTarget")?.value;

  const rootNameWrapper = document.getElementById("rootNameWrapper");
  const itemNameWrapper = document.getElementById("itemNameWrapper");
  const separatorWrapper = document.getElementById("separatorWrapper");

  const needsRootName =
    (source === "json" && target === "xml") ||
    (source === "csv" && target === "xml");

  const needsItemName = source === "csv" && target === "xml";
  const needsSeparator = source === "csv" || target === "csv";

  if (rootNameWrapper) rootNameWrapper.style.display = needsRootName ? "block" : "none";
  if (itemNameWrapper) itemNameWrapper.style.display = needsItemName ? "block" : "none";
  if (separatorWrapper) separatorWrapper.style.display = needsSeparator ? "block" : "none";
}

document.getElementById("converterSource")?.addEventListener("change", updateConverterDynamicFields);
document.getElementById("converterTarget")?.addEventListener("change", updateConverterDynamicFields);
updateConverterDynamicFields();

/* =========================
   File loaders
========================= */
function detectFileTypeFromName(fileName = "") {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".xml")) return "xml";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".b64") || lower.endsWith(".base64")) return "base64";
  if (lower.endsWith(".txt")) return "text";

  return "text";
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result || "");
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));

    reader.readAsText(file);
  });
}

function setFileMeta(metaId, file) {
  const meta = document.getElementById(metaId);
  if (!meta) return;

  const kb = (file.size / 1024).toFixed(1);
  meta.textContent = `Archivo cargado: ${file.name} · ${kb} KB`;
}

function setupFileLoader({
  fileInputId,
  dropzoneId,
  buttonId,
  metaId,
  onLoad
}) {
  const fileInput = document.getElementById(fileInputId);
  const dropzone = document.getElementById(dropzoneId);
  const button = document.getElementById(buttonId);

  if (!fileInput || !dropzone || !button) return;

  button.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await readFileAsText(file);
      onLoad(text, file);
      setFileMeta(metaId, file);
      showToast(`Archivo ${file.name} cargado ✅`, "success");
    } catch (error) {
      showToast(error.message || "Error cargando archivo", "error");
    } finally {
      fileInput.value = "";
    }
  });

  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", async (event) => {
    event.preventDefault();
    dropzone.classList.remove("dragover");

    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    try {
      const text = await readFileAsText(file);
      onLoad(text, file);
      setFileMeta(metaId, file);
      showToast(`Archivo ${file.name} cargado ✅`, "success");
    } catch (error) {
      showToast(error.message || "Error cargando archivo", "error");
    }
  });
}

/* =========================
   Init file loaders
========================= */
setupFileLoader({
  fileInputId: "xmlFileInput",
  dropzoneId: "xmlDropzone",
  buttonId: "btnPickXmlFile",
  metaId: "xmlFileMeta",
  onLoad: (text) => {
    document.getElementById("xmlInput").value = text;
    activateTool("xmlTools");
  }
});

setupFileLoader({
  fileInputId: "jsonFileInput",
  dropzoneId: "jsonDropzone",
  buttonId: "btnPickJsonFile",
  metaId: "jsonFileMeta",
  onLoad: (text) => {
    document.getElementById("jsonInput").value = text;
    activateTool("jsonTools");
  }
});

setupFileLoader({
  fileInputId: "converterFileInput",
  dropzoneId: "converterDropzone",
  buttonId: "btnPickConverterFile",
  metaId: "converterFileMeta",
  onLoad: (text, file) => {
    const type = detectFileTypeFromName(file.name);

    document.getElementById("converterInput").value = text;
    activateTool("convertersTools");

    if (type === "xml" || type === "json" || type === "csv") {
      document.getElementById("converterSource").value = type;
      updateConverterDynamicFields();
    }
  }
});

setupFileLoader({
  fileInputId: "snippetFileInput",
  dropzoneId: "snippetDropzone",
  buttonId: "btnPickSnippetFile",
  metaId: "snippetFileMeta",
  onLoad: (text, file) => {
    const type = detectFileTypeFromName(file.name);

    document.getElementById("snippetContent").value = text;
    document.getElementById("snippetType").value =
      type === "xml" || type === "json" || type === "csv" || type === "base64"
        ? type
        : "text";

    if (!document.getElementById("snippetName").value.trim()) {
      document.getElementById("snippetName").value = file.name.replace(/\.[^/.]+$/, "");
    }

    activateTool("snippetsTools");
  }
});

setupFileLoader({
  fileInputId: "counterFileInput",
  dropzoneId: "counterDropzone",
  buttonId: "btnPickCounterFile",
  metaId: "counterFileMeta",
  onLoad: (text) => {
    document.getElementById("counterInput").value = text;
    activateTool("textCounter");
  }
});

setupFileLoader({
  fileInputId: "textAFileInput",
  dropzoneId: "textADropzone",
  buttonId: "btnPickTextAFile",
  metaId: "textAFileMeta",
  onLoad: (text) => {
    document.getElementById("textA").value = text;
    updateCounter();
    activateTool("textDiff");
  }
});

setupFileLoader({
  fileInputId: "textBFileInput",
  dropzoneId: "textBDropzone",
  buttonId: "btnPickTextBFile",
  metaId: "textBFileMeta",
  onLoad: (text) => {
    document.getElementById("textB").value = text;
    updateCounter();
    activateTool("textDiff");
  }
});

setupFileLoader({
  fileInputId: "base64FileInput",
  dropzoneId: "base64Dropzone",
  buttonId: "btnPickBase64File",
  metaId: "base64FileMeta",
  onLoad: (text) => {
    document.getElementById("base64Input").value = text;
    activateTool("base64Tools");
  }
});

/* =========================
   XML Tools
========================= */
document.getElementById("btnValidateXml")?.addEventListener("click", async () => {
  const xml = document.getElementById("xmlInput").value.trim();

  if (!xml) {
    setStatus("Pega un XML primero");
    showToast("Pega un XML primero", "error");
    return;
  }

  setStatus("Validando XML...");

  try {
    const { response, result } = await postJson("/validate-xml", { xml });
    setOutput("xmlOutput", JSON.stringify(result, null, 2));

    if (response.ok) {
      setStatus("XML válido");
      showToast("XML válido ✅", "success");
    } else {
      setStatus("XML inválido");
      showToast("XML inválido ❌", "error");
    }
  } catch (error) {
    setOutput("xmlOutput", error.message);
    setStatus("Error al validar XML");
    showToast("Error al validar XML", "error");
  }
});

document.getElementById("btnFormatXml")?.addEventListener("click", async () => {
  const xml = document.getElementById("xmlInput").value.trim();

  if (!xml) {
    setStatus("Pega un XML primero");
    showToast("Pega un XML primero", "error");
    return;
  }

  setStatus("Formateando XML...");

  try {
    const { response, result } = await postJson("/format-xml", { xml });

    if (!response.ok) {
      setOutput("xmlOutput", JSON.stringify(result, null, 2));
      setStatus("Error al formatear XML");
      showToast("Error al formatear XML", "error");
      return;
    }

    setOutput("xmlOutput", result.data);
    setStatus("XML formateado");
    showToast("XML formateado ✅", "success");
  } catch (error) {
    setOutput("xmlOutput", error.message);
    setStatus("Error al formatear XML");
    showToast("Error al formatear XML", "error");
  }
});

document.getElementById("btnXmlToJson")?.addEventListener("click", async () => {
  const xml = document.getElementById("xmlInput").value.trim();



  if (!xml) {
    setStatus("Pega un XML primero");
    showToast("Pega un XML primero", "error");
    return;
  }

  setStatus("Convirtiendo XML a JSON...");

  try {
    const { response, result } = await postJson("/xml-to-json", { xml });

    if (!response.ok) {
      setOutput("xmlOutput", JSON.stringify(result, null, 2));
      setStatus("Error en conversión");
      showToast("Error en conversión", "error");
      return;
    }

    setOutput("xmlOutput", JSON.stringify(result.data, null, 2));

    trackEvent("XML_TO_JSON");

    setStatus("Conversión completada");
    showToast("Conversión completada ✅", "success");
  } catch (error) {
    setOutput("xmlOutput", error.message);
    setStatus("Error en conversión");
    showToast("Error en conversión", "error");
  }
});

document.getElementById("btnExplainXml")?.addEventListener("click", async () => {
  openXmlAiModal();

  trackEvent("CLICK_ANALYZE_XML_IA");

  const btn = document.getElementById("btnExplainXml");
  const originalText = btn?.textContent || "Analizar XML";

  if (btn) {
    btn.textContent = "Analizando con IA...";
    btn.disabled = true;
  }

  setOutput("xmlExplainOutput", "Analizando payload con IA... por favor espera unos segundos.");

  const input = document.getElementById("xmlInput")?.value.trim();

  if (!input) {
    setStatus("Pega un XML primero");
    showToast("Pega un XML primero", "error");
    return;
  }

  setStatus("Analizando XML con IA...");

  try {
    const { response, result } = await explainPayload(input, "xml");

    if (!response.ok) {
      setOutput("xmlExplainOutput", result.error || "Error al analizar XML con IA");
      setStatus("Error al analizar XML con IA");
      showToast("Error al analizar XML con IA", "error");
      return;
    }

    setOutput("xmlExplainOutput", result.data);
    setStatus("Análisis IA completado");
    showToast("Análisis IA completado ✅", "success");
  } catch (error) {
    setOutput("xmlExplainOutput", error.message);
    setStatus("Error al analizar XML con IA");
    showToast("Error al analizar XML con IA", "error");
  } finally {
    if (btn) {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }
});

document.getElementById("btnExtractXpaths")?.addEventListener("click", async () => {
  const xml = document.getElementById("xmlInput").value.trim();

  if (!xml) {
    setStatus("Pega un XML primero");
    showToast("Pega un XML primero", "error");
    return;
  }

  setStatus("Extrayendo XPaths...");

  try {
    const { response, result } = await postJson("/extract-xpaths", { xml });

    if (!response.ok) {
      setOutput("xmlOutput", JSON.stringify(result, null, 2));
      setStatus("Error al extraer XPaths");
      showToast("Error al extraer XPaths", "error");
      return;
    }

    const container = document.getElementById("xmlOutput");
    container.innerHTML = "";

    result.paths.forEach((path) => {
      const row = document.createElement("div");
      row.className = "xpath-row";

      const pathText = document.createElement("div");
      pathText.className = "xpath-path";
      pathText.textContent = path;

      const copyButton = document.createElement("button");
      copyButton.className = "xpath-copy-btn";
      copyButton.textContent = "Copiar";

      copyButton.addEventListener("click", async (event) => {
        event.stopPropagation();

        await navigator.clipboard.writeText(path);

        document.querySelectorAll(".xpath-copy-btn").forEach((btn) => {
          btn.textContent = "Copiar";
        });

        document.querySelectorAll(".xpath-row").forEach((item) => {
          item.classList.remove("copied");
        });

        copyButton.textContent = "Copiado ✅";
        row.classList.add("copied");
        setStatus(`XPath copiado: ${path}`);
        showToast("XPath copiado ✅", "success");

        setTimeout(() => {
          copyButton.textContent = "Copiar";
          row.classList.remove("copied");
        }, 1500);
      });

      row.appendChild(pathText);
      row.appendChild(copyButton);
      container.appendChild(row);
    });

    setStatus("XPaths extraídos");
    showToast("XPaths extraídos ✅", "success");
  } catch (error) {
    setOutput("xmlOutput", error.message);
    setStatus("Error al extraer XPaths");
    showToast("Error al extraer XPaths", "error");
  }
});

document.getElementById("btnCopyXmlOutput")?.addEventListener("click", () => {
  copyOutput("xmlOutput");
});

document.getElementById("btnConfirmSaveSnippet")?.addEventListener("click", () => {
  const name = document.getElementById("saveSnippetName").value.trim();
  const type = document.getElementById("saveSnippetType").value;

  if (!name) {
    showToast("Ponle nombre al snippet", "error");
    return;
  }

  const snippets = getSnippets();

  snippets.push({
    id: crypto.randomUUID(),
    name,
    type,
    content: pendingSnippetContent,
    createdAt: new Date().toISOString()
  });

  saveSnippets(snippets);
  renderSnippets();
  closeSaveSnippetModal();
  setStatus("Snippet guardado");
  showToast("Snippet guardado ✅", "success");
});

/* =========================
   JSON Tools
========================= */
document.getElementById("btnValidateJson")?.addEventListener("click", async () => {
  const jsonText = document.getElementById("jsonInput").value.trim();

  if (!jsonText) {
    setStatus("Pega un JSON primero");
    showToast("Pega un JSON primero", "error");
    return;
  }

  setStatus("Validando JSON...");

  try {
    const { response, result } = await postJson("/validate-json", { jsonText });
    setOutput("jsonOutput", JSON.stringify(result, null, 2));

    if (response.ok) {
      setStatus("JSON válido");
      showToast("JSON válido ✅", "success");
    } else {
      setStatus("JSON inválido");
      showToast("JSON inválido ❌", "error");
    }
  } catch (error) {
    setOutput("jsonOutput", error.message);
    setStatus("Error al validar JSON");
    showToast("Error al validar JSON", "error");
  }
});

document.getElementById("btnFormatJson")?.addEventListener("click", async () => {
  const btn = document.getElementById("btnFormatJson");

  const originalText = btn.textContent;
  btn.textContent = "Formateando...";
  btn.disabled = true;

  const jsonText = document.getElementById("jsonInput").value.trim();

  if (!jsonText) {
    setStatus("Pega un JSON primero");
    showToast("Pega un JSON primero", "error");

    btn.textContent = originalText;
    btn.disabled = false;
    return;
  }

  setStatus("Formateando JSON...");

  try {
    const { response, result } = await postJson("/format-json", { jsonText });

    if (!response.ok) {
      setOutput("jsonOutput", JSON.stringify(result, null, 2));

      trackEvent("JSON_FORMATTED");

      setStatus("Error al formatear JSON");
      showToast("Error al formatear JSON", "error");
      return;
    }

    setOutput("jsonOutput", result.data);
    setStatus("JSON formateado");
    showToast("JSON formateado ✅", "success");

  } catch (error) {
    setOutput("jsonOutput", error.message);
    setStatus("Error al formatear JSON");
    showToast("Error al formatear JSON", "error");

  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
});

document.getElementById("btnExplainJson")?.addEventListener("click", async () => {
  openJsonAiModal();

  trackEvent("CLICK_ANALYZE_JSON_IA");

  const btn = document.getElementById("btnExplainJson");
  const originalText = btn?.textContent || "Analizar JSON";

  if (btn) {
    btn.textContent = "Analizando con IA...";
    btn.disabled = true;
  }

  setOutput("jsonExplainOutput", "Analizando payload con IA... por favor espera unos segundos.");

  const input = document.getElementById("jsonInput")?.value.trim();

  if (!input) {
    setStatus("Pega un JSON primero");
    showToast("Pega un JSON primero", "error");

    if (btn) {
      btn.textContent = originalText;
      btn.disabled = false;
    }
    return;
  }

  setStatus("Analizando JSON con IA...");

  try {
    const { response, result } = await explainPayload(input, "json");

    if (!response.ok) {
      setOutput("jsonExplainOutput", result.error || "Error al analizar JSON con IA");
      setStatus("Error al analizar JSON con IA");
      showToast("Error al analizar JSON con IA", "error");
      return;
    }

    setOutput("jsonExplainOutput", result.data);
    setStatus("Análisis IA completado");
    showToast("Análisis IA completado ✅", "success");
  } catch (error) {
    setOutput("jsonExplainOutput", error.message);
    setStatus("Error al analizar JSON con IA");
    showToast("Error al analizar JSON con IA", "error");
  } finally {
    if (btn) {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }
});

document.getElementById("btnCopyJsonOutput")?.addEventListener("click", () => {
  copyOutput("jsonOutput");
});

/* =========================
   Convertidores
========================= */
function loadConverterExample(type) {
  const input = document.getElementById("converterInput");
  const source = document.getElementById("converterSource");
  const target = document.getElementById("converterTarget");
  const rootName = document.getElementById("converterRootName");
  const itemName = document.getElementById("converterItemName");
  const separator = document.getElementById("converterSeparator");

  if (type === "json") {
    source.value = "json";
    target.value = "xml";
    if (rootName) rootName.value = "employees";
    input.value = JSON.stringify(
      [
        { id: 1, nombre: "Pepe", proyecto: "PayloadLab" },
        { id: 2, nombre: "Ana", proyecto: "Integraciones" }
      ],
      null,
      2
    );
  }

  if (type === "xml") {
    source.value = "xml";
    target.value = "csv";
    if (separator) separator.value = ",";
    input.value = `<employees>
  <employee>
    <id>1</id>
    <name>Pepe</name>
  </employee>
  <employee>
    <id>2</id>
    <name>Ana</name>
  </employee>
</employees>`;
  }

  if (type === "csv") {
    source.value = "csv";
    target.value = "xml";
    if (rootName) rootName.value = "employees";
    if (itemName) itemName.value = "employee";
    if (separator) separator.value = ",";
    input.value = `id,nombre,proyecto
1,Pepe,PayloadLab
2,Ana,Integraciones`;
  }

  updateConverterDynamicFields();
}

document.getElementById("btnLoadJsonExample")?.addEventListener("click", () => {
  loadConverterExample("json");
  showToast("Ejemplo JSON cargado", "info");
});

document.getElementById("btnLoadXmlExample")?.addEventListener("click", () => {
  loadConverterExample("xml");
  showToast("Ejemplo XML cargado", "info");
});

document.getElementById("btnLoadCsvExample")?.addEventListener("click", () => {
  loadConverterExample("csv");
  showToast("Ejemplo CSV cargado", "info");
});

document.getElementById("btnConvertData")?.addEventListener("click", async () => {
  const source = document.getElementById("converterSource").value;
  const target = document.getElementById("converterTarget").value;
  const input = document.getElementById("converterInput").value.trim();
  const rootName = document.getElementById("converterRootName")?.value.trim() || "root";
  const itemName = document.getElementById("converterItemName")?.value.trim() || "item";
  const separator = document.getElementById("converterSeparator")?.value || ",";

  if (!input) {
    setStatus("Pega un contenido para convertir");
    showToast("Pega un contenido para convertir", "error");
    return;
  }

  if (source === target) {
    setStatus("Origen y destino no pueden ser iguales");
    showToast("Origen y destino no pueden ser iguales", "error");
    return;
  }

  setStatus("Convirtiendo...");

  try {
    let endpoint = "";
    let payload = {};

    if (source === "xml" && target === "json") {
      endpoint = "/xml-to-json";
      payload = { xml: input };
    } else if (source === "json" && target === "xml") {
      endpoint = "/json-to-xml";
      payload = { jsonText: input, rootName };
    } else if (source === "csv" && target === "json") {
      endpoint = "/csv-to-json";
      payload = { csvText: input, separator };
    } else if (source === "json" && target === "csv") {
      endpoint = "/json-to-csv";
      payload = { jsonText: input, separator };
    } else if (source === "csv" && target === "xml") {
      endpoint = "/csv-to-xml";
      payload = { csvText: input, separator, rootName, itemName };
    } else if (source === "xml" && target === "csv") {
      endpoint = "/xml-to-csv";
      payload = { xml: input, separator };
    } else {
      setStatus("Esa conversión todavía no está disponible");
      showToast("Esa conversión no está disponible", "info");
      setOutput("converterOutput", "Conversión no disponible.");
      return;
    }

    const { response, result } = await postJson(endpoint, payload);

    if (!response.ok) {
      setOutput("converterOutput", JSON.stringify(result, null, 2));
      setStatus("Error en conversión");
      showToast("Error en conversión", "error");
      return;
    }

    let output =
      typeof result.data === "string"
        ? result.data
        : JSON.stringify(result.data, null, 2);

    if (
      source === "xml" &&
      target === "csv" &&
      result.meta &&
      result.meta.detectedPath
    ) {
      output = `Nodo detectado: ${result.meta.detectedPath}\n\n${output}`;
    }

    setOutput("converterOutput", output);
    setStatus("Conversión completada");
    showToast("Conversión completada ✅", "success");
  } catch (error) {
    setOutput("converterOutput", error.message);
    setStatus("Error en conversión");
    showToast("Error en conversión", "error");
  }
});

document.getElementById("btnCopyConverterOutput")?.addEventListener("click", () => {
  copyOutput("converterOutput");
});

/* =========================
   Contador de texto
========================= */
document.getElementById("btnCountText")?.addEventListener("click", () => {
  const text = document.getElementById("counterInput").value;

  if (!text.trim()) {
    setStatus("Pega un texto primero");
    setOutput("counterOutput", "");
    showToast("Pega un texto primero", "error");
    return;
  }

  const caracteres = text.length;
  const caracteresSinEspacios = text.replace(/\s/g, "").length;
  const lineas = text.length === 0 ? 0 : text.split("\n").length;
  const palabras = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;

  const result = [
    `Caracteres: ${caracteres}`,
    `Caracteres sin espacios: ${caracteresSinEspacios}`,
    `Palabras: ${palabras}`,
    `Líneas: ${lineas}`
  ].join("\n");

  setOutput("counterOutput", result);
  setStatus("Conteo completado");
  showToast("Conteo completado ✅", "success");
});

document.getElementById("btnCopyCounterOutput")?.addEventListener("click", () => {
  copyOutput("counterOutput");
});

/* =========================
   Comparador de textos
========================= */
const textA = document.getElementById("textA");
const textB = document.getElementById("textB");
const countA = document.getElementById("countA");
const countB = document.getElementById("countB");

function getTextStats(text) {
  const caracteres = text.length;
  const lineas = text.length === 0 ? 0 : text.split("\n").length;
  const palabras = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;

  return { caracteres, palabras, lineas };
}

function updateCounter() {
  if (!textA || !textB || !countA || !countB) return;

  const statsA = getTextStats(textA.value);
  const statsB = getTextStats(textB.value);

  countA.textContent = `Caracteres: ${statsA.caracteres} | Palabras: ${statsA.palabras} | Líneas: ${statsA.lineas}`;
  countB.textContent = `Caracteres: ${statsB.caracteres} | Palabras: ${statsB.palabras} | Líneas: ${statsB.lineas}`;
}

textA?.addEventListener("input", updateCounter);
textB?.addEventListener("input", updateCounter);
updateCounter();

document.getElementById("btnCompareTexts")?.addEventListener("click", () => {
  const a = textA.value;
  const b = textB.value;

  if (!a && !b) {
    setStatus("Pega ambos textos para comparar");
    showToast("Pega ambos textos para comparar", "error");
    return;
  }

  if (a === b) {
    setOutput("diffOutput", "Los textos son iguales");
    setStatus("Comparación completada");
    showToast("Los textos son iguales ✅", "success");
    return;
  }

  const linesA = a.split("\n");
  const linesB = b.split("\n");
  const maxLines = Math.max(linesA.length, linesB.length);

  const differences = [];

  for (let i = 0; i < maxLines; i++) {
    const lineA = linesA[i] ?? "";
    const lineB = linesB[i] ?? "";

    if (lineA !== lineB) {
      differences.push(
        `Línea ${i + 1}:\n- Texto A: ${lineA}\n- Texto B: ${lineB}`
      );
    }
  }

  setOutput("diffOutput", differences.join("\n\n"));
  setStatus("Comparación completada");
  showToast("Diferencias encontradas", "info");
});

document.getElementById("btnCopyDiffOutput")?.addEventListener("click", () => {
  copyOutput("diffOutput");
});

/* =========================
   Base64
========================= */
document.getElementById("btnEncodeBase64")?.addEventListener("click", async () => {
  const text = document.getElementById("base64Input").value;

  setStatus("Codificando Base64...");

  try {
    const { response, result } = await postJson("/base64/encode", { text });

    if (!response.ok) {
      setOutput("base64Output", JSON.stringify(result, null, 2));
      setStatus("Error al codificar");
      showToast("Error al codificar", "error");
      return;
    }

    setOutput("base64Output", result.data);
    setStatus("Texto codificado");
    showToast("Texto codificado ✅", "success");
  } catch (error) {
    setOutput("base64Output", error.message);
    setStatus("Error al codificar");
    showToast("Error al codificar", "error");
  }
});

document.getElementById("btnDecodeBase64")?.addEventListener("click", async () => {
  const text = document.getElementById("base64Input").value;

  setStatus("Decodificando Base64...");

  try {
    const { response, result } = await postJson("/base64/decode", { text });

    if (!response.ok) {
      setOutput("base64Output", JSON.stringify(result, null, 2));
      setStatus("Error al decodificar");
      showToast("Error al decodificar", "error");
      return;
    }

    setOutput("base64Output", result.data);
    setStatus("Texto decodificado");
    showToast("Texto decodificado ✅", "success");
  } catch (error) {
    setOutput("base64Output", error.message);
    setStatus("Error al decodificar");
    showToast("Error al decodificar", "error");
  }
});

document.getElementById("btnCopyBase64Output")?.addEventListener("click", () => {
  copyOutput("base64Output");
});