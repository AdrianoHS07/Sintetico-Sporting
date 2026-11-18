package com.sinteticosporting.backend.repository;

import com.sinteticosporting.backend.entity.Multa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MultaRepository extends JpaRepository<Multa, Long> {
    List<Multa> findByUsuarioIdUsuario(Long idUsuario);
}