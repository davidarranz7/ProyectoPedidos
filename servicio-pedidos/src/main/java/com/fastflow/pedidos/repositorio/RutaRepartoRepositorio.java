package com.fastflow.pedidos.repositorio;

import com.fastflow.pedidos.modelo.RutaReparto;
import com.fastflow.pedidos.modelo.enums.EstadoRutaReparto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RutaRepartoRepositorio extends JpaRepository<RutaReparto, Long> {

    List<RutaReparto> findByEstadoInOrderByFechaCreacionDesc(
            List<EstadoRutaReparto> estados
    );

    Optional<RutaReparto> findFirstByMotero_IdAndEstadoInOrderByFechaCreacionDesc(
            Long moteroId,
            List<EstadoRutaReparto> estados
    );
}