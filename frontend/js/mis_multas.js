document.addEventListener("DOMContentLoaded", async function () {
    const usuarioGuardado = sessionStorage.getItem("usuario");

    if (!usuarioGuardado) {
        window.location.href = "login.html";
        return;
    }

    let usuario;
    try {
        usuario = JSON.parse(usuarioGuardado);
        const saludoElemento = document.getElementById("saludo-usuario");
        if (saludoElemento) {
            saludoElemento.textContent = `Hola, ${usuario.nombre || usuario.email}`;
        }
    } catch (e) {
        console.error("Error al leer sesión", e);
        window.location.href = "login.html";
        return;
    }

    // Botón cerrar sesión
    const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", function () {
            sessionStorage.clear();
            localStorage.removeItem("usuario");
            window.location.href = "login.html";
        });
    }

    // Control del menú hamburguesa por JS
    const btnHamburguesa = document.getElementById("btn-hamburguesa");
    const menuLateral = document.getElementById("menu-lateral");

    if (btnHamburguesa && menuLateral) {
        btnHamburguesa.addEventListener("click", function () {
            const leftActual = window.getComputedStyle(menuLateral).left;
            menuLateral.style.left = (leftActual === "0px") ? "-290px" : "0px";
        });
    }

    const panelAlerta = document.getElementById("estado-suspension");
    const iconoAlerta = panelAlerta.querySelector(".icono-alerta");
    const textoEstado = document.getElementById("texto-estado");
    const contenedorMultas = document.getElementById("contenedor-multas");

    // 1. Consultar estado actual del usuario (para verificar suspensión y multas acumuladas)
    if (usuario.dni) {
        try {
            const resUsuario = await fetch(`http://localhost:8080/usuarios/dni/${usuario.dni}`);
            if (resUsuario.ok) {
                const datosUsuario = await resUsuario.json();
                const acumuladas = datosUsuario.multasAcumuladas || 0;

                if (datosUsuario.suspendidoHasta && new Date(datosUsuario.suspendidoHasta) > new Date()) {
                    const fechaSuspension = datosUsuario.suspendidoHasta.split('T')[0];
                    panelAlerta.classList.add("suspendido");
                    iconoAlerta.textContent = "🔴";
                    textoEstado.innerHTML = `Cuenta suspendida temporalmente hasta el <strong>${fechaSuspension}</strong> por acumulación de infracciones.`;
                } else if (acumuladas > 0) {
                    textoEstado.innerHTML = `Tu cuenta está activa. Tenés <strong>${acumuladas} de 3</strong> multas acumuladas para suspensión.`;
                }
            }
        } catch (err) {
            console.warn("No se pudo verificar el estado actualizado del usuario:", err);
        }
    }

    // 2. Consultar historial de multas del usuario
    try {
        const resMultas = await fetch(`http://localhost:8080/usuarios/${usuario.idUsuario}/multas`);
        
        if (!resMultas.ok) {
            throw new Error(`HTTP ${resMultas.status}`);
        }

        const multas = await resMultas.json();
        contenedorMultas.innerHTML = "";

        if (!multas || multas.length === 0) {
            contenedorMultas.innerHTML = "<p style='color: #94a3b8; font-style: italic; text-align: center; padding: 15px;'>No tenés multas registradas. ¡Excelente comportamiento!</p>";
            return;
        }

        multas.forEach(m => {
            const item = document.createElement("div");
            item.className = "item-multa";

            const fechaFormateada = m.fechaMulta 
                ? m.fechaMulta.replace('T', ' ').substring(0, 16) 
                : 'Fecha desconocida';

            item.innerHTML = `
                <div class="fecha-multa">📅 ${fechaFormateada}</div>
                <div class="motivo-multa">${m.motivo || 'Infracción registrada'}</div>
            `;
            contenedorMultas.appendChild(item);
        });

    } catch (error) {
        console.error("Error al obtener multas:", error);
        contenedorMultas.innerHTML = `<p style='color: #ff8585; text-align: center;'>No se pudo conectar con el servidor (${error.message}).</p>`;
    }
});