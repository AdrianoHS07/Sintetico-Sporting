package com.sinteticosporting.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void enviarCorreoConfirmacion(String destinatario, String nombreCliente, String cancha, String fecha, String hora) {
        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setTo(destinatario);
            mensaje.setSubject("¡Pago Confirmado - Sintético Sporting!");
            mensaje.setText("Hola " + (nombreCliente != null ? nombreCliente : "Cliente") + ",\n\n" +
                    "¡Buenas noticias! Tu reserva para la " + cancha + " el día " + fecha + " a las " + hora + " ha sido confirmada exitosamente.\n\n" +
                    "¡Te esperamos en la cancha!\n\nAtentamente,\nSintético Sporting.");
            mailSender.send(mensaje);
        } catch (Exception e) {
            System.err.println("ERROR AL ENVIAR CORREO DE CONFIRMACIÓN: " + e.getMessage());
        }
    }

    public void enviarCorreoReservaExpirada(String destinatario, String nombreCliente, String cancha, String fecha, String hora) {
        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setTo(destinatario);
            mensaje.setSubject("Reserva Cancelada por Falta de Confirmación - Sintético Sporting");
            mensaje.setText("Hola " + (nombreCliente != null ? nombreCliente : "Cliente") + ",\n\n" +
                    "Te informamos que el administrador no confirmó tu pago dentro de los 15 minutos reglamentarios para la reserva de la " + cancha + 
                    " el día " + fecha + " a las " + hora + ".\n\n" +
                    "Por este motivo, la reserva fue cancelada automáticamente y el turno volvió a quedar disponible.\n" +
                    "Por favor, comunícate con el club si deseas realizar una nueva reserva.\n\n" +
                    "Atentamente,\nSintético Sporting.");
            mailSender.send(mensaje);
        } catch (Exception e) {
            System.err.println("ERROR AL ENVIAR CORREO DE EXPIRACIÓN: " + e.getMessage());
        }
    }

    public void enviarCorreoMulta(String destinatario, String nombreCliente, String motivo, int multasAcumuladas) {
        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setTo(destinatario);
            mensaje.setSubject("Aviso de Infracción / Multa Registrada - Sintético Sporting");
            
            String texto = "Hola " + (nombreCliente != null ? nombreCliente : "Cliente") + ",\n\n" +
                    "Te informamos que se ha registrado una infracción en tu cuenta de Sintético Sporting.\n\n" +
                    "Motivo: " + motivo + "\n" +
                    "Multas acumuladas actuales: " + multasAcumuladas + " de 3.\n\n";

            if (multasAcumuladas >= 3) {
                texto += "⚠️ ATENCIÓN: Has alcanzado o superado las 3 multas permitidas, por lo que tu cuenta ha sido suspendida temporalmente por 15 días para realizar nuevas reservas.\n\n";
            } else {
                texto += "Te recordamos que al acumular 3 multas se aplicará una suspensión temporal en el sistema.\n\n";
            }

            texto += "Atentamente,\nSintético Sporting.";

            mensaje.setText(texto);
            mailSender.send(mensaje);
        } catch (Exception e) {
            System.err.println("ERROR AL ENVIAR CORREO DE MULTA: " + e.getMessage());
        }
    }

    // Correo cuando el admin cancela sin multa o el usuario cancela a tiempo
    public void enviarCorreoCancelacionSinMulta(String destinatario, String nombreCliente, String cancha, String fecha, String hora, String quienCancelo) {
        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setTo(destinatario);
            mensaje.setSubject("Reserva Cancelada - Sintético Sporting");
            mensaje.setText("Hola " + (nombreCliente != null ? nombreCliente : "Cliente") + ",\n\n" +
                    "Te informamos que tu reserva para la " + cancha + " el día " + fecha + " a las " + hora + 
                    " ha sido cancelada " + quienCancelo + " dentro del plazo reglamentario (sin penalización).\n\n" +
                    "Esperamos verte pronto nuevamente.\n\n" +
                    "Atentamente,\nSintético Sporting.");
            mailSender.send(mensaje);
        } catch (Exception e) {
            System.err.println("ERROR AL ENVIAR CORREO DE CANCELACIÓN SIN MULTA: " + e.getMessage());
        }
    }
}