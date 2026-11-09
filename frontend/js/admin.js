document.addEventListener("DOMContentLoaded", function () {

    const tabla = document.getElementById("tabla-reservas");

    const totalReservas = document.getElementById("total-reservas");
    const pagosPendientes = document.getElementById("pagos-pendientes");
    const reservasConfirmadas = document.getElementById("reservas-confirmadas");

    const buscarReserva = document.getElementById("buscar-reserva");
    const filtroEstado = document.getElementById("filtro-estado");
    const sinResultados = document.getElementById("sin-resultados");

    // Modals de Reservas
    const btnNuevaReserva = document.getElementById("btn-nueva-reserva");
    const modalReserva = document.getElementById("modal-reserva");
    const cerrarModalReserva = document.getElementById("cerrar-modal");

    // Modals de Canchas
    const btnNuevaCancha = document.getElementById("btn-nueva-cancha");
    const btnModificarCancha = document.getElementById("btn-modificar-cancha");
    
    const modalCancha = document.getElementById("modal-cancha");
    const cerrarModalCancha = document.getElementById("cerrar-modal-cancha");
    const formCancha = document.getElementById("form-nueva-cancha");
    const numeroCanchaInput = document.getElementById("numero-cancha");
    const modalidadCanchaInput = document.getElementById("modalidad-cancha");
    const descripcionCanchaInput = document.getElementById("descripcion-cancha");
    const valorCanchaInput = document.getElementById("valor-cancha");
    const valorFinalCanchaInput = document.getElementById("valor-final-cancha");
    const errorFormularioCancha = document.getElementById("error-formulario-cancha");

    // Modal Gestionar Canchas
    const modalGesCanchas = document.getElementById("modal-gestionar-canchas");
    const cerrarModalGes = document.getElementById("cerrar-modal-ges");
    const listaCanchasContainer = document.getElementById("lista-canchas-container");

    const formulario = document.getElementById("form-nueva-reserva");
    const dniInput = document.getElementById("dni-cliente");
    const nombreInput = document.getElementById("nombre-cliente");
    const canchaInput = document.getElementById("cancha-reserva");
    const fechaInput = document.getElementById("fecha-reserva-admin");
    const horarioInput = document.getElementById("horario-reserva");
    const estadoInput = document.getElementById("estado-reserva");
    const errorFormulario = document.getElementById("error-formulario");

    let reservas = [];

    const HORARIOS_ESTANDAR = [
        "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
    ];

    function fechaLocalHoy() {
        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, "0");
        const dia = String(hoy.getDate()).padStart(2, "0");
        return `${anio}-${mes}-${dia}`;
    }

    function mostrarFecha(fecha) {
        if (!fecha) return "";
        const partes = fecha.split("-");
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    async function cargarReservasBackend() {
        try {
            const respuesta = await fetch("http://localhost:8080/reservas/todas");
            if (respuesta.ok) {
                const datosServidor = await respuesta.json();
                
                reservas = datosServidor.map(r => {
                    let nombreCliente = "Cliente General";
                    if (r.usuario && r.usuario.nombre) {
                        nombreCliente = r.usuario.nombre;
                    }

                    let nombreCancha = "Cancha 1";
                    if (r.cancha) {
                        nombreCancha = typeof r.cancha === 'object' ? (r.cancha.nombre || ("Cancha " + r.cancha.numero)) : ("Cancha " + r.cancha);
                    }

                    let estadoVista = "Pendiente";
                    const est = (r.estado || "").toUpperCase();
                    if (est.includes("CONFIRMADO") || est.includes("RESERVADO") || est.includes("CONFIRMADA")) {
                        estadoVista = "Confirmado";
                    } else if (est.includes("CANCELADO") || est.includes("CANCELADA")) {
                        estadoVista = "Cancelado";
                    }

                    return {
                        id: r.idReserva || r.id,
                        idUsuario: r.usuario ? (r.usuario.idUsuario || r.usuario.id) : null,
                        nombre: nombreCliente,
                        cancha: nombreCancha,
                        fecha: r.fecha,
                        horario: r.hora ? r.hora.substring(0, 5) : "",
                        estado: estadoVista
                    };
                });

                mostrarReservas();
            }
        } catch (error) {
            console.error("Error al cargar las reservas desde el servidor:", error);
        }
    }

    async function actualizarEstadisticas() {
        try {
            const respuesta = await fetch("http://localhost:8080/reservas/estadisticas");
            if (respuesta.ok) {
                const stats = await respuesta.json();
                totalReservas.textContent = stats.total || 0;
                pagosPendientes.textContent = stats.pendientes || 0;
                reservasConfirmadas.textContent = stats.confirmadas || 0;
            }
        } catch (error) {
            console.error("Error al conectar con el servidor para las estadísticas:", error);
        }
    }

    // Cargar dinámicamente las canchas en el <select> de Nueva Reserva
    async function cargarCanchasEnSelectModal() {
        if (!canchaInput) return;
        
        canchaInput.innerHTML = '<option value="" disabled selected>Cargando canchas...</option>';

        try {
            const respuesta = await fetch("http://localhost:8080/canchas/todas");
            if (respuesta.ok) {
                const canchas = await respuesta.json();
                
                // Ordenar canchas por número para que aparezcan secuenciales
                canchas.sort((a, b) => a.numero - b.numero);

                canchaInput.innerHTML = '<option value="" disabled selected>Seleccionar cancha</option>';

                const canchasActivas = canchas.filter(c => c.estado !== "SUSPENDIDA");

                if (canchasActivas.length === 0) {
                    canchaInput.innerHTML = '<option value="" disabled selected>No hay canchas disponibles</option>';
                    return;
                }

                canchasActivas.forEach(c => {
                    const option = document.createElement("option");
                    option.value = c.idCancha;
                    option.textContent = `Cancha ${c.numero} (${c.modalidad || 'Fútbol 5'})${c.descripcion ? ' - ' + c.descripcion : ''}`;
                    canchaInput.appendChild(option);
                });
            } else {
                canchaInput.innerHTML = '<option value="" disabled selected>Error al cargar canchas</option>';
            }
        } catch (error) {
            console.error("Error al cargar canchas en el select:", error);
            canchaInput.innerHTML = '<option value="" disabled selected>Error de conexión</option>';
        }
    }

    async function actualizarHorariosDisponibles() {
        const idCanchaNum = parseInt(canchaInput.value, 10);
        const fechaSeleccionada = fechaInput.value;

        if (!idCanchaNum || !fechaSeleccionada) {
            horarioInput.innerHTML = '<option value="" disabled selected>Seleccioná una fecha y cancha primero</option>';
            return;
        }

        horarioInput.innerHTML = '<option value="" disabled selected>Cargando horarios...</option>';

        try {
            const respuesta = await fetch(`http://localhost:8080/reservas/ocupadas?idCancha=${idCanchaNum}&fecha=${fechaSeleccionada}`);
            
            let horasOcupadas = [];
            if (respuesta.ok) {
                const ocupadas = await respuesta.json();
                horasOcupadas = ocupadas.map(r => r.hora ? r.hora.substring(0, 5) : "");
            }

            horarioInput.innerHTML = '<option value="" disabled selected>Seleccioná un horario</option>';
            let libresCount = 0;

            HORARIOS_ESTANDAR.forEach(hora => {
                const estaOcupado = horasOcupadas.includes(hora);
                const option = document.createElement("option");
                option.value = hora;

                if (estaOcupado) {
                    option.textContent = `${hora} hs - (Ocupado)`;
                    option.disabled = true;
                } else {
                    option.textContent = `${hora} hs - (Disponible)`;
                    libresCount++;
                }

                horarioInput.appendChild(option);
            });

            if (libresCount === 0) {
                horarioInput.innerHTML = '<option value="" disabled selected>Sin turnos disponibles para este día</option>';
            }

        } catch (error) {
            console.error("Error al cargar horarios:", error);
            horarioInput.innerHTML = '<option value="" disabled selected>Error al consultar disponibilidades</option>';
        }
    }

    // AUTOCOMPLETAR NOMBRE Y APELLIDO AL SALIR DEL CAMPO DNI
    dniInput.addEventListener("blur", async function () {
        const dniBuscado = dniInput.value.trim();
        if (!dniBuscado) return;

        try {
            const respuesta = await fetch(`http://localhost:8080/usuarios/dni/${dniBuscado}`);
            if (respuesta.ok) {
                const usuarioEncontrado = await respuesta.json();
                if (usuarioEncontrado && usuarioEncontrado.nombre) {
                    nombreInput.value = usuarioEncontrado.nombre;
                }
            }
        } catch (error) {
            console.error("Error al buscar cliente por DNI:", error);
        }
    });

    function crearCelda(texto) {
        const celda = document.createElement("td");
        celda.textContent = texto;
        return celda;
    }

    function mostrarReservas() {
        tabla.innerHTML = "";

        const busqueda = buscarReserva.value.trim().toLowerCase();
        const filtro = filtroEstado.value;

        const filtradas = reservas.filter(function (reserva) {
            const coincideNombre = reserva.nombre.toLowerCase().includes(busqueda);
            const coincideEstado = filtro === "Todas" || reserva.estado === filtro;
            return coincideNombre && coincideEstado;
        });

        filtradas.sort(function (a, b) {
            return a.fecha.localeCompare(b.fecha) || a.horario.localeCompare(b.horario);
        });

        sinResultados.hidden = filtradas.length > 0;

        filtradas.forEach(function (reserva) {
            const fila = document.createElement("tr");

            fila.appendChild(crearCelda(reserva.nombre));
            fila.appendChild(crearCelda(reserva.cancha));
            fila.appendChild(crearCelda(mostrarFecha(reserva.fecha)));
            fila.appendChild(crearCelda(reserva.horario));

            const celdaEstado = document.createElement("td");
            const etiqueta = document.createElement("span");

            etiqueta.textContent = reserva.estado;
            etiqueta.classList.add("estado");

            if (reserva.estado === "Pendiente") etiqueta.classList.add("estado-pendiente");
            if (reserva.estado === "Confirmado") etiqueta.classList.add("estado-confirmado");
            if (reserva.estado === "Cancelado") etiqueta.classList.add("estado-cancelado");

            celdaEstado.appendChild(etiqueta);
            fila.appendChild(celdaEstado);

            const celdaAcciones = document.createElement("td");
            const acciones = document.createElement("div");
            acciones.classList.add("acciones");

            if (reserva.estado === "Pendiente") {
                const botonConfirmar = document.createElement("button");
                botonConfirmar.type = "button";
                botonConfirmar.textContent = "Confirmar pago";
                botonConfirmar.classList.add("btn-confirmar");
                botonConfirmar.addEventListener("click", () => confirmarPago(reserva.id));
                acciones.appendChild(botonConfirmar);
            }

            if (reserva.estado !== "Cancelado") {
                const botonCancelar = document.createElement("button");
                botonCancelar.type = "button";
                botonCancelar.textContent = "Cancelar";
                botonCancelar.classList.add("btn-cancelar");
                botonCancelar.addEventListener("click", () => cancelarReserva(reserva.id));
                acciones.appendChild(botonCancelar);

                const botonCancelarMulta = document.createElement("button");
                botonCancelarMulta.type = "button";
                botonCancelarMulta.textContent = "Cancelar c/ Multa";
                botonCancelarMulta.classList.add("btn-cancelar");
                botonCancelarMulta.style.background = "#991b1b";
                botonCancelarMulta.title = "Cancela la reserva y aplica multa al usuario";
                botonCancelarMulta.addEventListener("click", () => cancelarConMultaAdmin(reserva.id, reserva.idUsuario));
                acciones.appendChild(botonCancelarMulta);

                const botonAusente = document.createElement("button");
                botonAusente.type = "button";
                botonAusente.textContent = "Faltó al Turno";
                botonAusente.classList.add("btn-cancelar");
                botonAusente.style.background = "#b45309";
                botonAusente.title = "Registra que el usuario no se presentó y suma multa";
                botonAusente.addEventListener("click", () => marcarAusenteAdmin(reserva.id, reserva.idUsuario));
                acciones.appendChild(botonAusente);
            }

            if (reserva.estado === "Cancelado" && acciones.children.length === 0) {
                acciones.textContent = "—";
            }

            celdaAcciones.appendChild(acciones);
            fila.appendChild(celdaAcciones);
            tabla.appendChild(fila);
        });
    }

    async function confirmarPago(id) {
        if (!window.confirm("¿Confirmás que querés aprobar esta reserva?")) return;

        try {
            const respuesta = await fetch(`http://localhost:8080/reservas/confirmar/${id}`, { method: "PUT" });
            if (respuesta.ok) {
                cargarReservasBackend();
                actualizarEstadisticas();
            } else {
                alert("No se pudo confirmar la reserva.");
            }
        } catch (error) {
            console.error("Error al confirmar la reserva:", error);
        }
    }

    async function cancelarReserva(id) {
        if (!window.confirm("¿Querés cancelar esta reserva?")) return;

        try {
            const respuesta = await fetch(`http://localhost:8080/reservas/cancelar/${id}`, { method: "PUT" });
            if (respuesta.ok) {
                cargarReservasBackend();
                actualizarEstadisticas();
            } else {
                alert("No se pudo cancelar la reserva.");
            }
        } catch (error) {
            console.error("Error al cancelar la reserva:", error);
        }
    }

    async function cancelarConMultaAdmin(idReserva, idUsuario) {
        if (!window.confirm("¿Estás seguro de cancelar esta reserva fuera de término? Esto le aplicará una penalización/multa al usuario.")) {
            return;
        }

        try {
            const respuesta = await fetch(`http://localhost:8080/reservas/cancelar-usuario/${idReserva}?idUsuario=${idUsuario}`, {
                method: "PUT"
            });

            if (respuesta.ok) {
                alert("Reserva cancelada y multa aplicada correctamente al usuario.");
                cargarReservasBackend();
                actualizarEstadisticas();
            } else {
                const errorTxt = await respuesta.text();
                alert("Error al procesar la cancelación: " + errorTxt);
            }
        } catch (error) {
            console.error("Error de red:", error);
            alert("No se pudo conectar con el servidor.");
        }
    }

    async function marcarAusenteAdmin(idReserva, idUsuario) {
        if (!window.confirm("¿Confirmar que el usuario no se presentó al turno? Se le sumará una multa y se cancelará la reserva.")) {
            return;
        }

        try {
            const respuesta = await fetch(`http://localhost:8080/reservas/ausente/${idReserva}?idUsuario=${idUsuario}`, {
                method: "PUT"
            });

            if (respuesta.ok) {
                alert("Ausencia registrada. Se aplicó la penalización correspondiente al usuario.");
                cargarReservasBackend();
                actualizarEstadisticas();
            } else {
                const errorTxt = await respuesta.text();
                alert("Error al registrar la ausencia: " + errorTxt);
            }
        } catch (error) {
            console.error("Error de red:", error);
            alert("No se pudo conectar con el servidor.");
        }
    }

    // Modal de Reserva
    function abrirModalReserva() {
        formulario.reset();
        errorFormulario.hidden = true;
        errorFormulario.textContent = "";
        fechaInput.min = fechaLocalHoy();
        horarioInput.innerHTML = '<option value="" disabled selected>Seleccioná una fecha y cancha primero</option>';
        
        cargarCanchasEnSelectModal();

        modalReserva.classList.add("activo");
        modalReserva.setAttribute("aria-hidden", "false");
        dniInput.focus();
    }

    function cerrarVentanaReserva() {
        modalReserva.classList.remove("activo");
        modalReserva.setAttribute("aria-hidden", "true");
        btnNuevaReserva.focus();
    }

    // Modal de Cancha (Rellena automáticamente el primer número libre/faltante)
    async function abrirModalCancha() {
        formCancha.reset();
        errorFormularioCancha.hidden = true;
        errorFormularioCancha.textContent = "";

        try {
            const respuesta = await fetch("http://localhost:8080/canchas/todas");
            if (respuesta.ok) {
                const canchas = await respuesta.json();
                
                // Mapear y ordenar los números existentes de menor a mayor
                const numeros = canchas.map(c => Number(c.numero)).sort((a, b) => a - b);
                
                // Encontrar el primer hueco numérico libre (ej: si borraste la 2, asignará la 2)
                let siguienteNumero = 1;
                for (let num of numeros) {
                    if (num === siguienteNumero) {
                        siguienteNumero++;
                    } else if (num > siguienteNumero) {
                        break;
                    }
                }
                numeroCanchaInput.value = siguienteNumero;
            } else {
                numeroCanchaInput.value = 1;
            }
        } catch (error) {
            console.error("Error al calcular el número de cancha:", error);
            numeroCanchaInput.value = 1;
        }

        modalCancha.classList.add("activo");
        modalCancha.setAttribute("aria-hidden", "false");
        modalidadCanchaInput.focus();
    }

    function cerrarVentanaCancha() {
        modalCancha.classList.remove("activo");
        modalCancha.setAttribute("aria-hidden", "true");
        btnNuevaCancha.focus();
    }

    // Modal Gestionar Canchas (Ordena estrictamente por número)
    async function abrirModalGestionarCanchas() {
        listaCanchasContainer.innerHTML = "<p>Cargando canchas...</p>";
        modalGesCanchas.classList.add("activo");
        modalGesCanchas.setAttribute("aria-hidden", "false");

        try {
            const respuesta = await fetch("http://localhost:8080/canchas/todas");
            if (respuesta.ok) {
                const canchas = await respuesta.json();
                
                // ORDENAR LAS CANCHAS POR NÚMERO DE MENOR A MAYOR
                canchas.sort((a, b) => a.numero - b.numero);

                listaCanchasContainer.innerHTML = "";

                if (canchas.length === 0) {
                    listaCanchasContainer.innerHTML = "<p>No hay canchas registradas.</p>";
                    return;
                }

                canchas.forEach(c => {
                    const div = document.createElement("div");
                    div.style.cssText = "display: flex; flex-direction: column; gap: 8px; background: #101014; padding: 12px; border-radius: 8px; border: 1px solid #333; margin-bottom: 8px;";
                    
                    const esSuspendida = c.estado === "SUSPENDIDA";

                    // Formatear precios existentes con puntos para visualización
                    const valorReservaFormateado = c.valorReserva ? Number(c.valorReserva).toLocaleString('es-AR') : '';
                    const valorFinalFormateado = c.valorFinalTurno ? Number(c.valorFinalTurno).toLocaleString('es-AR') : '';

                    div.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <strong>Cancha ${c.numero}</strong> 
                            <span style="font-size:11px; color:${esSuspendida ? '#fbbf24' : '#4ade80'}">(${c.estado || 'ACTIVA'})</span>
                        </div>

                        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                            <select id="mod-cancha-${c.idCancha}" style="flex: 1; min-width: 100px; padding: 6px; background: #1e1e26; border: 1px solid #444; color: white; border-radius: 5px; font-size: 13px;">
                                <option value="Fútbol 5" ${c.modalidad === 'Fútbol 5' ? 'selected' : ''}>Fútbol 5</option>
                                <option value="Fútbol 7" ${c.modalidad === 'Fútbol 7' ? 'selected' : ''}>Fútbol 7</option>
                                <option value="Fútbol 8" ${c.modalidad === 'Fútbol 8' ? 'selected' : ''}>Fútbol 8</option>
                                <option value="Fútbol 11" ${c.modalidad === 'Fútbol 11' ? 'selected' : ''}>Fútbol 11</option>
                            </select>
                            <input type="text" id="desc-cancha-${c.idCancha}" value="${c.descripcion || ''}" placeholder="Descripción" style="flex: 2; min-width: 120px; padding: 6px; background: #1e1e26; border: 1px solid #444; color: white; border-radius: 5px; font-size: 13px;">
                            <input type="text" id="valor-cancha-${c.idCancha}" value="${valorReservaFormateado}" placeholder="Reserva $" style="flex: 1; min-width: 70px; padding: 6px; background: #1e1e26; border: 1px solid #444; color: white; border-radius: 5px; font-size: 13px;" title="Valor de la reserva">
                            <input type="text" id="valor-final-cancha-${c.idCancha}" value="${valorFinalFormateado}" placeholder="Final $" style="flex: 1; min-width: 70px; padding: 6px; background: #1e1e26; border: 1px solid #444; color: white; border-radius: 5px; font-size: 13px;" title="Valor final del turno">
                            <button type="button" class="btn-guardar-cancha" data-id="${c.idCancha}" style="background: #2563eb; padding: 6px 12px; font-size: 12px;">💾 Guardar</button>
                        </div>

                        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px;">
                            <button type="button" class="btn-suspender" data-id="${c.idCancha}" data-estado="${c.estado}" style="background: ${esSuspendida ? '#166534' : '#b28704'}; padding: 6px 10px; font-size: 12px;">${esSuspendida ? 'Activar' : 'Suspender'}</button>
                            <button type="button" class="btn-eliminar-cancha" data-id="${c.idCancha}" style="background: #702626; padding: 6px 10px; font-size: 12px;">Eliminar</button>
                        </div>
                    `;
                    listaCanchasContainer.appendChild(div);
                });

                // Evento Guardar cambios en Modalidad, Descripción, Valor de Reserva y Valor Final (con limpieza de puntos)
                document.querySelectorAll(".btn-guardar-cancha").forEach(btn => {
                    btn.addEventListener("click", async function() {
                        const idCancha = this.getAttribute("data-id");
                        const nuevaModalidad = document.getElementById(`mod-cancha-${idCancha}`).value;
                        const nuevaDesc = document.getElementById(`desc-cancha-${idCancha}`).value.trim();
                        const valorReservaStr = document.getElementById(`valor-cancha-${idCancha}`).value.trim();
                        const valorFinalStr = document.getElementById(`valor-final-cancha-${idCancha}`).value.trim();

                        if (!nuevaDesc || !valorReservaStr || !valorFinalStr) {
                            alert("Por favor completa todos los campos.");
                            return;
                        }

                        const nuevoValorReserva = parseFloat(valorReservaStr.replace(/\./g, '').replace(',', '.'));
                        const nuevoValorFinal = parseFloat(valorFinalStr.replace(/\./g, '').replace(',', '.'));

                        if (isNaN(nuevoValorReserva) || isNaN(nuevoValorFinal)) {
                            alert("Por favor ingresa valores numéricos válidos.");
                            return;
                        }

                        try {
                            const respuesta = await fetch(`http://localhost:8080/canchas/actualizar/${idCancha}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    modalidad: nuevaModalidad,
                                    descripcion: nuevaDesc,
                                    valorReserva: nuevoValorReserva,
                                    valorFinalTurno: nuevoValorFinal
                                })
                            });

                            if (respuesta.ok) {
                                alert("Cancha actualizada exitosamente.");
                                abrirModalGestionarCanchas();
                            } else {
                                alert("No se pudo actualizar la cancha.");
                            }
                        } catch (error) {
                            console.error("Error al actualizar la cancha:", error);
                            alert("Error de conexión con el servidor.");
                        }
                    });
                });

                // Eventos de eliminar
                document.querySelectorAll(".btn-eliminar-cancha").forEach(btn => {
                    btn.addEventListener("click", async function() {
                        const idCancha = this.getAttribute("data-id");
                        if (window.confirm("¿Estás seguro de eliminar esta cancha?")) {
                            const resDel = await fetch(`http://localhost:8080/canchas/eliminar/${idCancha}`, { method: "DELETE" });
                            if (resDel.ok) {
                                alert("Cancha eliminada correctamente.");
                                abrirModalGestionarCanchas();
                            } else {
                                alert("No se pudo eliminar la cancha.");
                            }
                        }
                    });
                });

                // Eventos de suspender / activar
                document.querySelectorAll(".btn-suspender").forEach(btn => {
                    btn.addEventListener("click", async function() {
                        const idCancha = this.getAttribute("data-id");
                        const estadoActual = this.getAttribute("data-estado");
                        const nuevoEstado = (estadoActual === "SUSPENDIDA") ? "ACTIVA" : "SUSPENDIDA";

                        const resEst = await fetch(`http://localhost:8080/canchas/estado/${idCancha}?estado=${nuevoEstado}`, { method: "PUT" });
                        if (resEst.ok) {
                            alert(`Cancha actualizada a estado: ${nuevoEstado}`);
                            abrirModalGestionarCanchas();
                        } else {
                            alert("No se pudo cambiar el estado de la cancha.");
                        }
                    });
                });

            } else {
                listaCanchasContainer.innerHTML = "<p>Error al cargar las canchas.</p>";
            }
        } catch (error) {
            console.error("Error:", error);
            listaCanchasContainer.innerHTML = "<p>Error de conexión.</p>";
        }
    }

    function cerrarVentanaGesCanchas() {
        modalGesCanchas.classList.remove("activo");
        modalGesCanchas.setAttribute("aria-hidden", "true");
        btnModificarCancha.focus();
    }

    btnNuevaReserva.addEventListener("click", abrirModalReserva);
    cerrarModalReserva.addEventListener("click", cerrarVentanaReserva);

    btnNuevaCancha.addEventListener("click", abrirModalCancha);
    cerrarModalCancha.addEventListener("click", cerrarVentanaCancha);

    btnModificarCancha.addEventListener("click", abrirModalGestionarCanchas);
    cerrarModalGes.addEventListener("click", cerrarVentanaGesCanchas);

    document.addEventListener("keydown", (e) => { 
        if (e.key === "Escape") {
            if (modalReserva.classList.contains("activo")) cerrarVentanaReserva();
            if (modalCancha.classList.contains("activo")) cerrarVentanaCancha();
            if (modalGesCanchas.classList.contains("activo")) cerrarVentanaGesCanchas();
        }
    });

    canchaInput.addEventListener("change", actualizarHorariosDisponibles);
    fechaInput.addEventListener("change", actualizarHorariosDisponibles);

    // GUARDAR NUEVA CANCHA EN BD (Con soporte para puntos de miles)
    formCancha.addEventListener("submit", async function (e) {
        e.preventDefault();

        const numero = numeroCanchaInput.value.trim();
        const modalidad = modalidadCanchaInput ? modalidadCanchaInput.value.trim() : "Fútbol 5";
        const descripcion = descripcionCanchaInput.value.trim();
        const valorReservaStr = valorCanchaInput ? valorCanchaInput.value.trim() : "";
        const valorFinalStr = valorFinalCanchaInput ? valorFinalCanchaInput.value.trim() : "";

        errorFormularioCancha.hidden = true;

        if (!numero || !modalidad || !descripcion || !valorReservaStr || !valorFinalStr) {
            errorFormularioCancha.textContent = "Completá todos los campos de la cancha.";
            errorFormularioCancha.hidden = false;
            return;
        }

        const valorReservaLimpio = valorReservaStr.replace(/\./g, '').replace(',', '.');
        const valorFinalLimpio = valorFinalStr.replace(/\./g, '').replace(',', '.');

        const canchaDTO = {
            numero: parseInt(numero, 10),
            modalidad: modalidad,
            descripcion: descripcion,
            valorReserva: parseFloat(valorReservaLimpio),
            valorFinalTurno: parseFloat(valorFinalLimpio),
            estado: "ACTIVA"
        };

        try {
            const respuesta = await fetch("http://localhost:8080/canchas/crear", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(canchaDTO)
            });

            if (respuesta.ok) {
                cerrarVentanaCancha();
                alert("¡Cancha agregada exitosamente!");
            } else {
                const mensajeError = await respuesta.text();
                errorFormularioCancha.textContent = mensajeError || "No se pudo guardar la cancha.";
                errorFormularioCancha.hidden = false;
            }
        } catch (error) {
            console.error("Error al crear cancha:", error);
            errorFormularioCancha.textContent = "Error de conexión con el servidor.";
            errorFormularioCancha.hidden = false;
        }
    });

    // CREAR NUEVA RESERVA DESDE ADMIN
    formulario.addEventListener("submit", async function (e) {
        e.preventDefault();

        const dni = dniInput.value.trim();
        const nombre = nombreInput.value.trim();
        const idCanchaNum = parseInt(canchaInput.value, 10);
        const fecha = fechaInput.value;
        const horario = horarioInput.value;
        const estado = estadoInput.value === "Confirmado" ? "CONFIRMADO" : "PENDIENTE_PAGO";

        errorFormulario.hidden = true;

        if (!dni || !nombre || !idCanchaNum || !fecha || !horario) {
            mostrarError("Completá todos los campos.");
            return;
        }

        if (fecha < fechaLocalHoy()) {
            mostrarError("No podés reservar una fecha pasada.");
            return;
        }

        const nuevaReservaDTO = {
            cancha: { idCancha: idCanchaNum },
            fecha: fecha,
            hora: horario.length === 5 ? horario + ":00" : horario,
            estado: estado,
            usuario: { 
                idUsuario: 99, 
                dni: dni,
                nombre: nombre
            }
        };

        try {
            const respuesta = await fetch("http://localhost:8080/reservas/crear", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(nuevaReservaDTO)
            });

            if (respuesta.ok) {
                cargarReservasBackend();
                actualizarEstadisticas();
                cerrarVentanaReserva();
                alert("¡Reserva presencial creada correctamente!");
            } else {
                const mensajeError = await respuesta.text();
                mostrarError(mensajeError || "El horario ya se encuentra ocupado.");
            }
        } catch (error) {
            console.error("Error al crear reserva:", error);
            mostrarError("Error de conexión con el servidor.");
        }
    });

    function mostrarError(mensaje) {
        errorFormulario.textContent = mensaje;
        errorFormulario.hidden = false;
    }

    buscarReserva.addEventListener("input", mostrarReservas);
    filtroEstado.addEventListener("change", mostrarReservas);

    cargarReservasBackend();
    actualizarEstadisticas();
});