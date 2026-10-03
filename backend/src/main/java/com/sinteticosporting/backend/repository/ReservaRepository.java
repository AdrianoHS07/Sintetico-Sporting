package com.sinteticosporting.backend.repository;

import com.sinteticosporting.backend.entity.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    // Revisa si existe una reserva confirmada en la misma fecha y hora
    boolean existsByCanchaIdCanchaAndFechaAndHoraAndEstadoIn(
            long idCancha, LocalDate fecha, LocalTime hora, List<String> estados
    );

    // Obtiene las reservas ocupadas para mostrar en el frontend
    List<Reserva> findByCanchaIdCanchaAndFechaAndEstadoIn(
            long idCancha, LocalDate fecha, List<String> estados
    );
}