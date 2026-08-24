package com.sinteticosporting.backend.entity;

import java.time.LocalDate;

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
public class Pago {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long idPago;
    private String estadoPago;
    private String metodo;
    private double monto;
    private LocalDate fechaPago;

    @ManyToOne
    private Reserva reserva;
}
