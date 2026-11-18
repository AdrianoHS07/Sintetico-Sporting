document.addEventListener("DOMContentLoaded", function () {

    const checkbox = document.getElementById("menu-toggle");
    const menu = document.querySelector(".menu-lateral");
    const botonMenu = document.querySelector(".hamburguesa");

    const datosGuardados = sessionStorage.getItem("reservaSeleccionada");

    if (datosGuardados) {
        const reserva = JSON.parse(datosGuardados);

        const elCancha = document.getElementById("reserva-cancha");
        const elHorario = document.getElementById("reserva-horario");
        const elFecha = document.getElementById("reserva-fecha");

        if (elCancha) elCancha.textContent = reserva.cancha || "-";
        if (elHorario) elHorario.textContent = reserva.horario || reserva.hora || "-";
        if (reserva.fecha && elFecha) {
            elFecha.textContent = formatearFecha(reserva.fecha);
        }

        // Una vez mostrados los datos con éxito, limpiamos la selección temporal 
        // para que no se reenvíe si vuelve atrás en el navegador
        sessionStorage.removeItem("reservaSeleccionada");
    } else {
        // Si entra directamente a esta URL sin pasar por el flujo de pago, lo mandamos al inicio
        // (Opcional, podés comentarlo si querés que se pueda ver libremente)
        // window.location.href = "canchas.html";
    }

    // Lógica para cerrar el menú lateral al hacer clic afuera
    document.addEventListener("click", function (evento) {
        if (!checkbox || !checkbox.checked) {
            return;
        }

        const clickDentroDelMenu = menu ? menu.contains(evento.target) : false;
        const clickEnElBoton = botonMenu ? botonMenu.contains(evento.target) : false;

        if (!clickDentroDelMenu && !clickEnElBoton) {
            checkbox.checked = false;
        }
    });

});

function formatearFecha(fechaISO) {
    if (!fechaISO) return "-";
    const partes = fechaISO.split("-");
    if (partes.length !== 3) return fechaISO;

    const anio = partes[0];
    const mes = partes[1];
    const dia = partes[2];

    return `${dia}/${mes}/${anio}`;
}