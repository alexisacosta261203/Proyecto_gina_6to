(function () {
  function getRawState() {
    if (typeof loadState === "function") return loadState();
    if (typeof cargarEstado === "function") return cargarEstado();
    return {};
  }

  function normalizeState(raw) {
    const out = {
      organizerName: "",
      organizerIncluded: true,
      participants: [],
      exclusions: {},
      eventType: "",
      celebrationName: "",
      dateIso: "",
      budgetOption: "",
      budgetCustom: "",
      drawResults: {}
    };

    if (raw && typeof raw === "object") {
      // English model
      if (raw.organizer || raw.participants || raw.exclusions || raw.event || raw.budget) {
        out.organizerName = raw.organizer && raw.organizer.name ? String(raw.organizer.name).trim() : "";
        out.organizerIncluded = !!(raw.organizer && raw.organizer.included);
        out.participants = Array.isArray(raw.participants) ? raw.participants : [];
        out.exclusions = raw.exclusions && typeof raw.exclusions === "object" ? raw.exclusions : {};
        out.eventType = raw.event && raw.event.type ? String(raw.event.type).trim() : "";
        out.celebrationName = raw.event && raw.event.celebration_name ? String(raw.event.celebration_name).trim() : "";
        out.dateIso = raw.event && raw.event.date_iso ? String(raw.event.date_iso).trim() : "";
        out.budgetOption = raw.budget && raw.budget.preset ? String(raw.budget.preset).trim() : "";
        out.budgetCustom = raw.budget && raw.budget.custom_amount ? String(raw.budget.custom_amount).trim() : "";
        out.drawResults = raw.draw_results && typeof raw.draw_results === "object" ? raw.draw_results : {};
        return out;
      }

      // Spanish model
      if (raw.organizador || raw.participantes || raw.exclusiones || raw.evento || raw.presupuesto) {
        out.organizerName = raw.organizador && raw.organizador.nombre ? String(raw.organizador.nombre).trim() : "";
        out.organizerIncluded = !!(raw.organizador && raw.organizador.incluido);
        out.participants = Array.isArray(raw.participantes) ? raw.participantes : [];
        out.exclusions = raw.exclusiones && typeof raw.exclusiones === "object" ? raw.exclusiones : {};
        out.eventType = raw.evento && raw.evento.tipo ? String(raw.evento.tipo).trim() : "";
        out.celebrationName = raw.evento && raw.evento.nombre_celebracion ? String(raw.evento.nombre_celebracion).trim() : "";
        out.dateIso = raw.evento && raw.evento.fecha_iso ? String(raw.evento.fecha_iso).trim() : "";
        out.budgetOption = raw.presupuesto && raw.presupuesto.opcion ? String(raw.presupuesto.opcion).trim() : "";
        out.budgetCustom = raw.presupuesto && raw.presupuesto.cantidad_personalizada ? String(raw.presupuesto.cantidad_personalizada).trim() : "";
        out.drawResults = raw.resultados_sorteo && typeof raw.resultados_sorteo === "object" ? raw.resultados_sorteo : {};
        return out;
      }
    }

    return out;
  }

  function normName(s) {
    return String(s || "").trim();
  }

  function getAllParticipantsCompat(s) {
    const list = [];
    const org = normName(s.organizerName);

    if (s.organizerIncluded && org) list.push(org);

    (s.participants || []).forEach(function (p) {
      const n = normName(p);
      if (n) list.push(n);
    });

    const unique = [];
    const seen = new Set();
    list.forEach(function (n) {
      const k = n.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        unique.push(n);
      }
    });

    return unique;
  }

  function redirectTo(fileName) {
    // Works when pages are inside /pages/
    const inPages = window.location.pathname.toLowerCase().includes("/pages/");
    window.location.href = inPages ? "./" + fileName : "./pages/" + fileName;
  }

  function ensureSetup() {
    const s = normalizeState(getRawState());
    const all = getAllParticipantsCompat(s);
    if (!s.organizerName || all.length < 2) {
      redirectTo("setup.html");
      return false;
    }
    return true;
  }

  function ensureEventCompleted() {
    const s = normalizeState(getRawState());
    if (!s.eventType || !s.dateIso || !s.budgetOption) {
      redirectTo("event.html");
      return false;
    }
    if (s.budgetOption === "custom") {
      const n = Number(String(s.budgetCustom || "").trim());
      if (!Number.isFinite(n) || n <= 0) {
        redirectTo("event.html");
        return false;
      }
    }
    if (s.eventType === "Otro" && !s.celebrationName) {
      redirectTo("event.html");
      return false;
    }
    return true;
  }

  function run() {
    const page = (window.location.pathname.split("/").pop() || "").toLowerCase();

    // setup should always be accessible
    if (page === "setup.html") return;

    // exclusions needs setup
    if (page === "exclusions.html") {
      ensureSetup();
      return;
    }

    // event needs setup
    if (page === "event.html") {
      ensureSetup();
      return;
    }

    // summary needs setup + event
    if (page === "summary.html") {
      if (!ensureSetup()) return;
      ensureEventCompleted();
      return;
    }

    // draw needs setup + event
    if (page === "draw.html") {
      if (!ensureSetup()) return;
      ensureEventCompleted();
      return;
    }
  }

  run();
})();