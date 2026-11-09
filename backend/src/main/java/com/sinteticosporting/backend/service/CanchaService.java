package com.sinteticosporting.backend.service;

import com.sinteticosporting.backend.entity.Cancha;
import com.sinteticosporting.backend.repository.CanchaRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CanchaService {

    private final CanchaRepository canchaRepository;

    public CanchaService(CanchaRepository canchaRepository) {
        this.canchaRepository = canchaRepository;
    }

    public Cancha guardarCancha(Cancha cancha) {
        return canchaRepository.save(cancha);
    }

    public List<Cancha> obtenerTodas() {
        return canchaRepository.findAll();
    }

    public void eliminarCancha(Long id) {
        canchaRepository.deleteById(id);
    }

    public Cancha cambiarEstadoCancha(Long id, String nuevoEstado) {
        Cancha cancha = canchaRepository.findById(id).orElse(null);
        if (cancha != null) {
            cancha.setEstado(nuevoEstado);
            return canchaRepository.save(cancha);
        }
        return null;
    }

    public Cancha actualizarCancha(Long id, Cancha canchaDetalles) {
        Cancha cancha = canchaRepository.findById(id).orElse(null);
        if (cancha != null) {
            cancha.setModalidad(canchaDetalles.getModalidad());
            cancha.setDescripcion(canchaDetalles.getDescripcion());
            cancha.setValorReserva(canchaDetalles.getValorReserva()); // Actualizado al nuevo nombre
            cancha.setValorFinalTurno(canchaDetalles.getValorFinalTurno());
            return canchaRepository.save(cancha);
        }
        return null;
    }
}