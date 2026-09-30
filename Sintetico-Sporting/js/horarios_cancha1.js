document.addEventListener("DOMContentLoaded", function () {

    const checkbox = document.getElementById("menu-toggle");
    const menu = document.querySelector(".menu-lateral");
    const botonMenu = document.querySelector(".hamburguesa");

    const inputFecha = document.getElementById("fecha-reserva");
    const botonesReservar = document.querySelectorAll(".btn-reservar");
    const errorFecha = document.getElementById("error-fecha");

    const hoy = new Date();
    const fechaMinima = hoy.toISOString().split("T")[0];

    inputFecha.min = fechaMinima;

    document.addEventListener("click", function (evento) {

        if (!checkbox.checked) {
            return;
        }

        const clickDentroDelMenu = menu.contains(evento.target);
        const clickEnElBoton = botonMenu.contains(evento.target);

        if (!clickDentroDelMenu && !clickEnElBoton) {
            checkbox.checked = false;
        }

    });

    const paginaActual = window.location.pathname.split("/").pop();
    const links = document.querySelectorAll(".menu-lateral a");

    links.forEach(function (link) {

        const destino = link.getAttribute("href");

        if (destino === paginaActual) {
            link.classList.add("activo");
        }

    });

    botonesReservar.forEach(function (boton) {

        boton.addEventListener("click", function () {

            if (inputFecha.value === "") {
                errorFecha.textContent = "Seleccioná una fecha antes de reservar.";
                return;
            }

            errorFecha.textContent = "";

            const filaHorario = boton.closest(".horario");

            const horarioTexto = filaHorario
                .querySelector(".info h3")
                .textContent
                .trim();

            const reserva = {
                cancha: "CANCHA 1",
                fecha: inputFecha.value,
                horario: horarioTexto
            };

            sessionStorage.setItem(
                "reservaSeleccionada",
                JSON.stringify(reserva)
            );

            window.location.href = "confirmar.html";

        });

    });

});