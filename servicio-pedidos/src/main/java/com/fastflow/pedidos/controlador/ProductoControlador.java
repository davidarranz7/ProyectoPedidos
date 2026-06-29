package com.fastflow.pedidos.controlador;

import com.fastflow.pedidos.dto.ProductoResponse;
import com.fastflow.pedidos.servicio.ProductoServicio;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoControlador {

    private final ProductoServicio productoServicio;

    @GetMapping
    public List<ProductoResponse> listarProductosActivos() {
        return productoServicio.listarProductosActivos();
    }
}