package com.sinteticosporting.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginResponse {

    private long idUsuario;
    private String nombre;
    private String dni;
    private String email;
    private String rol;
    private String estado;
}