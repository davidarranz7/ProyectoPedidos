package com.fastflow.pedidos.repositorio;

import com.fastflow.pedidos.modelo.LineaPedido;
import com.fastflow.pedidos.modelo.ModificacionProducto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ModificacionProductoRepositorio extends JpaRepository<ModificacionProducto, Long> {

    // Busca modificaciones de una línea concreta del pedido
    List<ModificacionProducto> findByLineaPedido(LineaPedido lineaPedido);
}