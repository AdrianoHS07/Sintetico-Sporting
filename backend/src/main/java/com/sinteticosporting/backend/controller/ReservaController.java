package com.sinteticosporting.backend.controller;

import com.sinteticosporting.backend.entity.Reserva;
import com.sinteticosporting.backend.service.ReservaService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reservas")
@CrossOrigin(origins = "*")
public class ReservaController {

    private final ReservaService reservaService;

    public ReservaController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    @GetMapping("/ocupadas")
    public List<Reserva> obtenerOcupadas(@RequestParam long idCancha, @RequestParam String fecha) {
        LocalDate fechaParseada = LocalDate.parse(fecha);
        return reservaService.obtenerReservasOcupadas(idCancha, fechaParseada);
    }

    @PostMapping("/crear")
    public ResponseEntity<?> crearReserva(@RequestBody Reserva reserva) {
        try {
            Reserva nuevaReserva = reservaService.crearReserva(reserva);
            return ResponseEntity.ok(nuevaReserva);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<Reserva>> obtenerReservasPorUsuario(@PathVariable long idUsuario) {
        List<Reserva> reservas = reservaService.obtenerReservasPorUsuario(idUsuario);
        return ResponseEntity.ok(reservas);
    }

    @GetMapping("/todas")
    public ResponseEntity<List<Reserva>> obtenerTodas() {
        List<Reserva> reservas = reservaService.obtenerTodas();
        return ResponseEntity.ok(reservas);
    }

    @GetMapping("/estadisticas")
    public ResponseEntity<Map<String, Long>> obtenerEstadisticas() {
        Map<String, Long> stats = reservaService.obtenerEstadisticas();
        return ResponseEntity.ok(stats);
    }

    @PutMapping("/confirmar/{id}")
    public ResponseEntity<Void> confirmarReservaAdmin(@PathVariable Long id) {
        reservaService.confirmarReserva(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/cancelar/{id}")
    public ResponseEntity<Void> cancelarReservaAdmin(@PathVariable Long id) {
        reservaService.cancelarReserva(id);
        return ResponseEntity.ok().build();
    }

    // Endpoint para que el usuario cancele su turno (Aplica validación de 4 horas y multas)
    @PutMapping("/cancelar-usuario/{id}")
    public ResponseEntity<?> cancelarReservaUsuario(@PathVariable Long id, @RequestParam Long idUsuario) {
        try {
            reservaService.cancelarReservaPorUsuario(id, idUsuario);
            return ResponseEntity.ok().body("Reserva cancelada exitosamente.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}