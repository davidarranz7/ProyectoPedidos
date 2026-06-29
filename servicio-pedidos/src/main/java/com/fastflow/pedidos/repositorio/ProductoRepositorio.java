package com.fastflow.pedidos.repositorio;

import com.fastflow.pedidos.modelo.Producto;
import com.fastflow.pedidos.modelo.enums.CategoriaProducto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductoRepositorio extends JpaRepository<Producto, Long> {

    // Busca productos activos
    List<Producto> findByActivoTrue();

    // Busca productos por categoría
    List<Producto> findByCategoria(CategoriaProducto categoria);

    // Busca productos activos por categoría
    List<Producto> findByCategoriaAndActivoTrue(CategoriaProducto categoria);
}