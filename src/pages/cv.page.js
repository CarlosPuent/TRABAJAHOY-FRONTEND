// CV Management Page Controller
import { candidateService } from "@services/candidate.service";
import {
  getAuthUiContext,
  renderContentState,
  renderSectionHeader,
  showLoading,
  renderNavbar,
  renderPage,
} from "@utils/ui.js";

export async function initCVPage(params, query) {
  const authContext = getAuthUiContext();
  const user = authContext.user;
  showLoading("Cargando CVs...");

  try {
    const cvsData = await candidateService.getCVs(user?.id);
    const cvs = cvsData.data || [];
    document.getElementById("app").innerHTML = getCVHTML(
      authContext,
      cvs,
      false,
    );
    initCVEvents();
  } catch (error) {
    console.error("Error loading CVs:", error);
    document.getElementById("app").innerHTML = getCVHTML(authContext, [], true);
    initCVEvents();
  }
}

function getCVHTML(authContext, cvs, loadFailed = false) {
  const { user, isAuthenticated, roles, primaryRole } = authContext;
  const navbar = renderNavbar({
    activeRoute: "candidate/cv",
    isAuthenticated,
    user,
    roles,
    primaryRole,
  });

  const header = renderSectionHeader({
    title: "Mi CV",
    subtitle:
      "Sube y gestiona tus documentos curriculares. Formatos permitidos: PDF, DOC, DOCX (max 5MB).",
    actions:
      '<button class="btn btn--primary" id="upload-cv-btn"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>Subir CV</button>',
  });

  const sidebarHTML = `
    <aside class="cv-sidebar">
      <div class="cv-sidebar__brand">
        <h3 class="cv-sidebar__brand-title">TrabajaHoy</h3>
        <p class="cv-sidebar__brand-sub">Gestion de CV</p>
      </div>
      <nav class="cv-sidebar__nav">
        <a href="#/candidate/dashboard" class="cv-sidebar__link">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          Panel
        </a>
        <a href="#/candidate/profile" class="cv-sidebar__link">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          Mi Perfil
        </a>
        <a href="#/candidate/profile/edit" class="cv-sidebar__link">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          Editar Perfil
        </a>
        <a href="#/candidate/cv" class="cv-sidebar__link cv-sidebar__link--active">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          Mi CV
        </a>
        <a href="#/candidate/saved-jobs" class="cv-sidebar__link">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          Empleos Guardados
        </a>
        <a href="#/candidate/applications" class="cv-sidebar__link">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          Mis Aplicaciones
        </a>
      </nav>
    </aside>
  `;

  const mainContent = `
    <div class="cv-content">
      ${header}
      ${loadFailed ? '<div class="cv-warning">No se pudieron cargar todos tus documentos. Puedes reintentar en unos segundos.</div>' : ""}

      <div class="cv-upload-area" id="cv-drop-zone">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        <p class="cv-upload-text">Arrastra tu archivo aqui o haz clic para seleccionar</p>
        <input type="file" id="cv-file-input" accept=".pdf,.doc,.docx" style="display:none;" />
      </div>

      <div class="cv-list">
        ${
          cvs.length > 0
            ? cvs
                .map((cv) => {
                  const ext = (cv.fileName || "")
                    .split(".")
                    .pop()
                    .toUpperCase();
                  const size = cv.fileSize ? formatFileSize(cv.fileSize) : "";
                  const isPDF = ext === "PDF";
                  return `
            <div class="cv-row" data-id="${cv.id}">
              <div class="cv-row__icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#6b7280" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              </div>
              <div class="cv-row__info">
                <p class="cv-row__name">${cv.fileName || "Documento"}</p>
                <p class="cv-row__meta">${ext}${size ? ` · ${size}` : ""}${cv.createdAt ? ` · ${new Date(cv.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}` : ""}</p>
              </div>
              <div class="cv-row__actions">
                ${
                  isPDF
                    ? `<button class="btn btn--sm btn--outline" data-preview-cv="${cv.id}" data-url="${cv.downloadUrl || ""}" title="Vista previa">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  Ver
                </button>`
                    : ""
                }
                <button class="btn-icon" data-view-cv="${cv.id}" data-url="${cv.downloadUrl || ""}" title="Descargar">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </button>
                <button class="btn-icon btn-icon--danger" data-del-cv="${cv.id}" title="Eliminar">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          `;
                })
                .join("")
            : renderContentState({
                title: "No has subido ningun CV",
                message:
                  "Sube tu currículum para compartirlo con empresas y reclutadores.",
                compact: false,
              })
        }
      </div>
    </div>

    <!-- PDF Preview Modal -->
    <div id="cv-pdf-modal" class="cv-modal" style="display:none;">
      <div class="cv-modal__overlay"></div>
      <div class="cv-modal__content">
        <div class="cv-modal__header">
          <h2 class="cv-modal__title" id="cv-modal-title">Vista Previa del CV</h2>
          <button class="cv-modal__close" id="cv-modal-close">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="cv-modal__body">
          <iframe id="cv-pdf-frame" src="" style="width:100%;height:100%;border:none;"></iframe>
        </div>
      </div>
    </div>
  `;

  const styles = `
    .cv-layout { display: flex; min-height: calc(100vh - 70px); background: #f3f4f6; }
    .cv-sidebar { width: 260px; flex-shrink: 0; background: white; border-right: 1px solid #e5e7eb; position: sticky; top: 70px; height: calc(100vh - 70px); overflow-y: auto; display: flex; flex-direction: column; }
    .cv-sidebar__brand { padding: 24px 20px; border-bottom: 1px solid #f3f4f6; }
    .cv-sidebar__brand-title { font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 2px; }
    .cv-sidebar__brand-sub { font-size: 12px; color: #6b7280; margin: 0; }
    .cv-sidebar__nav { padding: 16px 0; flex: 1; }
    .cv-sidebar__link { display: flex; align-items: center; gap: 12px; padding: 11px 20px; color: #6b7280; text-decoration: none; font-size: 14px; font-weight: 500; transition: all 0.15s; border-right: 3px solid transparent; }
    .cv-sidebar__link:hover { background: #f9fafb; color: #111827; }
    .cv-sidebar__link--active { background: #eff6ff; color: #2563eb; border-right-color: #2563eb; }
    .cv-content { flex: 1; padding: 32px; min-width: 0; }
    .cv-warning {
      margin: 0 0 14px;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #fde68a;
      background: #fffbeb;
      color: #92400e;
      font-size: 13px;
    }
    .cv-upload-area { border: 2px dashed #e5e7eb; border-radius: 12px; padding: 40px; text-align: center; margin-bottom: 24px; cursor: pointer; transition: all 0.15s; background: white; }
    .cv-upload-area:hover { border-color: #3b82f6; background: #f8faff; }
    .cv-upload-area.dragover { border-color: #3b82f6; background: #eff6ff; }
    .cv-upload-text { color: #6b7280; font-size: 14px; margin: 12px 0 0; }
    .cv-list { display: flex; flex-direction: column; gap: 8px; }
    .cv-row { display: flex; align-items: center; gap: 16px; background: white; padding: 16px 20px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .cv-row__icon { flex-shrink: 0; }
    .cv-row__info { flex: 1; min-width: 0; }
    .cv-row__name { font-size: 14px; font-weight: 600; color: #111827; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cv-row__meta { font-size: 12px; color: #9ca3af; margin: 0; }
    .cv-row__actions { display: flex; gap: 4px; flex-shrink: 0; }
    .th-content-state {
      background: white;
      border-style: solid;
    }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; text-decoration: none; border: none; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
    .btn--primary { background: #3b82f6; color: white; }
    .btn--primary:hover { background: #2563eb; }
    .btn--sm { padding: 7px 14px; font-size: 13px; }
    .btn--outline { background: white; color: #3b82f6; border: 1px solid #3b82f6; }
    .btn--outline:hover { background: #eff6ff; }
    .btn-icon { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 6px; color: #6b7280; transition: all 0.15s; display: flex; }
    .btn-icon:hover { background: #f3f4f6; color: #374151; }
    .btn-icon--danger:hover { background: #fee2e2; color: #dc2626; }
    
    /* PDF Preview Modal */
    .cv-modal { position: fixed; inset: 0; z-index: 1000; }
    .cv-modal__overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); }
    .cv-modal__content { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 12px; width: 90%; max-width: 900px; height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .cv-modal__header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
    .cv-modal__title { font-size: 18px; font-weight: 600; color: #111827; margin: 0; }
    .cv-modal__close { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 6px; color: #6b7280; transition: all 0.15s; }
    .cv-modal__close:hover { background: #f3f4f6; color: #374151; }
    .cv-modal__body { flex: 1; overflow: hidden; }
    
    @media (max-width: 1024px) {
      .cv-layout { flex-direction: column; }
      .cv-sidebar { width: 100%; position: static; height: auto; border-right: none; border-bottom: 1px solid #e5e7eb; }
      .cv-sidebar__brand { display: none; }
      .cv-sidebar__nav { display: flex; flex-direction: row; overflow-x: auto; padding: 8px 0; gap: 0; }
      .cv-sidebar__link { border-right: none; border-bottom: 3px solid transparent; white-space: nowrap; padding: 10px 16px; }
      .cv-sidebar__link--active { border-bottom-color: #2563eb; }
      .cv-content { padding: 20px 16px; }
      .cv-modal__content { width: 95%; height: 90vh; }
    }
  `;

  return renderPage({
    navbar,
    main: `<div class="cv-layout">${sidebarHTML}${mainContent}</div>`,
    extraStyles: styles,
  });
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function initCVEvents() {
  // Upload CV
  const uploadBtn = document.getElementById("upload-cv-btn");
  const dropZone = document.getElementById("cv-drop-zone");
  const fileInput = document.getElementById("cv-file-input");

  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener("click", () => fileInput.click());
    dropZone.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () =>
      handleFileUpload(fileInput.files[0]),
    );
  }

  if (dropZone) {
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });
    dropZone.addEventListener("dragleave", () =>
      dropZone.classList.remove("dragover"),
    );
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      if (e.dataTransfer.files.length)
        handleFileUpload(e.dataTransfer.files[0]);
    });
  }

  // Delete CV
  document.querySelectorAll("[data-del-cv]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (confirm("Eliminar este CV?")) {
        try {
          await candidateService.deleteCV(btn.dataset.delCv);
          btn.closest(".cv-row").remove();
          // If no more CVs, refresh
          if (!document.querySelectorAll(".cv-row").length) location.reload();
        } catch (error) {
          console.error("Delete error:", error);
        }
      }
    });
  });

  // View/Download CV
  document.querySelectorAll("[data-view-cv]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.dataset.url;
      if (url) {
        // Create a temporary link for download
        const a = document.createElement("a");
        a.href = url;
        a.download = "";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert("URL de descarga no disponible");
      }
    });
  });

  // Preview PDF in modal
  document.querySelectorAll("[data-preview-cv]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.dataset.url;
      if (url) {
        showPDFModal(url);
      } else {
        alert("URL de vista previa no disponible");
      }
    });
  });

  // Close PDF modal
  const modalClose = document.getElementById("cv-modal-close");
  const modalOverlay = document.querySelector(".cv-modal__overlay");
  if (modalClose) {
    modalClose.addEventListener("click", hidePDFModal);
  }
  if (modalOverlay) {
    modalOverlay.addEventListener("click", hidePDFModal);
  }

  // Close modal with ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hidePDFModal();
    }
  });
}

function showPDFModal(url) {
  const modal = document.getElementById("cv-pdf-modal");
  const frame = document.getElementById("cv-pdf-frame");
  if (modal && frame) {
    frame.src = url;
    modal.style.display = "block";
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  }
}

function hidePDFModal() {
  const modal = document.getElementById("cv-pdf-modal");
  const frame = document.getElementById("cv-pdf-frame");
  if (modal && frame) {
    modal.style.display = "none";
    frame.src = "";
    document.body.style.overflow = ""; // Restore scrolling
  }
}

async function handleFileUpload(file) {
  if (!file) return;
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowed.includes(file.type)) {
    alert("Formato no valido. Solo PDF, DOC, DOCX.");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert("El archivo es muy grande. Maximo 5MB.");
    return;
  }

  const user = getAuthUiContext().user;
  const formData = new FormData();
  formData.append("file", file);

  const btn = document.getElementById("upload-cv-btn");
  const origText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = "Subiendo...";

  try {
    await candidateService.uploadCV(user.id, formData);
    location.reload();
  } catch (error) {
    console.error("Upload error:", error);
    alert("Error al subir el CV");
  } finally {
    btn.disabled = false;
    btn.innerHTML = origText;
  }
}
