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

    // 1. Crear reserva inicial en estado PENDIENTE_PAGO
    public Reserva crearReserva(Reserva reserva) {
        boolean ocupado = reservaRepository.existsByCanchaIdCanchaAndFechaAndHoraAndEstadoIn(
                reserva.getCancha().getIdCancha(),
                reserva.getFecha(),
                reserva.getHora(),
                List.of("CONFIRMADA", "RESERVADO")
        );

        if (ocupado) {
            throw new RuntimeException("El turno seleccionado ya se encuentra ocupado.");
        }

        // Se guarda en estado PENDIENTE_PAGO a la espera de Mercado Pago
        reserva.setEstado("PENDIENTE_PAGO");
        return reservaRepository.save(reserva);
    }

    // 2. Confirmar la reserva cuando Mercado Pago notifica el pago exitoso
    @Transactional
    public void confirmarReserva(Long idReserva) {
        Reserva reserva = reservaRepository.findById(idReserva).orElse(null);
        if (reserva != null) {
            reserva.setEstado("RESERVADO");
            reservaRepository.save(reserva);
        }
    }

    // 3. Cancelar si el pago falla o fue rechazado
    @Transactional
    public void cancelarReserva(Long idReserva) {
        Reserva reserva = reservaRepository.findById(idReserva).orElse(null);
        if (reserva != null) {
            reserva.setEstado("CANCELADA");
            reservaRepository.save(reserva);
        }
    }

    // 4. Consultar turnos ocupados para el frontend
    public List<Reserva> obtenerReservasOcupadas(long idCancha, LocalDate fecha) {
        return reservaRepository.findByCanchaIdCanchaAndFechaAndEstadoIn(idCancha, fecha, List.of("CONFIRMADA", "RESERVADO"));
    }
}