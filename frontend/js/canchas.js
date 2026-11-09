document.addEventListener("DOMContentLoaded", async function () {

    // 1. Control de sesión del usuario
    const usuarioGuardado = localStorage.getItem("usuario");

    if (!usuarioGuardado) {
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

    // 4. Cargar dinámicamente las canchas desde Spring Boot (MySQL)
    const contenedorCanchas = document.getElementById("contenedor-canchas");
    if (contenedorCanchas) {
        try {
            const respuesta = await fetch("http://localhost:8080/canchas/todas");
            if (respuesta.ok) {
                const canchas = await respuesta.json();
                
                // ORDENAR LAS CANCHAS POR NÚMERO DE MENOR A MAYOR
                canchas.sort((a, b) => a.numero - b.numero);

                contenedorCanchas.innerHTML = "";

                if (canchas.length === 0) {
                    contenedorCanchas.innerHTML = "<p style='color: white;'>No hay canchas disponibles.</p>";
                    return;
                }

                canchas.forEach(c => {
                    const suspendida = c.estado === "SUSPENDIDA";

                    // Obtener valores con soporte seguro para nombres antiguos y nuevos
                    const valorReservaNum = c.valorReserva !== undefined ? c.valorReserva : (c.valorPorHora !== undefined ? c.valorPorHora : 0);
                    const valorFinalNum = c.valorFinalTurno !== undefined ? c.valorFinalTurno : 0;

                    // Formatear con puntos de miles (estilo argentino)
                    const valorReservaFormateado = Number(valorReservaNum).toLocaleString('es-AR');
                    const valorFinalFormateado = Number(valorFinalNum).toLocaleString('es-AR');

                    const tarjeta = document.createElement("div");
                    tarjeta.className = "cancha";

                    if (suspendida) {
                        tarjeta.style.opacity = "0.35";
                        tarjeta.style.pointerEvents = "none";
                    }

                    tarjeta.innerHTML = `
                        <h2>⚽ CANCHA ${c.numero}</h2>
                        <p style="color: #4ade80; font-weight: bold; margin-bottom: 6px;">${c.modalidad || 'Fútbol 5'}</p>
                        <p>${c.descripcion || "Césped sintético"}</p>
                        <p><strong>Valor de la reserva:</strong> $${valorReservaFormateado}</p>
                        <p><strong>Valor final del turno:</strong> $${valorFinalFormateado}</p>
                        ${suspendida 
                            ? '<span style="color: #ff5252; font-weight: bold; display: block; margin-top: 10px;">🔴 EN REPARACIÓN</span>' 
                            : `<a href="horarios.html?id=${c.idCancha}"><button>VER HORARIOS</button></a>`
                        }
                    `;

                    contenedorCanchas.appendChild(tarjeta);
                });
            }
        } catch (error) {
            console.error("Error al cargar las canchas del usuario:", error);
        }
    }
});