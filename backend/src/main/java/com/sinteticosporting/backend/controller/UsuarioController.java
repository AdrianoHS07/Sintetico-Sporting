package com.sinteticosporting.backend.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sinteticosporting.backend.entity.Usuario;
import com.sinteticosporting.backend.service.UsuarioService;
import com.sinteticosporting.backend.dto.LoginRequest;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {
    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping("/registro")
    public Usuario registrar(@RequestBody Usuario usuario) {

        return usuarioService.registrarUsuario(usuario);
    }

    @PostMapping("/login")
    public String login(@RequestBody LoginRequest loginRequest) {

        usuarioService.login(
            loginRequest.getEmail(),
            loginRequest.getContraseña()
        );

        return "Login correcto";
    }
}
