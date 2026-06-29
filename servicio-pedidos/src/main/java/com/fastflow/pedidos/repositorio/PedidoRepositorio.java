package com.fastflow.pedidos.repositorio;

import com.fastflow.pedidos.modelo.Pedido;
import com.fastflow.pedidos.modelo.enums.EstadoPedido;
import com.fastflow.pedidos.modelo.enums.OrigenPedido;
import com.fastflow.pedidos.modelo.enums.PlataformaPedido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PedidoRepositorio extends JpaRepository<Pedido, Long> {

    Optional<Pedido> findByNumeroPedido(String numeroPedido);

    List<Pedido> findByOrigenOrderByFechaCreacionDesc(OrigenPedido origen);

    List<Pedido> findByPlataformaOrderByFechaCreacionDesc(PlataformaPedido plataforma);

    List<Pedido> findByEstadoOrderByFechaCreacionDesc(EstadoPedido estado);

    List<Pedido> findByOrigenAndEstadoOrderByFechaCreacionDesc(
            OrigenPedido origen,
            EstadoPedido estado
    );

    List<Pedido> findAllByOrderByFechaCreacionDesc();

    long countByNumeroPedidoStartingWithAndFechaCreacionBetween(
            String prefijo,
            LocalDateTime inicioDia,
            LocalDateTime finDia
    );

    Optional<Pedido> findFirstByMoteroAsignado_IdAndEstadoInOrderByFechaCreacionDesc(
            Long moteroId,
            List<EstadoPedido> estados
    );

    List<Pedido> findByEstadoAndFechaProgramadaLessThanEqual(
            EstadoPedido estado,
            LocalDateTime fechaProgramada
    );

    long countByMoteroAsignado_IdAndEstadoIn(
            Long moteroId,
            List<EstadoPedido> estados
    );

    List<Pedido> findByMoteroAsignado_IdAndEstadoInOrderByFechaCreacionAsc(
            Long moteroId,
            List<EstadoPedido> estados
    );

    List<Pedido> findByEstadoAndMoteroAsignadoIsNullOrderByFechaCreacionAsc(
            EstadoPedido estado
    );

    boolean existsByEstadoAndMoteroAsignado_Id(
            EstadoPedido estado,
            Long moteroId
    );

    long countByMoteroAsignado_IdAndFechaCreacionBetween(
            Long moteroId,
            LocalDateTime inicioDia,
            LocalDateTime finDia
    );
}