package com.sinteticosporting.backend.entity;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Reserva {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long idReserva;
    private LocalDate fecha;
    private LocalTime hora;
    private double precio;
    private String estado;

    @ManyToOne
    private Usuario usuario;

    @ManyToOne
    private Cancha cancha;
}
