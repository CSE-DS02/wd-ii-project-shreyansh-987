const promptInput = document.getElementById("promptInput");
const titleInput = document.getElementById("docTitle");
const chat = document.getElementById("chat");
const statusDot = document.getElementById("statusDot");
const statusLabel = document.getElementById("statusLabel");
const statusText = document.getElementById("statusText");
const coverPreview = document.getElementById("coverPreview");
const coverTitle = document.getElementById("coverTitle");
const coverSubtitle = document.getElementById("coverSubtitle");
const wordCount = document.getElementById("wordCount");
const pageEstimate = document.getElementById("pageEstimate");
const assetCount = document.getElementById("assetCount");
const readTime = document.getElementById("readTime");
const activeProjectLabel = document.getElementById("activeProjectLabel");
const targetPages = document.getElementById("targetPages");
const themeLabel = document.getElementById("themeLabel");
const themeSelect = document.getElementById("themeSelect");
const exportPreset = document.getElementById("exportPreset");
const exportPresetLabel = document.getElementById("exportPresetLabel");
const projectNameInput = document.getElementById("projectNameInput");
const projectSelect = document.getElementById("projectSelect");
const importJsonInput = document.getElementById("importJsonInput");
const themeGallery = document.getElementById("themeGallery");
const pageFilterInput = document.getElementById("pageFilterInput");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const aiProgressBar = document.getElementById("aiProgressBar");
const saveState = document.getElementById("saveState");
const pagesCanvas = document.getElementById("pagesCanvas");
const imageUpload = document.getElementById("imageUpload");
const dropZone = document.getElementById("dropZone");
const imageStage = document.getElementById("imageStage");
const videoStage = document.getElementById("videoStage");
const fileList = document.getElementById("fileList");
const docPreview = document.getElementById("docPreview");
const miniPreview = document.getElementById("miniPreview");
const docChatInput = document.getElementById("docChatInput");
const previewCount = document.getElementById("previewCount");
const presentationOverlay = document.getElementById("presentationOverlay");
const presentationStage = document.getElementById("presentationStage");
const presentationCount = document.getElementById("presentationCount");
const presentationTitle = document.getElementById("presentationTitle");
const onboardingToast = document.getElementById("onboardingToast");

const draftKey = "pdfify-ai-builder-draft";
const lastDraftKey = "pdfify-ai-last-draft";
const onboardingKey = "pdfify-ai-onboarded";
const projectsKey = "pdfify-ai-projects";
let targetPageCount = 1;
let currentTheme = "editorial";
let activeProjectName = "Default";
let uploadedFiles = [];
let pages = [];
let draggedPageId = null;
let currentSlideIndex = 0;
let pageFilterQuery = "";
let historyStack = [];
let redoStack = [];
let progressTimer = null;
let saveStateTimer = null;
let exportPresetMode = "standard";
let structuredDocument = { title: "", sections: [] };
let userPreferences = { theme: currentTheme, exportPresetMode: exportPresetMode };
let sharedLink = "";

const themes = {
  editorial: { a: "#d76548", b: "#223d57", c: "#e8aa45", surface: [26, 43, 60], accent: [215, 101, 72] },
  executive: { a: "#243949", b: "#517fa4", c: "#d7e1ec", surface: [27, 38, 52], accent: [81, 127, 164] },
  sunset: { a: "#7b4397", b: "#dc2430", c: "#f7b267", surface: [66, 39, 90], accent: [220, 36, 48] },
  forest: { a: "#134e5e", b: "#2f7a5c", c: "#e0c97f", surface: [19, 78, 94], accent: [47, 122, 92] }
};

const templates = {
  pitch: [
    { type: "cover", label: "Cover", title: "Startup Pitch Deck", body: "A sharp investor-ready overview." },
    { type: "text", label: "Problem", title: "The Problem", body: "Describe the pain point, market gap, and urgency.\n\nAdd supporting proof points and user signals." },
    { type: "split", label: "Solution", title: "Our Solution", columns: { left: "Product summary\n\nCore features\n\nMain differentiator", right: "Why now\n\nCustomer value\n\nImplementation edge" } },
    { type: "text", label: "Traction", title: "Traction & Business Model", body: "Revenue, users, pilots, partnerships, pricing, and momentum." },
    { type: "text", label: "Ask", title: "The Ask", body: "Funding amount, use of funds, milestones, and closing statement." }
  ],
  resume: [
    { type: "cover", label: "Profile", title: "Your Name", body: "Role title, city, contact line, and personal brand summary." },
    { type: "split", label: "Experience", title: "Professional Experience", columns: { left: "Company / Role\n\nKey results\n\nTeam impact", right: "Company / Role\n\nKey results\n\nTeam impact" } },
    { type: "text", label: "Skills", title: "Core Skills", body: "Technical skills, tools, domain knowledge, and strengths." },
    { type: "text", label: "Projects", title: "Projects", body: "List notable projects, outcomes, metrics, and technologies used." },
    { type: "text", label: "Education", title: "Education & Certifications", body: "Degrees, certificates, awards, and key highlights." }
  ],
  report: [
    { type: "cover", label: "Cover", title: "Business Report", body: "A concise report prepared for review." },
    { type: "text", label: "Summary", title: "Executive Summary", body: "Summarize the purpose, scope, and top findings." },
    { type: "split", label: "Findings", title: "Key Findings", columns: { left: "Finding 1\n\nEvidence\n\nImplication", right: "Finding 2\n\nEvidence\n\nImplication" } },
    { type: "text", label: "Analysis", title: "Analysis", body: "Expand on trends, risks, opportunities, and interpretation." },
    { type: "text", label: "Conclusion", title: "Conclusion & Recommendations", body: "Wrap up the report and list practical next steps." }
  ],
  certificate: [
    { type: "cover", label: "Certificate", title: "Certificate of Achievement", body: "Presented to [Name] for outstanding work and dedication." },
    { type: "text", label: "Details", title: "Recognition Details", body: "Issued by, date, event, and the reason for recognition." },
    { type: "text", label: "Sign-off", title: "Authorized Signatures", body: "Director Name\n\nOrganization\n\nSeal / signature block" }
  ]
};

function addLog(label, message) {
  const entry = document.createElement("div");
  entry.className = "chat-entry";
  entry.innerHTML = `<strong>${label}</strong>${escapeHtml(message)}`;
  chat.prepend(entry);
}

function clearLog() {
  chat.innerHTML = "";
}

function setStatus(state, label, text) {
  statusDot.classList.remove("busy", "error");
  if (state === "busy") statusDot.classList.add("busy");
  if (state === "error") statusDot.classList.add("error");
  statusLabel.textContent = label;
  statusText.textContent = text;
}

function setAiProgress(percent) {
  if (!aiProgressBar) return;
  aiProgressBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
}

function startAiProgress() {
  if (progressTimer) clearInterval(progressTimer);
  let progress = 8;
  setAiProgress(progress);
  progressTimer = setInterval(() => {
    progress = Math.min(92, progress + Math.random() * 9);
    setAiProgress(progress);
  }, 280);
}

function stopAiProgress(done = true) {
  if (progressTimer) clearInterval(progressTimer);
  progressTimer = null;
  setAiProgress(done ? 100 : 0);
  if (done) setTimeout(() => setAiProgress(0), 420);
}

function snapshotState() {
  return JSON.stringify({
    prompt: promptInput.value,
    title: titleInput.value,
    targetPages: targetPageCount,
    theme: currentTheme,
    exportPresetMode,
    activeProjectName,
    files: uploadedFiles,
    pages,
    document: structuredDocument,
    preferences: userPreferences
  });
}

function restoreSnapshot(rawState) {
  const state = JSON.parse(rawState);
  promptInput.value = state.prompt || "";
  titleInput.value = state.title || "";
  targetPageCount = Math.max(1, Number(state.targetPages) || 1);
  currentTheme = state.theme || "editorial";
  exportPresetMode = state.exportPresetMode || "standard";
  activeProjectName = state.activeProjectName || "Default";
  uploadedFiles = Array.isArray(state.files) ? state.files : [];
  pages = Array.isArray(state.pages) && state.pages.length ? state.pages : [createPage("cover")];
  structuredDocument = state.document && state.document.sections ? state.document : { title: "", sections: [] };
  userPreferences = state.preferences || { theme: currentTheme, exportPresetMode };
  themeSelect.value = currentTheme;
  if (exportPreset) exportPreset.value = exportPresetMode;
  renderExportPreset();
  if (activeProjectLabel) activeProjectLabel.textContent = activeProjectName;
  if (projectNameInput) projectNameInput.value = activeProjectName === "Default" ? "" : activeProjectName;
  renderTargetPages();
  renderTheme();
  renderSelectedFiles();
  renderPages();
  renderDocumentPreview();
  refreshMetrics();
  persistDraft();
}

function pushHistory() {
  const current = snapshotState();
  if (historyStack[historyStack.length - 1] === current) return;
  historyStack.push(current);
  if (historyStack.length > 80) historyStack.shift();
  redoStack = [];
  updateHistoryButtons();
}

function updateHistoryButtons() {
  if (undoBtn) undoBtn.disabled = historyStack.length <= 1;
  if (redoBtn) redoBtn.disabled = redoStack.length === 0;
}

function undoChange() {
  if (historyStack.length <= 1) return;
  const current = historyStack.pop();
  redoStack.push(current);
  const previous = historyStack[historyStack.length - 1];
  if (previous) restoreSnapshot(previous);
  updateHistoryButtons();
}

function redoChange() {
  if (!redoStack.length) return;
  const next = redoStack.pop();
  historyStack.push(next);
  restoreSnapshot(next);
  updateHistoryButtons();
}

