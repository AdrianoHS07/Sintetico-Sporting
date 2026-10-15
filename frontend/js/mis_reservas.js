document.addEventListener("DOMContentLoaded", function () {

    const lista = document.getElementById("lista-reservas");
    const vacio = document.getElementById("sin-reservas");
    const contador = document.getElementById("cantidad-reservas");
    const filtros = document.querySelectorAll(".filtro");
    let filtroActual = "TODAS";
    let reservas = [];

    // 1. Obtener ID de usuario desde localStorage
    function obtenerIdUsuarioLogueado() {
        const usuarioGuardado = localStorage.getItem("usuario");
        if (usuarioGuardado) {
            try {
                const u = JSON.parse(usuarioGuardado);
                return u.idUsuario || u.id || 1;
            } catch (e) {
                console.error("Error al parsear el usuario:", e);
            }
        }
        return 1;
    }

    // 2. Formatear la fecha para la interfaz (YYYY-MM-DD -> DD/MM/YYYY)
    function fechaLegible(fecha) {
        if (!fecha) return "-";
        const partes = String(fecha).split("T")[0].split("-");
        return partes.length === 3
            ? `${partes[2]}/${partes[1]}/${partes[0]}`
            : String(fecha);
    }

    // 3. Formatear la hora
    function horaLegible(reserva) {
        if (reserva.horario) return reserva.horario;
        if (reserva.hora) {
            const h = String(reserva.hora).substring(0, 5);
            const horaNum = parseInt(h.split(":")[0], 10);
            const finNum = (horaNum + 1) % 24;
            const finStr = finNum < 10 ? "0" + finNum : finNum;
            return `${h} - ${finStr}:00`;
        }
        return "-";
    }

    // 4. Formatear moneda en ARS
    function precioLegible(valor) {
        const numero = Number(valor);
        return Number.isFinite(numero)
            ? numero.toLocaleString("es-AR", {
                style: "currency",
                currency: "ARS",
                maximumFractionDigits: 0
            })
            : "$ 20.000";
    }

    // 5. Determinar las etiquetas visuales de los estados
    function estadoVisible(estadoRaw) {
        const estado = String(estadoRaw || "").toUpperCase();

        if (["CONFIRMADA", "CONFIRMADO", "PAGO_CONFIRMADO", "RESERVADO"].includes(estado)) {
            return {
                texto: "🟢 Confirmada",
                clase: "estado-confirmada",
                descripcion: "Pago confirmado"
            };
        }

        if (["CANCELADA", "CANCELADO"].includes(estado)) {
            return {
                texto: "🔴 Cancelada",
                clase: "estado-cancelada",
                descripcion: "Reserva cancelada"
            };
        }

        if (estado === "PENDIENTE_VERIFICACION") {
            return {
                texto: "🟠 Transferencia pendiente",
                clase: "estado-pendiente",
                descripcion: "Esperando verificación del administrador"
            };
        }

        return {
            texto: "🟡 Pendiente de pago",
            clase: "estado-pendiente",
            descripcion: "Pago pendiente de aprobación"
        };
    }

    // 6. Consultar la API de Spring Boot
    async function cargarReservasDesdeBD() {
        const idUsuario = obtenerIdUsuarioLogueado();

        try {
            let respuesta = await fetch(`http://localhost:8080/reservas/usuario/${idUsuario}`);

            if (!respuesta.ok) {
                respuesta = await fetch(`http://localhost:8080/reservas/todas`);
            }

            if (respuesta.ok) {
                const data = await respuesta.json();
                
                if (Array.isArray(data)) {
                    reservas = data.filter(r => {
                        if (!r.usuario) return true;
                        const uId = r.usuario.idUsuario || r.usuario.id;
                        return String(uId) === String(idUsuario);
                    });
                } else {
                    reservas = [];
                }

            } else {
                console.error("Error al obtener reservas del servidor:", respuesta.status);
                reservas = [];
            }
        } catch (error) {
            console.error("Error de conexión al cargar reservas:", error);
            reservas = [];
        }

        mostrar();
    }

    // 7. Filtrado según la solapa activa
    function coincide(reserva) {
        if (filtroActual === "TODAS") return true;

        const est = estadoVisible(reserva.estado);

        if (filtroActual === "CONFIRMADAS") {
            return est.clase === "estado-confirmada";
        }

        if (filtroActual === "CANCELADAS") {
            return est.clase === "estado-cancelada";
        }

        return est.clase === "estado-pendiente";
    }

    function crear(tag, clase, texto) {
        const elemento = document.createElement(tag);
        if (clase) elemento.className = clase;
        if (texto !== undefined) elemento.textContent = texto;
        return elemento;
    }

    // 8. Construcción de tarjetas
    function crearTarjeta(reserva) {
        const est = estadoVisible(reserva.estado);
        const tarjeta = crear("article", "reserva");
        const superior = crear("div", "reserva-superior");

        let nombreCancha = "Cancha";
        if (reserva.cancha) {
            if (typeof reserva.cancha === "object") {
                nombreCancha = reserva.cancha.nombre || ("CANCHA " + (reserva.cancha.idCancha || ""));
            } else {
                nombreCancha = reserva.cancha;
            }
        }

        superior.append(
            crear("h3", "", "⚽ " + nombreCancha),
            crear("span", "estado " + est.clase, est.texto)
        );

        const datos = crear("div", "datos-reserva");

        datos.append(
            crear("p", "", "📅 " + fechaLegible(reserva.fecha)),
            crear("p", "", "🕒 " + horaLegible(reserva))
        );

        const acciones = crear("div", "acciones");
        const boton = crear("button", "btn-detalle", "VER DETALLE");
        boton.type = "button";

        const detalle = crear("div", "detalle");
        detalle.hidden = true;

        detalle.append(
            crear("p", "", "⚽ Césped sintético"),
            crear("p", "", "👥 Fútbol 8"),
            crear("p", "", "💳 " + est.descripcion),
            crear("p", "", "💰 Importe: " + precioLegible(reserva.precio))
        );

        boton.addEventListener("click", function () {
            detalle.hidden = !detalle.hidden;
            boton.textContent = detalle.hidden ? "VER DETALLE" : "OCULTAR DETALLE";
        });

        acciones.append(boton);
        tarjeta.append(superior, datos, acciones, detalle);

        return tarjeta;
    }

    // 9. Renderizar en pantalla
    function mostrar() {
        const visibles = reservas.filter(coincide);

        lista.replaceChildren(...visibles.map(crearTarjeta));

        contador.textContent = visibles.length +
            (visibles.length === 1 ? " reserva" : " reservas");

        vacio.hidden = visibles.length > 0;
    }

    // 10. Eventos de filtros
    filtros.forEach(boton => {
        boton.addEventListener("click", function () {
            filtroActual = boton.dataset.filtro;

            filtros.forEach(item => {
                item.classList.toggle("activo", item === boton);
            });

            mostrar();
        });
    });

    cargarReservasDesdeBD();
});