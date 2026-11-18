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

        let loginExitoso = false; // Bandera para controlar el finally

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
                return; // Acá sale, y el finally reactivará el botón porque falló
            }

            const data = await respuesta.json();
            console.log("Respuesta del login:", data);

            // Extraemos el rol de forma segura
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
                .replace(/^ROLE_/, "")
                .trim();

            console.log("Rol detectado:", rol);

            const esAdmin = rol === "ADMIN";
            
            // Si el rol viene vacío o es cualquier variante de usuario común, lo dejamos pasar
            const esUsuario = rol === "USUARIO" || rol === "USER" || rol === "CLIENTE" || rol === "";

            if (!esAdmin && !esUsuario) {
                mostrarMensaje(
                    "El servidor inició sesión, pero devolvió un rol no reconocido (" + rolOriginal + ").",
                    "error"
                );
                console.warn("Formato de rol no reconocido:", data.rol);
                return; // Si el rol no es válido, sale y reactiva el botón
            }

            // Guardamos los datos en sessionStorage
            sessionStorage.setItem("usuario", JSON.stringify(data));

            mostrarMensaje(
                "¡Inicio de sesión exitoso!",
                "exito"
            );

            // Marcamos que fue exitoso para que el finally NO prenda el botón de nuevo
            loginExitoso = true;

            // Redirección inmediata
            setTimeout(() => {
                if (esAdmin) {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "canchas.html";
                }
            }, 500);

        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            mostrarMensaje(
                "No se pudo conectar con el servidor. Comprobá que Spring Boot esté funcionando.",
                "error"
            );
        } finally {
            // Solo reactivamos el botón si el login falló o dio error. 
            // Si fue exitoso, dejamos el botón deshabilitado mientras redirige.
            if (!loginExitoso) {
                botonLogin.disabled = false;
                botonLogin.textContent = "INICIAR SESIÓN";
            }
        }
    });

    function mostrarMensaje(texto, tipo) {
        mensajeError.textContent = texto;
        mensajeError.className = tipo;
    }

});