function setAiLoading(isLoading) {
  document.body.classList.toggle("ai-loading", isLoading);
  if (isLoading) {
    miniPreview.innerHTML = Array.from({ length: Math.max(2, Math.min(4, targetPageCount || 2)) })
      .map(() => `
        <article class="mini-slide skeleton-slide">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line medium"></div>
        </article>
      `)
      .join("");
  }
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function generateId() {
  return `page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createPage(type = "text", data = {}) {
  return {
    id: data.id || generateId(),
    type,
    label: data.label || `${type === "cover" ? "Cover" : "Page"} ${pages.length + 1}`,
    title: data.title || "",
    body: data.body || "",
    assetId: data.assetId || "",
    columns: data.columns || { left: "", right: "" },
    accent: data.accent || "#cc5a3f",
    sticker: data.sticker || "none",
    callout: data.callout || "",
    pinned: Boolean(data.pinned),
    locked: Boolean(data.locked),
    element: data.element || "none",
    elementX: Number.isFinite(data.elementX) ? data.elementX : 82,
    elementY: Number.isFinite(data.elementY) ? data.elementY : 18,
    elementSize: Number.isFinite(data.elementSize) ? data.elementSize : 120,
    imageWidth: Number.isFinite(data.imageWidth) ? data.imageWidth : 4,
    imageHeight: Number.isFinite(data.imageHeight) ? data.imageHeight : 3,
    imageX: Number.isFinite(data.imageX) ? data.imageX : 50,
    imageY: Number.isFinite(data.imageY) ? data.imageY : 50,
    imageUnit: data.imageUnit || "in",
    textFont: data.textFont || "IBM Plex Sans",
    textSize: Number.isFinite(data.textSize) ? data.textSize : 16,
    textColor: data.textColor || "#000000",
    textBgColor: data.textBgColor || "",
    textAlign: data.textAlign || "left",
    textWeight: data.textWeight || "400",
    textLineHeight: Number.isFinite(data.textLineHeight) ? data.textLineHeight : 1.6,
    textLetterSpacing: Number.isFinite(data.textLetterSpacing) ? data.textLetterSpacing : 0,
    textOpacity: Number.isFinite(data.textOpacity) ? data.textOpacity : 1,
    textDecoration: data.textDecoration || "none",
    textShadow: data.textShadow || ""
  };
}

function setSaveState(text, transient = false) {
  if (!saveState) return;
  saveState.textContent = text;
  if (saveStateTimer) clearTimeout(saveStateTimer);
  if (transient) {
    saveStateTimer = setTimeout(() => {
      saveState.textContent = "Saved";
    }, 1100);
  }
}

function getProjects() {
  try {
    const parsed = JSON.parse(localStorage.getItem(projectsKey) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setProjects(projects) {
  localStorage.setItem(projectsKey, JSON.stringify(projects.slice(0, 20)));
  renderProjectList();
}

function renderProjectList() {
  if (!projectSelect) return;
  const projects = getProjects();
  projectSelect.innerHTML = projects.length
    ? projects.map((project) => `<option value="${escapeHtml(project.name)}">${escapeHtml(project.name)}</option>`).join("")
    : `<option value="">No saved projects</option>`;

  const recentContainer = document.getElementById("recentProjectsContainer");
  if (recentContainer) {
    const lastDraft = getLastDraft();
    const draftCard = lastDraft
      ? `
        <div class="recent-project-card">
          <button type="button" onclick="restoreLastDraft()" style="border: none; background: none; padding: 0; text-align: left; width: 100%;">
            <strong>Last draft</strong>
            <span>Saved ${new Date(lastDraft.archivedAt || lastDraft.savedAt || Date.now()).toLocaleString()}</span>
          </button>
          <button type="button" class="delete-btn" onclick="deleteLastDraftWithModal()" title="Delete draft">×</button>
        </div>
      `
      : "";

    const projectCards = projects.length
      ? projects.slice(0, 3).map((project) => `
          <div class="recent-project-card">
            <button type="button" onclick="selectAndLoadProject('${escapeHtml(project.name)}')" style="border: none; background: none; padding: 0; text-align: left; width: 100%;">
              <strong>${escapeHtml(project.name)}</strong>
              <span>Saved ${new Date(project.savedAt).toLocaleString()}</span>
            </button>
            <button type="button" class="delete-btn" onclick="deleteProjectWithModal('${escapeHtml(project.name)}')" title="Delete project">×</button>
          </div>
        `).join("")
      : "";

    recentContainer.innerHTML = (draftCard + projectCards).trim() || `<p class="empty-note">Save or import a project to show recent items here.</p>`;
  }
}

function deleteProject(name) {
  const projects = getProjects().filter((item) => item.name !== name);
  setProjects(projects);
  renderProjectList();
  addLog("Project", `Deleted project: ${name}`);
}

function deleteLastDraft() {
  localStorage.removeItem(lastDraftKey);
  renderProjectList();
  addLog("Draft", "Deleted last draft");
}

function saveAsProject() {
  const name = (projectNameInput?.value || "").trim() || `Project ${new Date().toLocaleDateString()}`;
  activeProjectName = name;
  if (activeProjectLabel) activeProjectLabel.textContent = activeProjectName;
  const projects = getProjects().filter((item) => item.name !== name);
  projects.unshift({ name, savedAt: new Date().toISOString(), state: JSON.parse(snapshotState()) });
  setProjects(projects);
  if (projectSelect) projectSelect.value = name;
  persistDraft();
  addLog("Project", `Saved project: ${name}`);
}

function loadSelectedProject() {
  const name = projectSelect?.value;
  if (!name) return;
  const project = getProjects().find((item) => item.name === name);
  if (!project?.state) return;
  activeProjectName = project.name;
  restoreSnapshot(JSON.stringify(project.state));
  pushHistory();
  addLog("Project", `Loaded project: ${name}`);
}

function exportProjectJson() {
  const payload = { name: activeProjectName, savedAt: new Date().toISOString(), state: JSON.parse(snapshotState()) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFileName(activeProjectName || "pdfify-project")}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  addLog("Project", "Project exported as JSON.");
}

function importProjectJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result || "{}"));
      if (!payload.state) throw new Error("Invalid project file.");
      activeProjectName = payload.name || "Imported Project";
      restoreSnapshot(JSON.stringify(payload.state));
      const projects = getProjects().filter((item) => item.name !== activeProjectName);
      projects.unshift({ name: activeProjectName, savedAt: new Date().toISOString(), state: payload.state });
      setProjects(projects);
      if (projectSelect) projectSelect.value = activeProjectName;
      pushHistory();
      addLog("Project", `Imported project: ${activeProjectName}`);
    } catch (error) {
      alert(error.message || "Failed to import JSON file.");
    }
  };
  reader.readAsText(file);
}

function changeExportPreset(value) {
  exportPresetMode = value || "standard";
  renderExportPreset();
  persistDraft();
}

function renderExportPreset() {
  const map = { standard: "Standard", print: "Print", compact: "Compact" };
  if (exportPresetLabel) exportPresetLabel.textContent = map[exportPresetMode] || "Standard";
  if (exportPreset) exportPreset.value = exportPresetMode;
}

function addPage(type = "text") {
  pages.push(createPage(type));
  renderPages();
  refreshMetrics();
  persistDraft();
  addLog("Builder", `${type} page added.`);
  pushHistory();
}

function updatePage(id, field, value) {
  const page = pages.find((item) => item.id === id);
  if (!page) return;
  if (page.locked && field !== "locked" && field !== "pinned") return;
  page[field] = value;
  refreshMetrics();
  persistDraft();
}

function updatePageColumn(id, key, value) {
  const page = pages.find((item) => item.id === id);
  if (!page) return;
  if (page.locked) return;
  page.columns[key] = value;
  refreshMetrics();
  persistDraft();
}

function duplicatePage(id) {
  const page = pages.find((item) => item.id === id);
  if (!page) return;
  const clone = JSON.parse(JSON.stringify(page));
  clone.id = generateId();
  clone.label = `${page.label} Copy`;
  pages.splice(pages.findIndex((item) => item.id === id) + 1, 0, clone);
  renderPages();
  refreshMetrics();
  persistDraft();
  pushHistory();
}

function removePage(id) {
  const page = pages.find((item) => item.id === id);
  if (page?.pinned) {
    alert("Cannot delete a pinned page. Unpin it first.");
    return;
  }
  if (pages.length === 1) {
    alert("Cannot delete the last page.");
    return;
  }
  if (!confirm(`Are you sure you want to delete "${page.label || page.title || `Page ${pages.findIndex(p => p.id === id) + 1}`}"?`)) {
    return;
  }
  pages = pages.filter((item) => item.id !== id);
  renderPages();
  refreshMetrics();
  persistDraft();
  pushHistory();
  addLog("Page", `Deleted page: ${page.label || page.title || `Page ${pages.findIndex(p => p.id === id) + 1}`}`);
}

function movePage(id, direction) {
  const index = pages.findIndex((item) => item.id === id);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= pages.length) return;
  if (pages[index]?.pinned || pages[nextIndex]?.pinned) return;
  [pages[index], pages[nextIndex]] = [pages[nextIndex], pages[index]];
  renderPages();
  persistDraft();
  pushHistory();
}

function changePageType(id, value) {
  const page = pages.find((item) => item.id === id);
  if (!page) return;
  if (page.locked) return;
  page.type = value;
  renderPages();
  persistDraft();
  pushHistory();
}

function renderPages() {
  pagesCanvas.innerHTML = pages.map((page, index) => renderPageCard(page, index)).join("");
  applyPageFilter();
  renderMiniPreview();
  renderDocumentPreview();
}

function applyPageFilter() {
  Array.from(document.querySelectorAll(".page-card")).forEach((card) => {
    const text = card.textContent?.toLowerCase() || "";
    card.style.display = !pageFilterQuery || text.includes(pageFilterQuery) ? "" : "none";
  });
}

function renderPageCard(page, index) {
  const assetOptions = [`<option value="">No image</option>`]
    .concat(
      uploadedFiles
        .filter((file) => file.isImage)
        .map((file) => `<option value="${escapeHtml(file.id)}"${file.id === page.assetId ? " selected" : ""}>${escapeHtml(file.name)}</option>`)
    )
    .join("");

  const toolbar = renderTextToolbar(page.id, page.type === "split" ? "column" : "body");
  
  const textStyle = `font-family: ${page.textFont}; font-size: ${page.textSize}px; color: ${page.textColor}; font-weight: ${page.textWeight}; text-align: ${page.textAlign}; line-height: ${page.textLineHeight}; letter-spacing: ${page.textLetterSpacing}px; opacity: ${page.textOpacity}; ${page.textBgColor ? `background-color: ${page.textBgColor};` : ''} text-decoration: ${page.textDecoration}; ${page.textShadow ? `text-shadow: ${page.textShadow};` : ''}`;

  const columns = page.type === "split"
    ? `
      <div class="split-grid">
        <div class="editor-stack">
          ${renderTextToolbar(page.id, "left")}
          <textarea style="${textStyle}" data-page-column="${page.id}:left" placeholder="Left column" oninput="updatePageColumn('${page.id}', 'left', this.value)">${escapeHtml(page.columns.left)}</textarea>
        </div>
        <div class="editor-stack">
          ${renderTextToolbar(page.id, "right")}
          <textarea style="${textStyle}" data-page-column="${page.id}:right" placeholder="Right column" oninput="updatePageColumn('${page.id}', 'right', this.value)">${escapeHtml(page.columns.right)}</textarea>
        </div>
      </div>
    `
    : `<div class="editor-stack">${toolbar}<textarea style="${textStyle}" data-page-body="${page.id}" placeholder="Write page content" oninput="updatePage('${page.id}', 'body', this.value)">${escapeHtml(page.body)}</textarea></div>`;

  return `
    <article class="page-card" data-page-id="${page.id}" data-page-type="${page.type}" draggable="true" ondragstart="handlePageDragStart(event, '${page.id}')" ondragover="handlePageDragOver(event, '${page.id}')" ondrop="handlePageDrop(event, '${page.id}')" ondragend="handlePageDragEnd()">
      <div class="page-card-header">
        <div>
          <p class="eyebrow">Page ${index + 1}</p>
          <input class="page-label-input" value="${escapeHtml(page.label)}" placeholder="Page label" oninput="updatePage('${page.id}', 'label', this.value)" />
        </div>
        <div class="page-card-actions">
          <button class="mini-btn" title="Pin page" onclick="togglePinPage('${page.id}')">${page.pinned ? "Pinned" : "Pin"}</button>
          <button class="mini-btn" title="Lock page" onclick="toggleLockPage('${page.id}')">${page.locked ? "Unlock" : "Lock"}</button>
          <button class="mini-btn" onclick="movePage('${page.id}', -1)">↑</button>
          <button class="mini-btn" onclick="movePage('${page.id}', 1)">↓</button>
          <button class="mini-btn" onclick="duplicatePage('${page.id}')">Duplicate</button>
          <button class="mini-btn danger" onclick="removePageWithModal('${page.id}')">Delete</button>
        </div>
      </div>
      <div class="page-card-grid">
        <div class="page-card-main">
          <input class="page-title-input" value="${escapeHtml(page.title)}" placeholder="Page title" oninput="updatePage('${page.id}', 'title', this.value)" />
          <div class="rewrite-row">
            <button class="mini-btn" onclick="rewritePage('${page.id}', 'shorten')">Shorten</button>
            <button class="mini-btn" onclick="rewritePage('${page.id}', 'expand')">Expand</button>
            <button class="mini-btn" onclick="rewritePage('${page.id}', 'formal')">Formal</button>
            <button class="mini-btn" onclick="rewritePage('${page.id}', 'casual')">Casual</button>
          </div>
          ${columns}
        </div>
        <div class="page-card-side">
          <label class="field-label">Layout</label>
          <select class="theme-select" onchange="changePageType('${page.id}', this.value)">
            <option value="cover"${page.type === "cover" ? " selected" : ""}>Cover</option>
            <option value="text"${page.type === "text" ? " selected" : ""}>Text</option>
            <option value="split"${page.type === "split" ? " selected" : ""}>Split</option>
            <option value="image"${page.type === "image" ? " selected" : ""}>Image</option>
          </select>
          <label class="field-label">Accent color</label>
          <div class="color-palette">
            ${["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9", "#F8C471", "#82E0AA", "#F1948A", "#85C1E9", "#D7BDE2"].map(color => `<button type="button" class="color-swatch ${page.accent === color ? 'active' : ''}" style="background-color: ${color}" onclick="updatePage('${page.id}', 'accent', '${color}')"></button>`).join("")}
            <input class="accent-picker" type="color" value="${escapeHtml(page.accent)}" onchange="updatePage('${page.id}', 'accent', this.value)" title="Custom color" />
          </div>
          <label class="field-label">Sticker</label>
          <select class="theme-select" onchange="updatePage('${page.id}', 'sticker', this.value)">
            <option value="none"${page.sticker === "none" ? " selected" : ""}>🚫 None</option>
            <option value="star"${page.sticker === "star" ? " selected" : ""}>⭐ Star</option>
            <option value="spark"${page.sticker === "spark" ? " selected" : ""}>✨ Spark</option>
            <option value="badge"${page.sticker === "badge" ? " selected" : ""}>🏆 Badge</option>
            <option value="arrow"${page.sticker === "arrow" ? " selected" : ""}>➡️ Arrow</option>
            <option value="heart"${page.sticker === "heart" ? " selected" : ""}>❤️ Heart</option>
            <option value="check"${page.sticker === "check" ? " selected" : ""}>✅ Check</option>
            <option value="bulb"${page.sticker === "bulb" ? " selected" : ""}>💡 Bulb</option>
          </select>
          <label class="field-label">Element</label>
          <select class="theme-select" onchange="updatePage('${page.id}', 'element', this.value)">
            <option value="none"${page.element === "none" ? " selected" : ""}>🚫 None</option>
            <option value="circle"${page.element === "circle" ? " selected" : ""}>⭕ Circle</option>
            <option value="square"${page.element === "square" ? " selected" : ""}>▢ Square</option>
            <option value="triangle"${page.element === "triangle" ? " selected" : ""}>🔺 Triangle</option>
            <option value="diamond"${page.element === "diamond" ? " selected" : ""}>💎 Diamond</option>
            <option value="line"${page.element === "line" ? " selected" : ""}>━ Line</option>
            <option value="banner"${page.element === "banner" ? " selected" : ""}>🏴 Banner</option>
            <option value="wave"${page.element === "wave" ? " selected" : ""}>🌊 Wave</option>
            <option value="star"${page.element === "star" ? " selected" : ""}>⭐ Star</option>
            <option value="heart"${page.element === "heart" ? " selected" : ""}>❤️ Heart</option>
          </select>
          <label class="field-label">Element position X</label>
          <input type="range" min="0" max="100" value="${page.elementX}" oninput="updatePage('${page.id}', 'elementX', Number(this.value))" />
          <label class="field-label">Element position Y</label>
          <input type="range" min="0" max="100" value="${page.elementY}" oninput="updatePage('${page.id}', 'elementY', Number(this.value))" />
          <label class="field-label">Element size</label>
          <input type="range" min="40" max="220" value="${page.elementSize}" oninput="updatePage('${page.id}', 'elementSize', Number(this.value))" />
          <label class="field-label">Callout</label>
          <textarea class="callout-input" placeholder="Short highlighted note" oninput="updatePage('${page.id}', 'callout', this.value)">${escapeHtml(page.callout)}</textarea>
          <label class="field-label">Image asset</label>
          <select class="theme-select" onchange="updatePage('${page.id}', 'assetId', this.value)">${assetOptions}</select>
          <div class="page-hint">Choose a file from the asset library to place on this page.</div>
          <label class="field-label">Image Width</label>
          <div class="size-input-group">
            <input type="number" min="0" step="0.1" value="${page.imageWidth || 4}" oninput="updatePage('${page.id}', 'imageWidth', Number(this.value))" />
            <select class="theme-select size-unit" onchange="updatePage('${page.id}', 'imageUnit', this.value)">
              <option value="in"${page.imageUnit === "in" ? " selected" : ""}>in</option>
              <option value="cm"${page.imageUnit === "cm" ? " selected" : ""}>cm</option>
              <option value="mm"${page.imageUnit === "mm" ? " selected" : ""}>mm</option>
              <option value="px"${page.imageUnit === "px" ? " selected" : ""}>px</option>
            </select>
          </div>
          <label class="field-label">Image Height</label>
          <div class="size-input-group">
            <input type="number" min="0" step="0.1" value="${page.imageHeight || 3}" oninput="updatePage('${page.id}', 'imageHeight', Number(this.value))" />
            <select class="theme-select size-unit" onchange="updatePage('${page.id}', 'imageUnit', this.value)">
              <option value="in"${page.imageUnit === "in" ? " selected" : ""}>in</option>
              <option value="cm"${page.imageUnit === "cm" ? " selected" : ""}>cm</option>
              <option value="mm"${page.imageUnit === "mm" ? " selected" : ""}>mm</option>
              <option value="px"${page.imageUnit === "px" ? " selected" : ""}>px</option>
            </select>
          </div>
          <label class="field-label">Image Position X (%)</label>
          <input type="range" min="0" max="100" value="${page.imageX || 50}" oninput="updatePage('${page.id}', 'imageX', Number(this.value))" />
          <label class="field-label">Image Position Y (%)</label>
          <input type="range" min="0" max="100" value="${page.imageY || 50}" oninput="updatePage('${page.id}', 'imageY', Number(this.value))" />
        </div>
      </div>
    </article>
  `;
}

function renderTextToolbar(pageId, target) {
  const page = pages.find((p) => p.id === pageId);
  if (!page) return "";
  
  return `
    <div class="text-toolbar">
      <select class="text-select" onchange="updatePageTextProperty('${pageId}', 'textFont', this.value)" title="Font">
        <option value="IBM Plex Sans" ${page.textFont === "IBM Plex Sans" ? "selected" : ""}>IBM Plex</option>
        <option value="Space Grotesk" ${page.textFont === "Space Grotesk" ? "selected" : ""}>Space Grotesk</option>
        <option value="Georgia" ${page.textFont === "Georgia" ? "selected" : ""}>Georgia</option>
        <option value="Courier New" ${page.textFont === "Courier New" ? "selected" : ""}>Courier</option>
        <option value="Times New Roman" ${page.textFont === "Times New Roman" ? "selected" : ""}>Times</option>
        <option value="Verdana" ${page.textFont === "Verdana" ? "selected" : ""}>Verdana</option>
      </select>
      
      <div class="toolbar-group">
        <input type="number" min="8" max="120" value="${page.textSize}" onchange="updatePageTextProperty('${pageId}', 'textSize', this.value)" class="text-number-input" title="Font size" />
        <span class="text-unit">px</span>
      </div>
      
      <select class="text-select" onchange="updatePageTextProperty('${pageId}', 'textWeight', this.value)" title="Font weight">
        <option value="400" ${page.textWeight === "400" ? "selected" : ""}>Normal</option>
        <option value="600" ${page.textWeight === "600" ? "selected" : ""}>Semi-bold</option>
        <option value="700" ${page.textWeight === "700" ? "selected" : ""}>Bold</option>
      </select>
      
      <div class="toolbar-group">
        <button type="button" class="format-btn" title="Align left" onclick="updatePageTextProperty('${pageId}', 'textAlign', 'left')">⬅</button>
        <button type="button" class="format-btn" title="Align center" onclick="updatePageTextProperty('${pageId}', 'textAlign', 'center')">⬍</button>
        <button type="button" class="format-btn" title="Align right" onclick="updatePageTextProperty('${pageId}', 'textAlign', 'right')">➡</button>
        <button type="button" class="format-btn" title="Justify" onclick="updatePageTextProperty('${pageId}', 'textAlign', 'justify')">☰</button>
      </div>
      
      <div class="toolbar-group">
        <button type="button" class="format-btn" title="Bold" onclick="formatPageText('${pageId}', '${target}', 'bold')"><strong>B</strong></button>
        <button type="button" class="format-btn" title="Italic" onclick="formatPageText('${pageId}', '${target}', 'italic')"><em>I</em></button>
        <button type="button" class="format-btn" title="Underline" onclick="formatPageText('${pageId}', '${target}', 'underline')">U</button>
        <button type="button" class="format-btn" title="Strikethrough" onclick="formatPageText('${pageId}', '${target}', 'strike')">S</button>
      </div>
      
      <div class="toolbar-group">
        <label class="color-input-label" title="Text color"><input type="color" value="${page.textColor}" onchange="updatePageTextProperty('${pageId}', 'textColor', this.value)" class="color-input" /><span>Text</span></label>
        <label class="color-input-label" title="Background color"><input type="color" value="${page.textBgColor || '#ffffff'}" onchange="updatePageTextProperty('${pageId}', 'textBgColor', this.value)" class="color-input" /><span>BG</span></label>
      </div>
      
      <div class="toolbar-group">
        <input type="number" min="0.5" max="3" step="0.1" value="${page.textLineHeight}" onchange="updatePageTextProperty('${pageId}', 'textLineHeight', this.value)" class="text-number-input" title="Line height" />
        <span class="text-unit">lh</span>
      </div>
      
      <div class="toolbar-group">
        <input type="range" min="0" max="20" value="${page.textLetterSpacing}" onchange="updatePageTextProperty('${pageId}', 'textLetterSpacing', this.value)" class="text-slider" title="Letter spacing" />
        <span class="text-unit">LS</span>
      </div>
    </div>
  `;
}

function rewriteText(value, mode) {
  const text = String(value || "").trim();
  if (!text) return value;
  if (mode === "shorten") {
    return text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 4)
      .join("\n");
  }
  if (mode === "expand") {
    return `${text}\n\nKey detail: Add evidence, metrics, and a practical next step.`;
  }
  if (mode === "formal") {
    return text
      .replace(/\bcan't\b/gi, "cannot")
      .replace(/\bwon't\b/gi, "will not")
      .replace(/\bI'm\b/gi, "I am")
      .replace(/\bwe're\b/gi, "we are");
  }
  if (mode === "casual") {
    return text
      .replace(/\bcannot\b/gi, "can't")
      .replace(/\bwill not\b/gi, "won't")
      .replace(/\bdo not\b/gi, "don't");
  }
  return value;
}

async function rewritePage(id, mode) {
  const page = pages.find((item) => item.id === id);
  if (!page || page.locked) return;
  const apiBase = getApiBase();
  const rewriteOne = async (text) => {
    if (!text?.trim()) return text;
    try {
      const response = await fetch(`${apiBase}/api/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Rewrite failed");
      return data.text || text;
    } catch {
      return rewriteText(text, mode);
    }
  };
  if (page.type === "split") {
    page.columns.left = await rewriteOne(page.columns.left);
    page.columns.right = await rewriteOne(page.columns.right);
  } else {
    page.body = await rewriteOne(page.body);
  }
  renderPages();
  refreshMetrics();
  persistDraft();
  addLog("Rewrite", `Page ${id.slice(-4)} rewritten: ${mode}.`);
  pushHistory();
}

