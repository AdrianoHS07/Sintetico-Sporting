package com.sinteticosporting.backend.controller;

import com.sinteticosporting.backend.entity.Cancha;
import com.sinteticosporting.backend.service.CanchaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/canchas")
@CrossOrigin(origins = "*")
public class CanchaController {

    private final CanchaService canchaService;

    public CanchaController(CanchaService canchaService) {
        this.canchaService = canchaService;
    }

    @PostMapping("/crear")
    public ResponseEntity<Cancha> crearCancha(@RequestBody Cancha cancha) {
        Cancha nuevaCancha = canchaService.guardarCancha(cancha);
        return ResponseEntity.ok(nuevaCancha);
    }

    @GetMapping("/todas")
    public ResponseEntity<List<Cancha>> listarCanchas() {
        return ResponseEntity.ok(canchaService.obtenerTodas());
    }

    @DeleteMapping("/eliminar/{id}")
    public ResponseEntity<?> eliminarCancha(@PathVariable Long id) {
        try {
            canchaService.eliminarCancha(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body("No se pudo eliminar la cancha.");
        }
    }

    @PutMapping("/estado/{id}")
    public ResponseEntity<Cancha> cambiarEstado(@PathVariable Long id, @RequestParam String estado) {
        Cancha canchaActualizada = canchaService.cambiarEstadoCancha(id, estado);
        if (canchaActualizada != null) {
            return ResponseEntity.ok(canchaActualizada);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/actualizar/{id}")
    public ResponseEntity<?> actualizarCancha(@PathVariable Long id, @RequestBody Cancha canchaDetalles) {
        try {
            Cancha canchaActualizada = canchaService.actualizarCancha(id, canchaDetalles);
            if (canchaActualizada != null) {
                return ResponseEntity.ok(canchaActualizada);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body("No se pudo actualizar la cancha.");
        }
    }
}