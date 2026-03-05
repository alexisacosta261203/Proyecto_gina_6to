(function () {
  const msgEvento = document.getElementById("msgEvento");

  const tipoEvento = document.getElementById("tipoEvento");
  const nombreCelebracion = document.getElementById("nombreCelebracion");
  const fechaEvento = document.getElementById("fechaEvento");

  const btnFecha7 = document.getElementById("btnFecha7");
  const btnFecha14 = document.getElementById("btnFecha14");
  const btnFecha30 = document.getElementById("btnFecha30");

  const panelCustom = document.getElementById("panelCustom");
  const cantidadPersonalizada = document.getElementById("cantidadPersonalizada");

  const btnContinuar = document.getElementById("btnContinuar");

  function mostrarAlerta(contenedor, tipo, texto) {
    contenedor.innerHTML = '<div class="alert alert-' + tipo + ' mb-0">' + texto + "</div>";
  }

  function limpiarAlerta(contenedor) {
    contenedor.innerHTML = "";
  }

  function formatearFechaYYYYMMDD(fecha) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, "0");
    const d = String(fecha.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function fechaConDiasExtra(dias) {
    const hoy = new Date();
    const f = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 12, 0, 0);
    f.setDate(f.getDate() + dias);
    return formatearFechaYYYYMMDD(f);
  }

  function obtenerOpcionPresupuestoSeleccionada() {
    const radios = document.querySelectorAll('input[name="presupuestoOpcion"]');
    for (const r of radios) {
      if (r.checked) return r.value;
    }
    return "";
  }

  function seleccionarOpcionPresupuesto(valor) {
    const radios = document.querySelectorAll('input[name="presupuestoOpcion"]');
    for (const r of radios) {
      r.checked = r.value === valor;
    }
  }

  function actualizarPanelCustom() {
    const opcion = obtenerOpcionPresupuestoSeleccionada();
    if (opcion === "custom") {
      panelCustom.classList.remove("d-none");
    } else {
      panelCustom.classList.add("d-none");
    }
  }

  function cargarFormularioDesdeEstado() {
    const estado = cargarEstado();

    tipoEvento.value = estado.evento && estado.evento.tipo ? estado.evento.tipo : "";
    nombreCelebracion.value = estado.evento && estado.evento.nombre_celebracion ? estado.evento.nombre_celebracion : "";
    fechaEvento.value = estado.evento && estado.evento.fecha_iso ? estado.evento.fecha_iso : "";

    const opcion = estado.presupuesto && estado.presupuesto.opcion ? estado.presupuesto.opcion : "";
    const cantidad = estado.presupuesto && estado.presupuesto.cantidad_personalizada ? estado.presupuesto.cantidad_personalizada : "";

    if (opcion) {
      seleccionarOpcionPresupuesto(opcion);
    }
    if (cantidad !== "") {
      cantidadPersonalizada.value = cantidad;
    }

    actualizarPanelCustom();
  }

  function guardarEstadoDesdeFormulario() {
    const estado = cargarEstado();

    estado.evento.tipo = String(tipoEvento.value || "").trim();
    estado.evento.nombre_celebracion = String(nombreCelebracion.value || "").trim();
    estado.evento.fecha_iso = String(fechaEvento.value || "").trim();

    const opcion = obtenerOpcionPresupuestoSeleccionada();
    estado.presupuesto.opcion = opcion;

    if (opcion === "custom") {
      estado.presupuesto.cantidad_personalizada = String(cantidadPersonalizada.value || "").trim();
    } else {
      estado.presupuesto.cantidad_personalizada = "";
    }

    guardarEstado(estado);
  }

  function validar() {
    const estado = cargarEstado();
    const participantes = obtenerTodosLosParticipantes(estado);

    if (participantes.length < 2) {
      mostrarAlerta(msgEvento, "danger", "Complete setup first. At least 2 participants are required.");
      return false;
    }

    const tipo = String(tipoEvento.value || "").trim();
    if (!tipo) {
      mostrarAlerta(msgEvento, "danger", "Event type is required.");
      return false;
    }

    const fecha = String(fechaEvento.value || "").trim();
    if (!fecha) {
      mostrarAlerta(msgEvento, "danger", "Event date is required.");
      return false;
    }

    const opcion = obtenerOpcionPresupuestoSeleccionada();
    if (!opcion) {
      mostrarAlerta(msgEvento, "danger", "Budget option is required.");
      return false;
    }

    if (opcion === "custom") {
      const raw = String(cantidadPersonalizada.value || "").trim();
      const n = Number(raw);
      if (!raw || !Number.isFinite(n) || n <= 0) {
        mostrarAlerta(msgEvento, "danger", "Custom budget must be a valid number greater than 0.");
        return false;
      }
    }

    const nombre = String(nombreCelebracion.value || "").trim();
    if (tipo === "Otro" && !nombre) {
      mostrarAlerta(msgEvento, "danger", 'Celebration name is required when type is "Otro".');
      return false;
    }

    limpiarAlerta(msgEvento);
    return true;
  }

  function configurarListeners() {
    tipoEvento.addEventListener("change", function () {
      guardarEstadoDesdeFormulario();
      limpiarAlerta(msgEvento);
    });

    nombreCelebracion.addEventListener("input", function () {
      guardarEstadoDesdeFormulario();
    });

    fechaEvento.addEventListener("change", function () {
      guardarEstadoDesdeFormulario();
      limpiarAlerta(msgEvento);
    });

    btnFecha7.addEventListener("click", function () {
      fechaEvento.value = fechaConDiasExtra(7);
      guardarEstadoDesdeFormulario();
      limpiarAlerta(msgEvento);
    });

    btnFecha14.addEventListener("click", function () {
      fechaEvento.value = fechaConDiasExtra(14);
      guardarEstadoDesdeFormulario();
      limpiarAlerta(msgEvento);
    });

    btnFecha30.addEventListener("click", function () {
      fechaEvento.value = fechaConDiasExtra(30);
      guardarEstadoDesdeFormulario();
      limpiarAlerta(msgEvento);
    });

    const radios = document.querySelectorAll('input[name="presupuestoOpcion"]');
    for (const r of radios) {
      r.addEventListener("change", function () {
        actualizarPanelCustom();
        guardarEstadoDesdeFormulario();
        limpiarAlerta(msgEvento);
      });
    }

    cantidadPersonalizada.addEventListener("input", function () {
      guardarEstadoDesdeFormulario();
    });

    btnContinuar.addEventListener("click", function () {
      guardarEstadoDesdeFormulario();
      if (!validar()) return;
      window.location.href = "./summary.html";
    });
  }

  function iniciar() {
    cargarFormularioDesdeEstado();
    configurarListeners();
    guardarEstadoDesdeFormulario();
  }

  iniciar();
})();