
document.addEventListener("DOMContentLoaded", function () {

    // ELEMENTOS DEL HTML

    const tabla = document.getElementById("tabla-reservas");

    const totalReservas = document.getElementById("total-reservas");
    const pagosPendientes = document.getElementById("pagos-pendientes");
    const reservasConfirmadas = document.getElementById("reservas-confirmadas");

    const buscarReserva = document.getElementById("buscar-reserva");
    const filtroEstado = document.getElementById("filtro-estado");
    const sinResultados = document.getElementById("sin-resultados");

    const btnNuevaReserva = document.getElementById("btn-nueva-reserva");
    const modal = document.getElementById("modal-reserva");
    const cerrarModal = document.getElementById("cerrar-modal");

    const formulario = document.getElementById("form-nueva-reserva");
    const nombreInput = document.getElementById("nombre-cliente");
    const canchaInput = document.getElementById("cancha-reserva");
    const fechaInput = document.getElementById("fecha-reserva-admin");
    const horarioInput = document.getElementById("horario-reserva");
    const estadoInput = document.getElementById("estado-reserva");
    const errorFormulario = document.getElementById("error-formulario");

    const CLAVE_STORAGE = "sporting_admin_reservas_demo";

    // DATOS DE EJEMPLO

    const reservasIniciales = [
        {
            id: 1,
            nombre: "Juan Pérez",
            cancha: "Cancha 1",
            fecha: "2026-10-16",
            horario: "18:00",
            estado: "Pendiente"
        },
        {
            id: 2,
            nombre: "María López",
            cancha: "Cancha 2",
            fecha: "2026-10-16",
            horario: "19:00",
            estado: "Confirmado"
        },
        {
            id: 3,
            nombre: "Lucas Fernández",
            cancha: "Cancha 1",
            fecha: "2026-10-16",
            horario: "20:00",
            estado: "Pendiente"
        }
    ];

    // CARGAR DATOS GUARDADOS

    let reservas;

    try {
        const guardadas = localStorage.getItem(CLAVE_STORAGE);

        reservas = guardadas === null
            ? reservasIniciales
            : JSON.parse(guardadas);

        if (!Array.isArray(reservas)) {
            reservas = reservasIniciales;
        }

    } catch (error) {
        console.error("Error al cargar reservas:", error);
        reservas = reservasIniciales;
    }

    function guardarReservas() {
        try {
            localStorage.setItem(
                CLAVE_STORAGE,
                JSON.stringify(reservas)
            );
        } catch (error) {
            console.error("No se pudieron guardar los datos:", error);
            alert("El navegador no pudo guardar los cambios de prueba.");
        }
    }

    // FECHAS

    function fechaLocalHoy() {
        const hoy = new Date();

        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, "0");
        const dia = String(hoy.getDate()).padStart(2, "0");

        return `${anio}-${mes}-${dia}`;
    }

    function mostrarFecha(fecha) {
        const partes = fecha.split("-");
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    // ESTADÍSTICAS

    function actualizarEstadisticas() {
        const activas = reservas.filter(function (reserva) {
            return reserva.estado !== "Cancelado";
        });

        const pendientes = activas.filter(function (reserva) {
            return reserva.estado === "Pendiente";
        });

        const confirmadas = activas.filter(function (reserva) {
            return reserva.estado === "Confirmado";
        });

        totalReservas.textContent = activas.length;
        pagosPendientes.textContent = pendientes.length;
        reservasConfirmadas.textContent = confirmadas.length;
    }

    // CREAR CELDAS SEGURAS

    function crearCelda(texto) {
        const celda = document.createElement("td");
        celda.textContent = texto;
        return celda;
    }

    // MOSTRAR RESERVAS

    function mostrarReservas() {
        tabla.innerHTML = "";

        const busqueda = buscarReserva.value.trim().toLowerCase();
        const filtro = filtroEstado.value;

        const filtradas = reservas.filter(function (reserva) {
            const coincideNombre = reserva.nombre
                .toLowerCase()
                .includes(busqueda);

            const coincideEstado =
                filtro === "Todas" || reserva.estado === filtro;

            return coincideNombre && coincideEstado;
        });

        filtradas.sort(function (a, b) {
            return (
                a.fecha.localeCompare(b.fecha) ||
                a.horario.localeCompare(b.horario)
            );
        });

        sinResultados.hidden = filtradas.length > 0;

        filtradas.forEach(function (reserva) {
            const fila = document.createElement("tr");

            fila.appendChild(crearCelda(reserva.nombre));
            fila.appendChild(crearCelda(reserva.cancha));
            fila.appendChild(crearCelda(mostrarFecha(reserva.fecha)));
            fila.appendChild(crearCelda(reserva.horario));

            // ESTADO

            const celdaEstado = document.createElement("td");
            const etiqueta = document.createElement("span");

            etiqueta.textContent = reserva.estado;
            etiqueta.classList.add("estado");

            if (reserva.estado === "Pendiente") {
                etiqueta.classList.add("estado-pendiente");
            }

            if (reserva.estado === "Confirmado") {
                etiqueta.classList.add("estado-confirmado");
            }

            if (reserva.estado === "Cancelado") {
                etiqueta.classList.add("estado-cancelado");
            }

            celdaEstado.appendChild(etiqueta);
            fila.appendChild(celdaEstado);

            // ACCIONES

            const celdaAcciones = document.createElement("td");
            const acciones = document.createElement("div");

            acciones.classList.add("acciones");

            if (reserva.estado === "Pendiente") {
                const botonConfirmar = document.createElement("button");

                botonConfirmar.type = "button";
                botonConfirmar.textContent = "Confirmar pago";
                botonConfirmar.classList.add("btn-confirmar");

                botonConfirmar.addEventListener("click", function () {
                    confirmarPago(reserva.id);
                });

                acciones.appendChild(botonConfirmar);
            }

            if (reserva.estado !== "Cancelado") {
                const botonCancelar = document.createElement("button");

                botonCancelar.type = "button";
                botonCancelar.textContent = "Cancelar";
                botonCancelar.classList.add("btn-cancelar");

                botonCancelar.addEventListener("click", function () {
                    cancelarReserva(reserva.id);
                });

                acciones.appendChild(botonCancelar);
            }

            if (reserva.estado === "Cancelado") {
                acciones.textContent = "—";
            }

            celdaAcciones.appendChild(acciones);
            fila.appendChild(celdaAcciones);
            tabla.appendChild(fila);
        });

        actualizarEstadisticas();
    }

    // CONFIRMAR PAGOS

    function confirmarPago(id) {
        const reserva = reservas.find(function (item) {
            return item.id === id;
        });

        if (!reserva || reserva.estado !== "Pendiente") {
            return;
        }

        const confirmar = window.confirm(
            `¿Confirmás que recibiste el pago de ${reserva.nombre}?`
        );

        if (!confirmar) {
            return;
        }

        reserva.estado = "Confirmado";

        guardarReservas();
        sincronizarEstadoCliente(reserva);
        mostrarReservas();
    }

    // CANCELAR RESERVAS

    function cancelarReserva(id) {
        const reserva = reservas.find(function (item) {
            return item.id === id;
        });

        if (!reserva || reserva.estado === "Cancelado") {
            return;
        }

        const confirmar = window.confirm(
            `¿Querés cancelar la reserva de ${reserva.nombre}?`
        );

        if (!confirmar) {
            return;
        }

        reserva.estado = "Cancelado";

        guardarReservas();
        sincronizarEstadoCliente(reserva);
        mostrarReservas();
    }

    // ABRIR Y CERRAR MODAL

    function abrirModal() {
        formulario.reset();
        errorFormulario.hidden = true;
        errorFormulario.textContent = "";

        fechaInput.min = fechaLocalHoy();

        modal.classList.add("activo");
        modal.setAttribute("aria-hidden", "false");

        nombreInput.focus();
    }

    function cerrarVentana() {
        modal.classList.remove("activo");
        modal.setAttribute("aria-hidden", "true");

        btnNuevaReserva.focus();
    }

    btnNuevaReserva.addEventListener("click", abrirModal);
    cerrarModal.addEventListener("click", cerrarVentana);

    modal.addEventListener("click", function (evento) {
        if (evento.target === modal) {
            cerrarVentana();
        }
    });

    document.addEventListener("keydown", function (evento) {
        if (
            evento.key === "Escape" &&
            modal.classList.contains("activo")
        ) {
            cerrarVentana();
        }
    });

    // CREAR NUEVA RESERVA

    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();

        const nombre = nombreInput.value.trim().replace(/\s+/g, " ");
        const cancha = canchaInput.value;
        const fecha = fechaInput.value;
        const horario = horarioInput.value;
        const estado = estadoInput.value;

        errorFormulario.hidden = true;

        if (!nombre || !cancha || !fecha || !horario) {
            mostrarError("Completá todos los campos.");
            return;
        }

        if (fecha < fechaLocalHoy()) {
            mostrarError("No podés reservar una fecha pasada.");
            return;
        }

        // VERIFICAR SI EL HORARIO ESTÁ OCUPADO

        const horarioOcupado = reservas.some(function (reserva) {
            return (
                reserva.cancha === cancha &&
                reserva.fecha === fecha &&
                reserva.horario === horario &&
                reserva.estado !== "Cancelado"
            );
        });

        if (horarioOcupado) {
            mostrarError(
                "Ese horario ya está reservado para la cancha seleccionada."
            );
            return;
        }

        const nuevaReserva = {
            id: Date.now() + Math.random(),
            nombre: nombre,
            cancha: cancha,
            fecha: fecha,
            horario: horario,
            estado: estado
        };

        reservas.push(nuevaReserva);

        guardarReservas();
        mostrarReservas();
        cerrarVentana();

        alert("¡Reserva agregada correctamente en la demostración!");
    });

    function mostrarError(mensaje) {
        errorFormulario.textContent = mensaje;
        errorFormulario.hidden = false;
    }

    // SINCRONIZACIÓN CON EL CLIENTE (DEMO)

    function sincronizarEstadoCliente(reservaAdmin) {
        if (!reservaAdmin.idLocal) return;

        const claveCliente = "sporting_mis_reservas_demo";

        try {
            const datos = JSON.parse(
                localStorage.getItem(claveCliente) || "[]"
            );

            if (!Array.isArray(datos)) return;

            const reservaCliente = datos.find(function (item) {
                return item.idLocal === reservaAdmin.idLocal;
            });

            if (!reservaCliente) return;

            if (reservaAdmin.estado === "Confirmado") {
                reservaCliente.estado = "CONFIRMADA";
            }

            if (reservaAdmin.estado === "Cancelado") {
                reservaCliente.estado = "CANCELADA";
            }

            localStorage.setItem(
                claveCliente,
                JSON.stringify(datos)
            );

        } catch (error) {
            console.error(
                "No se pudo sincronizar el estado local:",
                error
            );
        }
    }

    // BUSCADOR Y FILTROS

    buscarReserva.addEventListener("input", mostrarReservas);
    filtroEstado.addEventListener("change", mostrarReservas);

    // INICIAR PANEL

    mostrarReservas();

});
