package com.sinteticosporting.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sinteticosporting.backend.entity.Usuario;
import com.sinteticosporting.backend.entity.Multa;
import com.sinteticosporting.backend.service.UsuarioService;
import com.sinteticosporting.backend.repository.MultaRepository;
import com.sinteticosporting.backend.dto.LoginRequest;
import com.sinteticosporting.backend.dto.LoginResponse;
import com.sinteticosporting.backend.dto.UsuarioMultaDTO;

import java.util.List;

@RestController
@RequestMapping("/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {
    
    private final UsuarioService usuarioService;
    private final MultaRepository multaRepository;

    public UsuarioController(UsuarioService usuarioService, MultaRepository multaRepository) {
        this.usuarioService = usuarioService;
        this.multaRepository = multaRepository;
    }

    @PostMapping("/registro")
    public Usuario registrar(@RequestBody Usuario usuario) {
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

    @GetMapping("/dni/{dni}")
    public ResponseEntity<Usuario> buscarPorDni(@PathVariable String dni) {
        return usuarioService.buscarPorDni(dni)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/multados")
    public ResponseEntity<List<UsuarioMultaDTO>> listarMultados() {
        return ResponseEntity.ok(usuarioService.obtenerUsuariosConDetalleMultas());
    }

    @PutMapping("/multa/sumar/{id}")
    public ResponseEntity<Usuario> sumarMulta(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.sumarMultaAdmin(id));
    }

    @PutMapping("/multa/quitar/{id}")
    public ResponseEntity<Usuario> quitarMulta(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.quitarMultaAdmin(id));
    }

    // Endpoint para que el usuario consulte sus propias multas
    @GetMapping("/{idUsuario}/multas")
    public ResponseEntity<List<Multa>> obtenerMultasDeUsuario(@PathVariable Long idUsuario) {
        List<Multa> multas = multaRepository.findByUsuarioIdUsuario(idUsuario);
        return ResponseEntity.ok(multas);
    }
}