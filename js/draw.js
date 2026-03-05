(function () {
  const msgSorteo = document.getElementById("msgSorteo");
  const btnSortear = document.getElementById("btnSortear");
  const btnRevelar = document.getElementById("btnRevelar");
  const btnLimpiarResultados = document.getElementById("btnLimpiarResultados");
  const contenedorResultados = document.getElementById("contenedorResultados");
  const totalResultados = document.getElementById("totalResultados");
  const rawDrawData = document.getElementById("rawDrawData");

  function mostrarAlerta(tipo, texto) {
    msgSorteo.innerHTML = '<div class="alert alert-' + tipo + ' mb-0">' + texto + "</div>";
  }

  function limpiarAlerta() {
    msgSorteo.innerHTML = "";
  }

  function obtenerEstadoActual() {
    if (typeof loadState === "function") return loadState();
    return {};
  }

  function guardarEstadoActual(estado) {
    if (typeof saveState === "function") saveState(estado);
  }

  function obtenerTodosParticipantes(estado) {
    if (typeof getAllParticipants === "function") return getAllParticipants(estado);
    return [];
  }

  function normalizarTexto(valor) {
    return String(valor || "").trim();
  }

  function mismoNombre(a, b) {
    return normalizarTexto(a).toLowerCase() === normalizarTexto(b).toLowerCase();
  }

  function obtenerExclusionesDe(estado, nombre) {
    if (!estado.exclusions || typeof estado.exclusions !== "object") return [];

    const claves = Object.keys(estado.exclusions);
    const clave = claves.find((k) => mismoNombre(k, nombre));

    if (!clave) return [];
    return Array.isArray(estado.exclusions[clave]) ? estado.exclusions[clave] : [];
  }

  function puedeAsignarse(estado, origen, destino) {
    if (mismoNombre(origen, destino)) return false;

    const exclusiones = obtenerExclusionesDe(estado, origen);
    if (exclusiones.some((nombre) => mismoNombre(nombre, destino))) return false;

    return true;
  }

  function mezclarLista(lista) {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = copia[i];
      copia[i] = copia[j];
      copia[j] = temp;
    }
    return copia;
  }

  function validarEscenario(estado, participantes) {
    if (!Array.isArray(participantes) || participantes.length < 2) {
      return "At least 2 participants are required.";
    }

    for (const origen of participantes) {
      const candidatos = participantes.filter((destino) => puedeAsignarse(estado, origen, destino));
      if (candidatos.length === 0) {
        return "There is no valid draw because at least one participant has no valid options.";
      }
    }

    return "";
  }

  function resolverSorteoBacktracking(estado, participantes) {
    const emisores = mezclarLista(participantes).sort(function (a, b) {
      const opcionesA = participantes.filter((destino) => puedeAsignarse(estado, a, destino)).length;
      const opcionesB = participantes.filter((destino) => puedeAsignarse(estado, b, destino)).length;
      return opcionesA - opcionesB;
    });

    const usados = new Set();
    const asignaciones = {};

    function backtrack(indice) {
      if (indice === emisores.length) return true;

      const origen = emisores[indice];

      const candidatos = mezclarLista(
        participantes.filter((destino) => {
          if (usados.has(destino.toLowerCase())) return false;
          return puedeAsignarse(estado, origen, destino);
        })
      );

      for (const destino of candidatos) {
        asignaciones[origen] = destino;
        usados.add(destino.toLowerCase());

        if (backtrack(indice + 1)) return true;

        delete asignaciones[origen];
        usados.delete(destino.toLowerCase());
      }

      return false;
    }

    const exito = backtrack(0);
    return exito ? asignaciones : null;
  }

  function guardarResultadosEnEstado(asignaciones) {
    const estado = obtenerEstadoActual();
    estado.draw_results = asignaciones || {};
    guardarEstadoActual(estado);
  }

  function limpiarResultadosEnEstado() {
    const estado = obtenerEstadoActual();
    estado.draw_results = {};
    guardarEstadoActual(estado);
  }

  function crearTarjetaResultado(origen, destino, index) {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-xl-4";

    const card = document.createElement("div");
    card.className = "card shadow-sm h-100 tarjeta-resultado";

    const body = document.createElement("div");
    body.className = "card-body p-4 text-center";

    const icono = document.createElement("div");
    icono.className = "fs-1 mb-3";
    icono.textContent = "Gift";

    const titulo = document.createElement("div");
    titulo.className = "fw-bold mb-2";
    titulo.textContent = origen;

    const linea = document.createElement("div");
    linea.className = "text-muted mb-3";
    linea.textContent = "gives to";

    const destinoOculto = document.createElement("div");
    destinoOculto.className = "destino-oculto border rounded-3 p-3 bg-light fw-semibold";
    destinoOculto.textContent = "Click to reveal";
    destinoOculto.dataset.destino = destino;
    destinoOculto.dataset.revelado = "false";
    destinoOculto.dataset.index = String(index);

    destinoOculto.addEventListener("click", function () {
      revelarElemento(destinoOculto);
    });

    body.appendChild(icono);
    body.appendChild(titulo);
    body.appendChild(linea);
    body.appendChild(destinoOculto);

    card.appendChild(body);
    col.appendChild(card);

    return col;
  }

  function revelarElemento(elemento) {
    if (elemento.dataset.revelado === "true") return;
    elemento.dataset.revelado = "true";
    elemento.classList.remove("bg-light");
    elemento.classList.add("bg-success-subtle");
    elemento.textContent = elemento.dataset.destino;
  }

  function revelarTodos() {
    const elementos = document.querySelectorAll(".destino-oculto");
    elementos.forEach(function (el) {
      revelarElemento(el);
    });
  }

  function renderizarResultados() {
    const estado = obtenerEstadoActual();
    const resultados = estado.draw_results && typeof estado.draw_results === "object" ? estado.draw_results : {};
    const claves = Object.keys(resultados);

    rawDrawData.textContent = JSON.stringify(estado, null, 2);
    totalResultados.textContent = String(claves.length);
    contenedorResultados.innerHTML = "";

    if (claves.length === 0) {
      contenedorResultados.innerHTML =
        '<div class="col-12"><div class="alert alert-secondary mb-0">No draw results yet</div></div>';
      return;
    }

    claves.forEach(function (origen, index) {
      contenedorResultados.appendChild(crearTarjetaResultado(origen, resultados[origen], index));
    });
  }

  function ejecutarSorteo() {
    const estado = obtenerEstadoActual();
    const participantes = obtenerTodosParticipantes(estado);

    const error = validarEscenario(estado, participantes);
    if (error) {
      mostrarAlerta("danger", error);
      return;
    }

    const asignaciones = resolverSorteoBacktracking(estado, participantes);

    if (!asignaciones) {
      mostrarAlerta("danger", "No valid draw could be generated with the current exclusions.");
      return;
    }

    guardarResultadosEnEstado(asignaciones);
    renderizarResultados();
    mostrarAlerta("success", "Draw generated successfully.");
  }

  btnSortear.addEventListener("click", function () {
    ejecutarSorteo();
  });

  btnRevelar.addEventListener("click", function () {
    revelarTodos();
  });

  btnLimpiarResultados.addEventListener("click", function () {
    limpiarResultadosEnEstado();
    renderizarResultados();
    mostrarAlerta("success", "Draw results cleared.");
  });

  renderizarResultados();
  limpiarAlerta();
})();