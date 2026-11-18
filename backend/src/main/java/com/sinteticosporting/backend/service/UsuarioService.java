package com.sinteticosporting.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sinteticosporting.backend.dto.LoginResponse;
import com.sinteticosporting.backend.dto.UsuarioMultaDTO;
import com.sinteticosporting.backend.entity.Multa;
import com.sinteticosporting.backend.entity.Usuario;
import com.sinteticosporting.backend.repository.MultaRepository;
import com.sinteticosporting.backend.repository.UsuarioRepository;

@Service
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final MultaRepository multaRepository;
    private final EmailService emailService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UsuarioService(UsuarioRepository usuarioRepository, MultaRepository multaRepository, EmailService emailService) {
        this.usuarioRepository = usuarioRepository;
        this.multaRepository = multaRepository;
        this.emailService = emailService;
    }

    public Usuario registrarUsuario(Usuario usuario) {
        if (usuarioRepository.findByEmail(usuario.getEmail()).isPresent()) {
            throw new RuntimeException("El email ya está registrado");
        }
        String contraseñaHash = passwordEncoder.encode(usuario.getContraseña());
        usuario.setContraseña(contraseñaHash);

        usuario.setRol("USUARIO");
        usuario.setEstado("ACTIVO");
        return usuarioRepository.save(usuario);
    }

    public LoginResponse login(String email, String contraseña) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("El email no está registrado"));

        if (!passwordEncoder.matches(contraseña, usuario.getContraseña())) {
            throw new RuntimeException("La contraseña es incorrecta");
        }

        LoginResponse response = new LoginResponse();
        response.setIdUsuario(usuario.getIdUsuario());
        response.setNombre(usuario.getNombre());
        response.setDni(usuario.getDni());
        response.setEmail(usuario.getEmail());
        response.setRol(usuario.getRol());
        response.setEstado(usuario.getEstado());
        
        return response;
    }

    public Optional<Usuario> buscarPorDni(String dni) {
        return usuarioRepository.findByDni(dni);
    }

    public List<UsuarioMultaDTO> obtenerUsuariosConDetalleMultas() {
        List<Usuario> usuarios = usuarioRepository.findAll().stream()
                .filter(u -> u.getMultasAcumuladas() > 0 || u.getSuspendidoHasta() != null)
                .toList();

        List<UsuarioMultaDTO> resultado = new ArrayList<>();

        for (Usuario u : usuarios) {
            List<Multa> historial = multaRepository.findByUsuarioIdUsuario(u.getIdUsuario());
            resultado.add(new UsuarioMultaDTO(u, historial));
        }

        return resultado;
    }

    @Transactional
    public Usuario sumarMultaAdmin(Long idUsuario) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        usuario.setMultasAcumuladas(usuario.getMultasAcumuladas() + 1);

        String motivo = "Multa aplicada manualmente por el administrador";
        Multa multa = new Multa();
        multa.setUsuario(usuario);
        multa.setFechaMulta(LocalDateTime.now());
        multa.setMotivo(motivo);
        multaRepository.save(multa);

        // Si llega a 3 multas, suspende por 15 días y resetea el contador a 0
        if (usuario.getMultasAcumuladas() >= 3) {
            usuario.setSuspendidoHasta(LocalDateTime.now().plusDays(15));
            usuario.setMultasAcumuladas(0);
        }

        Usuario usuarioGuardado = usuarioRepository.save(usuario);

        // Enviar correo de notificación de multa
        if (usuarioGuardado.getEmail() != null && !usuarioGuardado.getEmail().contains("@sinteticosporting.local")) {
            try {
                emailService.enviarCorreoMulta(usuarioGuardado.getEmail(), usuarioGuardado.getNombre(), motivo, usuarioGuardado.getMultasAcumuladas());
            } catch (Exception e) {
                System.err.println("Error al enviar correo de multa manual: " + e.getMessage());
            }
        }

        return usuarioGuardado;
    }

    @Transactional
    public Usuario quitarMultaAdmin(Long idUsuario) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (usuario.getMultasAcumuladas() > 0) {
            usuario.setMultasAcumuladas(usuario.getMultasAcumuladas() - 1);
        }
        
        if (usuario.getSuspendidoHasta() != null) {
            usuario.setSuspendidoHasta(null);
        }

        return usuarioRepository.save(usuario);
    }
}