document.addEventListener("DOMContentLoaded", async function () {

    const urlParams = new URLSearchParams(window.location.search);
    const idCancha = urlParams.get("id");

    if (!idCancha) {
        alert("No se especificó la cancha.");
        window.location.href = "canchas.html";
        return;
    }

    const menu = document.querySelector(".menu-lateral");
    const botonMenu = document.querySelector(".hamburguesa");

    const tituloCancha = document.getElementById("titulo-cancha");
    const descripcionCancha = document.getElementById("descripcion-cancha");
    const precioCancha = document.getElementById("precio-cancha");
    const inputFecha = document.getElementById("fecha-reserva");
    const errorFecha = document.getElementById("error-fecha");
    const contenedorHorarios = document.getElementById("contenedor-horarios");

    const HORARIOS_ESTANDAR = ["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];

    let datosCancha = null;
    let nombreCanchaStr = "CANCHA";
    let modalidadCanchaStr = "Fútbol 5";

    // 1. Control del Menú Hamburguesa por JavaScript
    if (botonMenu && menu) {
        botonMenu.addEventListener("click", function (evento) {
            evento.stopPropagation();
            menu.classList.toggle("abierto");
        });

        // Cerrar menú al hacer clic fuera de él
        document.addEventListener("click", function (evento) {
            if (menu.classList.contains("abierto")) {
                const dentroDelMenu = menu.contains(evento.target);
                const enBoton = botonMenu.contains(evento.target);

                if (!dentroDelMenu && !enBoton) {
                    menu.classList.remove("abierto");
                }
            }
        });
    }

    // Marcar enlace activo en el menú lateral
    const paginaActual = window.location.pathname.split("/").pop();
    document.querySelectorAll(".menu-lateral a").forEach(function (link) {
        if (link.getAttribute("href") === paginaActual) {
            link.classList.add("activo");
        }
    });

    // 2. Obtener datos de la cancha desde el servidor
    try {
        const respuestaCanchas = await fetch("http://localhost:8080/canchas/todas");
        if (respuestaCanchas.ok) {
            const canchas = await respuestaCanchas.json();
            datosCancha = canchas.find(c => c.idCancha == idCancha);

            if (datosCancha) {
                nombreCanchaStr = `CANCHA ${datosCancha.numero}`;
                modalidadCanchaStr = datosCancha.modalidad || "Fútbol 5";

                if (tituloCancha) tituloCancha.textContent = nombreCanchaStr;
                
                // Mostrar la modalidad arriba de la descripción
                if (descripcionCancha) {
                    descripcionCancha.innerHTML = `<strong style="color: #4ade80; display: block; margin-bottom: 4px;">${modalidadCanchaStr}</strong>${datosCancha.descripcion || "Seleccioná la fecha y el horario para tu partido"}`;
                }

                if (precioCancha) {
                    const precioValor = datosCancha.valorReserva !== undefined ? datosCancha.valorReserva : (datosCancha.valorPorHora !== undefined ? datosCancha.valorPorHora : 0);
                    const precioFormateado = Number(precioValor).toLocaleString('es-AR');
                    precioCancha.textContent = `$${precioFormateado}`;
                }
            } else {
                alert("La cancha seleccionada no existe.");
                window.location.href = "canchas.html";
                return;
            }
        }
    } catch (error) {
        console.error("Error al obtener la información de la cancha:", error);
    }

    // 3. Establecer fecha mínima (Hoy)
    const hoyObj = new Date();
    const anio = hoyObj.getFullYear();
    const mes = String(hoyObj.getMonth() + 1).padStart(2, "0");
    const dia = String(hoyObj.getDate()).padStart(2, "0");
    const fechaHoyStr = `${anio}-${mes}-${dia}`;

    if (inputFecha) {
        inputFecha.min = fechaHoyStr;
        if (!inputFecha.value) {
            inputFecha.value = fechaHoyStr;
        }
    }

    function esHorarioPasado(fechaSeleccionada, horaSlotStr) {
        if (fechaSeleccionada !== fechaHoyStr) {
            return false;
        }
        const horaActual = hoyObj.getHours();
        const minutoActual = hoyObj.getMinutes();

        const partesHora = horaSlotStr.split(":");
        const horaSlotNum = parseInt(partesHora[0], 10);
        const minutoSlotNum = parseInt(partesHora[1] || "0", 10);

        if (horaSlotNum < horaActual) return true;
        if (horaSlotNum === horaActual && minutoSlotNum <= minutoActual) return true;

        return false;
    }

    // 4. Renderizar y actualizar los turnos disponibles consultando el Backend
    async function actualizarTurnosDisponibles() {
        const fecha = inputFecha.value;
        if (!fecha) return;

        try {
            const respuesta = await fetch(`http://localhost:8080/reservas/ocupadas?idCancha=${idCancha}&fecha=${fecha}`);
            let horasOcupadas = [];

            if (respuesta.ok) {
                const reservasOcupadas = await respuesta.json();
                horasOcupadas = reservasOcupadas.map(r => {
                    if (typeof r.hora === 'string') {
                        return r.hora.substring(0, 5);
                    }
                    return r.hora;
                });
            }

            if (contenedorHorarios) {
                contenedorHorarios.innerHTML = "";

                HORARIOS_ESTANDAR.forEach(horaStr => {
                    const horaFinNum = parseInt(horaStr.split(":")[0], 10) + 1;
                    const horaFinStr = (horaFinNum < 10 ? "0" : "") + horaFinNum + ":00";
                    const rangoTexto = `${horaStr} - ${horaFinStr}`;

                    const yaPaso = esHorarioPasado(fecha, horaStr);
                    const estaOcupado = horasOcupadas.includes(horaStr);

                    const divHorario = document.createElement("div");
                    divHorario.className = "horario";

                    let estadoClase = "disponible";
                    let estadoTexto = "🟢 Disponible";
                    let botonDeshabilitado = false;
                    let botonTexto = "RESERVAR";

                    if (yaPaso) {
                        estadoClase = "ocupado";
                        estadoTexto = "⌛ Expirado";
                        botonDeshabilitado = true;
                        botonTexto = "EXPIRADO";
                    } else if (estaOcupado) {
                        estadoClase = "ocupado";
                        estadoTexto = "🔴 Reservado";
                        botonDeshabilitado = true;
                        botonTexto = "OCUPADO";
                    }

                    divHorario.innerHTML = `
                        <div class="info">
                            <h3>${rangoTexto}</h3>
                            <p class="${estadoClase}">${estadoTexto}</p>
                        </div>
                        <button type="button" class="btn-reservar" ${botonDeshabilitado ? 'disabled' : ''}>${botonTexto}</button>
                    `;

                    contenedorHorarios.appendChild(divHorario);
                });
            }

        } catch (error) {
            console.error("Error al consultar disponibilidad en MySQL:", error);
        }
    }

    if (inputFecha) {
        inputFecha.addEventListener("change", actualizarTurnosDisponibles);
        actualizarTurnosDisponibles();
    }

    // 5. Evento al hacer clic en RESERVAR
    document.addEventListener("click", function (evento) {
        if (evento.target && evento.target.classList.contains("btn-reservar")) {

            if (!inputFecha.value) {
                if (errorFecha) errorFecha.textContent = "Seleccioná una fecha antes de reservar.";
                return;
            }
            if (errorFecha) errorFecha.textContent = "";

            const filaHorario = evento.target.closest(".horario");
            const horarioTexto = filaHorario.querySelector(".info h3").textContent.trim();
            const horaLimpia = horarioTexto.split("-")[0].trim();

            if (esHorarioPasado(inputFecha.value, horaLimpia)) {
                alert("No podés reservar un horario que ya pasó.");
                actualizarTurnosDisponibles();
                return;
            }

            const precioFinal = datosCancha ? (datosCancha.valorReserva !== undefined ? datosCancha.valorReserva : datosCancha.valorPorHora) : 20000.0;

            const reserva = {
                idCancha: parseInt(idCancha, 10),
                cancha: nombreCanchaStr,
                modalidad: modalidadCanchaStr,
                fecha: inputFecha.value,
                horario: horarioTexto,
                hora: horaLimpia + ":00",
                precio: precioFinal
            };

            sessionStorage.setItem("reservaSeleccionada", JSON.stringify(reserva));
            window.location.href = "confirmar.html";
        }
    });

});