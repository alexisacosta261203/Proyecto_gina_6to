const STORAGE_KEY = "gift_exchange_state";

function defaultState() {
  return {
    organizer: { name: "", included: true },
    participants: [],
    exclusions: {},
    event: { type: "", celebration_name: "", date_iso: "" },
    budget: { preset: "", custom_amount: "" },
    draw_results: {}
  };
}

function safeParseJSON(value) {
  try {
    return JSON.parse(value);
  } catch (e) {
    return null;
  }
}

function normalizeName(name) {
  return String(name || "").trim();
}

function sameName(a, b) {
  return normalizeName(a).toLowerCase() === normalizeName(b).toLowerCase();
}

function uniqueNames(list) {
  const out = [];
  for (const n of list || []) {
    const v = normalizeName(n);
    if (!v) continue;
    if (!out.some((x) => sameName(x, v))) out.push(v);
  }
  return out;
}

function mergeExclusions(target, extra) {
  const out = target && typeof target === "object" ? { ...target } : {};
  if (!extra || typeof extra !== "object") return out;

  for (const k of Object.keys(extra)) {
    const arr = Array.isArray(extra[k]) ? extra[k] : [];
    if (!out[k]) out[k] = [];
    const merged = uniqueNames([...(out[k] || []), ...arr]);
    out[k] = merged;
  }
  return out;
}

function toEnglishState(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== "object") return base;

  // Start with english defaults
  let st = {
    ...base,
    organizer: { ...base.organizer },
    event: { ...base.event },
    budget: { ...base.budget }
  };

  // Read english if present
  if (raw.organizer || raw.participants || raw.exclusions || raw.event || raw.budget || raw.draw_results) {
    st.organizer = { ...st.organizer, ...(raw.organizer || {}) };
    st.participants = Array.isArray(raw.participants) ? raw.participants : [];
    st.exclusions = raw.exclusions && typeof raw.exclusions === "object" ? raw.exclusions : {};
    st.event = { ...st.event, ...(raw.event || {}) };
    st.budget = { ...st.budget, ...(raw.budget || {}) };
    st.draw_results = raw.draw_results && typeof raw.draw_results === "object" ? raw.draw_results : {};
  }

  // Also accept spanish keys even if english exists (handles mixed objects)
  if (raw.organizador && typeof raw.organizador === "object") {
    if (!st.organizer.name) st.organizer.name = normalizeName(raw.organizador.nombre);
    if (typeof raw.organizador.incluido === "boolean") st.organizer.included = raw.organizador.incluido;
  }

  if (Array.isArray(raw.participantes) && raw.participantes.length) {
    if (!st.participants.length) st.participants = raw.participantes;
  }

  if (raw.exclusiones && typeof raw.exclusiones === "object") {
    st.exclusions = mergeExclusions(st.exclusions, raw.exclusiones);
  }

  if (raw.evento && typeof raw.evento === "object") {
    if (!st.event.type) st.event.type = normalizeName(raw.evento.tipo);
    if (!st.event.celebration_name) st.event.celebration_name = normalizeName(raw.evento.nombre_celebracion);
    if (!st.event.date_iso) st.event.date_iso = normalizeName(raw.evento.fecha_iso);
  }

  if (raw.presupuesto && typeof raw.presupuesto === "object") {
    if (!st.budget.preset) st.budget.preset = normalizeName(raw.presupuesto.opcion);
    if (!st.budget.custom_amount) st.budget.custom_amount = normalizeName(raw.presupuesto.cantidad_personalizada);
  }

  if (raw.resultados_sorteo && typeof raw.resultados_sorteo === "object") {
    if (!st.draw_results || Object.keys(st.draw_results).length === 0) st.draw_results = raw.resultados_sorteo;
  }

  // Normalize
  st.organizer.name = normalizeName(st.organizer.name);
  st.participants = uniqueNames(st.participants);

  if (!st.exclusions || typeof st.exclusions !== "object") st.exclusions = {};
  if (!st.draw_results || typeof st.draw_results !== "object") st.draw_results = {};

  return st;
}

function loadState() {
  const rawText = localStorage.getItem(STORAGE_KEY);
  const rawObj = safeParseJSON(rawText);
  const eng = toEnglishState(rawObj);

  // Always store back in english to avoid future mismatches
  localStorage.setItem(STORAGE_KEY, JSON.stringify(eng));

  return eng;
}

function saveState(state) {
  const eng = toEnglishState(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(eng));
}

function resetState() {
  localStorage.removeItem(STORAGE_KEY);
}

function getAllParticipants(state) {
  const st = toEnglishState(state);
  const out = [...(st.participants || [])];
  const org = normalizeName(st.organizer && st.organizer.name);

  if (st.organizer && st.organizer.included && org) {
    if (!out.some((x) => sameName(x, org))) out.unshift(org);
  }
  return uniqueNames(out);
}

/* Spanish aliases */
const CLAVE_ALMACENAMIENTO = STORAGE_KEY;

function cargarEstado() {
  // Return spanish-shaped object for pages that use spanish keys
  const e = loadState();
  return {
    organizador: { nombre: e.organizer.name, incluido: !!e.organizer.included },
    participantes: [...(e.participants || [])],
    exclusiones: e.exclusions && typeof e.exclusions === "object" ? e.exclusions : {},
    evento: { tipo: e.event.type, nombre_celebracion: e.event.celebration_name, fecha_iso: e.event.date_iso },
    presupuesto: { opcion: e.budget.preset, cantidad_personalizada: e.budget.custom_amount },
    resultados_sorteo: e.draw_results && typeof e.draw_results === "object" ? e.draw_results : {}
  };
}

function guardarEstado(estado) {
  saveState(estado);
}

function reiniciarEstado() {
  resetState();
}

function obtenerTodosLosParticipantes(estado) {
  return getAllParticipants(estado);
}

function mismoNombre(a, b) {
  return sameName(a, b);
}

function nombresUnicos(lista) {
  return uniqueNames(lista);
}