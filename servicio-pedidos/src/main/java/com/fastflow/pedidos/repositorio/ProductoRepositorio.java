package com.fastflow.pedidos.repositorio;

import com.fastflow.pedidos.modelo.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductoRepositorio extends JpaRepository<Producto, Long> {

    List<Producto> findByActivoTrue();

    List<Producto> findByCategoria(String categoria);

    List<Producto> findByCategoriaAndActivoTrue(String categoria);
}
