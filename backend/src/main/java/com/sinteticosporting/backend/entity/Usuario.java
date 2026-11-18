package com.sinteticosporting.backend.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long idUsuario;
    
    private String nombre;
    
    @Column(unique = true)
    private String dni;
    
    private String telefono;
    private String email;
    private String contraseña;
    private String rol;
    private String estado;

    // CAMPOS PARA EL SISTEMA DE MULTAS Y SUSPENSIONES
    @Column(nullable = false)
    private int multasAcumuladas = 0;

    private LocalDateTime suspendidoHasta;
}