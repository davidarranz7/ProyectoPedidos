package com.fastflow.pedidos.controlador;

import com.fastflow.pedidos.dto.EntregasResponse;
import com.fastflow.pedidos.servicio.EntregasServicio;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/entregas")
@RequiredArgsConstructor
public class EntregasControlador {

    private final EntregasServicio entregasServicio;

    @GetMapping
    public EntregasResponse listarPedidosEntregas() {
        return entregasServicio.listarPedidosEntregas();
    }

    @PutMapping("/{pedidoId}/listo")
    public EntregasResponse marcarPedidoListo(@PathVariable Long pedidoId) {
        return entregasServicio.marcarPedidoListo(pedidoId);
    }

    @PutMapping("/{pedidoId}/entregado")
    public EntregasResponse marcarPedidoEntregado(@PathVariable Long pedidoId) {
        return entregasServicio.marcarPedidoEntregado(pedidoId);
    }
}