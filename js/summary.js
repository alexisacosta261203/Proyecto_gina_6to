(function () {
  const msgSummary = document.getElementById("msgSummary");

  const vOrganizer = document.getElementById("vOrganizer");
  const vOrganizerIncluded = document.getElementById("vOrganizerIncluded");
  const vEventType = document.getElementById("vEventType");
  const vCelebrationName = document.getElementById("vCelebrationName");
  const vDate = document.getElementById("vDate");
  const vBudget = document.getElementById("vBudget");

  const vParticipants = document.getElementById("vParticipants");
  const vParticipantsCount = document.getElementById("vParticipantsCount");

  const vExclusions = document.getElementById("vExclusions");
  const vExclusionsCount = document.getElementById("vExclusionsCount");

  const vRaw = document.getElementById("vRaw");

  const btnRecargar = document.getElementById("btnRecargar");
  const btnReiniciar = document.getElementById("btnReiniciar");

  function mostrarAlerta(tipo, texto) {
    msgSummary.innerHTML = '<div class="alert alert-' + tipo + ' mb-0">' + texto + "</div>";
  }

  function limpiarAlerta() {
    msgSummary.innerHTML = "";
  }

  function renderBadges(container, items) {
    container.innerHTML = "";
    if (!items || items.length === 0) {
      container.innerHTML = '<div class="text-muted small">No data</div>';
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "d-flex flex-wrap gap-2";
    items.forEach(function (x) {
      const b = document.createElement("span");
      b.className = "badge text-bg-light border";
      b.textContent = x;
      wrap.appendChild(b);
    });
    container.appendChild(wrap);
  }

  function countExclusions(exclusions) {
    let total = 0;
    for (const k in exclusions || {}) {
      if (Array.isArray(exclusions[k])) total += exclusions[k].length;
    }
    return total;
  }

  function renderExclusions(container, exclusions) {
    container.innerHTML = "";
    const keys = Object.keys(exclusions || {});
    if (keys.length === 0) {
      container.innerHTML = '<div class="text-muted small">No exclusions</div>';
      return;
    }

    const grid = document.createElement("div");
    grid.className = "d-grid gap-2";

    keys.forEach(function (origin) {
      const dest = Array.isArray(exclusions[origin]) ? exclusions[origin] : [];
      const box = document.createElement("div");
      box.className = "border rounded-3 p-2";

      const t = document.createElement("div");
      t.className = "fw-semibold";
      t.textContent = origin;

      const c = document.createElement("div");
      c.className = "mt-1";

      if (dest.length === 0) {
        c.innerHTML = '<div class="text-muted small">No exclusions</div>';
      } else {
        const wrap = document.createElement("div");
        wrap.className = "d-flex flex-wrap gap-2";
        dest.forEach(function (d) {
          const b = document.createElement("span");
          b.className = "badge text-bg-light border";
          b.textContent = d;
          wrap.appendChild(b);
        });
        c.appendChild(wrap);
      }

      box.appendChild(t);
      box.appendChild(c);
      grid.appendChild(box);
    });

    container.appendChild(grid);
  }

  function formatBudget(state) {
    const preset = state.budget && state.budget.preset ? String(state.budget.preset).trim() : "";
    const custom = state.budget && state.budget.custom_amount ? String(state.budget.custom_amount).trim() : "";
    if (!preset) return "-";
    if (preset === "custom") return custom ? "Custom: " + custom + " MXN" : "Custom";
    return preset + " MXN";
  }

  function render() {
    const state = loadState();
    vRaw.textContent = JSON.stringify(state, null, 2);

    vOrganizer.textContent = (state.organizer && state.organizer.name) ? state.organizer.name : "-";
    vOrganizerIncluded.textContent = (state.organizer && state.organizer.included) ? "Organizer participates: yes" : "Organizer participates: no";

    vEventType.textContent = (state.event && state.event.type) ? state.event.type : "-";
    vCelebrationName.textContent = (state.event && state.event.celebration_name) ? state.event.celebration_name : "-";
    vDate.textContent = (state.event && state.event.date_iso) ? state.event.date_iso : "-";
    vBudget.textContent = formatBudget(state);

    const participants = getAllParticipants(state);
    vParticipantsCount.textContent = String(participants.length);
    renderBadges(vParticipants, participants);

    const exclusions = state.exclusions && typeof state.exclusions === "object" ? state.exclusions : {};
    vExclusionsCount.textContent = String(countExclusions(exclusions));
    renderExclusions(vExclusions, exclusions);

    if (participants.length < 2) {
      mostrarAlerta("danger", "At least 2 participants are required. Go back to setup.");
      return;
    }

    limpiarAlerta();
  }

  btnRecargar.addEventListener("click", function () {
    render();
    mostrarAlerta("success", "Reloaded from localStorage");
    setTimeout(function () {
      limpiarAlerta();
    }, 900);
  });

  btnReiniciar.addEventListener("click", function () {
    resetState();
    render();
    mostrarAlerta("success", "Local data cleared");
  });

  render();
})();