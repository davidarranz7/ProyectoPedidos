package com.fastflow.pedidos.controlador;

import com.fastflow.pedidos.dto.CrearPedidoHdRequest;
import com.fastflow.pedidos.dto.PedidoResponse;
import com.fastflow.pedidos.servicio.PedidoServicio;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hd/pedidos")
@RequiredArgsConstructor
public class PedidoHdControlador {

    private final PedidoServicio pedidoServicio;

    @PostMapping
    public PedidoResponse crearPedidoHd(@RequestBody CrearPedidoHdRequest request) {
        return pedidoServicio.crearPedidoHd(request);
    }

    @GetMapping
    public List<PedidoResponse> listarPedidosHd() {
        return pedidoServicio.listarPedidosHd();
    }

    @PutMapping("/{id}/preparado")
    public PedidoResponse marcarPedidoPreparadoYAvisarMotero(@PathVariable Long id) {
        return pedidoServicio.marcarPedidoPreparadoYAvisarMotero(id);
    }
}