function togglePinPage(id) {
  const page = pages.find((item) => item.id === id);
  if (!page) return;
  page.pinned = !page.pinned;
  renderPages();
  persistDraft();
  pushHistory();
}

function toggleLockPage(id) {
  const page = pages.find((item) => item.id === id);
  if (!page) return;
  page.locked = !page.locked;
  renderPages();
  persistDraft();
  pushHistory();
}

function polishAllPages() {
  const accents = ["#cc5a3f", "#3f7ecc", "#8e44ad", "#1b8f6b", "#d18a2a"];
  const stickers = ["none", "star", "spark", "badge", "arrow"];
  const elements = ["none", "circle", "square", "line", "banner"];
  pages = pages.map((page, index) => ({
    ...page,
    accent: accents[index % accents.length],
    sticker: page.sticker === "none" ? stickers[(index + 1) % stickers.length] : page.sticker,
    element: page.element === "none" ? elements[(index + 1) % elements.length] : page.element
  }));
  renderPages();
  refreshMetrics();
  persistDraft();
  addLog("Design", "Applied smart design polish to all pages.");
  pushHistory();
}

async function requestAI(mode) {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    alert("Please enter a prompt first.");
    return null;
  }

  setStatus("busy", "Working", "Talking to the AI model...");
  addLog("Prompt", prompt);
  setAiLoading(true);
  startAiProgress();

  try {
    const apiBase = getApiBase();
    const response = await fetch(`${apiBase}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, mode, targetPages: targetPageCount })
    });

    const raw = await response.text();
    const data = raw ? JSON.parse(raw) : {};
    if (!response.ok) throw new Error(data.error || "Request failed.");
    setStatus("ready", "Ready", "Content generated.");
    stopAiProgress(true);
    return data;
  } catch (error) {
    setStatus("error", "Error", error.message);
    addLog("Error", error.message);
    alert(error.message);
    stopAiProgress(false);
    return null;
  } finally {
    setAiLoading(false);
  }
}

async function generateAIContent() {
  const data = await requestAI("write");
  if (!data) return;
  if (!pages.length) addPage("text");
  pages[0].body = data.text;
  pages[0].title = pages[0].title || data.title || "AI Notes";
  if (!titleInput.value.trim()) titleInput.value = data.title || "PDFify AI Project";
  renderPages();
  refreshMetrics();
  persistDraft();
  addLog("AI", "AI notes added to the first page.");
  pushHistory();
}

async function generateAIPDF() {
  const data = await requestAI("document");
  if (!data) return;
  titleInput.value = data.title || "AI Project";
  structuredDocument = {
    title: data.title || titleInput.value,
    sections: Array.isArray(data.sections) ? data.sections : [{ heading: "Overview", content: data.text || "" }]
  };
  pages = buildPagesFromText(data.text, data.title || titleInput.value);
  if (!pages.length) pages = [createPage("text", { title: data.title, body: data.text })];
  updateCoverFromTheme(promptInput.value.trim(), titleInput.value.trim());
  renderPages();
  renderDocumentPreview();
  refreshMetrics();
  persistDraft();
  addLog("AI", "Generated a structured multi-page builder draft.");
  pushHistory();
}

function buildPagesFromText(text, fallbackTitle) {
  const chunks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  const built = [];
  if (!chunks.length) return built;

  built.push(createPage("cover", { label: "Cover", title: fallbackTitle, body: promptInput.value.trim() }));
  const sections = [];
  let current = null;

  chunks.forEach((chunk) => {
    const lines = chunk.split("\n").filter(Boolean);
    const first = lines[0]?.trim() || "";
    const isHeading = /^(#{1,3}\s+|[A-Z][A-Z\s]{4,}|.+:)$/.test(first);

    if (isHeading) {
      if (current) sections.push(current);
      current = { title: first.replace(/^#{1,3}\s+/, "").replace(/:$/, ""), body: lines.slice(1).join("\n") };
    } else if (!current) {
      current = { title: "Overview", body: lines.join("\n") };
    } else {
      current.body += `\n\n${lines.join("\n")}`;
    }
  });

  if (current) sections.push(current);

  sections.slice(0, Math.max(1, targetPageCount - 1)).forEach((section, index) => {
    built.push(createPage(index === 1 ? "split" : "text", {
      label: `Page ${index + 2}`,
      title: section.title,
      body: section.body,
      columns: index === 1 ? splitIntoColumns(section.body) : undefined
    }));
  });

  return built;
}

async function generateStructuredDocument() {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    alert("Enter a prompt to generate a structured document.");
    return;
  }

  setStatus("busy", "Generating", "Building structured document...");
  addLog("Document", "Generating structured document.");
  setAiLoading(true);
  startAiProgress();

  try {
    const apiBase = getApiBase();
    const response = await fetch(`${apiBase}/api/document`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, mode: "document", sections: targetPageCount + 1 })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Document generation failed.");

    structuredDocument = {
      title: data.title || prompt.slice(0, 50),
      sections: Array.isArray(data.sections) ? data.sections : [{ heading: "Overview", content: data.text || prompt }]
    };

    titleInput.value = structuredDocument.title;
    pages = buildPagesFromDocument(structuredDocument);
    renderPages();
    renderDocumentPreview();
    refreshMetrics();
    persistDraft();
    addLog("Document", "Structured document generated.");
    setStatus("ready", "Ready", "Structured document ready.");
    pushHistory();
  } catch (error) {
    setStatus("error", "Error", error.message);
    addLog("Error", error.message);
    alert(error.message);
  } finally {
    setAiLoading(false);
    stopAiProgress(true);
  }
}

function buildPagesFromDocument(document) {
  const pagesOut = [];
  pagesOut.push(createPage("cover", { label: "Cover", title: document.title, body: document.sections[0]?.content || "" }));
  document.sections.slice(0, targetPageCount).forEach((section, index) => {
    pagesOut.push(createPage(index === 0 ? "split" : "text", {
      label: section.heading || `Section ${index + 1}`,
      title: section.heading,
      body: section.content,
      columns: index === 0 ? splitIntoColumns(section.content) : undefined
    }));
  });
  return pagesOut;
}

function renderDocumentPreview() {
  if (!docPreview) return;
  if (!structuredDocument.sections.length) {
    docPreview.innerHTML = `<p class="empty-note">No structured document available. Generate one to preview it here.</p>`;
    return;
  }

  docPreview.innerHTML = `
    <div class="doc-summary-card">
      <h3>${escapeHtml(structuredDocument.title)}</h3>
      <p>${escapeHtml(structuredDocument.sections[0]?.content.slice(0, 120) || "A smart document preview will appear here.")}</p>
    </div>
    <div class="doc-sections-grid">
      ${structuredDocument.sections.map((section) => `
        <section class="doc-section-card">
          <strong>${escapeHtml(section.heading)}</strong>
          <p>${escapeHtml(section.content)}</p>
        </section>
      `).join("")}
    </div>
  `;
  renderDataCharts();
}

function renderDataCharts() {
  if (!docPreview) return;
  const numericLines = pages.map((page) => page.body + " " + (page.columns?.left || "") + " " + (page.columns?.right || "")).join("\n");
  const matches = [...numericLines.matchAll(/([A-Za-z ]+?)\s*[:\-]\s*(\d+(?:\.\d+)?)/g)];
  if (!matches.length) return;

  const chartData = matches.reduce((acc, match) => {
    const label = match[1].trim();
    acc[label] = (acc[label] || 0) + Number(match[2]);
    return acc;
  }, {});

  const chartHtml = `<div class="chart-card"><strong>Auto Visual</strong><div class="chart-bars">${Object.entries(chartData)
    .map(([label, value]) => `
      <div class="chart-bar-row">
        <span>${escapeHtml(label)}</span>
        <div class="chart-bar" style="width:${Math.min(100, value / Math.max(...Object.values(chartData)) * 100)}%"></div>
        <strong>${value}</strong>
      </div>
    `).join("")}</div></div>`;

  docPreview.insertAdjacentHTML("beforeend", chartHtml);
}

function enhanceDesign() {
  polishAllPages();
  pages = pages.map((page) => ({
    ...page,
    callout: page.callout || `Tip: ${page.title} should be concise and visually strong.`,
    accent: page.accent === "#cc5a3f" ? "#3f7ecc" : page.accent,
    element: page.element === "none" ? "banner" : page.element
  }));
  renderPages();
  renderDocumentPreview();
  addLog("Design", "Auto design enhancement applied.");
  pushHistory();
}

function shareProject() {
  const snapshot = snapshotState();
  const encoded = encodeURIComponent(btoa(snapshot));
  sharedLink = `${window.location.origin}${window.location.pathname}#doc=${encoded}`;
  window.prompt("Copy this share link:", sharedLink);
}

function loadSharedDocument() {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.startsWith("doc=")) return;
  try {
    const payload = hash.replace(/^doc=/, "");
    const raw = atob(decodeURIComponent(payload));
    restoreSnapshot(raw);
    addLog("Share", "Loaded document from shared link.");
  } catch (error) {
    console.warn("Unable to load shared document.", error);
  }
}

