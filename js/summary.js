(function () {
  const msgSummary = document.getElementById("msgSummary");

  const vOrganizador = document.getElementById("vOrganizador");
  const vOrganizadorIncluido = document.getElementById("vOrganizadorIncluido");
  const vTipoEvento = document.getElementById("vTipoEvento");
  const vNombreCelebracion = document.getElementById("vNombreCelebracion");
  const vFecha = document.getElementById("vFecha");
  const vPresupuesto = document.getElementById("vPresupuesto");

  const vParticipantes = document.getElementById("vParticipantes");
  const vParticipantesCount = document.getElementById("vParticipantesCount");

  const vExclusiones = document.getElementById("vExclusiones");
  const vExclusionesCount = document.getElementById("vExclusionesCount");

  const vRaw = document.getElementById("vRaw");

  const btnRecargar = document.getElementById("btnRecargar");
  const btnReiniciar = document.getElementById("btnReiniciar");

  function mostrarAlerta(tipo, texto) {
    msgSummary.innerHTML = '<div class="alert alert-' + tipo + ' mb-0">' + texto + "</div>";
  }

  function limpiarAlerta() {
    msgSummary.innerHTML = "";
  }

  function obtenerEstadoCompat() {
    if (typeof cargarEstado === "function") return cargarEstado();
    if (typeof loadState === "function") return loadState();
    return {};
  }

  function reiniciarEstadoCompat() {
    if (typeof reiniciarEstado === "function") return reiniciarEstado();
    if (typeof resetState === "function") return resetState();
  }

  function normalizarModelo(estado) {
    const modelo = {
      organizador: { nombre: "", incluido: true },
      participantes: [],
      exclusiones: {},
      evento: { tipo: "", nombre_celebracion: "", fecha_iso: "" },
      presupuesto: { opcion: "", cantidad_personalizada: "" }
    };

    if (estado && typeof estado === "object") {
      if (estado.organizador || estado.participantes || estado.exclusiones || estado.evento || estado.presupuesto) {
        modelo.organizador = estado.organizador || modelo.organizador;
        modelo.participantes = estado.participantes || [];
        modelo.exclusiones = estado.exclusiones || {};
        modelo.evento = estado.evento || modelo.evento;
        modelo.presupuesto = estado.presupuesto || modelo.presupuesto;
        return modelo;
      }

      if (estado.organizer || estado.participants || estado.exclusions || estado.event || estado.budget) {
        modelo.organizador = {
          nombre: (estado.organizer && estado.organizer.name) || "",
          incluido: !!(estado.organizer && estado.organizer.included)
        };
        modelo.participantes = Array.isArray(estado.participants) ? estado.participants : [];
        modelo.exclusiones = estado.exclusions && typeof estado.exclusions === "object" ? estado.exclusions : {};
        modelo.evento = {
          tipo: (estado.event && estado.event.type) || "",
          nombre_celebracion: (estado.event && estado.event.celebration_name) || "",
          fecha_iso: (estado.event && estado.event.date_iso) || ""
        };
        modelo.presupuesto = {
          opcion: (estado.budget && estado.budget.preset) || "",
          cantidad_personalizada: (estado.budget && estado.budget.custom_amount) || ""
        };
        return modelo;
      }
    }

    return modelo;
  }

  function obtenerTodosParticipantesCompat(modelo) {
    if (typeof obtenerTodosLosParticipantes === "function") return obtenerTodosLosParticipantes(modelo);
    if (typeof getAllParticipants === "function") return getAllParticipants({
      organizer: { name: modelo.organizador.nombre, included: modelo.organizador.incluido },
      participants: modelo.participantes
    });

    const salida = [];
    const org = String(modelo.organizador.nombre || "").trim();
    if (modelo.organizador.incluido && org) salida.push(org);

    for (const p of modelo.participantes || []) {
      const n = String(p || "").trim();
      if (n) salida.push(n);
    }

    const unicos = [];
    const vistos = new Set();
    for (const n of salida) {
      const k = n.toLowerCase();
      if (!vistos.has(k)) {
        vistos.add(k);
        unicos.push(n);
      }
    }
    return unicos;
  }

  function renderizarListaComoBadges(contenedor, lista) {
    contenedor.innerHTML = "";
    if (!lista || lista.length === 0) {
      contenedor.innerHTML = '<div class="text-muted small">No data</div>';
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "d-flex flex-wrap gap-2";

    for (const item of lista) {
      const span = document.createElement("span");
      span.className = "badge text-bg-light border";
      span.textContent = item;
      wrap.appendChild(span);
    }

    contenedor.appendChild(wrap);
  }

  function contarExclusiones(exclusiones) {
    let total = 0;
    for (const k in exclusiones || {}) {
      if (Array.isArray(exclusiones[k])) total += exclusiones[k].length;
    }
    return total;
  }

  function renderizarExclusiones(contenedor, exclusiones) {
    contenedor.innerHTML = "";

    const claves = Object.keys(exclusiones || {});
    if (claves.length === 0) {
      contenedor.innerHTML = '<div class="text-muted small">No exclusions</div>';
      return;
    }

    const lista = document.createElement("div");
    lista.className = "d-grid gap-2";

    for (const origen of claves) {
      const destinos = Array.isArray(exclusiones[origen]) ? exclusiones[origen] : [];
      const card = document.createElement("div");
      card.className = "border rounded-3 p-2";

      const titulo = document.createElement("div");
      titulo.className = "fw-semibold";
      titulo.textContent = origen;

      const cuerpo = document.createElement("div");
      cuerpo.className = "mt-1";

      if (destinos.length === 0) {
        cuerpo.innerHTML = '<div class="text-muted small">No exclusions</div>';
      } else {
        const wrap = document.createElement("div");
        wrap.className = "d-flex flex-wrap gap-2";
        destinos.forEach((d) => {
          const b = document.createElement("span");
          b.className = "badge text-bg-light border";
          b.textContent = d;
          wrap.appendChild(b);
        });
        cuerpo.appendChild(wrap);
      }

      card.appendChild(titulo);
      card.appendChild(cuerpo);
      lista.appendChild(card);
    }

    contenedor.appendChild(lista);
  }

  function formatearPresupuesto(modelo) {
    const opcion = String(modelo.presupuesto.opcion || "").trim();
    const custom = String(modelo.presupuesto.cantidad_personalizada || "").trim();

    if (opcion === "custom") {
      if (!custom) return "Custom";
      return "Custom: " + custom + " MXN";
    }

    if (!opcion) return "-";
    return opcion + " MXN";
  }

  function renderizar() {
    const estadoCrudo = obtenerEstadoCompat();
    const modelo = normalizarModelo(estadoCrudo);

    vRaw.textContent = JSON.stringify(estadoCrudo, null, 2);

    const orgNombre = String(modelo.organizador.nombre || "").trim();
    vOrganizador.textContent = orgNombre || "-";
    vOrganizadorIncluido.textContent = modelo.organizador.incluido ? "Organizer participates: yes" : "Organizer participates: no";

    vTipoEvento.textContent = String(modelo.evento.tipo || "").trim() || "-";
    vNombreCelebracion.textContent = String(modelo.evento.nombre_celebracion || "").trim() || "-";
    vFecha.textContent = String(modelo.evento.fecha_iso || "").trim() || "-";
    vPresupuesto.textContent = formatearPresupuesto(modelo);

    const participantes = obtenerTodosParticipantesCompat(modelo);
    vParticipantesCount.textContent = String(participantes.length);
    renderizarListaComoBadges(vParticipantes, participantes);

    const totalExcl = contarExclusiones(modelo.exclusiones);
    vExclusionesCount.textContent = String(totalExcl);
    renderizarExclusiones(vExclusiones, modelo.exclusiones);

    if (participantes.length < 2) {
      mostrarAlerta("danger", "At least 2 participants are required. Go back to setup.");
      return;
    }

    limpiarAlerta();
  }

  btnRecargar.addEventListener("click", function () {
    renderizar();
    mostrarAlerta("success", "Reloaded from localStorage");
    setTimeout(function () {
      limpiarAlerta();
    }, 1000);
  });

  btnReiniciar.addEventListener("click", function () {
    reiniciarEstadoCompat();
    renderizar();
    mostrarAlerta("success", "Local data cleared");
  });

  renderizar();
})();