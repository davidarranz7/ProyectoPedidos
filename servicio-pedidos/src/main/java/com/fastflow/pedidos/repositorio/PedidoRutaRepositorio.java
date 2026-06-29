package com.fastflow.pedidos.repositorio;

import com.fastflow.pedidos.modelo.PedidoRuta;
import com.fastflow.pedidos.modelo.enums.EstadoPedidoRuta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PedidoRutaRepositorio extends JpaRepository<PedidoRuta, Long> {

    List<PedidoRuta> findByRutaReparto_IdOrderByOrdenEntregaAsc(Long rutaRepartoId);

    Optional<PedidoRuta> findByPedido_Id(Long pedidoId);

    List<PedidoRuta> findByRutaReparto_Motero_IdAndEstadoInOrderByOrdenEntregaAsc(
            Long moteroId,
            List<EstadoPedidoRuta> estados
    );
}