import { vacancyService } from "@services/vacancy.service";
import {
  getAuthUiContext,
  renderNavbar,
  renderPage,
  showLoading,
} from "@utils/ui";

/* =========================
   CONFIG
========================= */

const STATUS_META = {
  pending: { label: "Pendientes", color: "#f59e0b" },
  reviewed: { label: "Revisados", color: "#3b82f6" },
  interview: { label: "Entrevista", color: "#8b5cf6" },
  accepted: { label: "Aceptados", color: "#10b981" },
  rejected: { label: "Rechazados", color: "#ef4444" },
};

/* =========================
   HELPERS
========================= */

function getFullName(user) {
  return (
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.email ||
    "Sin nombre"
  );
}

function countAll(pipeline) {
  return Object.values(pipeline).reduce(
    (acc, arr) => acc + (arr?.length || 0),
    0,
  );
}

/* =========================
   UI
========================= */

function renderStats(pipeline) {
  return `
    <div class="stats">
      ${Object.entries(STATUS_META)
        .map(([key, meta]) => {
          const count = pipeline[key]?.length || 0;
          return `
            <div class="stat">
              <span class="dot" style="background:${meta.color}"></span>
              <div>
                <strong>${count}</strong>
                <p>${meta.label}</p>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderCard(app) {
  return `
    <div class="card" draggable="true" data-id="${app.id}">
      <strong>${getFullName(app.user)}</strong>
      <p>${app.user?.email || ""}</p>
    </div>
  `;
}

function renderColumn(status, items = []) {
  const meta = STATUS_META[status];

  return `
    <div class="column" data-status="${status}">
      <div class="column__header">
        <h3>${meta.label}</h3>
        <span>${items.length}</span>
      </div>

      <div class="dropzone">
        ${
          items.length
            ? items.map(renderCard).join("")
            : `<p class="empty">Sin candidatos</p>`
        }
      </div>
    </div>
  `;
}

function renderBoard(pipeline) {
  return `
    <div class="board">
      ${Object.keys(STATUS_META)
        .map((status) => renderColumn(status, pipeline[status]))
        .join("")}
    </div>
  `;
}

/* =========================
   MAIN
========================= */

export async function initApplicantsPage(params) {
  const app = document.getElementById("app");
  const authContext = getAuthUiContext();

  const vacancyId = params?.id;

  if (!vacancyId) {
    app.innerHTML = `<p>Error: vacante no válida</p>`;
    return;
  }

  showLoading("Cargando candidatos...");

  try {
    const pipeline = await vacancyService.getPipeline(vacancyId);

    // 👇 obtener nombre de vacante (desde cualquier candidato)
    const vacancyTitle =
      Object.values(pipeline).flat()[0]?.vacancy?.title || "Vacante";

    const navbar = renderNavbar({
      activeRoute: "",
      ...authContext,
    });

    app.innerHTML = renderPage({
      navbar,
      main: `
        <div class="container applicants">
          
          <div class="header">
            <h2>${vacancyTitle}</h2>
            <p>${countAll(pipeline)} candidatos en proceso</p>
          </div>

          ${renderStats(pipeline)}

          ${renderBoard(pipeline)}

        </div>
      `,
      extraStyles: `
        .applicants {
          padding: 30px 0;
        }

        .header h2 {
          font-size: 26px;
          margin-bottom: 4px;
        }

        .header p {
          color:#6b7280;
          font-size:14px;
        }

        /* STATS */
        .stats {
          display:flex;
          gap:16px;
          margin:20px 0;
          flex-wrap:wrap;
        }

        .stat {
          display:flex;
          gap:10px;
          align-items:center;
          background:white;
          padding:10px 14px;
          border-radius:10px;
          border:1px solid #e5e7eb;
        }

        .dot {
          width:10px;
          height:10px;
          border-radius:50%;
        }

        /* BOARD */
        .board {
          display:flex;
          gap:16px;
          overflow-x:auto;
          padding-bottom:10px;
        }

        .column {
          min-width:280px;
          background:#f9fafb;
          border-radius:14px;
          padding:12px;
          display:flex;
          flex-direction:column;
          max-height:70vh;
        }

        .column__header {
          display:flex;
          justify-content:space-between;
          margin-bottom:10px;
        }

        .column__header span {
          background:#e5e7eb;
          padding:2px 8px;
          border-radius:999px;
        }

        .dropzone {
          display:flex;
          flex-direction:column;
          gap:10px;
          min-height:80px;
        }

        .dropzone.drag-over {
          background:#eef2ff;
          border:2px dashed #6366f1;
        }

        .empty {
          text-align:center;
          font-size:12px;
          color:#9ca3af;
        }

        /* CARD */
        .card {
          background:white;
          padding:12px;
          border-radius:10px;
          border:1px solid #e5e7eb;
          cursor:grab;
          transition:all .15s ease;
        }

        .card:hover {
          box-shadow:0 6px 16px rgba(0,0,0,0.1);
          transform:translateY(-2px);
        }

        .card p {
          font-size:12px;
          color:#6b7280;
        }
      `,
    });

    initDragAndDrop();
    initCardClick();
  } catch (error) {
    console.error(error);
    app.innerHTML = `<p>Error cargando candidatos</p>`;
  }
}

/* =========================
   EVENTS
========================= */

function initCardClick() {
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      alert("Abrir candidato: " + id);
    });
  });
}

function initDragAndDrop() {
  let dragged = null;

  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("dragstart", () => {
      dragged = card;
      card.style.opacity = "0.4";
    });

    card.addEventListener("dragend", () => {
      card.style.opacity = "1";
    });
  });

  document.querySelectorAll(".dropzone").forEach((zone) => {
    zone.addEventListener("dragover", (e) => e.preventDefault());

    zone.addEventListener("dragenter", () => {
      zone.classList.add("drag-over");
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("drag-over");
    });

    zone.addEventListener("drop", async () => {
      zone.classList.remove("drag-over");

      if (!dragged) return;

      const newStatus = zone.parentElement.dataset.status;
      const appId = dragged.dataset.id;

      zone.appendChild(dragged);

      try {
        await vacancyService.updateApplicationStatus(appId, newStatus);

        // 🔥 reload para mantener consistencia
        window.location.reload();
      } catch (err) {
        alert("Error actualizando estado");
      }
    });
  });
}