async function askDocumentQuestion() {
  const query = docChatInput?.value.trim();
  if (!query) {
    alert("Enter a question about the document.");
    return;
  }
  if (!structuredDocument.sections.length) {
    alert("Generate or load a document first.");
    return;
  }

  addChatEntry("You", query);
  setChatStatus("Fetching answer...");

  try {
    const apiBase = getApiBase();
    const response = await fetch(`${apiBase}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, document: structuredDocument, mode: "question" })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Chat request failed.");
    addChatEntry("PDFify", result.answer);
  } catch (error) {
    addChatEntry("PDFify", `Error: ${error.message}`);
  } finally {
    setChatStatus("Ready");
    if (docChatInput) docChatInput.value = "";
  }
}

async function runDocumentAction(action) {
  if (!structuredDocument.sections.length) {
    alert("Generate a document first to use smart actions.");
    return;
  }
  addChatEntry("System", `Running ${action} action...`);
  setChatStatus(`Running ${action}...`);

  try {
    const apiBase = getApiBase();
    const response = await fetch(`${apiBase}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: action, document: structuredDocument, mode: action })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Smart action failed.");
    addChatEntry("PDFify", result.answer);
  } catch (error) {
    addChatEntry("PDFify", `Error: ${error.message}`);
  } finally {
    setChatStatus("Ready");
  }
}

