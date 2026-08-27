package com.sinteticosporting.backend.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.sinteticosporting.backend.dto.LoginResponse;
import com.sinteticosporting.backend.entity.Usuario;
import com.sinteticosporting.backend.repository.UsuarioRepository;

@Service
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
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
}
