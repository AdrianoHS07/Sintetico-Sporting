document.addEventListener("DOMContentLoaded", function () {

    const checkbox = document.getElementById("menu-toggle");
    const menu = document.querySelector(".menu-lateral");
    const botonMenu = document.querySelector(".hamburguesa");
    const btnVolverArriba = document.getElementById("btn-volver-arriba");

    if (botonMenu && checkbox) {
        botonMenu.addEventListener("click", function () {
            setTimeout(() => {
                if (checkbox.checked) {
                    if (menu) menu.classList.add("activo");
                } else {
                    if (menu) menu.classList.remove("activo");
                }
            }, 10);
        });
    }

    document.addEventListener("click", function (evento) {
        if (!checkbox || !checkbox.checked) return;

        const dentroDelMenu = menu ? menu.contains(evento.target) : false;
        const enBoton = botonMenu ? botonMenu.contains(evento.target) : false;

        if (!dentroDelMenu && !enBoton) {
            checkbox.checked = false;
            if (menu) menu.classList.remove("activo");
        }
    });

    const paginaActual = window.location.pathname.split("/").pop();

    document.querySelectorAll(".menu-lateral a").forEach(function (link) {
        if (link.getAttribute("href") === paginaActual) {
            link.classList.add("activo");
        }
    });

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

    const botonTransferencia = document.getElementById("btn-transferencia");
    const panelTransferencia = document.getElementById("panel-transferencia");
    const panelPendiente = document.getElementById("panel-pendiente");
    const mensajeError = document.getElementById("mensaje-error");

    if (botonTransferencia) {
        botonTransferencia.addEventListener("click", async function () {

            if (mensajeError) mensajeError.hidden = true;

            // OBTENER USUARIO DESDE sessionStorage CON VALIDACIÓN ESTRICTA
            const usuarioGuardado = sessionStorage.getItem("usuario");
            
            if (!usuarioGuardado) {
                alert("No se encontró una sesión activa. Iniciá sesión nuevamente.");
                window.location.href = "login.html";
                return;
            }

            let idUsuario = null;
            try {
                const u = JSON.parse(usuarioGuardado);
                idUsuario = u.idUsuario || u.id;
            } catch (e) {}

            if (!idUsuario) {
                alert("ID de usuario inválido. Iniciá sesión otra vez.");
                window.location.href = "login.html";
                return;
            }

            const confirmar = window.confirm(
                "¿Ya realizaste la transferencia bancaria?\n\n" +
                "Tu turno quedará bloqueado temporalmente y el administrador deberá verificar el pago para confirmarlo."
            );

            if (!confirmar) return;

            botonTransferencia.disabled = true;
            const textoOriginal = botonTransferencia.textContent;
            botonTransferencia.textContent = "⏳ REGISTRANDO RESERVA...";

            const idCanchaValido = Number(reserva.idCancha) || (String(reserva.cancha).includes("2") ? 2 : 1);
            const horaValida = obtenerHoraFormateada(reserva.horario || reserva.hora);

            const datosParaBackend = {
                fecha: reserva.fecha,
                hora: horaValida,
                precio: precio,
                estado: "PENDIENTE_PAGO",
                cancha: { idCancha: idCanchaValido },
                usuario: { idUsuario: idUsuario } // ID estricto del usuario actual de la pestaña
            };

            try {
                const respuesta = await fetch("http://localhost:8080/reservas/crear", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(datosParaBackend)
                });

                if (respuesta.ok) {
                    const dataReserva = await respuesta.json();
                    console.log("Reserva registrada como PENDIENTE_PAGO:", dataReserva);

                    escribirTexto("resultado-cancha", cancha);
                    escribirTexto("resultado-fecha", fecha);
                    escribirTexto("resultado-horario", horario);

                    if (panelTransferencia) panelTransferencia.hidden = true;
                    if (panelPendiente) panelPendiente.hidden = false;

                    if (btnVolverArriba) {
                        btnVolverArriba.href = "canchas.html";
                    }

                    window.scrollTo({ top: 0, behavior: "smooth" });

                    sessionStorage.removeItem("reservaSeleccionada");

                } else {
                    const errorTexto = await respuesta.text();
                    console.error("Error al guardar reserva en Spring Boot:", respuesta.status, errorTexto);
                    alert("Ocurrió un error al registrar la reserva: " + errorTexto);
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
    }
});