function addChatEntry(sender, text) {
  const entry = document.createElement("div");
  entry.className = "chat-message";
  entry.innerHTML = `<span class="chat-sender">${escapeHtml(sender)}:</span> <span>${escapeHtml(text)}</span>`;
  chat.prepend(entry);
}

function clearDocChat() {
  chat.innerHTML = "";
  if (docChatInput) docChatInput.value = "";
  addChatEntry("System", "Document chat cleared.");
}

function exportSlides() {
  const slideText = pages.map((page, index) => `Slide ${index + 1}: ${page.title || page.label}\n${page.body || page.columns.left || page.columns.right || ""}`).join("\n\n");
  const blob = new Blob([slideText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${sanitizeFileName(titleInput.value || "pdfify-slides")}-slides.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
  addLog("Export", "Slides export created.");
}

function exportNotes() {
  const noteContent = structuredDocument.sections.length
    ? structuredDocument.sections.map((section) => `## ${section.heading}\n${section.content}`).join("\n\n")
    : pages.map((page) => `${page.title}\n${page.body}`).join("\n\n");
  const blob = new Blob([noteContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${sanitizeFileName(titleInput.value || "pdfify-notes")}-notes.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
  addLog("Export", "Notes export created.");
}

function setChatStatus(message) {
  if (statusText) statusText.textContent = message;
}

function applyTemplate(name) {
  const template = templates[name];
  if (!template) return;

  pages = template.map((page) => createPage(page.type, page));
  titleInput.value = pages[0]?.title || "PDFify AI Project";
  promptInput.value = `${name} template`;
  renderPages();
  refreshMetrics();
  persistDraft();
  addLog("Template", `${name} template applied.`);
  setStatus("ready", "Ready", `${name} template loaded.`);
  pushHistory();
}

function applyPromptPreset(text) {
  promptInput.value = text;
  promptInput.focus();
  updateCoverFromTheme(promptInput.value.trim(), titleInput.value.trim() || "PDFify AI");
  persistDraft();
  setStatus("ready", "Ready", "Prompt preset applied.");
  addLog("Prompt", "Quick prompt preset inserted.");
}

function dismissOnboarding() {
  if (!onboardingToast) return;
  onboardingToast.classList.add("hidden");
  localStorage.setItem(onboardingKey, "1");
}

function maybeShowOnboarding() {
  if (!onboardingToast) return;
  const alreadySeen = localStorage.getItem(onboardingKey) === "1";
  if (alreadySeen) return;
  onboardingToast.classList.remove("hidden");
}

function generateAIImage() {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    alert("Enter a prompt first so I can generate a demo image from it.");
    return;
  }

  const generated = createGeneratedImageFile(prompt, titleInput.value.trim() || "Generated Visual");
  uploadedFiles.unshift(generated);
  updateCoverFromTheme(prompt, titleInput.value.trim() || "PDFify AI");
  renderSelectedFiles();
  renderPages();
  refreshMetrics();
  persistDraft();
  addLog("Image", "Prompt-based demo image generated.");
  pushHistory();
}

function clearAll() {
  promptInput.value = "";
  titleInput.value = "";
  uploadedFiles = [];
  targetPageCount = 1;
  currentTheme = "editorial";
  structuredDocument = { title: "", sections: [] };
  userPreferences = { theme: "editorial", exportPresetMode: "standard" };
  pages = [createPage("cover", { label: "Cover", title: "PDFify AI", body: "Start with a prompt or build your own pages." })];
  clearLog();
  clearDocChat();
  localStorage.removeItem(draftKey);
  themeSelect.value = currentTheme;
  updateCoverFromTheme("", "PDFify AI");
  renderTargetPages();
  renderTheme();
  renderSelectedFiles();
  renderPages();
  refreshMetrics();
  setStatus("ready", "Ready", "Waiting for your prompt.");
  pushHistory();
}

function toggleMode() {
  document.body.classList.toggle("dark-mode");
}

function changeTargetPages(step) {
  targetPageCount = Math.max(1, targetPageCount + step);
  renderTargetPages();
  persistDraft();
  pushHistory();
}

function renderTargetPages() {
  targetPages.textContent = String(targetPageCount);
}

function changeTheme(value) {
  currentTheme = value;
  renderTheme();
  persistDraft();
  pushHistory();
}

function renderTheme() {
  const label = currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1);
  themeLabel.textContent = label;
  themeSelect.value = currentTheme;
  Array.from(themeGallery.querySelectorAll(".theme-tile")).forEach((tile) => {
    tile.classList.toggle("active", tile.dataset.theme === currentTheme);
  });
  updateCoverFromTheme(promptInput.value.trim(), titleInput.value.trim() || "PDFify AI");
  renderMiniPreview();
}

function updateCoverFromTheme(prompt, fallbackTitle) {
  const theme = themes[currentTheme];
  coverPreview.style.background = `linear-gradient(140deg, rgba(12, 21, 29, 0.2), rgba(12, 21, 29, 0.58)), linear-gradient(135deg, ${theme.a}, ${theme.b} 58%, ${theme.c})`;
  coverTitle.textContent = fallbackTitle || "PDFify AI";
  coverSubtitle.textContent = prompt || "Your pages will use the selected visual system when exported.";
}

async function copyContent() {
  const text = pages.map((page) => `${page.title}\n${page.body || [page.columns.left, page.columns.right].filter(Boolean).join("\n")}`).join("\n\n");
  if (!text.trim()) {
    alert("There is nothing to copy yet.");
    return;
  }
  await navigator.clipboard.writeText(text);
  addLog("Clipboard", "Project copied to clipboard.");
}

function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const theme = themes[currentTheme];
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  const imageCompression = exportPresetMode === "print" ? "NONE" : exportPresetMode === "compact" ? "FAST" : "MEDIUM";

  pages.forEach((page, index) => {
    if (index > 0) doc.addPage();
    const asset = uploadedFiles.find((file) => file.id === page.assetId && file.isImage);
    renderPdfPage(doc, page, theme, asset, { pageWidth, pageHeight, margin, maxWidth, imageCompression });
  });

  doc.save(`${sanitizeFileName(titleInput.value || "pdfify-ai-project")}.pdf`);
  addLog("Export", "Multi-page PDF exported successfully.");
}

function renderPdfPage(doc, page, theme, asset, dims) {
  const { pageWidth, pageHeight, margin, maxWidth, imageCompression } = dims;
  doc.setFillColor(...theme.surface);
  doc.rect(0, 0, pageWidth, 170, "F");
  const rgb = hexToRgb(page.accent || "#cc5a3f");
  doc.setFillColor(rgb.r, rgb.g, rgb.b);
  doc.rect(pageWidth - 116, 22, 68, 68, "F");
  drawPdfElement(doc, page, rgb, pageWidth, pageHeight, margin);
  doc.setTextColor(255, 248, 241);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(page.type === "cover" ? 28 : 22);
  doc.text(page.title || page.label, margin, 72, { maxWidth });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(titleInput.value || "PDFify AI", margin, 104);

  let y = 208;
  if (asset?.dataUrl) {
    try {
      const imgWidth = toPoints(page.imageWidth || 4, page.imageUnit || 'in');
      const imgHeight = toPoints(page.imageHeight || 3, page.imageUnit || 'in');
      const imgX = margin + (maxWidth - imgWidth) * ((page.imageX || 50) / 100);
      doc.addImage(asset.dataUrl, detectImageFormat(asset.dataUrl), imgX, y, imgWidth, imgHeight, undefined, imageCompression || "MEDIUM");
      y += imgHeight + 20;
    } catch {}
  }

  doc.setTextColor(30, 34, 38);
  if (page.callout) {
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.roundedRect(margin, y, maxWidth, 46, 10, 10, "F");
    doc.setTextColor(255, 248, 241);
    doc.setFontSize(12);
    doc.text(doc.splitTextToSize(page.callout, maxWidth - 24), margin + 12, y + 28);
    doc.setTextColor(30, 34, 38);
    y += 64;
  }

  // Apply text styling
  const textColorRgb = hexToRgb(page.textColor || "#000000");
  doc.setTextColor(textColorRgb.r, textColorRgb.g, textColorRgb.b);
  doc.setFont("helvetica", page.textWeight === "700" ? "bold" : "normal");
  doc.setFontSize(Math.max(8, page.textSize * 0.75)); // Scale for PDF
  
  if (page.type === "split") {
    renderPdfColumns(doc, page.columns.left, page.columns.right, y, dims);
  } else if (page.type === "image" && asset?.dataUrl) {
    const lines = doc.splitTextToSize(page.body || "", maxWidth);
    doc.text(lines, margin, y);
  } else {
    const content = page.body || [page.columns.left, page.columns.right].filter(Boolean).join("\n");
    const lines = doc.splitTextToSize(content, maxWidth);
    doc.text(lines, margin, y);
  }

  doc.setDrawColor(210, 214, 220);
  doc.line(margin, pageHeight - 36, pageWidth - margin, pageHeight - 36);
}

function renderPdfColumns(doc, left, right, startY, dims) {
  const { margin, maxWidth } = dims;
  const gap = 18;
  const columnWidth = (maxWidth - gap) / 2;
  const leftLines = doc.splitTextToSize(left || "", columnWidth);
  const rightLines = doc.splitTextToSize(right || "", columnWidth);
  doc.text(leftLines, margin, startY);
  doc.text(rightLines, margin + columnWidth + gap, startY);
}

function refreshMetrics() {
  const words = pages
    .map((page) => [page.title, page.body, page.columns?.left, page.columns?.right].filter(Boolean).join(" "))
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  wordCount.textContent = String(words || 0);
  pageEstimate.textContent = String(Math.max(1, pages.length || 1));
  assetCount.textContent = String(uploadedFiles.length);
  previewCount.textContent = `${pages.length} ${pages.length === 1 ? "page" : "pages"}`;
  const minutes = Math.max(1, Math.ceil((words || 0) / 220));
  if (readTime) readTime.textContent = `${minutes} min`;
}

function persistDraft() {
  setSaveState("Saving...");
  localStorage.setItem(draftKey, JSON.stringify({
    prompt: promptInput.value,
    title: titleInput.value,
    targetPages: targetPageCount,
    theme: currentTheme,
    files: uploadedFiles,
    pages,
    savedAt: new Date().toISOString()
  }));
  setSaveState("Saved", true);
}

function saveDraft() {
  persistDraft();
  addLog("Draft", "Builder draft saved in this browser.");
}

function archiveDraft() {
  const raw = localStorage.getItem(draftKey);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    localStorage.setItem(lastDraftKey, JSON.stringify({
      ...data,
      archivedAt: new Date().toISOString()
    }));
  } catch {
    // ignore invalid draft data
  }
  localStorage.removeItem(draftKey);
}

