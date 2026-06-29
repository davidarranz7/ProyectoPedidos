package com.fastflow.pedidos.controlador;

import com.fastflow.pedidos.dto.MoteroResponse;
import com.fastflow.pedidos.dto.PedidoResponse;
import com.fastflow.pedidos.servicio.MoteroServicio;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/moteros")
@RequiredArgsConstructor
public class MoteroControlador {

    private final MoteroServicio moteroServicio;

    @GetMapping
    public List<MoteroResponse> listarMoteros() {
        return moteroServicio.listarMoteros();
    }

    @GetMapping("/disponibles")
    public List<MoteroResponse> listarMoterosDisponibles() {
        return moteroServicio.listarMoterosDisponibles();
    }

    @GetMapping("/{id}/pedido-activo")
    public PedidoResponse obtenerPedidoActivoMotero(@PathVariable Long id) {
        return moteroServicio.obtenerPedidoActivoMotero(id);
    }

    @PutMapping("/{id}/fichar")
    public MoteroResponse ficharMotero(@PathVariable Long id) {
        return moteroServicio.ficharMotero(id);
    }

    @PutMapping("/{id}/desconectar")
    public MoteroResponse desconectarMotero(@PathVariable Long id) {
        return moteroServicio.desconectarMotero(id);
    }

    @PutMapping("/{id}/pedido-activo/recoger")
    public PedidoResponse recogerPedidoActivo(@PathVariable Long id) {
        return moteroServicio.recogerPedidoActivo(id);
    }

    @PutMapping("/{id}/pedido-activo/entregar")
    public PedidoResponse entregarPedidoActivo(@PathVariable Long id) {
        return moteroServicio.entregarPedidoActivo(id);
    }
}