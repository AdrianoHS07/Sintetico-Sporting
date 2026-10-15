package com.sinteticosporting.backend.controller;

import com.sinteticosporting.backend.entity.Reserva;
import com.sinteticosporting.backend.service.ReservaService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

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
    public ResponseEntity<Reserva> crearReserva(@RequestBody Reserva reserva) {
        Reserva nuevaReserva = reservaService.crearReserva(reserva);
        return ResponseEntity.ok(nuevaReserva);
    }

    // --- NUEVO: Obtener reservas filtradas por usuario ---
    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<Reserva>> obtenerReservasPorUsuario(@PathVariable long idUsuario) {
        List<Reserva> reservas = reservaService.obtenerReservasPorUsuario(idUsuario);
        return ResponseEntity.ok(reservas);
    }

    // --- NUEVO: Obtener todas las reservas ---
    @GetMapping("/todas")
    public ResponseEntity<List<Reserva>> obtenerTodas() {
        List<Reserva> reservas = reservaService.obtenerTodas();
        return ResponseEntity.ok(reservas);
    }
}