function getLastDraft() {
  try {
    const raw = localStorage.getItem(lastDraftKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function restoreLastDraft() {
  const draft = getLastDraft();
  if (!draft) return;
  promptInput.value = draft.prompt || "";
  titleInput.value = draft.title || "";
  targetPageCount = Math.max(1, Number(draft.targetPages) || 1);
  currentTheme = draft.theme || "editorial";
  uploadedFiles = Array.isArray(draft.files) ? draft.files : [];
  pages = Array.isArray(draft.pages) && draft.pages.length ? draft.pages : [createPage("cover")];
  themeSelect.value = currentTheme;
  if (exportPreset) exportPreset.value = exportPresetMode;
  if (activeProjectLabel) activeProjectLabel.textContent = activeProjectName;
  renderTargetPages();
  renderTheme();
  renderSelectedFiles();
  renderPages();
  refreshMetrics();
  persistDraft();
  addLog("Draft", "Restored previous draft.");
}

function restoreDraft() {
  const raw = localStorage.getItem(draftKey);
  if (!raw) {
    clearAll();
    return;
  }

  try {
    const draft = JSON.parse(raw);
    promptInput.value = draft.prompt || "";
    titleInput.value = draft.title || "";
    targetPageCount = Math.max(1, Number(draft.targetPages) || 1);
    currentTheme = draft.theme || "editorial";
    uploadedFiles = Array.isArray(draft.files) ? draft.files : [];
    pages = Array.isArray(draft.pages) && draft.pages.length ? draft.pages : [createPage("cover")];
    themeSelect.value = currentTheme;
    renderTargetPages();
    renderTheme();
    renderSelectedFiles();
    renderPages();
    refreshMetrics();
    addLog("Draft", "Previous builder draft restored.");
  } catch {
    clearAll();
  }
}

function openImagePicker() {
  imageUpload.click();
}

function clearSelectedFiles() {
  uploadedFiles = [];
  imageUpload.value = "";
  renderSelectedFiles();
  renderPages();
  refreshMetrics();
  persistDraft();
  pushHistory();
}

function handlePageDragStart(event, pageId) {
  draggedPageId = pageId;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", pageId);
  const card = event.currentTarget;
  if (card) card.classList.add("dragging");
}

function handlePageDragOver(event, pageId) {
  event.preventDefault();
  if (!draggedPageId || draggedPageId === pageId) return;
  const card = event.currentTarget;
  if (card) card.classList.add("drag-target");
}

function handlePageDrop(event, pageId) {
  event.preventDefault();
  const draggedId = draggedPageId || event.dataTransfer.getData("text/plain");
  if (!draggedId || draggedId === pageId) return;

  const fromIndex = pages.findIndex((page) => page.id === draggedId);
  const toIndex = pages.findIndex((page) => page.id === pageId);
  if (fromIndex < 0 || toIndex < 0) return;

  const [moved] = pages.splice(fromIndex, 1);
  pages.splice(toIndex, 0, moved);
  draggedPageId = null;
  renderPages();
  persistDraft();
  addLog("Builder", "Page order updated.");
  pushHistory();
}

function handlePageDragEnd() {
  draggedPageId = null;
  Array.from(document.querySelectorAll(".page-card")).forEach((card) => {
    card.classList.remove("dragging", "drag-target");
  });
}

function renderSelectedFiles() {
  const imageFiles = uploadedFiles.filter((file) => file.isImage);
  const videoFiles = uploadedFiles.filter((file) => file.isVideo);
  if (!uploadedFiles.length) {
    imageStage.className = "image-stage empty";
    imageStage.innerHTML = "<p>No image files yet.</p>";
    videoStage.className = "video-stage empty";
    videoStage.innerHTML = "<p>No video files yet.</p>";
    fileList.className = "file-list empty";
    fileList.innerHTML = "<p>No uploaded files yet.</p>";
    return;
  }

  if (imageFiles.length) {
    imageStage.className = "image-stage";
    imageStage.innerHTML = `<div class="image-stage-grid">${imageFiles
      .map((file) => `<div class="image-thumb"><img src="${file.dataUrl}" alt="${escapeHtml(file.name)}" /></div>`)
      .join("")}</div>`;
  } else {
    imageStage.className = "image-stage empty";
    imageStage.innerHTML = "<p>No image files yet.</p>";
  }

  if (videoFiles.length) {
    videoStage.className = "video-stage";
    videoStage.innerHTML = `<div class="video-stage-grid">${videoFiles
      .map((file) => `<div class="video-thumb"><video src="${file.dataUrl}" controls muted></video><p>${escapeHtml(file.name)}</p></div>`)
      .join("")}</div>`;
  } else {
    videoStage.className = "video-stage empty";
    videoStage.innerHTML = "<p>No video files yet.</p>";
  }

  fileList.className = "file-list";
  fileList.innerHTML = uploadedFiles.map((file, index) => `
    <div class="file-item">
      <div>
        <strong>${escapeHtml(file.name)}</strong>
        <span>${escapeHtml(file.type || "Unknown type")} | ${formatFileSize(file.size)}</span>
      </div>
      <button type="button" class="file-remove-btn" onclick="removeFile(${index})">Remove</button>
    </div>
  `).join("");
}

function renderMiniPreview() {
  if (!miniPreview) return;

  const theme = themes[currentTheme];
  previewCount.textContent = `${pages.length} ${pages.length === 1 ? "page" : "pages"}`;
  miniPreview.innerHTML = pages.map((page, index) => {
    const asset = uploadedFiles.find((file) => file.id === page.assetId && file.isImage);
    const bodyText = page.type === "split"
      ? [page.columns.left, page.columns.right].filter(Boolean).join(" ")
      : page.body;
    
    const textStyle = `font-family: ${page.textFont}; font-size: ${page.textSize * 0.6}px; color: ${page.textColor}; font-weight: ${page.textWeight}; line-height: ${page.textLineHeight}; opacity: ${page.textOpacity};`;

    return `
      <article class="mini-slide" style="--theme-a:${theme.a}; --theme-b:${theme.b}; --theme-c:${theme.c}; --page-accent:${page.accent}; animation-delay:${index * 80}ms">
        ${renderElement(page)}
        <div class="mini-slide-top">
          <span class="mini-slide-number">${index + 1}</span>
          <span class="mini-slide-type">${escapeHtml(page.type)}</span>
        </div>
        ${renderSticker(page.sticker)}
        <h4>${escapeHtml(page.title || page.label || `Page ${index + 1}`)}</h4>
        <p style="${textStyle}">${escapeHtml((bodyText || "No content yet.").slice(0, 120))}</p>
        ${page.callout ? `<div class="mini-callout">${escapeHtml(page.callout)}</div>` : ""}
        ${asset ? `<div class="mini-slide-image"><img src="${asset.dataUrl}" alt="${escapeHtml(asset.name)}" /></div>` : ""}
      </article>
    `;
  }).join("");
}

function openPresentationMode() {
  if (!pages.length) return;
  currentSlideIndex = 0;
  presentationOverlay.classList.remove("hidden");
  presentationOverlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  renderPresentationSlide();
  addLog("Present", "Presentation mode opened.");
}

function closePresentationMode() {
  presentationOverlay.classList.add("hidden");
  presentationOverlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function nextSlide() {
  if (!pages.length) return;
  currentSlideIndex = Math.min(pages.length - 1, currentSlideIndex + 1);
  renderPresentationSlide();
}

function previousSlide() {
  if (!pages.length) return;
  currentSlideIndex = Math.max(0, currentSlideIndex - 1);
  renderPresentationSlide();
}

function renderPresentationSlide() {
  const page = pages[currentSlideIndex];
  if (!page) return;

  const theme = themes[currentTheme];
  const asset = uploadedFiles.find((file) => file.id === page.assetId && file.isImage);
  const bodyText = page.type === "split"
    ? [page.columns.left, page.columns.right].filter(Boolean)
    : [page.body];
  
  const textStyle = `font-family: ${page.textFont}; font-size: ${page.textSize}px; color: ${page.textColor}; font-weight: ${page.textWeight}; text-align: ${page.textAlign}; line-height: ${page.textLineHeight}; letter-spacing: ${page.textLetterSpacing}px; opacity: ${page.textOpacity}; ${page.textBgColor ? `background-color: ${page.textBgColor}; padding: 12px 16px; border-radius: 8px;` : ''} ${page.textDecoration !== 'none' ? `text-decoration: ${page.textDecoration};` : ''} ${page.textShadow ? `text-shadow: ${page.textShadow};` : ''}`;

  presentationTitle.textContent = titleInput.value || "PDFify AI";
  presentationCount.textContent = `${currentSlideIndex + 1} / ${pages.length}`;
  presentationStage.innerHTML = `
    <article class="presentation-slide" style="--theme-a:${theme.a}; --theme-b:${theme.b}; --theme-c:${theme.c}; --page-accent:${page.accent}">
      ${renderElement(page)}
      <div class="presentation-slide-head">
        <span class="presentation-badge">${escapeHtml(page.label || `Page ${currentSlideIndex + 1}`)}</span>
        <span class="presentation-badge subtle">${escapeHtml(page.type)}</span>
      </div>
      ${renderSticker(page.sticker)}
      <h2>${escapeHtml(page.title || "Untitled Slide")}</h2>
      <div class="presentation-slide-body ${page.type === "split" ? "is-split" : ""}">
        ${page.type === "split"
          ? `
            <div class="presentation-column" style="${textStyle}">${escapeHtml(bodyText[0] || "").replace(/\n/g, "<br>")}</div>
            <div class="presentation-column" style="${textStyle}">${escapeHtml(bodyText[1] || "").replace(/\n/g, "<br>")}</div>
          `
          : `<div class="presentation-copy" style="${textStyle}">${escapeHtml(bodyText[0] || "").replace(/\n/g, "<br>")}</div>`
        }
        ${page.callout ? `<div class="presentation-callout">${escapeHtml(page.callout)}</div>` : ""}
        ${asset ? `<div class="presentation-image"><img src="${asset.dataUrl}" alt="${escapeHtml(asset.name)}" /></div>` : ""}
      </div>
    </article>
  `;
}

function handleSelectedFiles(files) {
  Array.from(files || []).forEach((file) => handleSelectedFile(file));
}

function handleSelectedFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    uploadedFiles.push({
      id: generateId(),
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size || 0,
      dataUrl: reader.result,
      isImage: file.type.startsWith("image/"),
      isVideo: file.type.startsWith("video/")
    });
    renderSelectedFiles();
    renderPages();
    refreshMetrics();
    persistDraft();
    addLog("Files", `${file.name} added to the library.`);
  };
  reader.readAsDataURL(file);
}

function formatPageText(pageId, target, type) {
  let selector = `[data-page-body="${pageId}"]`;
  if (target === "left" || target === "right") {
    selector = `[data-page-column="${pageId}:${target}"]`;
  }

  const textarea = document.querySelector(selector);
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end);
  const raw = selected || textarea.value;
  let replacement = selected;

  if (type === "bold") replacement = `**${raw}**`;
  if (type === "italic") replacement = `_${raw}_`;
  if (type === "underline") replacement = `<u>${raw}</u>`;
  if (type === "strike") replacement = `~~${raw}~~`;
  if (type === "upper") replacement = raw.toUpperCase();
  if (type === "bullet") {
    const lines = raw.split("\n").map((line) => line.trim() ? `• ${line.replace(/^•\s*/, "")}` : line);
    replacement = lines.join("\n");
  }

  if (selected) {
    textarea.setRangeText(replacement, start, end, "select");
  } else {
    textarea.value = replacement;
  }

  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.focus();
}

function updatePageTextProperty(pageId, property, value) {
  const page = pages.find((p) => p.id === pageId);
  if (!page) return;
  
  if (property === "textSize" || property === "textLineHeight" || property === "textLetterSpacing") {
    page[property] = Number(value);
  } else {
    page[property] = value;
  }
  
  renderPages();
  persistDraft();
  pushHistory();
}

function removeFile(index) {
  const removed = uploadedFiles[index];
  uploadedFiles = uploadedFiles.filter((_, currentIndex) => currentIndex !== index);
  pages = pages.map((page) => page.assetId === removed?.id ? { ...page, assetId: "" } : page);
  renderSelectedFiles();
  renderPages();
  refreshMetrics();
  persistDraft();
  pushHistory();
}

function createPromptIllustration(prompt, title) {
  const theme = themes[currentTheme];
  const safePrompt = escapeHtml(prompt.slice(0, 90) || "Prompt illustration");
  const safeTitle = escapeHtml(title.slice(0, 32) || "PDFify AI");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.a}"/><stop offset="60%" stop-color="${theme.b}"/><stop offset="100%" stop-color="${theme.c}"/>
      </linearGradient></defs>
      <rect width="1200" height="800" fill="url(#bg)"/>
      <rect x="80" y="90" width="1040" height="600" rx="36" fill="rgba(11,23,32,0.18)" stroke="rgba(255,255,255,0.18)"/>
      <text x="130" y="230" fill="#fff7f1" font-family="Arial, sans-serif" font-weight="700" font-size="72">${safeTitle}</text>
      <text x="130" y="310" fill="rgba(255,247,241,0.88)" font-family="Arial, sans-serif" font-size="34">${safePrompt}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function createGeneratedImageFile(prompt, title) {
  return {
    id: generateId(),
    name: `${sanitizeFileName(title || "generated-image")}.svg`,
    type: "image/svg+xml",
    size: prompt.length,
    dataUrl: createPromptIllustration(prompt, title),
    isImage: true
  };
}

function detectImageFormat(dataUrl) {
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  if (dataUrl.startsWith("data:image/webp")) return "WEBP";
  if (dataUrl.startsWith("data:image/svg+xml")) return "SVG";
  return "JPEG";
}

function sanitizeFileName(value) {
  return value.replace(/[<>:"/\\|?*]+/g, "").trim() || "document";
}

function formatFileSize(size) {
  if (!size) return "0 KB";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function toPoints(value, unit) {
  switch (unit) {
    case 'in': return value * 72;
    case 'cm': return (value / 2.54) * 72;
    case 'mm': return (value / 25.4) * 72;
    case 'px': return (value / 96) * 72; // assuming 96 dpi
    default: return value * 72;
  }
}

function renderSticker(type) {
  if (!type || type === "none") return "";
  const map = {
    star: "★",
    spark: "✦",
    badge: "●",
    arrow: "➜"
  };
  return `<div class="sticker-badge">${map[type] || "✦"}</div>`;
}

function renderElement(page) {
  if (!page?.element || page.element === "none") return "";
  return `<div class="decor-element decor-${page.element}" style="--element-x:${page.elementX}%; --element-y:${page.elementY}%; --element-size:${page.elementSize}px;"></div>`;
}

function hexToRgb(hex) {
  const normalized = (hex || "#cc5a3f").replace("#", "");
  const bigint = parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function drawPdfElement(doc, page, rgb, pageWidth, pageHeight, margin) {
  const type = page?.element;
  if (!type || type === "none") return;

  const size = Math.max(24, page.elementSize || 120);
  const x = margin + ((pageWidth - margin * 2) * ((page.elementX ?? 82) / 100));
  const y = 40 + ((pageHeight - 140) * ((page.elementY ?? 18) / 100));

  doc.setFillColor(rgb.r, rgb.g, rgb.b);
  if (type === "circle") {
    doc.circle(x, y, size / 3, "F");
  }
  if (type === "square") {
    doc.roundedRect(x - size / 3, y - size / 3, size * 0.66, size * 0.66, 10, 10, "F");
  }
  if (type === "line") {
    doc.setDrawColor(rgb.r, rgb.g, rgb.b);
    doc.setLineWidth(4);
    doc.line(margin, y, pageWidth - margin, y);
  }
  if (type === "banner") {
    doc.roundedRect(x - size / 2, y - 16, size, 32, 8, 8, "F");
  }
}

promptInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.ctrlKey) {
    event.preventDefault();
    generateAIPDF();
  }
});

titleInput.addEventListener("input", () => {
  updateCoverFromTheme(promptInput.value.trim(), titleInput.value.trim() || "PDFify AI");
  persistDraft();
});
promptInput.addEventListener("input", () => {
  updateCoverFromTheme(promptInput.value.trim(), titleInput.value.trim() || "PDFify AI");
  persistDraft();
});
imageUpload.addEventListener("change", (event) => handleSelectedFiles(event.target.files));

["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("drag-over");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("drag-over");
  });
});

