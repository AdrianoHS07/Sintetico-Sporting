package com.sinteticosporting.backend.service;

import com.sinteticosporting.backend.entity.Reserva;
import com.sinteticosporting.backend.entity.Usuario;
import com.sinteticosporting.backend.repository.ReservaRepository;
import com.sinteticosporting.backend.repository.UsuarioRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService; // <--- Servicio de correo integrado
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public ReservaService(ReservaRepository reservaRepository, UsuarioRepository usuarioRepository, EmailService emailService) {
        this.reservaRepository = reservaRepository;
        this.usuarioRepository = usuarioRepository;
        this.emailService = emailService;
    }

    private final List<String> ESTADOS_OCUPADOS = List.of("CONFIRMADO", "RESERVADO", "PENDIENTE_PAGO");

    // 1. Crear reserva (Valida fechas pasadas, si está suspendido y gestiona el usuario)
    public Reserva crearReserva(Reserva reserva) {
        
        // VALIDACIÓN DE SUSPENSIÓN POR MULTAS
        if (reserva.getUsuario() != null && reserva.getUsuario().getIdUsuario() > 0) {
            Usuario usuarioDB = usuarioRepository.findById(reserva.getUsuario().getIdUsuario()).orElse(null);
            if (usuarioDB != null && usuarioDB.getSuspendidoHasta() != null) {
                if (usuarioDB.getSuspendidoHasta().isAfter(LocalDateTime.now())) {
                    throw new RuntimeException("Tu cuenta se encuentra suspendida temporalmente por acumulación de multas hasta el " + 
                        usuarioDB.getSuspendidoHasta().toLocalDate() + ".");
                }
            }
        }

        // VALIDACIÓN DE SEGURIDAD: EVITAR RESERVAS EN EL PASADO
        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();

        if (reserva.getFecha() != null) {
            if (reserva.getFecha().isBefore(hoy)) {
                throw new RuntimeException("No se pueden realizar reservas en fechas pasadas.");
            }
            if (reserva.getFecha().isEqual(hoy)) {
                if (reserva.getHora() != null && reserva.getHora().isBefore(ahora)) {
                    throw new RuntimeException("No se puede reservar un horario que ya ha transcurrido en el día de hoy.");
                }
            }
        }

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

        // DETECTAR SI ES UNA RESERVA PRESENCIAL DESDE EL ADMIN O WEB
        boolean esMostrador = false;
        String dniCliente = null;
        String nombreRealCliente = null;

        if (reserva.getUsuario() != null) {
            dniCliente = reserva.getUsuario().getDni();
            nombreRealCliente = reserva.getUsuario().getNombre();
            Long idU = reserva.getUsuario().getIdUsuario();
            if (idU == null || idU == 0L || idU == 99L) {
                esMostrador = true;
            }
        } else {
            esMostrador = true;
        }

        if (esMostrador) {
            String nombreFinal = (nombreRealCliente != null && !nombreRealCliente.trim().isEmpty()) 
                    ? nombreRealCliente.trim() 
                    : "Cliente Presencial";

            String dniFinal = (dniCliente != null && !dniCliente.trim().isEmpty()) 
                    ? dniCliente.trim() 
                    : "S/D";

            Usuario usuarioExistente = usuarioRepository.findByDni(dniFinal).orElse(null);

            if (usuarioExistente != null) {
                usuarioExistente.setNombre(nombreFinal);
                usuarioRepository.save(usuarioExistente);
                reserva.setUsuario(usuarioExistente);
            } else {
                Usuario nuevoPresencial = new Usuario();
                nuevoPresencial.setDni(dniFinal);
                nuevoPresencial.setNombre(nombreFinal);
                nuevoPresencial.setEmail("dni_" + dniFinal + "@sinteticosporting.local");
                nuevoPresencial.setContraseña(passwordEncoder.encode("temporal123"));
                nuevoPresencial.setRol("USUARIO");
                nuevoPresencial.setEstado("ACTIVO");

                Usuario usuarioGuardado = usuarioRepository.save(nuevoPresencial);
                reserva.setUsuario(usuarioGuardado);
            }
        }

        return reservaRepository.save(reserva);
    }

    // 2. Confirmar pago desde Admin y disparar el correo electrónico automáticamente
    @Transactional
    public void confirmarReserva(Long idReserva) {
        Reserva reserva = reservaRepository.findById(idReserva).orElse(null);
        if (reserva != null) {
            reserva.setEstado("CONFIRMADO");
            reservaRepository.save(reserva);

            // Disparar correo si el usuario tiene email registrado
            if (reserva.getUsuario() != null && reserva.getUsuario().getEmail() != null) {
                try {
                    emailService.enviarCorreoConfirmacion(
                        reserva.getUsuario().getEmail(), 
                        reserva.getUsuario().getNombre()
                    );
                } catch (Exception e) {
                    System.err.println("No se pudo enviar el correo de confirmación: " + e.getMessage());
                }
            }
        }
    }

    // 3. Cancelar reserva desde Admin (Sin penalización al usuario)
    @Transactional
    public void cancelarReserva(Long idReserva) {
        Reserva reserva = reservaRepository.findById(idReserva).orElse(null);
        if (reserva != null) {
            reserva.setEstado("CANCELADA");
            reservaRepository.save(reserva);
        }
    }

    // 3.1. Cancelar reserva desde el Usuario con regla de anticipación y multas
    @Transactional
    public void cancelarReservaPorUsuario(Long idReserva, Long idUsuarioFirma) {
        Reserva reserva = reservaRepository.findById(idReserva)
                .orElseThrow(() -> new RuntimeException("La reserva no existe."));

        if (reserva.getUsuario() == null || reserva.getUsuario().getIdUsuario() != idUsuarioFirma) {
            throw new RuntimeException("No tenés permisos para cancelar esta reserva.");
        }

        if ("CANCELADA".equals(reserva.getEstado())) {
            throw new RuntimeException("Esta reserva ya se encuentra cancelada.");
        }

        LocalDateTime fechaHoraTurno = LocalDateTime.of(reserva.getFecha(), reserva.getHora());
        LocalDateTime ahora = LocalDateTime.now();
        long horasRestantes = ChronoUnit.HOURS.between(ahora, fechaHoraTurno);

        reserva.setEstado("CANCELADA");
        reservaRepository.save(reserva);

        if (horasRestantes < 4) {
            Usuario usuario = reserva.getUsuario();
            usuario.setMultasAcumuladas(usuario.getMultasAcumuladas() + 1);

            if (usuario.getMultasAcumuladas() >= 3) {
                usuario.setSuspendidoHasta(ahora.plusDays(15));
                usuario.setMultasAcumuladas(0);
            }
            usuarioRepository.save(usuario);
        }
    }

    // 4. Obtener turnos ocupados
    public List<Reserva> obtenerReservasOcupadas(long idCancha, LocalDate fecha) {
        return reservaRepository.findByCanchaIdCanchaAndFechaAndEstadoIn(
                idCancha, fecha, ESTADOS_OCUPADOS
        );
    }

    // 5. Obtener reservas vigentes de un usuario
    public List<Reserva> obtenerReservasPorUsuario(long idUsuario) {
        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();
        return reservaRepository.findReservasVigentesPorUsuario(idUsuario, hoy, ahora);
    }

    // 6. Obtener todas las reservas vigentes generales
    public List<Reserva> obtenerTodas() {
        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();
        return reservaRepository.findReservasVigentes(hoy, ahora);
    }

    // 7. Obtener estadísticas de reservas vigentes
    public Map<String, Long> obtenerEstadisticas() {
        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();
        List<Object[]> resultados = reservaRepository.contarReservasVigentesPorEstado(hoy, ahora);
        
        long total = 0;
        long pendientes = 0;
        long confirmadas = 0;

        for (Object[] fila : resultados) {
            String estadoBD = (String) fila[0];
            Long cantidad = (Long) fila[1];

            total += cantidad;

            if (estadoBD != null) {
                String estadoUpper = estadoBD.toUpperCase().trim();
                
                if (estadoUpper.contains("PENDIENTE")) {
                    pendientes += cantidad;
                } else if (estadoUpper.contains("CONFIRMADO") || estadoUpper.contains("RESERVADO") || estadoUpper.contains("CONFIRMADA")) {
                    confirmadas += cantidad;
                }
            }
        }

        Map<String, Long> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("pendientes", pendientes);
        stats.put("confirmadas", confirmadas);
        return stats;
    }
}