package com.sinteticosporting.backend.service;

import com.sinteticosporting.backend.entity.Cancha;
import com.sinteticosporting.backend.repository.CanchaRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
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

    // CORREGIDO: Asigna estrictamente la fecha elegida en el calendario
    public Cancha cambiarEstadoCanchaConFecha(Long id, String nuevoEstado, String fechaSuspensionStr) {
        Cancha cancha = canchaRepository.findById(id).orElse(null);
        if (cancha != null) {
            cancha.setEstado(nuevoEstado);
            
            if ("SUSPENDIDA".equalsIgnoreCase(nuevoEstado)) {
                if (fechaSuspensionStr != null && !fechaSuspensionStr.isEmpty() && !fechaSuspensionStr.equals("null")) {
                    cancha.setSuspendidaDesde(LocalDate.parse(fechaSuspensionStr));
                } else {
                    cancha.setSuspendidaDesde(LocalDate.now());
                }
            } else {
                cancha.setSuspendidaDesde(null);
            }
            
            return canchaRepository.save(cancha);
        }
        return null;
    }

    public Cancha cambiarEstadoCancha(Long id, String nuevoEstado) {
        return cambiarEstadoCanchaConFecha(id, nuevoEstado, null);
    }

    public Cancha actualizarCancha(Long id, Cancha canchaDetalles) {
        Cancha cancha = canchaRepository.findById(id).orElse(null);
        if (cancha != null) {
            cancha.setModalidad(canchaDetalles.getModalidad());
            cancha.setDescripcion(canchaDetalles.getDescripcion());
            cancha.setValorReserva(canchaDetalles.getValorReserva());
            cancha.setValorFinalTurno(canchaDetalles.getValorFinalTurno());
            return canchaRepository.save(cancha);
        }
        return null;
    }
}