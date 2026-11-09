package com.sinteticosporting.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void enviarCorreoConfirmacion(String destinatario, String nombreCliente) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setTo(destinatario);
        mensaje.setSubject("¡Pago Confirmado - Sintético Sporting!");
        mensaje.setText("Hola " + nombreCliente + ",\n\n¡Buenas noticias! Tu pago por transferencia ha sido verificado y tu reserva ha sido confirmada exitosamente.\n\n¡Te esperamos en la cancha!\n\nAtentamente,\nSintético Sporting.");

        mailSender.send(mensaje);
    }
}