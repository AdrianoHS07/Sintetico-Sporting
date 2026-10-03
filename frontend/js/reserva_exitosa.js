document.addEventListener("DOMContentLoaded", function () {

    const checkbox = document.getElementById("menu-toggle");
    const menu = document.querySelector(".menu-lateral");
    const botonMenu = document.querySelector(".hamburguesa");

    const datosGuardados = sessionStorage.getItem("reservaSeleccionada");

    if (datosGuardados) {

        const reserva = JSON.parse(datosGuardados);

        document.getElementById("reserva-cancha").textContent =
            reserva.cancha || "-";

        document.getElementById("reserva-horario").textContent =
            reserva.horario || "-";

        if (reserva.fecha) {
            document.getElementById("reserva-fecha").textContent =
                formatearFecha(reserva.fecha);
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

});

function formatearFecha(fechaISO) {

    const partes = fechaISO.split("-");

    const anio = partes[0];
    const mes = partes[1];
    const dia = partes[2];

    return `${dia}/${mes}/${anio}`;
}