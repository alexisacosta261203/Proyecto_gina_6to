const CLAVE_ALMACENAMIENTO = "gift_exchange_state";

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

function parsearJSONSeguro(valor) {
  try {
    return JSON.parse(valor);
  } catch (e) {
    return null;
  }
}

function normalizarNombre(nombre) {
  return String(nombre || "").trim();
}

function mismoNombre(a, b) {
  return normalizarNombre(a).toLowerCase() === normalizarNombre(b).toLowerCase();
}

function cargarEstado() {
  const bruto = localStorage.getItem(CLAVE_ALMACENAMIENTO);
  const parseado = parsearJSONSeguro(bruto);
  const base = estadoPorDefecto();

  if (!parseado || typeof parseado !== "object") return base;

  const estado = {
    ...base,
    ...parseado,
    organizador: { ...base.organizador, ...(parseado.organizador || {}) },
    evento: { ...base.evento, ...(parseado.evento || {}) },
    presupuesto: { ...base.presupuesto, ...(parseado.presupuesto || {}) }
  };

  if (!Array.isArray(estado.participantes)) estado.participantes = [];
  if (!estado.exclusiones || typeof estado.exclusiones !== "object") estado.exclusiones = {};
  if (!estado.resultados_sorteo || typeof estado.resultados_sorteo !== "object") estado.resultados_sorteo = {};

  estado.organizador.nombre = normalizarNombre(estado.organizador.nombre);
  estado.participantes = estado.participantes
    .map(normalizarNombre)
    .filter((x) => x.length > 0);

  estado.participantes = nombresUnicos(estado.participantes);

  return estado;
}

function guardarEstado(estado) {
  localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(estado));
}

function reiniciarEstado() {
  localStorage.removeItem(CLAVE_ALMACENAMIENTO);
}

function nombresUnicos(lista) {
  const salida = [];
  for (const nombre of lista) {
    if (!salida.some((x) => mismoNombre(x, nombre))) salida.push(nombre);
  }
  return salida;
}

function obtenerTodosLosParticipantes(estado) {
  const salida = [...(estado.participantes || [])];
  const nombreOrganizador = normalizarNombre(estado.organizador && estado.organizador.nombre);

  if (estado.organizador && estado.organizador.incluido && nombreOrganizador) {
    if (!salida.some((x) => mismoNombre(x, nombreOrganizador))) salida.unshift(nombreOrganizador);
  }
  return nombresUnicos(salida);
}