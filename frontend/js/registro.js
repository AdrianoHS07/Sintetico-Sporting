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

    formulario.addEventListener("submit", async function (evento) {

        evento.preventDefault();

        // 1. Validar que no haya campos vacíos
        for (const clave in campos) {
            if (campos[clave].value.trim() === "") {
                mostrarError("Completá todos los campos para crear la cuenta.");
                return;
            }
        }

        // 2. Validar formato de correo
        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailValido.test(campos.email.value.trim())) {
            mostrarError("Ingresá un email válido.");
            return;
        }

        // 3. Validar coincidencia y longitud de contraseña
        if (campos.contrasena.value !== campos.confirmarContrasena.value) {
            mostrarError("Las contraseñas no coinciden.");
            return;
        }

        if (campos.contrasena.value.length < 6) {
            mostrarError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        ocultarError();

        // 4. Armar el objeto JSON que se enviará a Spring Boot
        // Unificamos nombre + apellido ya que en Java la entidad tiene solo 'nombre'
        const usuarioNuevo = {
            nombre: `${campos.nombre.value.trim()} ${campos.apellido.value.trim()}`,
            dni: campos.dni.value.trim(),
            telefono: campos.telefono.value.trim(),
            email: campos.email.value.trim(),
            contraseña: campos.contrasena.value, // Hace juego con private String contraseña en Java
            rol: "USUARIO",                      // Valor por defecto para nuevos usuarios
            estado: "ACTIVO"                     // Valor por defecto
        };

        try {
            // 5. Enviar la petición al backend
            const respuesta = await fetch("http://localhost:8080/usuarios/registro", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(usuarioNuevo)
            });

            if (respuesta.ok) {
                alert("¡Cuenta creada con éxito! Redirigiendo al inicio de sesión...");
                window.location.href = "login.html";
            } else {
                const mensajeBackend = await respuesta.text();
                mostrarError("Error en el registro: " + (mensajeBackend || "No se pudo registrar."));
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            mostrarError("No se pudo conectar con el servidor backend.");
        }
    });

    function mostrarError(mensaje) {
        errorRegistro.textContent = mensaje;
        errorRegistro.style.color = "#e53935";
        errorRegistro.classList.remove("oculto");
    }

    function ocultarError() {
        errorRegistro.textContent = "";
        errorRegistro.classList.add("oculto");
    }

});