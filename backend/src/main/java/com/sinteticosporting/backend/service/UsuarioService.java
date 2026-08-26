package com.sinteticosporting.backend.service;

import org.springframework.stereotype.Service;

import com.sinteticosporting.backend.entity.Usuario;
import com.sinteticosporting.backend.repository.UsuarioRepository;

@Service
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public Usuario registrarUsuario(Usuario usuario) {

        if (usuarioRepository.findByEmail(usuario.getEmail()).isPresent()) {
            throw new RuntimeException("El email ya está registrado");
        }

        return usuarioRepository.save(usuario);
    }
}
