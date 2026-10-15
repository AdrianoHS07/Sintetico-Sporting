document.addEventListener("DOMContentLoaded", function () {

    // 1. Detectar automáticamente si estamos en Cancha 1 o Cancha 2
    const esCancha2 = window.location.pathname.includes("cancha2");
    const idCancha = esCancha2 ? 2 : 1;
    const nombreCancha = "CANCHA " + idCancha;

    // 2. Elementos del HTML
    const checkbox = document.getElementById("menu-toggle");
    const menu = document.querySelector(".menu-lateral");
    const botonMenu = document.querySelector(".hamburguesa");
    const inputFecha = document.getElementById("fecha-reserva");
    const errorFecha = document.getElementById("error-fecha");

    // 3. Establecer fecha mínima (Hoy)
    const hoy = new Date().toISOString().split("T")[0];
    if (inputFecha) {
        inputFecha.min = hoy;
        if (!inputFecha.value) {
            inputFecha.value = hoy;
        }
    }

    // 4. Marcar opción activa en el menú lateral
    const paginaActual = window.location.pathname.split("/").pop();
    document.querySelectorAll(".menu-lateral a").forEach(link => {
        if (link.getAttribute("href") === paginaActual) {
            link.classList.add("activo");
        }
    });

    // 5. Consultar a Spring Boot qué horarios ya están ocupados
    async function actualizarTurnosDisponibles() {
        const fecha = inputFecha.value;
        if (!fecha) return;

        try {
            // RUTA CORREGIDA: Apunta a /reservas/ocupadas directamente
            const respuesta = await fetch(`http://localhost:8080/reservas/ocupadas?idCancha=${idCancha}&fecha=${fecha}`);
            
            if (respuesta.ok) {
                const reservasOcupadas = await respuesta.json();
                
                // Extraer horas ocupadas recortando formato HH:mm:ss a HH:mm (ej: "18:00")
                const horasOcupadas = reservasOcupadas.map(r => {
                    if (typeof r.hora === 'string') {
                        return r.hora.substring(0, 5);
                    }
                    return r.hora;
                });

                document.querySelectorAll(".horario").forEach(bloque => {
                    const horaTexto = bloque.querySelector(".info h3").textContent.split("-")[0].trim();
                    const estadoTexto = bloque.querySelector(".info p");
                    const boton = bloque.querySelector("button");

                    if (horasOcupadas.includes(horaTexto)) {
                        // SI ESTÁ OCUPADO:
                        if (estadoTexto) {
                            estadoTexto.className = "reservado";
                            estadoTexto.textContent = "🔴 Reservado";
                        }
                        boton.disabled = true;
                        boton.textContent = "OCUPADO";
                        boton.classList.remove("btn-reservar");
                    } else {
                        // SI ESTÁ DISPONIBLE:
                        if (estadoTexto) {
                            estadoTexto.className = "disponible";
                            estadoTexto.textContent = "🟢 Disponible";
                        }
                        boton.disabled = false;
                        boton.textContent = "RESERVAR";
                        boton.classList.add("btn-reservar");
                    }
                });
            }
        } catch (error) {
            console.error("Error consultando disponibilidad en MySQL:", error);
        }
    }

    // Escuchar cuando el usuario cambia la fecha
    if (inputFecha) {
        inputFecha.addEventListener("change", actualizarTurnosDisponibles);
        actualizarTurnosDisponibles(); // Ejecutar al cargar la página
    }

    // 6. Evento cuando el usuario hace clic en RESERVAR
    document.addEventListener("click", function (evento) {
        if (evento.target && evento.target.classList.contains("btn-reservar")) {

            if (!inputFecha.value) {
                if (errorFecha) errorFecha.textContent = "Seleccioná una fecha antes de reservar.";
                return;
            }
            if (errorFecha) errorFecha.textContent = "";

            const filaHorario = evento.target.closest(".horario");
            const horarioTexto = filaHorario.querySelector(".info h3").textContent.trim();

            const reserva = {
                idCancha: idCancha,
                cancha: nombreCancha,
                fecha: inputFecha.value,
                horario: horarioTexto,
                hora: horarioTexto.split("-")[0].trim() + ":00",
                precio: 20000.0
            };

            sessionStorage.setItem("reservaSeleccionada", JSON.stringify(reserva));
            window.location.href = "confirmar.html";
        }
    });
});