package com.sinteticosporting.backend.repository;

import com.sinteticosporting.backend.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Método para buscar al usuario comodín o por email
    Optional<Usuario> findByEmail(String email);

    // Método clave para buscar clientes presenciales recurrentes por su DNI
    Optional<Usuario> findByDni(String dni);
}