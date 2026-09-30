document.addEventListener("DOMContentLoaded", function () {

    const checkbox = document.getElementById("menu-toggle");
    const menu = document.querySelector(".menu-lateral");
    const botonMenu = document.querySelector(".hamburguesa");

    const canchaReserva = document.getElementById("cancha-reserva");
    const fechaReserva = document.getElementById("fecha-reserva");
    const horarioReserva = document.getElementById("horario-reserva");

    const reservaGuardada = sessionStorage.getItem("reservaSeleccionada");

    if (reservaGuardada) {

        const reserva = JSON.parse(reservaGuardada);

        canchaReserva.textContent = "⚽ " + reserva.cancha;
        horarioReserva.textContent = reserva.horario;

        const partesFecha = reserva.fecha.split("-");

        if (partesFecha.length === 3) {

            fechaReserva.textContent =
                partesFecha[2] + "/" +
                partesFecha[1] + "/" +
                partesFecha[0];

        } else {

            fechaReserva.textContent = reserva.fecha;

        }
    }

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

});