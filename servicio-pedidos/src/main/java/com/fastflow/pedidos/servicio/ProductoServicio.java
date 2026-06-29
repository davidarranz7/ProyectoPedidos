package com.fastflow.pedidos.servicio;

import com.fastflow.pedidos.dto.ProductoResponse;
import com.fastflow.pedidos.mapper.PedidoMapper;
import com.fastflow.pedidos.repositorio.ProductoRepositorio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoServicio {

    private final ProductoRepositorio productoRepositorio;
    private final PedidoMapper pedidoMapper;

    @Transactional(readOnly = true)
    public List<ProductoResponse> listarProductosActivos() {
        return productoRepositorio.findByActivoTrue()
                .stream()
                .map(pedidoMapper::convertirProducto)
                .toList();
    }
}