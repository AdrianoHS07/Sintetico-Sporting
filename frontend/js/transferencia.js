
document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // 1. MENÚ LATERAL
    // ==========================================

    const checkbox = document.getElementById("menu-toggle");
    const menu = document.querySelector(".menu-lateral");
    const botonMenu = document.querySelector(".hamburguesa");

    document.addEventListener("click", function (evento) {
        if (!checkbox || !checkbox.checked) return;

        const dentroDelMenu = menu.contains(evento.target);
        const enBoton = botonMenu.contains(evento.target);

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
    // 4. AVISO DE TRANSFERENCIA (DEMO)
    // ==========================================

    const botonTransferencia = document.getElementById("btn-transferencia");
    const panelTransferencia = document.getElementById("panel-transferencia");
    const panelPendiente = document.getElementById("panel-pendiente");
    const mensajeError = document.getElementById("mensaje-error");

    botonTransferencia.addEventListener("click", function () {

        mensajeError.hidden = true;

        const confirmar = window.confirm(
            "¿Ya realizaste la transferencia bancaria?\n\n" +
            "Tu pago quedará pendiente de verificación."
        );

        if (!confirmar) return;

        // Guardamos el aviso solamente en el navegador.
        // Esto NO crea una reserva en MySQL ni confirma el pago.
        const avisoDemo = {
            ...reserva,
            metodoPago: "TRANSFERENCIA",
            estado: "PENDIENTE_VERIFICACION",
            fechaAviso: new Date().toISOString()
        };

        try {
            sessionStorage.setItem(
                "transferenciaPendienteDemo",
                JSON.stringify(avisoDemo)
            );
        } catch (error) {
            console.warn("No se pudo guardar el aviso de demostración:", error);
        }

        escribirTexto("resultado-cancha", cancha);
        escribirTexto("resultado-fecha", fecha);
        escribirTexto("resultado-horario", horario);

        panelTransferencia.hidden = true;
        panelPendiente.hidden = false;

        window.scrollTo({ top: 0, behavior: "smooth" });
    });

});
