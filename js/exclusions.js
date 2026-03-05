(function () {
  const hayExclusiones = document.getElementById("hayExclusiones");
  const panelExclusiones = document.getElementById("panelExclusiones");
  const msgGeneral = document.getElementById("msgGeneral");

  const listaConfiguracion = document.getElementById("listaConfiguracion");
  const listaArrastrables = document.getElementById("listaArrastrables");
  const resumenActivo = document.getElementById("resumenActivo");
  const zonaDrop = document.getElementById("zonaDrop");
  const listaExclusionesActuales = document.getElementById("listaExclusionesActuales");
  const btnLimpiarExclusiones = document.getElementById("btnLimpiarExclusiones");

  let participanteActivo = "";

  function mostrarAlerta(contenedor, tipo, texto) {
    contenedor.innerHTML = '<div class="alert alert-' + tipo + ' mb-0">' + texto + "</div>";
  }

  function limpiarAlerta(contenedor) {
    contenedor.innerHTML = "";
  }

  function obtenerParticipantesValidos() {
    const estado = cargarEstado();
    return obtenerTodosLosParticipantes(estado);
  }

  function sanearExclusiones(estado) {
    const participantes = obtenerTodosLosParticipantes(estado);
    const exclusionesLimpias = {};

    for (const origen in estado.exclusiones || {}) {
      if (!participantes.some((p) => mismoNombre(p, origen))) continue;

      const lista = Array.isArray(estado.exclusiones[origen]) ? estado.exclusiones[origen] : [];

      const filtrada = lista.filter((destino) => {
        if (!participantes.some((p) => mismoNombre(p, destino))) return false;
        if (mismoNombre(origen, destino)) return false;
        return true;
      });

      exclusionesLimpias[origen] = nombresUnicos(filtrada);
    }

    estado.exclusiones = exclusionesLimpias;
    return estado;
  }

  function hayDatosDeExclusiones(estado) {
    if (!estado.exclusiones || typeof estado.exclusiones !== "object") return false;

    for (const nombre in estado.exclusiones) {
      if (Array.isArray(estado.exclusiones[nombre]) && estado.exclusiones[nombre].length > 0) {
        return true;
      }
    }

    return false;
  }

  function obtenerExclusionesDe(nombreBase) {
    const estado = cargarEstado();
    const origenEncontrado = Object.keys(estado.exclusiones || {}).find((clave) => mismoNombre(clave, nombreBase));

    if (!origenEncontrado) return [];
    return Array.isArray(estado.exclusiones[origenEncontrado]) ? estado.exclusiones[origenEncontrado] : [];
  }

  function guardarExclusionesDe(nombreBase, listaNueva) {
    const estado = sanearExclusiones(cargarEstado());

    const claves = Object.keys(estado.exclusiones || {});
    const claveExistente = claves.find((clave) => mismoNombre(clave, nombreBase));
    const claveFinal = claveExistente || nombreBase;

    estado.exclusiones[claveFinal] = nombresUnicos(
      (listaNueva || []).filter((nombre) => !mismoNombre(nombre, claveFinal))
    );

    if (estado.exclusiones[claveFinal].length === 0) {
      delete estado.exclusiones[claveFinal];
    }

    guardarEstado(estado);
  }

  function agregarExclusion(origen, destino) {
    if (!origen || !destino) return;
    if (mismoNombre(origen, destino)) return;

    const actuales = obtenerExclusionesDe(origen);

    if (actuales.some((nombre) => mismoNombre(nombre, destino))) {
      mostrarAlerta(msgGeneral, "warning", "This exclusion already exists");
      return;
    }

    actuales.push(destino);
    guardarExclusionesDe(origen, actuales);
    renderizarTodo();
    mostrarAlerta(msgGeneral, "success", "Exclusion added");
  }

  function eliminarExclusion(origen, destino) {
    const actuales = obtenerExclusionesDe(origen);
    const nuevaLista = actuales.filter((nombre) => !mismoNombre(nombre, destino));
    guardarExclusionesDe(origen, nuevaLista);
    renderizarTodo();
    mostrarAlerta(msgGeneral, "success", "Exclusion removed");
  }

  function limpiarExclusionesActuales() {
    if (!participanteActivo) {
      mostrarAlerta(msgGeneral, "warning", "Select a participant first");
      return;
    }

    guardarExclusionesDe(participanteActivo, []);
    renderizarTodo();
    mostrarAlerta(msgGeneral, "success", "Current exclusions cleared");
  }

  function renderizarListaConfiguracion() {
    const participantes = obtenerParticipantesValidos();
    listaConfiguracion.innerHTML = "";

    if (participantes.length < 2) {
      listaConfiguracion.innerHTML =
        '<div class="alert alert-warning mb-0">At least 2 participants are required</div>';
      return;
    }

    participantes.forEach((nombre) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className =
        "list-group-item list-group-item-action d-flex justify-content-between align-items-center" +
        (mismoNombre(nombre, participanteActivo) ? " active" : "");
      boton.innerHTML = '<span></span><span class="badge text-bg-secondary"></span>';

      boton.querySelector("span").textContent = nombre;
      boton.querySelector(".badge").textContent = obtenerExclusionesDe(nombre).length;

      boton.addEventListener("click", function () {
        participanteActivo = nombre;
        limpiarAlerta(msgGeneral);
        renderizarTodo();
      });

      listaConfiguracion.appendChild(boton);
    });
  }

  function crearTarjetaArrastrable(nombre) {
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-arrastrable border rounded-3 bg-white p-3 shadow-sm";
    tarjeta.draggable = true;
    tarjeta.dataset.nombre = nombre;
    tarjeta.textContent = nombre;

    tarjeta.addEventListener("dragstart", function (e) {
      e.dataTransfer.setData("text/plain", nombre);
      e.dataTransfer.effectAllowed = "move";
      tarjeta.classList.add("arrastrando");
    });

    tarjeta.addEventListener("dragend", function () {
      tarjeta.classList.remove("arrastrando");
    });

    return tarjeta;
  }

  function renderizarArrastrables() {
    const participantes = obtenerParticipantesValidos();
    listaArrastrables.innerHTML = "";

    if (!participanteActivo) {
      listaArrastrables.innerHTML =
        '<div class="alert alert-secondary mb-0">Select a participant to enable drag and drop</div>';
      return;
    }

    const candidatos = participantes.filter((nombre) => !mismoNombre(nombre, participanteActivo));

    if (candidatos.length === 0) {
      listaArrastrables.innerHTML =
        '<div class="alert alert-warning mb-0">No valid names available</div>';
      return;
    }

    candidatos.forEach((nombre) => {
      listaArrastrables.appendChild(crearTarjetaArrastrable(nombre));
    });
  }

  function renderizarResumenActivo() {
    if (!participanteActivo) {
      resumenActivo.textContent = "Select a participant first.";
      return;
    }

    resumenActivo.innerHTML =
      '<span class="fw-semibold">' + participanteActivo + '</span>' +
      " cannot draw the names dropped below.";
  }

  function renderizarExclusionesActuales() {
    listaExclusionesActuales.innerHTML = "";

    if (!participanteActivo) {
      listaExclusionesActuales.innerHTML =
        '<div class="alert alert-secondary mb-0">No participant selected</div>';
      return;
    }

    const exclusiones = obtenerExclusionesDe(participanteActivo);

    if (exclusiones.length === 0) {
      listaExclusionesActuales.innerHTML =
        '<div class="alert alert-light border mb-0">No exclusions for this participant</div>';
      return;
    }

    exclusiones.forEach((nombre) => {
      const item = document.createElement("div");
      item.className = "border rounded-3 bg-white p-2 d-flex justify-content-between align-items-center";
      item.innerHTML =
        '<span class="fw-semibold"></span>' +
        '<button type="button" class="btn btn-sm btn-outline-danger">Remove</button>';

      item.querySelector("span").textContent = nombre;

      item.querySelector("button").addEventListener("click", function () {
        eliminarExclusion(participanteActivo, nombre);
      });

      listaExclusionesActuales.appendChild(item);
    });
  }

  function actualizarPanelSegunSwitch() {
    if (hayExclusiones.checked) {
      panelExclusiones.classList.remove("d-none");
      limpiarAlerta(msgGeneral);
    } else {
      panelExclusiones.classList.add("d-none");
    }
  }

  function renderizarTodo() {
    const estado = sanearExclusiones(cargarEstado());
    guardarEstado(estado);

    const participantes = obtenerTodosLosParticipantes(estado);

    if (participantes.length < 2) {
      mostrarAlerta(msgGeneral, "danger", "At least 2 total participants are required");
    }

    if (participanteActivo && !participantes.some((nombre) => mismoNombre(nombre, participanteActivo))) {
      participanteActivo = "";
    }

    renderizarListaConfiguracion();
    renderizarArrastrables();
    renderizarResumenActivo();
    renderizarExclusionesActuales();
    actualizarPanelSegunSwitch();
  }

  function manejarCambioSwitch() {
    const estado = sanearExclusiones(cargarEstado());

    if (!hayExclusiones.checked) {
      estado.exclusiones = {};
      guardarEstado(estado);
      participanteActivo = "";
      renderizarTodo();
      mostrarAlerta(msgGeneral, "success", "All exclusions cleared");
      return;
    }

    guardarEstado(estado);
    renderizarTodo();
    mostrarAlerta(msgGeneral, "success", "Exclusions enabled");
  }

  function inicializarZonaDrop() {
    zonaDrop.addEventListener("dragover", function (e) {
      e.preventDefault();
      zonaDrop.classList.add("zona-drop-activa");
    });

    zonaDrop.addEventListener("dragenter", function (e) {
      e.preventDefault();
      zonaDrop.classList.add("zona-drop-activa");
    });

    zonaDrop.addEventListener("dragleave", function () {
      zonaDrop.classList.remove("zona-drop-activa");
    });

    zonaDrop.addEventListener("drop", function (e) {
      e.preventDefault();
      zonaDrop.classList.remove("zona-drop-activa");

      if (!hayExclusiones.checked) {
        mostrarAlerta(msgGeneral, "warning", "Enable exclusions first");
        return;
      }

      if (!participanteActivo) {
        mostrarAlerta(msgGeneral, "warning", "Select a participant first");
        return;
      }

      const nombreArrastrado = e.dataTransfer.getData("text/plain");
      agregarExclusion(participanteActivo, nombreArrastrado);
    });
  }

  function iniciar() {
    const estado = sanearExclusiones(cargarEstado());
    guardarEstado(estado);

    const participantes = obtenerTodosLosParticipantes(estado);

    if (participantes.length < 2) {
      mostrarAlerta(msgGeneral, "danger", "Complete setup first. At least 2 participants are required");
    }

    hayExclusiones.checked = hayDatosDeExclusiones(estado);

    if (participantes.length > 0) {
      participanteActivo = participantes[0];
    }

    inicializarZonaDrop();

    hayExclusiones.addEventListener("change", manejarCambioSwitch);
    btnLimpiarExclusiones.addEventListener("click", limpiarExclusionesActuales);

    renderizarTodo();
  }

  iniciar();
})();