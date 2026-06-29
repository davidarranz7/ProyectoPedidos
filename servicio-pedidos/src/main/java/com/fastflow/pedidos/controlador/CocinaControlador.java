package com.fastflow.pedidos.controlador;

import com.fastflow.pedidos.dto.PedidoResponse;
import com.fastflow.pedidos.servicio.PedidoServicio;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cocina")
@RequiredArgsConstructor
public class CocinaControlador {

    private final PedidoServicio pedidoServicio;

    @GetMapping("/hamburguesas")
    public List<PedidoResponse> listarPedidosHamburguesas() {
        return pedidoServicio.listarPedidosCocinaHamburguesas();
    }
}