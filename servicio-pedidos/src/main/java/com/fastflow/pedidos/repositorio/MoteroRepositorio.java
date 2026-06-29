package com.fastflow.pedidos.repositorio;

import com.fastflow.pedidos.modelo.Motero;
import com.fastflow.pedidos.modelo.enums.EstadoMotero;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MoteroRepositorio extends JpaRepository<Motero, Long> {

    // Busca moteros activos
    List<Motero> findByActivoTrue();

    // Busca moteros por estado
    List<Motero> findByEstado(EstadoMotero estado);

    // Busca moteros activos por estado
    List<Motero> findByEstadoAndActivoTrue(EstadoMotero estado);
}