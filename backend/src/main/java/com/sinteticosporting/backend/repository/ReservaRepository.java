package com.sinteticosporting.backend.repository;

import com.sinteticosporting.backend.entity.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    boolean existsByCanchaIdCanchaAndFechaAndHoraAndEstadoIn(
            long idCancha, LocalDate fecha, LocalTime hora, List<String> estados
    );

    List<Reserva> findByCanchaIdCanchaAndFechaAndEstadoIn(
            long idCancha, LocalDate fecha, List<String> estados
    );

    // Consulta dinámica para agrupar y contar por estado real de la BD (todas)
    @Query("SELECT r.estado, COUNT(r) FROM Reserva r GROUP BY r.estado")
    List<Object[]> contarReservasPorEstado();

    // Traer solo reservas vigentes generales (desde hoy y hora actual en adelante)
    @Query("SELECT r FROM Reserva r WHERE r.fecha > :fechaActual OR (r.fecha = :fechaActual AND r.hora >= :horaActual) ORDER BY r.fecha ASC, r.hora ASC")
    List<Reserva> findReservasVigentes(@Param("fechaActual") LocalDate fechaActual, @Param("horaActual") LocalTime horaActual);

    // Estadísticas basadas solo en reservas vigentes
    @Query("SELECT r.estado, COUNT(r) FROM Reserva r WHERE r.fecha > :fechaActual OR (r.fecha = :fechaActual AND r.hora >= :horaActual) GROUP BY r.estado")
    List<Object[]> contarReservasVigentesPorEstado(@Param("fechaActual") LocalDate fechaActual, @Param("horaActual") LocalTime horaActual);

    // Traer reservas vigentes de un usuario específico
    @Query("SELECT r FROM Reserva r WHERE r.usuario.idUsuario = :idUsuario AND (r.fecha > :fechaActual OR (r.fecha = :fechaActual AND r.hora >= :horaActual)) ORDER BY r.fecha ASC, r.hora ASC")
    List<Reserva> findReservasVigentesPorUsuario(@Param("idUsuario") long idUsuario, @Param("fechaActual") LocalDate fechaActual, @Param("horaActual") LocalTime horaActual);
}