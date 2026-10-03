document.querySelectorAll(".btn-pagar").forEach(function (boton) {

    boton.addEventListener("click", function () {

        const tarjeta = boton.closest(".reserva");

        const reserva = {
            cancha: tarjeta.dataset.cancha,
            fecha: convertirAFechaISO(tarjeta.dataset.fecha),
            horario: tarjeta.dataset.horario
        };

        sessionStorage.setItem(
            "reservaSeleccionada",
            JSON.stringify(reserva)
        );

        window.location.href = "mercadopago.html";

    });

});

document.querySelectorAll(".btn-detalle").forEach(function (boton) {

    boton.addEventListener("click", function () {

        const tarjeta = boton.closest(".reserva");
        const detalle = tarjeta.querySelector(".detalle");

        const estaOculto = detalle.classList.contains("oculto");

        detalle.classList.toggle("oculto");

        boton.textContent =
            estaOculto
                ? "OCULTAR DETALLE"
                : "VER DETALLE";

    });

});

function convertirAFechaISO(fechaTexto) {

    const partes = fechaTexto.split("/");

    const dia = partes[0];
    const mes = partes[1];
    const anio = partes[2];

    return `${anio}-${mes}-${dia}`;
}