dropZone.addEventListener("drop", (event) => handleSelectedFiles(event.dataTransfer.files));

window.addEventListener("paste", (event) => {
  const imageItem = Array.from(event.clipboardData?.items || []).find((item) => item.type.startsWith("image/"));
  if (!imageItem) return;
  const file = imageItem.getAsFile();
  if (file) handleSelectedFile(file);
});

window.addEventListener("keydown", (event) => {
  const ctrlOrCmd = event.ctrlKey || event.metaKey;
  if (ctrlOrCmd && event.key.toLowerCase() === "z" && !event.shiftKey) {
    event.preventDefault();
    undoChange();
  }
  if (ctrlOrCmd && (event.key.toLowerCase() === "y" || (event.shiftKey && event.key.toLowerCase() === "z"))) {
    event.preventDefault();
    redoChange();
  }
  if (ctrlOrCmd && event.key.toLowerCase() === "s") {
    event.preventDefault();
    saveDraft();
  }
  if (ctrlOrCmd && event.key === "Enter") {
    event.preventDefault();
    generateAIPDF();
  }

  if (presentationOverlay.classList.contains("hidden")) return;
  if (event.key === "ArrowRight") {
    event.preventDefault();
    nextSlide();
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    previousSlide();
  }
  if (event.key === "Escape") {
    event.preventDefault();
    closePresentationMode();
  }
});

