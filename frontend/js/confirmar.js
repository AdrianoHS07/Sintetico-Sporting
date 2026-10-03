document.addEventListener("DOMContentLoaded", function () {

    // 1. Capturar elementos del DOM
    const canchaReserva = document.getElementById("cancha-reserva");
    const fechaReserva = document.getElementById("fecha-reserva");
    const horarioReserva = document.getElementById("horario-reserva");
    const btnMercadoPago = document.querySelector(".mercadopago");

    // 2. Obtener datos de la reserva desde sessionStorage
    const reservaGuardada = sessionStorage.getItem("reservaSeleccionada");

    if (reservaGuardada) {
        const reserva = JSON.parse(reservaGuardada);

        if (canchaReserva) canchaReserva.textContent = "⚽ " + (reserva.cancha || "Cancha");
        if (horarioReserva) horarioReserva.textContent = reserva.horario;

        if (fechaReserva) {
            const partesFecha = reserva.fecha ? reserva.fecha.split("-") : [];
            if (partesFecha.length === 3) {
                fechaReserva.textContent = partesFecha[2] + "/" + partesFecha[1] + "/" + partesFecha[0];
            } else {
                fechaReserva.textContent = reserva.fecha;
            }
        }
    } else {
        // Si no hay datos de reserva, redirige al catálogo
        window.location.href = "canchas.html";
        return;
    }

    // Auxiliar para formatear la hora al estándar 'HH:mm:ss' exigido por Spring Boot / LocalTime
    function obtenerHoraFormateada(rangoHorario) {
        if (!rangoHorario) return "18:00:00";
        const horaInicio = rangoHorario.split("-")[0].trim();
        return horaInicio.length === 5 ? horaInicio + ":00" : horaInicio;
    }

    // PASO 1: Enviar datos a Spring Boot para guardar la reserva en MySQL
    async function guardarReservaEnBD() {
        const reserva = JSON.parse(reservaGuardada);
        const horaValida = obtenerHoraFormateada(reserva.horario || reserva.hora);

        const datosParaBackend = {
            fecha: reserva.fecha,
            hora: horaValida,
            precio: reserva.precio || 20000.0,
            estado: "PENDIENTE_PAGO",
            cancha: { idCancha: Number(reserva.idCancha) || 1 },
            usuario: { idUsuario: 1 } // Ajustar según tu lógica de login
        };

        try {
            const respuesta = await fetch("http://localhost:8080/reservas/crear", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datosParaBackend)
            });

            if (respuesta.ok) {
                const data = await respuesta.json();
                console.log("Reserva guardada exitosamente en BD:", data);
                return data;
            } else {
                const errorTexto = await respuesta.text();
                console.error("Error al guardar reserva en Spring Boot:", respuesta.status, errorTexto);
                return null;
            }
        } catch (error) {
            console.error("Error de red al conectar con Spring Boot:", error);
            return null;
        }
    }

    // PASO 2: Evento al presionar el botón de pagar
    if (btnMercadoPago) {
        btnMercadoPago.addEventListener("click", async function (e) {
            e.preventDefault();

            // Deshabilitar botón para evitar múltiples clics
            btnMercadoPago.disabled = true;
            const textoOriginal = btnMercadoPago.textContent;
            btnMercadoPago.textContent = "⏳ PROCESANDO...";

            // A) Primero guarda en la base de datos
            const reservaCreada = await guardarReservaEnBD();

            // Soporta tanto 'idReserva' como 'id' en el objeto devuelto por Spring Boot
            const idGenerado = reservaCreada ? (reservaCreada.idReserva || reservaCreada.id) : null;

            if (!reservaCreada || !idGenerado) {
                alert("Ocurrió un error al guardar la reserva en la base de datos.");
                btnMercadoPago.disabled = false;
                btnMercadoPago.textContent = textoOriginal;
                return;
            }

            // B) Solicita la preferencia de pago a Mercado Pago (Spring Boot en puerto 8080)
            try {
                const resMP = await fetch("http://localhost:8080/api/mercadopago/crear-preferencia", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        cancha: reservaCreada.cancha ? (reservaCreada.cancha.nombre || "Cancha") : "Cancha",
                        precio: reservaCreada.precio || 20000.0,
                        idReserva: idGenerado
                    })
                });

                const dataMP = await resMP.json();

                if (resMP.ok && dataMP.initPoint) {
                    // Redirige al usuario a la pasarela de Mercado Pago
                    window.location.href = dataMP.initPoint;
                } else {
                    console.error("Respuesta fallida de Mercado Pago:", dataMP);
                    alert("Ocurrió un error al generar la preferencia de pago.");
                    btnMercadoPago.disabled = false;
                    btnMercadoPago.textContent = textoOriginal;
                }
            } catch (error) {
                console.error("Error al conectar con el endpoint de Mercado Pago:", error);
                alert("No se pudo establecer comunicación con el servidor de pagos.");
                btnMercadoPago.disabled = false;
                btnMercadoPago.textContent = textoOriginal;
            }
        });
    }
});