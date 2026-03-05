(function () {
  const nombreOrganizador = document.getElementById("nombreOrganizador");
  const organizadorIncluido = document.getElementById("organizadorIncluido");
  const msgOrganizador = document.getElementById("msgOrganizador");

  const inputParticipante = document.getElementById("inputParticipante");
  const btnAgregarParticipante = document.getElementById("btnAgregarParticipante");
  const listaParticipantes = document.getElementById("listaParticipantes");
  const msgParticipantes = document.getElementById("msgParticipantes");

  const btnContinuar = document.getElementById("btnContinuar");

  function mostrarAlerta(contenedor, tipo, texto) {
    contenedor.innerHTML = '<div class="alert alert-' + tipo + ' mb-0">' + texto + "</div>";
  }

  function limpiarAlerta(contenedor) {
    contenedor.innerHTML = "";
  }

  function renderizarParticipantes(estado) {
    listaParticipantes.innerHTML = "";

    const elementos = estado.participantes || [];
    if (elementos.length === 0) {
      listaParticipantes.innerHTML = '<li class="list-group-item text-muted">No participants yet</li>';
      return;
    }

    for (let i = 0; i < elementos.length; i++) {
      const nombre = elementos[i];

      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML =
        '<span class="fw-semibold"></span>' +
        '<button type="button" class="btn btn-sm btn-outline-danger">Remove</button>';

      li.querySelector("span").textContent = nombre;

      li.querySelector("button").addEventListener("click", function () {
        const siguienteEstado = cargarEstado();
        siguienteEstado.participantes = (siguienteEstado.participantes || []).filter((x) => x !== nombre);
        guardarEstado(siguienteEstado);
        renderizarParticipantes(siguienteEstado);
        limpiarAlerta(msgParticipantes);
      });

      listaParticipantes.appendChild(li);
    }
  }

  function iniciar() {
    const estado = cargarEstado();

    nombreOrganizador.value = estado.organizador && estado.organizador.nombre ? estado.organizador.nombre : "";
    organizadorIncluido.checked = !!(estado.organizador && estado.organizador.incluido);

    renderizarParticipantes(estado);
  }

  function guardarOrganizador() {
    const estado = cargarEstado();
    estado.organizador.nombre = String(nombreOrganizador.value || "").trim();
    estado.organizador.incluido = !!organizadorIncluido.checked;
    guardarEstado(estado);

    if (estado.organizador.nombre.length === 0) {
      mostrarAlerta(msgOrganizador, "warning", "Organizer name is empty");
    } else {
      mostrarAlerta(msgOrganizador, "success", "Organizer saved");
    }
  }

  function agregarParticipante() {
    const nombre = String(inputParticipante.value || "").trim();
    if (!nombre) {
      mostrarAlerta(msgParticipantes, "warning", "Participant name is empty");
      return;
    }

    const estado = cargarEstado();
    const lista = estado.participantes || [];

    if (lista.some((x) => x.toLowerCase() === nombre.toLowerCase())) {
      mostrarAlerta(msgParticipantes, "danger", "Duplicate participant");
      return;
    }

    lista.push(nombre);
    estado.participantes = lista;
    guardarEstado(estado);

    inputParticipante.value = "";
    inputParticipante.focus();

    limpiarAlerta(msgParticipantes);
    renderizarParticipantes(estado);
  }

  function validarYContinuar() {
    const estado = cargarEstado();
    const todos = obtenerTodosLosParticipantes(estado);

    if (!estado.organizador.nombre) {
      mostrarAlerta(msgOrganizador, "danger", "Organizer name is required");
      return;
    }

    if (todos.length < 2) {
      mostrarAlerta(msgParticipantes, "danger", "At least 2 total participants are required");
      return;
    }

    window.location.href = "./exclusions.html";
  }

  nombreOrganizador.addEventListener("input", function () {
    guardarOrganizador();
  });

  organizadorIncluido.addEventListener("change", function () {
    guardarOrganizador();
  });

  btnAgregarParticipante.addEventListener("click", function () {
    agregarParticipante();
  });

  inputParticipante.addEventListener("keydown", function (e) {
    if (e.key === "Enter") agregarParticipante();
  });

  btnContinuar.addEventListener("click", function () {
    validarYContinuar();
  });

  iniciar();
})();