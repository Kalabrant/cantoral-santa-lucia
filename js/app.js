/* =========================================================
   Cantoral Santa Lucía — lógica de la aplicación
   JavaScript vanilla, sin dependencias. Funciona desde file://
   Datos: window.CANTORAL (js/cantos.js)
   ========================================================= */

(function () {
  "use strict";

  var C = window.CANTORAL;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- Estado ---------- */
  var estado = {
    celebracion: null,   // objeto celebración elegido
    lista: [],           // [{ puestoId, etiqueta, cancion }]
    capaActiva: "A"      // capa de fondo visible (para el fundido de tema)
  };

  /* Números romanos para los puestos con más de un canto (Comunión I / II) */
  var ROMANOS = ["I", "II", "III", "IV"];

  /* ---------- Utilidades ---------- */

  function alAzar(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  }

  /* Devuelve las listas de candidatos por nivel de prioridad (de más a menos apropiado) */
  function nivelesDeCandidatos(celebracion, puestoId) {
    var pref = celebracion.preferencias[puestoId];
    if (!pref || !pref.prioridades) return [];
    return pref.prioridades.map(function (regla) {
      return C.canciones.filter(function (cancion) { return C.coincide(cancion, regla); });
    });
  }

  /* Elige un canto respetando la prioridad litúrgica y evitando los ya usados.
     Nunca devuelve un canto que ya esté en 'idsExcluidos': así ninguna canción
     puede aparecer en dos puestos de la misma lista. */
  function elegirCanto(niveles, idsExcluidos) {
    var i, libres;
    for (i = 0; i < niveles.length; i++) {
      libres = niveles[i].filter(function (c) { return idsExcluidos.indexOf(c.id) === -1; });
      if (libres.length) return alAzar(libres);
    }
    return null;
  }

  function idsEnUso(exceptoIndice) {
    return estado.lista.reduce(function (acc, fila, i) {
      if (i !== exceptoIndice && fila.cancion) acc.push(fila.cancion.id);
      return acc;
    }, []);
  }

  /* ---------- Tema de color ---------- */

  function aplicarTema(color) {
    var raiz = document.documentElement.style;
    raiz.setProperty("--primario", color.primario);
    raiz.setProperty("--acento", color.acento);
    raiz.setProperty("--texto", color.texto);
    raiz.setProperty("--fondo-base", color.fondoBase);

    // El degradado se cruza en fundido entre dos capas para que el cambio sea suave
    var entra = estado.capaActiva === "A" ? $("capaB") : $("capaA");
    var sale = estado.capaActiva === "A" ? $("capaA") : $("capaB");
    entra.style.background = color.fondo;
    entra.classList.add("activa");
    sale.classList.remove("activa");
    estado.capaActiva = estado.capaActiva === "A" ? "B" : "A";

    var meta = $("meta-theme");
    if (meta) meta.setAttribute("content", color.fondoBase);
  }

  /* ---------- Selector de celebraciones ---------- */

  function pintarSelector() {
    var contenedor = $("gruposCelebraciones");
    var grupos = [];

    C.celebraciones.forEach(function (cel) {
      var g = grupos.filter(function (x) { return x.nombre === cel.grupo; })[0];
      if (!g) { g = { nombre: cel.grupo, items: [] }; grupos.push(g); }
      g.items.push(cel);
    });

    contenedor.innerHTML = "";
    grupos.forEach(function (grupo) {
      var bloque = document.createElement("div");
      bloque.className = "grupo";

      var titulo = document.createElement("p");
      titulo.className = "grupo-titulo";
      titulo.id = "grupo-" + grupo.nombre.replace(/\s+/g, "-").toLowerCase();
      titulo.textContent = grupo.nombre;
      bloque.appendChild(titulo);

      var chips = document.createElement("div");
      chips.className = "chips";
      chips.setAttribute("role", "group");
      chips.setAttribute("aria-labelledby", titulo.id);

      grupo.items.forEach(function (cel) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip";
        chip.dataset.id = cel.id;
        chip.setAttribute("aria-pressed", "false");
        chip.setAttribute("aria-label", "Celebración: " + cel.nombre);
        chip.style.setProperty("--chip-color", cel.color.primario);
        chip.style.setProperty("--chip-acento", cel.color.acento);
        chip.innerHTML = '<span class="punto" aria-hidden="true"></span>';
        chip.appendChild(document.createTextNode(cel.nombre));
        chip.addEventListener("click", function () { elegirCelebracion(cel); });
        chips.appendChild(chip);
      });

      bloque.appendChild(chips);
      contenedor.appendChild(bloque);
    });

    $("contadorCelebraciones").textContent = C.celebraciones.length + " celebraciones";
  }

  function elegirCelebracion(cel) {
    estado.celebracion = cel;

    var chips = document.querySelectorAll(".chip");
    Array.prototype.forEach.call(chips, function (chip) {
      chip.setAttribute("aria-pressed", String(chip.dataset.id === cel.id));
    });

    aplicarTema(cel.color);

    var nota = $("notaCelebracion");
    nota.textContent = cel.nota || "";
    nota.hidden = !cel.nota;

    $("btnGenerar").disabled = false;
    $("textoBotonGenerar").textContent = "Generar lista · " + cel.nombre;

    // Al cambiar de celebración la lista anterior deja de ser válida
    estado.lista = [];
    $("resultado").hidden = true;
    $("bienvenida").hidden = false;
  }

  /* ---------- Generación de la lista ---------- */

  function generarLista() {
    var cel = estado.celebracion;
    if (!cel) return;

    var filas = [];
    var usados = [];

    C.puestos.forEach(function (puesto) {
      // El Gloria se omite en Adviento y Cuaresma
      if (puesto.soloSiGloria && !cel.gloria) return;

      var pref = cel.preferencias[puesto.id];
      if (!pref) return;

      var cantidad = pref.cantidad || puesto.cantidad || 1;
      var niveles = nivelesDeCandidatos(cel, puesto.id);

      for (var i = 0; i < cantidad; i++) {
        var cancion = elegirCanto(niveles, usados);
        // Si el repertorio del puesto se agotase, se deja de insistir (no hay bucle)
        if (!cancion) break;
        usados.push(cancion.id);
        filas.push({
          puestoId: puesto.id,
          etiqueta: cantidad > 1 ? puesto.nombre + " " + (ROMANOS[i] || i + 1) : puesto.nombre,
          cancion: cancion
        });
      }
    });

    estado.lista = filas;
    pintarLista();

    $("bienvenida").hidden = true;
    $("resultado").hidden = false;
    $("subResultado").textContent = cel.nombre + " · " + filas.length + " cantos";
    $("resultado").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* Sustituye un solo canto por otro elegible y distinto de los demás de la lista */
  function regenerarUno(indice) {
    var fila = estado.lista[indice];
    if (!fila) return;

    var niveles = nivelesDeCandidatos(estado.celebracion, fila.puestoId);
    // Se excluye el canto actual y todos los que ya ocupan otro puesto de la lista
    var excluidos = idsEnUso(indice).concat([fila.cancion.id]);
    var nueva = elegirCanto(niveles, excluidos);

    if (!nueva) {
      avisar("No hay más cantos disponibles para " + fila.etiqueta);
      return;
    }

    fila.cancion = nueva;

    // Se sustituye sólo esa fila: el resto de la lista no se vuelve a animar
    var ol = $("listaCantos");
    var anterior = ol.children[indice];
    var nuevaFila = crearFila(fila, indice, true);
    ol.replaceChild(nuevaFila, anterior);

    var nuevoBoton = nuevaFila.querySelector(".btn-regenerar");
    if (nuevoBoton) {
      nuevoBoton.classList.add("girando");
      nuevoBoton.focus();
    }
  }

  /* ---------- Pintado de la lista ---------- */

  /* Construye el <li> de un puesto. 'destacado' marca la fila recién cambiada. */
  function crearFila(fila, i, destacado) {
    var li = document.createElement("li");
    li.className = "canto" + (destacado ? " cambiado" : "");
    li.style.animationDelay = (destacado ? 0 : i * 45) + "ms";

    // Zona pulsable: abre la letra
    var abrir = document.createElement("button");
    abrir.type = "button";
    abrir.className = "canto-abrir";
    abrir.setAttribute("aria-label", "Ver la letra de " + fila.cancion.titulo + " (" + fila.etiqueta + ")");
    abrir.innerHTML =
      '<span class="canto-num" aria-hidden="true">' + (i + 1) + "</span>" +
      '<span class="canto-cuerpo">' +
        '<span class="pastilla">' + escapar(fila.etiqueta) + "</span>" +
        '<span class="canto-titulo">' + escapar(fila.cancion.titulo) + "</span>" +
        '<span class="canto-meta">' + escapar(metaDe(fila.cancion)) + "</span>" +
      "</span>";
    abrir.addEventListener("click", function () { abrirHoja(fila, abrir); });

    // Botón de regenerar sólo este puesto
    var recargar = document.createElement("button");
    recargar.type = "button";
    recargar.className = "btn-regenerar";
    recargar.setAttribute("aria-label", "Cambiar el canto de " + fila.etiqueta + " por otro");
    recargar.setAttribute("title", "Cambiar este canto");
    recargar.innerHTML =
      '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M20 11.5A8 8 0 1 0 18.4 16"/><path d="M20.5 5.5V11h-5.5"/></svg>';
    recargar.addEventListener("click", function () { regenerarUno(i); });

    li.appendChild(abrir);
    li.appendChild(recargar);
    return li;
  }

  function pintarLista() {
    var ol = $("listaCantos");
    ol.innerHTML = "";
    estado.lista.forEach(function (fila, i) {
      ol.appendChild(crearFila(fila, i, false));
    });
  }

  function metaDe(cancion) {
    var partes = [cancion.seccion];
    if (cancion.paginas) partes.push("pág. " + cancion.paginas);
    return partes.join(" · ");
  }

  function escapar(texto) {
    return String(texto)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---------- Panel de la letra ---------- */

  var ultimoFoco = null;

  function abrirHoja(fila, origen) {
    ultimoFoco = origen || null;
    $("hojaPuesto").textContent = fila.etiqueta;
    $("hojaTitulo").textContent = fila.cancion.titulo;
    $("hojaMeta").textContent = metaDe(fila.cancion);
    $("hojaLetra").textContent = fila.cancion.letra || "(Sin letra registrada)";

    var hoja = $("hoja");
    var velo = $("velo");
    hoja.hidden = false;
    velo.hidden = false;
    document.body.style.overflow = "hidden";

    requestAnimationFrame(function () {
      hoja.classList.add("visible");
      velo.classList.add("visible");
      $("btnCerrarHoja").focus();
    });
  }

  function cerrarHoja() {
    var hoja = $("hoja");
    var velo = $("velo");
    if (hoja.hidden) return;

    hoja.classList.remove("visible");
    velo.classList.remove("visible");
    document.body.style.overflow = "";

    window.setTimeout(function () {
      hoja.hidden = true;
      velo.hidden = true;
    }, 300);

    if (ultimoFoco && document.contains(ultimoFoco)) ultimoFoco.focus();
  }

  /* ---------- Copiar la lista ---------- */

  function textoDeLaLista() {
    var lineas = ["Cantoral Santa Lucía — " + estado.celebracion.nombre, ""];
    estado.lista.forEach(function (fila, i) {
      lineas.push((i + 1) + ". " + fila.etiqueta + ": " + fila.cancion.titulo);
    });
    return lineas.join("\n");
  }

  /* Una línea es "de acordes" si todos sus fragmentos son cifrado americano
     (C, D7, Em, G#m7, Asus4, Bb/F…) o signos de repetición. Se usa para que
     el mensaje de WhatsApp lleve sólo la letra: en el teléfono, sin fuente
     monoespaciada, los acordes quedarían descuadrados. */
  var ACORDE = /^\(?[A-G](?:#|b)?(?:m|maj|min|sus|dim|aum|add|\+|°)?[0-9]{0,2}(?:sus[24]?|maj7)?(?:\/[A-G](?:#|b)?)?\)?[,.]?$/;

  function esLineaDeAcordes(linea) {
    var partes = linea.trim().split(/[\s\-|/]+/).filter(Boolean);
    if (!partes.length) return false;
    return partes.every(function (p) {
      return ACORDE.test(p) || /^x[0-9]$/i.test(p) || /^[().,:%]+$/.test(p);
    });
  }

  function letraSinAcordes(letra) {
    return String(letra || "")
      .split("\n")
      .filter(function (l) { return !esLineaDeAcordes(l); })
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  /* Mensaje completo con letras, con formato de WhatsApp (*negrita*, _cursiva_) */
  function textoConLetras() {
    var partes = [
      "*Cantoral Santa Lucía*",
      "_" + estado.celebracion.nombre + " · " + estado.lista.length + " cantos_"
    ];
    estado.lista.forEach(function (fila, i) {
      partes.push("");
      partes.push("——————————");
      partes.push("*" + (i + 1) + ". " + fila.etiqueta + ": " + fila.cancion.titulo + "*");
      partes.push("_" + metaDe(fila.cancion) + "_");
      partes.push("");
      partes.push(letraSinAcordes(fila.cancion.letra) || "(Sin letra registrada)");
    });
    return partes.join("\n");
  }

  function copiarTexto(texto, mensajeExito) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto)
        .then(function () { avisar(mensajeExito); })
        .catch(function () { copiarAlternativo(texto, mensajeExito); });
    } else {
      copiarAlternativo(texto, mensajeExito);
    }
  }

  function copiarLista() {
    if (!estado.lista.length) return;
    copiarTexto(textoDeLaLista(), "Lista copiada");
  }

  function copiarConLetras() {
    if (!estado.lista.length) return;
    copiarTexto(textoConLetras(), "Mensaje con letras copiado: pégalo en WhatsApp");
  }

  /* Respaldo para file:// y navegadores sin API de portapapeles */
  function copiarAlternativo(texto, mensajeExito) {
    var area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    document.body.appendChild(area);
    area.select();
    var bien = false;
    try { bien = document.execCommand("copy"); } catch (e) { bien = false; }
    document.body.removeChild(area);
    avisar(bien ? (mensajeExito || "Lista copiada") : "No se pudo copiar en este navegador");
  }

  /* ---------- Aviso flotante ---------- */

  var temporizadorAviso = null;

  function avisar(mensaje) {
    var caja = $("brindis");
    caja.textContent = mensaje;
    caja.classList.add("visible");
    window.clearTimeout(temporizadorAviso);
    temporizadorAviso = window.setTimeout(function () {
      caja.classList.remove("visible");
    }, 2200);
  }

  /* ---------- Arranque ---------- */

  function iniciar() {
    if (!C || !C.celebraciones) {
      document.body.innerHTML = "<p style='padding:32px;font-family:system-ui'>No se pudo cargar js/cantos.js</p>";
      return;
    }

    pintarSelector();
    $("btnGenerar").disabled = true;
    $("pieDatos").textContent = C.canciones.length + " cantos · datos v" + C.version;

    $("btnGenerar").addEventListener("click", generarLista);
    $("btnCopiar").addEventListener("click", copiarLista);
    $("btnCopiarLetras").addEventListener("click", copiarConLetras);
    $("btnCerrarHoja").addEventListener("click", cerrarHoja);
    $("velo").addEventListener("click", cerrarHoja);

    $("btnAyuda").addEventListener("click", function () {
      var panel = $("panelAyuda");
      panel.hidden = !panel.hidden;
      $("btnAyuda").setAttribute("aria-expanded", String(!panel.hidden));
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") cerrarHoja();
    });

    // Limpia la animación de giro cuando termina
    document.addEventListener("animationend", function (ev) {
      if (ev.target && ev.target.parentElement && ev.target.parentElement.classList.contains("girando")) {
        ev.target.parentElement.classList.remove("girando");
      }
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
