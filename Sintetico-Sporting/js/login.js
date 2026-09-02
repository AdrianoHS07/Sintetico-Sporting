const formulario = document.getElementById("formLogin");
const email = document.getElementById("email");
const password = document.getElementById("password");
const mensajeError = document.getElementById("mensajeError");

formulario.addEventListener("submit", function (event) {

    event.preventDefault();

    if (email.value === "" || password.value === "") {

        mensajeError.textContent = "Completá todos los campos";

    } else if (!email.value.includes("@")) {

        mensajeError.textContent = "Ingresá un email válido";

    } else {

        mensajeError.textContent = "Datos completos";

    }

});