package com.sinteticosporting.backend.service;

import com.sinteticosporting.backend.entity.Reserva;
import com.sinteticosporting.backend.repository.ReservaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ReservaService {

    private final ReservaRepository reservaRepository;

    public ReservaService(ReservaRepository reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    // Lista unificada de estados que bloquean el turno en la cancha
    private final List<String> ESTADOS_OCUPADOS = List.of("CONFIRMADO", "RESERVADO", "PENDIENTE_PAGO");

    // 1. Crear reserva
    public Reserva crearReserva(Reserva reserva) {
        boolean ocupado = reservaRepository.existsByCanchaIdCanchaAndFechaAndHoraAndEstadoIn(
                reserva.getCancha().getIdCancha(),
                reserva.getFecha(),
                reserva.getHora(),
                ESTADOS_OCUPADOS
        );

        if (ocupado) {
            throw new RuntimeException("El turno seleccionado ya se encuentra ocupado o en proceso de pago.");
        }

        if (reserva.getEstado() == null || reserva.getEstado().isEmpty()) {
            reserva.setEstado("PENDIENTE_PAGO");
        }

        return reservaRepository.save(reserva);
    }

    // 2. Confirmar la reserva tras la aprobación del pago
    @Transactional
    public void confirmarReserva(Long idReserva) {
        Reserva reserva = reservaRepository.findById(idReserva).orElse(null);
        if (reserva != null) {
            reserva.setEstado("CONFIRMADO");
            reservaRepository.save(reserva);
        }
    }

    // 3. Cancelar la reserva
    @Transactional
    public void cancelarReserva(Long idReserva) {
        Reserva reserva = reservaRepository.findById(idReserva).orElse(null);
        if (reserva != null) {
            reserva.setEstado("CANCELADA");
            reservaRepository.save(reserva);
        }
    }

    // 4. Consultar turnos ocupados para deshabilitar en el frontend
    public List<Reserva> obtenerReservasOcupadas(long idCancha, LocalDate fecha) {
        return reservaRepository.findByCanchaIdCanchaAndFechaAndEstadoIn(
                idCancha, fecha, ESTADOS_OCUPADOS
        );
    }

    // 5. Obtener todas las reservas de un usuario
    public List<Reserva> obtenerReservasPorUsuario(long idUsuario) {
        return reservaRepository.findByUsuarioIdUsuario(idUsuario);
    }

    // 6. Obtener el listado completo de reservas
    public List<Reserva> obtenerTodas() {
        return reservaRepository.findAll();
    }
}