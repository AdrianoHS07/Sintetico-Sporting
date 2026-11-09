package com.sinteticosporting.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Cancha {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long idCancha;
    
    private int numero;
    private String modalidad; // Ej: Fútbol 5, Fútbol 7, etc.
    private String descripcion;
    private double valorReserva;     // Renombrado desde valorPorHora
    private double valorFinalTurno;  // Valor final del turno
    private String estado = "ACTIVA"; // Valores: ACTIVA, SUSPENDIDA
}