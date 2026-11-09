package com.sinteticosporting.backend.controller;

import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.preference.*;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.resources.preference.Preference;
import com.sinteticosporting.backend.service.ReservaService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mercadopago")
@CrossOrigin(origins = "*")
public class MercadoPagoController {

    @Value("${mercadopago.access.token}")
    private String accessToken;

    @Autowired
    private ReservaService reservaService;

    // 1. Crear el cobro en Mercado Pago
    @PostMapping("/crear-preferencia")
    public ResponseEntity<?> crearPreferencia(@RequestBody Map<String, Object> datosReserva) {
        try {
            MercadoPagoConfig.setAccessToken(accessToken);

            String cancha = datosReserva.containsKey("cancha") && datosReserva.get("cancha") != null 
                    ? datosReserva.get("cancha").toString() 
                    : "Reserva Cancha Sintetica";

            Double precio = 20000.0;
            if (datosReserva.containsKey("precio") && datosReserva.get("precio") != null) {
                try {
                    precio = Double.parseDouble(datosReserva.get("precio").toString());
                } catch (NumberFormatException ignored) {}
            }

            Object idReservaObj = datosReserva.get("idReserva");
            String idReserva = idReservaObj != null ? idReservaObj.toString() : "1";

            // A. Configurar el ítem
            PreferenceItemRequest itemRequest = PreferenceItemRequest.builder()
                    .id(idReserva)
                    .title("Reserva " + cancha)
                    .quantity(1)
                    .unitPrice(new BigDecimal(precio))
                    .currencyId("ARS")
                    .build();

            List<PreferenceItemRequest> items = new ArrayList<>();
            items.add(itemRequest);

            // B. URLs de retorno y Webhook usando ngrok (Necesario para autoReturn)
            String urlBaseNgrok = "https://chosen-unstamped-exfoliate.ngrok-free.dev";

            PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
                    .success(urlBaseNgrok + "/api/mercadopago/exito?idReserva=" + idReserva)
                    .failure(urlBaseNgrok + "/api/mercadopago/fallo?idReserva=" + idReserva)
                    .pending(urlBaseNgrok + "/api/mercadopago/exito?idReserva=" + idReserva)
                    .build();

            // C. Crear la petición de preferencia
            PreferenceRequest preferenceRequest = PreferenceRequest.builder()
                    .items(items)
                    .backUrls(backUrls)
                    .externalReference(idReserva)
                    .notificationUrl(urlBaseNgrok + "/api/mercadopago/webhook")
                    .autoReturn("approved") // Fuerza el retorno automático al aprobarse el pago
                    .build();

            PreferenceClient client = new PreferenceClient();
            Preference preference = client.create(preferenceRequest);

            return ResponseEntity.ok(Map.of("initPoint", preference.getInitPoint()));

        } catch (MPApiException apiEx) {
            System.err.println("=== ERROR API MERCADO PAGO (STATUS " + apiEx.getStatusCode() + ") ===");
            if (apiEx.getApiResponse() != null) {
                System.err.println("Respuesta del servidor de MP: " + apiEx.getApiResponse().getContent());
            }
            apiEx.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error API Mercado Pago: " + (apiEx.getApiResponse() != null ? apiEx.getApiResponse().getContent() : apiEx.getMessage())
            ));
        } catch (Exception e) {
            System.err.println("=== ERROR GENERAL EN MERCADO PAGO ===");
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Error interno"));
        }
    }

    // 2. WEBHOOK: Recibe notificaciones automáticas en segundo plano desde Mercado Pago
    @PostMapping("/webhook")
    public ResponseEntity<Void> recibirNotificacionWebhook(
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "data.id", required = false) String dataId,
            @RequestBody(required = false) Map<String, Object> payload) {

        try {
            MercadoPagoConfig.setAccessToken(accessToken);

            String paymentId = dataId;
            String tipoNotificacion = type;

            if (payload != null) {
                if (tipoNotificacion == null && payload.containsKey("type")) {
                    tipoNotificacion = String.valueOf(payload.get("type"));
                }
                if (paymentId == null && payload.containsKey("data")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> data = (Map<String, Object>) payload.get("data");
                    if (data != null && data.containsKey("id")) {
                        paymentId = String.valueOf(data.get("id"));
                    }
                }
            }

            if ("payment".equalsIgnoreCase(tipoNotificacion) && paymentId != null) {
                PaymentClient paymentClient = new PaymentClient();
                Payment payment = paymentClient.get(Long.parseLong(paymentId));

                if (payment != null && payment.getExternalReference() != null) {
                    Long idReserva = Long.parseLong(payment.getExternalReference());
                    String status = payment.getStatus();

                    System.out.println("Webhook recibido - Pago ID: " + paymentId + " | Estado: " + status + " | Reserva ID: " + idReserva);

                    if ("approved".equalsIgnoreCase(status)) {
                        reservaService.confirmarReserva(idReserva);
                    } else if ("rejected".equalsIgnoreCase(status) || "cancelled".equalsIgnoreCase(status)) {
                        reservaService.cancelarReserva(idReserva);
                    }
                }
            }

            return ResponseEntity.ok().build();

        } catch (Exception e) {
            System.err.println("Error procesando Webhook de Mercado Pago: " + e.getMessage());
            return ResponseEntity.ok().build();
        }
    }

    // 3. Redirección por Pago exitoso en navegador
    @GetMapping("/exito")
    public void pagoExitoso(@RequestParam("idReserva") Long idReserva, 
                            HttpServletResponse response) throws IOException {
        
        reservaService.confirmarReserva(idReserva);
        System.out.println("Pago exitoso procesado para reserva ID: " + idReserva);
        
        // Redirige automáticamente de vuelta al frontend local
        response.sendRedirect("http://127.0.0.1:5500/frontend/Estructura/reserva_exitosa.html?estado=exito");
    }

    // 4. Redirección por Pago fallido o cancelado en navegador
    @GetMapping("/fallo")
    public void pagoFallido(@RequestParam("idReserva") Long idReserva, 
                            HttpServletResponse response) throws IOException {
        
        reservaService.cancelarReserva(idReserva);
        response.sendRedirect("http://127.0.0.1:5500/frontend/Estructura/confirmar.html?error=pago_rechazado");
    }
}