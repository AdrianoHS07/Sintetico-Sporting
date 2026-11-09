document.addEventListener("DOMContentLoaded", async function () {

    // 1. Capturar elementos del DOM
    const canchaReserva = document.getElementById("cancha-reserva");
    const fechaReserva = document.getElementById("fecha-reserva");
    const horarioReserva = document.getElementById("horario-reserva");
    const modalidadReserva = document.getElementById("modalidad-reserva"); // Capturar elemento modalidad
    const btnMercadoPago = document.querySelector(".mercadopago");
    const btnVolverHorarios = document.getElementById("btn-volver-horarios");

    // Obtener usuario logueado en localStorage
    const usuarioGuardado = localStorage.getItem("usuario");
    let idUsuario = 1;
    if (usuarioGuardado) {
        try {
            const u = JSON.parse(usuarioGuardado);
            idUsuario = u.idUsuario || u.id || 1;
        } catch (e) {}
    }

    // 2. VERIFICACIÓN PREVIA DE SUSPENSIÓN AL CARGAR LA PÁGINA
    try {
        const respuestaUser = await fetch(`http://localhost:8080/usuarios/${idUsuario}`);
        if (respuestaUser.ok) {
            const datosUsuario = await respuestaUser.json();
            if (datosUsuario.suspendidoHasta) {
                const fechaSuspension = new Date(datosUsuario.suspendidoHasta);
                const ahora = new Date();

                if (fechaSuspension > ahora) {
                    alert(`Aviso: Tu cuenta se encuentra suspendida temporalmente por acumulación de multas hasta el ${datosUsuario.suspendidoHasta.split('T')[0]}. No podés realizar nuevas reservas.`);
                    window.location.href = "canchas.html";
                    return;
                }
            }
        }
    } catch (error) {
        console.error("Error al verificar suspensión del usuario:", error);
    }

    // 3. Obtener datos de la reserva desde sessionStorage
    const reservaGuardada = sessionStorage.getItem("reservaSeleccionada");

    if (reservaGuardada) {
        const reserva = JSON.parse(reservaGuardada);

        if (canchaReserva) canchaReserva.textContent = "⚽ " + (reserva.cancha || "Cancha");
        if (horarioReserva) horarioReserva.textContent = reserva.horario || reserva.hora;
        if (modalidadReserva) modalidadReserva.textContent = reserva.modalidad || "Fútbol 5"; // Mostrar la modalidad guardada

        if (fechaReserva) {
            const partesFecha = reserva.fecha ? reserva.fecha.split("-") : [];
            if (partesFecha.length === 3) {
                fechaReserva.textContent = partesFecha[2] + "/" + partesFecha[1] + "/" + partesFecha[0];
            } else {
                fechaReserva.textContent = reserva.fecha;
            }
        }

        if (btnVolverHorarios) {
            const idCancha = Number(reserva.idCancha) || 1;
            btnVolverHorarios.href = `horarios.html?id=${idCancha}`;
        }

    } else {
        window.location.href = "canchas.html";
        return;
    }

    // Auxiliar para formatear la hora al estándar 'HH:mm:ss' exigido por Spring Boot
    function obtenerHoraFormateada(rangoHorario) {
        if (!rangoHorario) return "18:00:00";
        const horaInicio = rangoHorario.split("-")[0].trim();
        return horaInicio.length === 5 ? horaInicio + ":00" : horaInicio;
    }

    // PASO 1: Enviar datos a Spring Boot para guardar la reserva en MySQL (Exclusivo para Mercado Pago)
    async function guardarReservaEnBD() {
        const reserva = JSON.parse(reservaGuardada);
        const horaValida = obtenerHoraFormateada(reserva.horario || reserva.hora);

        const datosParaBackend = {
            fecha: reserva.fecha,
            hora: horaValida,
            precio: reserva.precio || 20000.0,
            estado: "PENDIENTE_PAGO",
            cancha: { idCancha: Number(reserva.idCancha) || 1 },
            usuario: { idUsuario: idUsuario }
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
                alert("Aviso: " + errorTexto);
                return null;
            }
        } catch (error) {
            console.error("Error de red al conectar con Spring Boot:", error);
            alert("Error de conexión con el servidor de reservas.");
            return null;
        }
    }

    // PASO 2: Evento al presionar el botón de pagar con Mercado Pago
    if (btnMercadoPago) {
        btnMercadoPago.addEventListener("click", async function (e) {
            e.preventDefault();

            btnMercadoPago.disabled = true;
            const textoOriginal = btnMercadoPago.textContent;
            btnMercadoPago.textContent = "⏳ PROCESANDO...";

            const reservaCreada = await guardarReservaEnBD();
            const idGenerado = reservaCreada ? (reservaCreada.idReserva || reservaCreada.id) : null;

            if (!reservaCreada || !idGenerado) {
                btnMercadoPago.disabled = false;
                btnMercadoPago.textContent = textoOriginal;
                return;
            }

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

    // PASO 3: Botón de transferencia bancaria (SOLO REDIRIGE, sin guardar en la BD todavía)
    const btnTransferencia = document.querySelector(".transferencia");
    if (btnTransferencia) {
        btnTransferencia.addEventListener("click", function (e) {
            e.preventDefault();
            // Redirige a transferencia.html para que el usuario vea los datos bancarios
            window.location.href = "transferencia.html";
        });
    }
});