
document.addEventListener("DOMContentLoaded", function () {

    const formulario = document.getElementById("formLogin");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const mensajeError = document.getElementById("mensajeError");
    const botonLogin = formulario.querySelector('button[type="submit"]');

    formulario.addEventListener("submit", async function (event) {
        event.preventDefault();

        mensajeError.textContent = "";
        mensajeError.className = "";

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            mostrarMensaje("Completá todos los campos.", "error");
            return;
        }

        if (!emailInput.checkValidity()) {
            mostrarMensaje("Ingresá un email válido.", "error");
            return;
        }

        const datosLogin = {
            email: email,
            contraseña: password
        };

        botonLogin.disabled = true;
        botonLogin.textContent = "INICIANDO SESIÓN...";

        try {
            const respuesta = await fetch(
                "http://localhost:8080/usuarios/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(datosLogin)
                }
            );

            if (!respuesta.ok) {
                if (respuesta.status === 401 || respuesta.status === 403) {
                    mostrarMensaje(
                        "Email o contraseña incorrectos.",
                        "error"
                    );
                } else {
                    mostrarMensaje(
                        "No se pudo iniciar sesión. Intentá nuevamente.",
                        "error"
                    );
                }
                return;
            }

            const data = await respuesta.json();

            // Debe coincidir con LoginResponse.java.
            // Aceptamos temporalmente algunas variantes de formato.
            const rolOriginal =
                typeof data.rol === "string"
                    ? data.rol
                    : data.rol?.nombre ||
                      data.rol?.nombreRol ||
                      data.rol?.rol ||
                      data.role ||
                      "";

            const rol = String(rolOriginal)
                .toUpperCase()
                .replace(/^ROLE_/, "");

            if (rol !== "ADMIN" && rol !== "CLIENTE") {
                mostrarMensaje(
                    "El servidor inició sesión, pero no devolvió " +
                    "un rol reconocido. Revisá LoginResponse.java.",
                    "error"
                );
                console.warn("Formato de rol no reconocido:", data.rol);
                return;
            }

            // Datos para personalizar la interfaz.
            // NO deben utilizarse como autorización de seguridad.
            localStorage.setItem("usuario", JSON.stringify(data));

            mostrarMensaje(
                "¡Inicio de sesión exitoso!",
                "exito"
            );

            if (rol === "ADMIN") {
                window.location.href = "admin.html";
            } else {
                window.location.href = "canchas.html";
            }

        } catch (error) {
            console.error("Error al iniciar sesión:", error);

            mostrarMensaje(
                "No se pudo conectar con el servidor. " +
                "Comprobá que Spring Boot esté funcionando.",
                "error"
            );

        } finally {
            botonLogin.disabled = false;
            botonLogin.textContent = "INICIAR SESIÓN";
        }
    });

    function mostrarMensaje(texto, tipo) {
        mensajeError.textContent = texto;
        mensajeError.className = tipo;
    }

});
