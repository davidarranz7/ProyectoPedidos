package com.fastflow.pedidos.repositorio;

import com.fastflow.pedidos.modelo.LineaPedido;
import com.fastflow.pedidos.modelo.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LineaPedidoRepositorio extends JpaRepository<LineaPedido, Long> {

    List<LineaPedido> findByPedido(Pedido pedido);
}
