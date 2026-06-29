package com.fastflow.pedidos.repositorio;

import com.fastflow.pedidos.modelo.LineaPedido;
import com.fastflow.pedidos.modelo.Pedido;
import com.fastflow.pedidos.modelo.enums.CategoriaProducto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LineaPedidoRepositorio extends JpaRepository<LineaPedido, Long> {

    // Busca las líneas de un pedido concreto
    List<LineaPedido> findByPedido(Pedido pedido);

    // Busca líneas por categoría del producto
    List<LineaPedido> findByProductoCategoria(CategoriaProducto categoria);

    // Busca líneas de pedido por varias categorías
    List<LineaPedido> findByProductoCategoriaIn(List<CategoriaProducto> categorias);
}