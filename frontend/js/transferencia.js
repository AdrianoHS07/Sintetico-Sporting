document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // 1. MENÚ LATERAL Y NAVEGACIÓN
    // ==========================================

    const checkbox = document.getElementById("menu-toggle");
    const menu = document.querySelector(".menu-lateral");
    const botonMenu = document.querySelector(".hamburguesa");
    const btnVolverArriba = document.getElementById("btn-volver-arriba");

    document.addEventListener("click", function (evento) {
        if (!checkbox || !checkbox.checked) return;

        const dentroDelMenu = menu.contains(evento.target);
        const enBoton = botonMenu ? botonMenu.contains(evento.target) : false;

        if (!dentroDelMenu && !enBoton) {
            checkbox.checked = false;
        }
    });

    const paginaActual = window.location.pathname.split("/").pop();

    document.querySelectorAll(".menu-lateral a").forEach(function (link) {
        if (link.getAttribute("href") === paginaActual) {
            link.classList.add("activo");
        }
    });

    // ==========================================
    // 2. RECUPERAR RESERVA
    // ==========================================

    const reservaGuardada = sessionStorage.getItem("reservaSeleccionada");

    let reserva;

    try {
        reserva = reservaGuardada ? JSON.parse(reservaGuardada) : null;
    } catch (error) {
        console.error("Reserva inválida:", error);
        reserva = null;
    }

    if (!reserva || !reserva.fecha || !(reserva.horario || reserva.hora)) {
        alert("Primero tenés que seleccionar una cancha y un horario.");
        window.location.href = "canchas.html";
        return;
    }

    const cancha = reserva.cancha || "Cancha";
    const horario = reserva.horario || reserva.hora;
    const fecha = formatearFecha(reserva.fecha);

    const precioNumerico = Number(reserva.precio);
    const precio = Number.isFinite(precioNumerico) && precioNumerico > 0
        ? precioNumerico
        : 20000;

    function formatearFecha(fechaOriginal) {
        const partes = String(fechaOriginal).split("-");

        if (partes.length === 3) {
            return partes[2] + "/" + partes[1] + "/" + partes[0];
        }

        return String(fechaOriginal);
    }

    function obtenerHoraFormateada(rangoHorario) {
        if (!rangoHorario) return "18:00:00";
        const horaInicio = rangoHorario.split("-")[0].trim();
        return horaInicio.length === 5 ? horaInicio + ":00" : horaInicio;
    }

    function escribirTexto(id, valor) {
        const elemento = document.getElementById(id);

        if (elemento) {
            elemento.textContent = valor;
        }
    }

    escribirTexto("cancha-reserva", cancha);
    escribirTexto("fecha-reserva", fecha);
    escribirTexto("horario-reserva", horario);

    escribirTexto(
        "precio-reserva",
        precio.toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0
        })
    );

    // ==========================================
    // 3. COPIAR DATOS BANCARIOS
    // ==========================================

    document.querySelectorAll(".btn-copiar").forEach(function (boton) {

        boton.addEventListener("click", async function () {

            const id = boton.dataset.copiar;
            const elemento = document.getElementById(id);

            if (!elemento) return;

            const texto = elemento.textContent.trim();

            try {
                await navigator.clipboard.writeText(texto);

                const textoOriginal = boton.textContent;
                boton.textContent = "¡Copiado!";

                setTimeout(function () {
                    boton.textContent = textoOriginal;
                }, 1800);

            } catch (error) {
                console.error("No se pudo copiar:", error);
                alert("No se pudo copiar automáticamente. Seleccioná el dato para copiarlo.");
            }
        });

    });

    // ==========================================
    // 4. GUARDAR RESERVA EN MYSQL Y MOSTRAR PENDIENTE
    // ==========================================

    const botonTransferencia = document.getElementById("btn-transferencia");
    const panelTransferencia = document.getElementById("panel-transferencia");
    const panelPendiente = document.getElementById("panel-pendiente");
    const mensajeError = document.getElementById("mensaje-error");

    botonTransferencia.addEventListener("click", async function () {

        if (mensajeError) mensajeError.hidden = true;

        const confirmar = window.confirm(
            "¿Ya realizaste la transferencia bancaria?\n\n" +
            "Tu pago quedará pendiente de verificación por el administrador."
        );

        if (!confirmar) return;

        // Deshabilitar el botón mientras se procesa la solicitud
        botonTransferencia.disabled = true;
        const textoOriginal = botonTransferencia.textContent;
        botonTransferencia.textContent = "⏳ REGISTRANDO RESERVA...";

        // Obtener ID del usuario desde localStorage si está logueado
        const usuarioGuardado = localStorage.getItem("usuario");
        let idUsuario = 1;

        if (usuarioGuardado) {
            try {
                const u = JSON.parse(usuarioGuardado);
                idUsuario = u.idUsuario || u.id || 1;
            } catch (e) {}
        }

        const idCanchaValido = Number(reserva.idCancha) || (String(reserva.cancha).includes("2") ? 2 : 1);
        const horaValida = obtenerHoraFormateada(reserva.horario || reserva.hora);

        const datosParaBackend = {
            fecha: reserva.fecha,
            hora: horaValida,
            precio: precio,
            estado: "PENDIENTE_PAGOS",
            cancha: { idCancha: idCanchaValido },
            usuario: { idUsuario: idUsuario }
        };

        try {
            const respuesta = await fetch("http://localhost:8080/reservas/crear", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datosParaBackend)
            });

            if (respuesta.ok) {
                const dataReserva = await respuesta.json();
                console.log("Reserva registrada con éxito en MySQL:", dataReserva);

                escribirTexto("resultado-cancha", cancha);
                escribirTexto("resultado-fecha", fecha);
                escribirTexto("resultado-horario", horario);

                // Ocultar vista de datos y mostrar panel de pendiente
                panelTransferencia.hidden = true;
                panelPendiente.hidden = false;

                // Redirigir botón de arriba hacia el menú de canchas
                if (btnVolverArriba) {
                    btnVolverArriba.href = "canchas.html";
                }

                window.scrollTo({ top: 0, behavior: "smooth" });

            } else {
                const errorTexto = await respuesta.text();
                console.error("Error al guardar reserva en Spring Boot:", respuesta.status, errorTexto);
                alert("Ocurrió un error al registrar la reserva. Intentá nuevamente.");
                botonTransferencia.disabled = false;
                botonTransferencia.textContent = textoOriginal;
            }

        } catch (error) {
            console.error("Error de conexión:", error);
            alert("No se pudo conectar con el servidor. Comprobá que Spring Boot esté funcionando.");
            botonTransferencia.disabled = false;
            botonTransferencia.textContent = textoOriginal;
        }
    });

});