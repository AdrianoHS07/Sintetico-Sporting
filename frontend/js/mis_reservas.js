
document.addEventListener("DOMContentLoaded", function () {
    const CLAVE_RESERVAS = "sporting_mis_reservas_demo";
    const CLAVE_TRANSFERENCIA = "transferenciaPendienteDemo";
    const CLAVE_ADMIN = "sporting_admin_reservas_demo";
    const lista = document.getElementById("lista-reservas");
    const vacio = document.getElementById("sin-reservas");
    const contador = document.getElementById("cantidad-reservas");
    const filtros = document.querySelectorAll(".filtro");
    let filtroActual = "TODAS";

    function leerLista(clave) {
        try {
            const dato = JSON.parse(localStorage.getItem(clave) || "[]");
            return Array.isArray(dato) ? dato : [];
        } catch (error) {
            console.error("No se pudo leer", clave, error);
            return [];
        }
    }

    let reservas = leerLista(CLAVE_RESERVAS);

    function guardarReservas() {
        localStorage.setItem(CLAVE_RESERVAS, JSON.stringify(reservas));
    }

    function enviarReservaAlAdmin(reserva) {
        const reservasAdmin = leerLista(CLAVE_ADMIN);

        if (reservasAdmin.some(item => item.idLocal === reserva.idLocal)) {
            return;
        }

        reservasAdmin.push({
            id: reserva.idLocal,
            idLocal: reserva.idLocal,
            nombre: "Cliente (demo)",
            cancha: reserva.cancha,
            fecha: reserva.fecha,
            horario: reserva.horario,
            estado: "Pendiente",
            metodoPago: "TRANSFERENCIA"
        });

        localStorage.setItem(
            CLAVE_ADMIN,
            JSON.stringify(reservasAdmin)
        );
    }

    function incorporarTransferencia() {
        const guardado = sessionStorage.getItem(CLAVE_TRANSFERENCIA);
        if (!guardado) return;

        try {
            const aviso = JSON.parse(guardado);

            if (!aviso.fecha || !(aviso.horario || aviso.hora)) {
                return;
            }

            const idLocal = aviso.idLocal ||
                "demo-" + Date.now() + "-" +
                Math.random().toString(36).slice(2, 9);

            const nueva = {
                idLocal,
                cancha: aviso.cancha || "Cancha",
                idCancha: aviso.idCancha || null,
                fecha: aviso.fecha,
                horario: aviso.horario || aviso.hora,
                precio: aviso.precio || 20000,
                metodoPago: "TRANSFERENCIA",
                estado: "PENDIENTE_VERIFICACION",
                fechaAviso: aviso.fechaAviso || new Date().toISOString()
            };

            if (!reservas.some(item => item.idLocal === idLocal)) {
                reservas.push(nueva);
                guardarReservas();
            }

            enviarReservaAlAdmin(nueva);
            sessionStorage.removeItem(CLAVE_TRANSFERENCIA);

        } catch (error) {
            console.error("No se pudo incorporar la transferencia:", error);
        }
    }

    function sincronizarDesdeAdmin() {
        const admin = leerLista(CLAVE_ADMIN);
        let cambio = false;

        for (const reserva of reservas) {
            if (!reserva.idLocal) continue;

            const encontrada = admin.find(
                item => item.idLocal === reserva.idLocal
            );

            if (!encontrada) continue;

            const estado =
                encontrada.estado === "Confirmado" ? "CONFIRMADA" :
                encontrada.estado === "Cancelado" ? "CANCELADA" :
                null;

            if (estado && reserva.estado !== estado) {
                reserva.estado = estado;
                cambio = true;
            }
        }

        if (cambio) guardarReservas();
    }

    function fechaLegible(fecha) {
        if (!fecha) return "-";

        const partes = String(fecha).split("-");

        return partes.length === 3
            ? `${partes[2]}/${partes[1]}/${partes[0]}`
            : String(fecha);
    }

    function precioLegible(valor) {
        const numero = Number(valor);

        return Number.isFinite(numero)
            ? numero.toLocaleString("es-AR", {
                style: "currency",
                currency: "ARS",
                maximumFractionDigits: 0
            })
            : "-";
    }

    function estadoVisible(estado) {
        if (["CONFIRMADA", "CONFIRMADO", "PAGO_CONFIRMADO"].includes(estado)) {
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
            descripcion: "Pago todavía no confirmado"
        };
    }

    function coincide(reserva) {
        if (filtroActual === "TODAS") return true;

        const estado = estadoVisible(reserva.estado);

        if (filtroActual === "CONFIRMADAS") {
            return estado.clase === "estado-confirmada";
        }

        if (filtroActual === "CANCELADAS") {
            return estado.clase === "estado-cancelada";
        }

        return estado.clase === "estado-pendiente";
    }

    function crear(tag, clase, texto) {
        const elemento = document.createElement(tag);

        if (clase) elemento.className = clase;
        if (texto !== undefined) elemento.textContent = texto;

        return elemento;
    }

    function crearTarjeta(reserva) {
        const estado = estadoVisible(reserva.estado);
        const tarjeta = crear("article", "reserva");
        const superior = crear("div", "reserva-superior");

        superior.append(
            crear("h3", "", "⚽ " + (reserva.cancha || "Cancha")),
            crear("span", "estado " + estado.clase, estado.texto)
        );

        const datos = crear("div", "datos-reserva");

        datos.append(
            crear("p", "", "📅 " + fechaLegible(reserva.fecha)),
            crear("p", "", "🕒 " + (reserva.horario || "-"))
        );

        const acciones = crear("div", "acciones");
        const boton = crear("button", "btn-detalle", "VER DETALLE");
        boton.type = "button";

        const detalle = crear("div", "detalle");
        detalle.hidden = true;

        detalle.append(
            crear("p", "", "⚽ Césped sintético"),
            crear("p", "", "👥 Fútbol 8"),
            crear("p", "", "💳 " + estado.descripcion),
            crear("p", "", "💰 Importe: " + precioLegible(reserva.precio)),
            crear("p", "", "🏦 Método de pago: " +
                (reserva.metodoPago || "No especificado"))
        );

        if (reserva.estado === "PENDIENTE_PAGO" && reserva.idReserva) {
            detalle.append(
                crear("p", "",
                    "Para reintentar el pago, será necesario conectar " +
                    "la reserva existente con el backend.")
            );
        }

        boton.addEventListener("click", function () {
            detalle.hidden = !detalle.hidden;
            boton.textContent = detalle.hidden
                ? "VER DETALLE"
                : "OCULTAR DETALLE";
        });

        acciones.append(boton);
        tarjeta.append(superior, datos, acciones, detalle);

        return tarjeta;
    }

    function mostrar() {
        sincronizarDesdeAdmin();

        const visibles = reservas.filter(coincide);

        lista.replaceChildren(...visibles.map(crearTarjeta));

        contador.textContent = visibles.length +
            (visibles.length === 1 ? " reserva" : " reservas");

        vacio.hidden = visibles.length > 0;
    }

    incorporarTransferencia();

    filtros.forEach(boton => {
        boton.addEventListener("click", function () {
            filtroActual = boton.dataset.filtro;

            filtros.forEach(item => {
                item.classList.toggle("activo", item === boton);
            });

            mostrar();
        });
    });

    window.addEventListener("storage", function (evento) {
        if (evento.key === CLAVE_ADMIN) mostrar();
    });

    mostrar();
});
