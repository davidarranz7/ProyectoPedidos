package com.fastflow.pedidos.controlador;

import com.fastflow.pedidos.dto.RutaRepartoResponse;
import com.fastflow.pedidos.servicio.RutaRepartoServicio;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rutas-reparto")
@RequiredArgsConstructor
public class RutaRepartoControlador {

    private final RutaRepartoServicio rutaRepartoServicio;

    @GetMapping("/activas")
    public List<RutaRepartoResponse> listarRutasActivas() {
        return rutaRepartoServicio.listarRutasActivas();
    }

    @GetMapping("/motero/{moteroId}/activa")
    public RutaRepartoResponse obtenerRutaActivaMotero(@PathVariable Long moteroId) {
        return rutaRepartoServicio.obtenerRutaActivaMotero(moteroId);
    }

    @PutMapping("/{rutaId}/avisar")
    public RutaRepartoResponse avisarRuta(@PathVariable Long rutaId) {
        return rutaRepartoServicio.avisarRuta(rutaId);
    }

    @PutMapping("/{rutaId}/recoger")
    public RutaRepartoResponse recogerRuta(@PathVariable Long rutaId) {
        return rutaRepartoServicio.recogerRuta(rutaId);
    }

    @PutMapping("/pedidos-ruta/{pedidoRutaId}/seleccionar")
    public RutaRepartoResponse seleccionarPedidoRuta(@PathVariable Long pedidoRutaId) {
        return rutaRepartoServicio.seleccionarPedidoRuta(pedidoRutaId);
    }

    @PutMapping("/pedidos-ruta/{pedidoRutaId}/entregar")
    public RutaRepartoResponse entregarPedidoRuta(@PathVariable Long pedidoRutaId) {
        return rutaRepartoServicio.entregarPedidoRuta(pedidoRutaId);
    }
}