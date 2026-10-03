document.addEventListener("click", function (evento) {

    const checkbox = document.getElementById("menu-toggle");
    const menu = document.querySelector(".menu-lateral");
    const boton = document.querySelector(".hamburguesa");

    if (!checkbox.checked) {
        return;
    }

    const clickDentroDelMenu = menu.contains(evento.target);
    const clickEnElBoton = boton.contains(evento.target);

    if (!clickDentroDelMenu && !clickEnElBoton) {
        checkbox.checked = false;
    }

});

document.addEventListener("DOMContentLoaded", function () {

    const paginaActual = window.location.pathname.split("/").pop();
    const links = document.querySelectorAll(".menu-lateral a");

    links.forEach(function (link) {

        const destino = link.getAttribute("href");

        if (destino === paginaActual) {
            link.classList.add("activo");
        }

    });

});