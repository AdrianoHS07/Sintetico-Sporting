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
    private String descripcion;
    private double valorPorHora;
}
