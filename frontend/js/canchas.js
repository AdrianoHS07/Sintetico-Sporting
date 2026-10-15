document.addEventListener("DOMContentLoaded", function () {

    // 1. Control de sesión del usuario
    const usuarioGuardado = localStorage.getItem("usuario");

    if (!usuarioGuardado) {
        // Si no hay sesión, manda a loguearse
        window.location.href = "login.html";
        return;
    }

    try {
        const usuario = JSON.parse(usuarioGuardado);
        const saludoElemento = document.getElementById("saludo-usuario");
        if (saludoElemento && (usuario.nombre || usuario.email)) {
            saludoElemento.textContent = `Hola, ${usuario.nombre || usuario.email}`;
        }
    } catch (e) {
        console.error("Error al leer sesión de usuario", e);
    }

    // 2. Evento para cerrar sesión correctamente
    const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", function () {
            localStorage.removeItem("usuario");
            sessionStorage.clear();
            window.location.href = "login.html";
        });
    }

    // 3. Marcar la página actual en el menú lateral
    const paginaActual = window.location.pathname.split("/").pop();
    const links = document.querySelectorAll(".menu-lateral a");

    links.forEach(function (link) {
        if (link.getAttribute("href") === paginaActual) {
            link.classList.add("activo");
        }
    });

});