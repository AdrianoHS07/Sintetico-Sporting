document.addEventListener("DOMContentLoaded", function () {

    const checkbox = document.getElementById("menu-toggle");
    const menu = document.querySelector(".menu-lateral");
    const botonMenu = document.querySelector(".hamburguesa");

    const inputFecha = document.getElementById("fecha-reserva");
    const botonesReservar = document.querySelectorAll(".btn-reservar");
    const errorFecha = document.getElementById("error-fecha");

    // Establecer fecha mínima (hoy)
    const hoy = new Date();
    const fechaMinima = hoy.toISOString().split("T")[0];
    if (inputFecha) {
        inputFecha.min = fechaMinima;
        if (!inputFecha.value) {
            inputFecha.value = fechaMinima;
        }
    }

    // Cerrar menú al hacer clic afuera
    document.addEventListener("click", function (evento) {
        if (!checkbox || !checkbox.checked) return;

        const dentroDelMenu = menu.contains(evento.target);
        const enBoton = botonMenu ? botonMenu.contains(evento.target) : false;

        if (!dentroDelMenu && !enBoton) {
            checkbox.checked = false;
        }
    });

    // Marcar enlace activo en el menú lateral
    const paginaActual = window.location.pathname.split("/").pop();
    document.querySelectorAll(".menu-lateral a").forEach(function (link) {
        if (link.getAttribute("href") === paginaActual) {
            link.classList.add("activo");
        }
    });

    // Evento para los botones de reservar
    document.querySelectorAll(".btn-reservar").forEach(function (boton) {
        boton.addEventListener("click", function () {

            if (!inputFecha.value) {
                if (errorFecha) errorFecha.textContent = "Seleccioná una fecha antes de reservar.";
                return;
            }

            if (errorFecha) errorFecha.textContent = "";

            const filaHorario = boton.closest(".horario");
            const horarioTexto = filaHorario
                .querySelector(".info h3")
                .textContent
                .trim();

            const reserva = {
                idCancha: 1,
                cancha: "CANCHA 1",
                fecha: inputFecha.value,
                horario: horarioTexto,
                hora: horarioTexto.split("-")[0].trim() + ":00",
                precio: 20000.0
            };

            sessionStorage.setItem(
                "reservaSeleccionada",
                JSON.stringify(reserva)
            );

            window.location.href = "confirmar.html";
        });
    });

});