package com.sinteticosporting.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sinteticosporting.backend.entity.Usuario;
import com.sinteticosporting.backend.service.UsuarioService;
import com.sinteticosporting.backend.dto.LoginRequest;
import com.sinteticosporting.backend.dto.LoginResponse;

@RestController
@RequestMapping("/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {
    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping("/registro")
    public Usuario registrar(@RequestBody Usuario usuario) {
        // Garantiza que todo registro desde el formulario sea siempre de rol USUARIO
        usuario.setRol("USUARIO");
        return usuarioService.registrarUsuario(usuario);
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest loginRequest) {
        return usuarioService.login(
            loginRequest.getEmail(),
            loginRequest.getContraseña()
        );
    }

    // Endpoint para buscar usuario por DNI (usado en el modal de reservas del admin)
    @GetMapping("/dni/{dni}")
    public ResponseEntity<Usuario> buscarPorDni(@PathVariable String dni) {
        return usuarioService.buscarPorDni(dni)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}