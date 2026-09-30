document.addEventListener("DOMContentLoaded", function () {

    const formulario = document.getElementById("form-registro");

    const campos = {
        nombre: document.getElementById("nombre"),
        apellido: document.getElementById("apellido"),
        dni: document.getElementById("dni"),
        fechaNacimiento: document.getElementById("fecha-nacimiento"),
        email: document.getElementById("email"),
        telefono: document.getElementById("telefono"),
        contrasena: document.getElementById("contrasena"),
        confirmarContrasena: document.getElementById("confirmar-contrasena")
    };

    const errorRegistro = document.getElementById("error-registro");

    formulario.addEventListener("submit", function (evento) {

        evento.preventDefault();

        for (const clave in campos) {

            if (campos[clave].value.trim() === "") {
                mostrarError("Completá todos los campos para crear la cuenta.");
                return;
            }
        }

        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailValido.test(campos.email.value.trim())) {
            mostrarError("Ingresá un email válido.");
            return;
        }

        if (campos.contrasena.value !== campos.confirmarContrasena.value) {
            mostrarError("Las contraseñas no coinciden.");
            return;
        }

        if (campos.contrasena.value.length < 6) {
            mostrarError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        ocultarError();

        // Temporal hasta conectar el registro con el backend y la base de datos.
        window.location.href = "canchas.html";
    });

    function mostrarError(mensaje) {
        errorRegistro.textContent = mensaje;
        errorRegistro.classList.remove("oculto");
    }

    function ocultarError() {
        errorRegistro.textContent = "";
        errorRegistro.classList.add("oculto");
    }

});