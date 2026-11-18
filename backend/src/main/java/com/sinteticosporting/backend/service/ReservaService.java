package com.sinteticosporting.backend.service;

import com.sinteticosporting.backend.entity.Cancha;
import com.sinteticosporting.backend.entity.Multa;
import com.sinteticosporting.backend.entity.Reserva;
import com.sinteticosporting.backend.entity.Usuario;
import com.sinteticosporting.backend.repository.CanchaRepository;
import com.sinteticosporting.backend.repository.MultaRepository;
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
    private final MultaRepository multaRepository;
    private final CanchaRepository canchaRepository;
    private final EmailService emailService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public ReservaService(ReservaRepository reservaRepository, 
                          UsuarioRepository usuarioRepository, 
                          MultaRepository multaRepository,
                          CanchaRepository canchaRepository,
                          EmailService emailService) {
        this.reservaRepository = reservaRepository;
        this.usuarioRepository = usuarioRepository;
        this.multaRepository = multaRepository;
        this.canchaRepository = canchaRepository;
        this.emailService = emailService;
    }

    private final List<String> ESTADOS_OCUPADOS = List.of("CONFIRMADO", "RESERVADO", "PENDIENTE_PAGO");

    // Método auxiliar seguro para obtener el número de la cancha usando el atributo real 'numero'
    private String obtenerNombreCanchaSeguro(Cancha cancha) {
        if (cancha == null) {
            return "Cancha";
        }
        return "Cancha " + cancha.getNumero();
    }

    // Método auxiliar seguro para obtener el email o identificación del usuario
    private String obtenerNombreUsuarioSeguro(Usuario usuario) {
        if (usuario == null) {
            return "Cliente";
        }
        if (usuario.getEmail() != null && !usuario.getEmail().isEmpty()) {
            return usuario.getEmail();
        }
        return "Cliente";
    }

    public Reserva crearReserva(Reserva reserva) {
        if (reserva.getFechaCreacion() == null) {
            reserva.setFechaCreacion(LocalDateTime.now());
        }

        limpiarReservasExpiradas();

        if (reserva.getCancha() != null) {
            Cancha canchaDB = canchaRepository.findById(reserva.getCancha().getIdCancha()).orElse(null);
            if (canchaDB != null && "SUSPENDIDA".equalsIgnoreCase(canchaDB.getEstado())) {
                LocalDate fechaSuspension = canchaDB.getSuspendidaDesde();
                if (fechaSuspension != null && !reserva.getFecha().isBefore(fechaSuspension)) {
                    throw new RuntimeException("Lo sentimos, esta cancha se encuentra suspendida / en mantenimiento a partir del " + fechaSuspension + ".");
                }
            }
        }

        if (reserva.getUsuario() != null && reserva.getUsuario().getIdUsuario() > 0) {
            Usuario usuarioDB = usuarioRepository.findById(reserva.getUsuario().getIdUsuario()).orElse(null);
            if (usuarioDB != null && usuarioDB.getSuspendidoHasta() != null) {
                if (usuarioDB.getSuspendidoHasta().isAfter(LocalDateTime.now())) {
                    throw new RuntimeException("Tu cuenta se encuentra suspendida temporalmente por acumulación de multas hasta el " + 
                        usuarioDB.getSuspendidoHasta().toLocalDate() + ".");
                }
            }
        }

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

        boolean esMostrador = false;
        String dniCliente = null;
        String nombreRealCliente = null;

        if (reserva.getUsuario() != null) {
            dniCliente = reserva.getUsuario().getDni();
            try {
                nombreRealCliente = reserva.getUsuario().getNombre();
            } catch (Exception ignored) {}
            
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
                try {
                    usuarioExistente.setNombre(nombreFinal);
                } catch (Exception ignored) {}
                usuarioRepository.save(usuarioExistente);
                reserva.setUsuario(usuarioExistente);
            } else {
                Usuario nuevoPresencial = new Usuario();
                nuevoPresencial.setDni(dniFinal);
                try {
                    nuevoPresencial.setNombre(nombreFinal);
                } catch (Exception ignored) {}
                nuevoPresencial.setEmail("dni_" + dniFinal + "@sinteticosporting.local");
                nuevoPresencial.setContraseña(passwordEncoder.encode("temporal123"));
                nuevoPresencial.setRol("USUARIO");
                nuevoPresencial.setEstado("ACTIVO");

                Usuario usuarioGuardado = usuarioRepository.save(nuevoPresencial);
                reserva.setUsuario(usuarioGuardado);
            }
        }

        if (reserva.getFechaCreacion() == null) {
            reserva.setFechaCreacion(LocalDateTime.now());
        }

        Reserva reservaGuardada = reservaRepository.save(reserva);

        if ("CONFIRMADO".equalsIgnoreCase(reservaGuardada.getEstado())) {
            if (reservaGuardada.getUsuario() != null && reservaGuardada.getUsuario().getEmail() != null && 
                !reservaGuardada.getUsuario().getEmail().contains("@sinteticosporting.local")) {
                try {
                    String nombreCancha = obtenerNombreCanchaSeguro(reservaGuardada.getCancha());
                    String nombreUsuario = obtenerNombreUsuarioSeguro(reservaGuardada.getUsuario());
                    emailService.enviarCorreoConfirmacion(
                        reservaGuardada.getUsuario().getEmail(),
                        nombreUsuario,
                        nombreCancha,
                        reservaGuardada.getFecha().toString(),
                        reservaGuardada.getHora().toString()
                    );
                } catch (Exception e) {
                    System.err.println("Error al enviar correo de confirmación online: " + e.getMessage());
                }
            }
        }

        return reservaGuardada;
    }

    @Transactional
    public void confirmarReserva(Long idReserva) {
        Reserva reserva = reservaRepository.findById(idReserva).orElse(null);
        if (reserva != null) {
            reserva.setEstado("CONFIRMADO");
            reservaRepository.save(reserva);

            if (reserva.getUsuario() != null && reserva.getUsuario().getEmail() != null && 
                !reserva.getUsuario().getEmail().contains("@sinteticosporting.local")) {
                try {
                    String nombreCancha = obtenerNombreCanchaSeguro(reserva.getCancha());
                    String nombreUsuario = obtenerNombreUsuarioSeguro(reserva.getUsuario());
                    emailService.enviarCorreoConfirmacion(
                        reserva.getUsuario().getEmail(), 
                        nombreUsuario,
                        nombreCancha,
                        reserva.getFecha().toString(),
                        reserva.getHora().toString()
                    );
                } catch (Exception e) {
                    System.err.println("No se pudo enviar el correo de confirmación manual: " + e.getMessage());
                }
            }
        }
    }

    @Transactional
    public void cancelarReserva(Long idReserva) {
        Reserva reserva = reservaRepository.findById(idReserva).orElse(null);
        if (reserva != null && !"CANCELADA".equals(reserva.getEstado())) {
            reserva.setEstado("CANCELADA");
            reservaRepository.save(reserva);

            if (reserva.getUsuario() != null && reserva.getUsuario().getEmail() != null && 
                !reserva.getUsuario().getEmail().contains("@sinteticosporting.local")) {
                try {
                    String nombreCancha = obtenerNombreCanchaSeguro(reserva.getCancha());
                    String nombreUsuario = obtenerNombreUsuarioSeguro(reserva.getUsuario());
                    emailService.enviarCorreoCancelacionSinMulta(
                        reserva.getUsuario().getEmail(),
                        nombreUsuario,
                        nombreCancha,
                        reserva.getFecha().toString(),
                        reserva.getHora().toString(),
                        "por el administrador"
                    );
                } catch (Exception e) {
                    System.err.println("Error al enviar correo de cancelación sin multa (admin): " + e.getMessage());
                }
            }
        }
    }

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

        String nombreCancha = obtenerNombreCanchaSeguro(reserva.getCancha());
        String nombreUsuario = obtenerNombreUsuarioSeguro(reserva.getUsuario());

        if (horasRestantes < 4) {
            Usuario usuario = reserva.getUsuario();
            usuario.setMultasAcumuladas(usuario.getMultasAcumuladas() + 1);

            Multa multa = new Multa();
            multa.setUsuario(usuario);
            multa.setFechaMulta(LocalDateTime.now());
            String motivo = "Cancelación fuera de término por el usuario";
            multa.setMotivo(motivo);
            multaRepository.save(multa);

            if (usuario.getMultasAcumuladas() >= 3) {
                usuario.setSuspendidoHasta(ahora.plusDays(15));
                usuario.setMultasAcumuladas(0);
            }
            usuarioRepository.save(usuario);

            if (usuario.getEmail() != null && !usuario.getEmail().contains("@sinteticosporting.local")) {
                try {
                    emailService.enviarCorreoMulta(usuario.getEmail(), nombreUsuario, motivo, usuario.getMultasAcumuladas());
                } catch (Exception e) {
                    System.err.println("Error al enviar correo de multa: " + e.getMessage());
                }
            }
        } else {
            if (reserva.getUsuario().getEmail() != null && !reserva.getUsuario().getEmail().contains("@sinteticosporting.local")) {
                try {
                    emailService.enviarCorreoCancelacionSinMulta(
                        reserva.getUsuario().getEmail(),
                        nombreUsuario,
                        nombreCancha,
                        reserva.getFecha().toString(),
                        reserva.getHora().toString(),
                        "por vos"
                    );
                } catch (Exception e) {
                    System.err.println("Error al enviar correo de cancelación a tiempo: " + e.getMessage());
                }
            }
        }
    }

    @Transactional
    public void cancelarReservaConMulta(Long idReserva, Long idUsuario) {
        Reserva reserva = reservaRepository.findById(idReserva)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));
        reserva.setEstado("CANCELADA");
        reservaRepository.save(reserva);

        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        usuario.setMultasAcumuladas(usuario.getMultasAcumuladas() + 1);

        Multa multa = new Multa();
        multa.setUsuario(usuario);
        multa.setFechaMulta(LocalDateTime.now());
        String motivo = "Cancelación fuera de término por administrador";
        multa.setMotivo(motivo);
        multaRepository.save(multa);

        if (usuario.getMultasAcumuladas() >= 3) {
            usuario.setSuspendidoHasta(LocalDateTime.now().plusDays(15));
            usuario.setMultasAcumuladas(0);
        }

        usuarioRepository.save(usuario);

        if (usuario.getEmail() != null && !usuario.getEmail().contains("@sinteticosporting.local")) {
            try {
                String nombreUsuario = obtenerNombreUsuarioSeguro(usuario);
                emailService.enviarCorreoMulta(usuario.getEmail(), nombreUsuario, motivo, usuario.getMultasAcumuladas());
            } catch (Exception e) {
                System.err.println("Error al enviar correo de multa: " + e.getMessage());
            }
        }
    }

    @Transactional
    public void registrarAusencia(Long idReserva, Long idUsuario) {
        Reserva reserva = reservaRepository.findById(idReserva)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));
        reserva.setEstado("CANCELADA");
        reservaRepository.save(reserva);

        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        usuario.setMultasAcumuladas(usuario.getMultasAcumuladas() + 1);

        Multa multa = new Multa();
        multa.setUsuario(usuario);
        multa.setFechaMulta(LocalDateTime.now());
        String motivo = "Inasistencia / Falta al turno registrada por administrador";
        multa.setMotivo(motivo);
        multaRepository.save(multa);

        if (usuario.getMultasAcumuladas() >= 3) {
            usuario.setSuspendidoHasta(LocalDateTime.now().plusDays(15));
            usuario.setMultasAcumuladas(0);
        }

        usuarioRepository.save(usuario);

        if (usuario.getEmail() != null && !usuario.getEmail().contains("@sinteticosporting.local")) {
            try {
                String nombreUsuario = obtenerNombreUsuarioSeguro(usuario);
                emailService.enviarCorreoMulta(usuario.getEmail(), nombreUsuario, motivo, usuario.getMultasAcumuladas());
            } catch (Exception e) {
                System.err.println("Error al enviar correo de multa: " + e.getMessage());
            }
        }
    }

    @Transactional
    public void limpiarReservasExpiradas() {
        LocalDateTime limiteTiempo = LocalDateTime.now().minusMinutes(15);
        List<Reserva> pendientes = reservaRepository.findByEstado("PENDIENTE_PAGO");

        for (Reserva r : pendientes) {
            LocalDateTime creacion = r.getFechaCreacion() != null ? r.getFechaCreacion() : LocalDateTime.now();
            if (creacion.isBefore(limiteTiempo)) {
                r.setEstado("CANCELADA");
                reservaRepository.save(r);

                if (r.getUsuario() != null && r.getUsuario().getEmail() != null && !r.getUsuario().getEmail().contains("@sinteticosporting.local")) {
                    try {
                        String emailUsuario = r.getUsuario().getEmail();
                        String nombreUsuario = obtenerNombreUsuarioSeguro(r.getUsuario());
                        String nombreCancha = obtenerNombreCanchaSeguro(r.getCancha());

                        String fechaStr = r.getFecha() != null ? r.getFecha().toString() : "";
                        String horaStr = r.getHora() != null ? r.getHora().toString() : "";

                        emailService.enviarCorreoReservaExpirada(
                            emailUsuario,
                            nombreUsuario,
                            nombreCancha,
                            fechaStr,
                            horaStr
                        );
                    } catch (Exception e) {
                        System.err.println("No se pudo enviar el correo de reserva expirada: " + e.getMessage());
                    }
                }
            }
        }
    }

    public List<Reserva> obtenerReservasOcupadas(long idCancha, LocalDate fecha) {
        limpiarReservasExpiradas();
        return reservaRepository.findByCanchaIdCanchaAndFechaAndEstadoIn(
                idCancha, fecha, ESTADOS_OCUPADOS
        );
    }

    public List<Reserva> obtenerReservasPorUsuario(long idUsuario) {
        limpiarReservasExpiradas();
        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();
        return reservaRepository.findReservasVigentesPorUsuario(idUsuario, hoy, ahora);
    }

    public List<Reserva> obtenerTodas() {
        limpiarReservasExpiradas();
        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();
        return reservaRepository.findReservasVigentes(hoy, ahora);
    }

    public Map<String, Long> obtenerEstadisticas() {
        limpiarReservasExpiradas();
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