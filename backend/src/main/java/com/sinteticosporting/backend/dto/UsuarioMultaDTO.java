package com.sinteticosporting.backend.dto;

import com.sinteticosporting.backend.entity.Multa;
import com.sinteticosporting.backend.entity.Usuario;
import java.util.List;

public class UsuarioMultaDTO {
    private Usuario usuario;
    private List<Multa> historialMultas;

    public UsuarioMultaDTO(Usuario usuario, List<Multa> historialMultas) {
        this.usuario = usuario;
        this.historialMultas = historialMultas;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public List<Multa> getHistorialMultas() {
        return historialMultas;
    }

    public void setHistorialMultas(List<Multa> historialMultas) {
        this.historialMultas = historialMultas;
    }
}