window.addEventListener("load", async () => {
  restoreDraft();
  renderProjectList();
  maybeShowOnboarding();
  loadSharedDocument();
  renderDocumentPreview();
  pushHistory();
  updateHistoryButtons();
  try {
    const apiBase = getApiBase();
    const response = await fetch(`${apiBase}/api/health`);
    if (!response.ok) throw new Error("Health check failed");
    setStatus("ready", "Ready", `Server connected at ${apiBase}.`);
  } catch {
    const apiBase = getApiBase();
    setStatus("error", "Offline", `Backend not reachable at ${apiBase}.`);
    addLog("Status", `Server health check failed. Start the Node server and open the app from ${apiBase}.`);
  }
});

window.addEventListener("beforeunload", () => {
  archiveDraft();
});

window.addEventListener("pagehide", () => {
  archiveDraft();
});

function getApiBase() {
  if (window.location.protocol === "file:") {
    return "http://localhost:5000";
  }
  return window.location.origin;
}

if (pageFilterInput) {
  pageFilterInput.addEventListener("input", (event) => {
    pageFilterQuery = String(event.target.value || "").toLowerCase().trim();
    applyPageFilter();
  });
}

if (importJsonInput) {
  importJsonInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) importProjectJson(file);
    importJsonInput.value = "";
  });
}

// Modal confirmation system
let pendingConfirmAction = null;

function showConfirmModal(title, message, onConfirm) {
  const modal = document.getElementById("confirmModal");
  const titleEl = document.getElementById("confirmTitle");
  const messageEl = document.getElementById("confirmMessage");
  const confirmBtn = document.getElementById("confirmBtn");
  
  titleEl.textContent = title;
  messageEl.textContent = message;
  pendingConfirmAction = onConfirm;
  
  modal.style.display = "flex";
  confirmBtn.focus();
}

function closeModal() {
  const modal = document.getElementById("confirmModal");
  modal.style.display = "none";
  pendingConfirmAction = null;
}

function executeConfirmed() {
  if (pendingConfirmAction) {
    pendingConfirmAction();
  }
  closeModal();
}

// Improved delete with modal
function removePageWithModal(id) {
  const page = pages.find((item) => item.id === id);
  if (!page) return;
  
  if (page.pinned) {
    alert("Cannot delete a pinned page. Unpin it first.");
    return;
  }
  
  if (pages.length === 1) {
    alert("Cannot delete the last page.");
    return;
  }
  
  const pageLabel = page.label || page.title || `Page ${pages.findIndex(p => p.id === id) + 1}`;
  showConfirmModal(
    "Delete Page",
    `Are you sure you want to delete "${pageLabel}"? This cannot be undone.`,
    () => {
      pages = pages.filter((item) => item.id !== id);
      renderPages();
      refreshMetrics();
      persistDraft();
      pushHistory();
      addLog("Page", `Deleted page: ${pageLabel}`);
    }
  );
}

// Improved project delete with modal
function deleteProjectWithModal(name) {
  showConfirmModal(
    "Delete Project",
    `Are you sure you want to delete "${name}"? This cannot be undone.`,
    () => {
      const projects = getProjects().filter((item) => item.name !== name);
      setProjects(projects);
      renderProjectList();
      addLog("Project", `Deleted project: ${name}`);
    }
  );
}

// Improved draft delete with modal
function deleteLastDraftWithModal() {
  showConfirmModal(
    "Delete Draft",
    "Are you sure you want to delete the last draft? This cannot be undone.",
    () => {
      localStorage.removeItem(lastDraftKey);
      renderProjectList();
      addLog("Draft", "Deleted last draft");
    }
  );
}
