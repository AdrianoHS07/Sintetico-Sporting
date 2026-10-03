const formulario = document.getElementById("formLogin");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const mensajeError = document.getElementById("mensajeError");

formulario.addEventListener("submit", async function (event) {
    event.preventDefault();

    mensajeError.textContent = "";
    mensajeError.style.color = "red";

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (email === "" || password === "") {
        mensajeError.textContent = "Completá todos los campos";
        return;
    }

    if (!email.includes("@")) {
        mensajeError.textContent = "Ingresá un email válido";
        return;
    }

    // Coincide con LoginRequest.java (email y contraseña)
    const datosLogin = {
        email: email,
        contraseña: password
    };

    try {
        const respuesta = await fetch("http://localhost:8080/usuarios/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datosLogin)
        });

        if (respuesta.ok) {
            // Convierte el JSON devuelto por LoginResponse.java a objeto JS
            const data = await respuesta.json();

            // Guardamos idUsuario, nombre, rol, etc., para usarlos en canchas.html
            localStorage.setItem("usuario", JSON.stringify(data));

            mensajeError.style.color = "green";
            mensajeError.textContent = "¡Inicio de sesión exitoso!";

            setTimeout(() => {
                window.location.href = "canchas.html";
            }, 1000);

        } else {
            mensajeError.textContent = "Email o contraseña incorrectos.";
        }
    } catch (error) {
        console.error("Error de red o servidor:", error);
        mensajeError.textContent = "No se pudo conectar con el servidor.";
    }
});