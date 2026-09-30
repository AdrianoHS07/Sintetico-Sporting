document.addEventListener("DOMContentLoaded", function () {

    const checkbox = document.getElementById("menu-toggle");
    const menu = document.querySelector(".menu-lateral");
    const botonMenu = document.querySelector(".hamburguesa");

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

    const datosGuardados = sessionStorage.getItem("reservaSeleccionada");

    if (!datosGuardados) {
        return;
    }

    const reserva = JSON.parse(datosGuardados);

    if (reserva.cancha) {
        document.getElementById("resumen-cancha").textContent = reserva.cancha;
    }

    if (reserva.fecha) {
        document.getElementById("resumen-fecha").textContent =
            formatearFecha(reserva.fecha);
    }

    if (reserva.horario) {
        document.getElementById("resumen-horario").textContent =
            reserva.horario;
    }

});

function formatearFecha(fechaISO) {

    const partes = fechaISO.split("-");

    const anio = partes[0];
    const mes = partes[1];
    const dia = partes[2];

    return `${dia}/${mes}/${anio}`;
}