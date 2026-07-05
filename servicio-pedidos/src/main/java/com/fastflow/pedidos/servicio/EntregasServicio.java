package com.fastflow.pedidos.servicio;

import com.fastflow.pedidos.dto.EntregasResponse;
import com.fastflow.pedidos.dto.PedidoEntregaResponse;
import com.fastflow.pedidos.modelo.LineaPedido;
import com.fastflow.pedidos.modelo.Pedido;
import com.fastflow.pedidos.modelo.enums.EstadoPedido;
import com.fastflow.pedidos.modelo.enums.OrigenPedido;
import com.fastflow.pedidos.repositorio.PedidoRepositorio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EntregasServicio {

    private final PedidoRepositorio pedidoRepositorio;

    @Transactional(readOnly = true)
    public EntregasResponse listarPedidosEntregas() {
        List<Pedido> pedidos = pedidoRepositorio.findAllByOrderByFechaCreacionDesc();

        List<PedidoEntregaResponse> enPreparacion = pedidos.stream()
                .filter(this::esPedidoDelivery)
                .filter(this::estaEnPreparacion)
                .map(this::convertirPedidoEntrega)
                .toList();

        List<PedidoEntregaResponse> listos = pedidos.stream()
                .filter(this::esPedidoDelivery)
                .filter(this::estaListoParaRecoger)
                .map(this::convertirPedidoEntrega)
                .toList();

        return EntregasResponse.builder()
                .kioskoSinPagar(List.of())
                .enPreparacion(enPreparacion)
                .listos(listos)
                .build();
    }

    @Transactional
    public EntregasResponse marcarPedidoListo(Long pedidoId) {
        Pedido pedido = pedidoRepositorio.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado con id: " + pedidoId));

        pedido.setEstado(EstadoPedido.PREPARADO);
        pedido.setFechaPreparado(LocalDateTime.now());

        pedidoRepositorio.save(pedido);

        return listarPedidosEntregas();
    }

    @Transactional
    public EntregasResponse marcarPedidoEntregado(Long pedidoId) {
        Pedido pedido = pedidoRepositorio.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado con id: " + pedidoId));

        pedido.setEstado(EstadoPedido.ENTREGADO);
        pedido.setFechaEntregado(LocalDateTime.now());

        pedidoRepositorio.save(pedido);

        return listarPedidosEntregas();
    }

    private boolean esPedidoDelivery(Pedido pedido) {
        return pedido.getOrigen() == OrigenPedido.DELIVERY;
    }

    private boolean estaEnPreparacion(Pedido pedido) {
        return pedido.getEstado() == EstadoPedido.RECIBIDO
                || pedido.getEstado() == EstadoPedido.EN_PREPARACION
                || pedido.getEstado() == EstadoPedido.PENDIENTE_ASIGNACION
                || pedido.getEstado() == EstadoPedido.ASIGNADO_MOTERO;
    }

    private boolean estaListoParaRecoger(Pedido pedido) {
        return pedido.getEstado() == EstadoPedido.PREPARADO
                || pedido.getEstado() == EstadoPedido.MOTERO_AVISADO;
    }

    private PedidoEntregaResponse convertirPedidoEntrega(Pedido pedido) {
        return PedidoEntregaResponse.builder()
                .id(pedido.getId())
                .numeroPedido(pedido.getNumeroPedido())
                .clienteNombre(obtenerNombreCliente(pedido))
                .resumen(obtenerResumenPedido(pedido))
                .horaEntrada(obtenerHoraEntrada(pedido))
                .build();
    }

    private String obtenerNombreCliente(Pedido pedido) {
        if (pedido.getClienteNombre() == null || pedido.getClienteNombre().isBlank()) {
            return "Cliente";
        }

        return pedido.getClienteNombre();
    }

    private String obtenerHoraEntrada(Pedido pedido) {
        if (pedido.getFechaCreacion() == null) {
            return "--:--";
        }

        return pedido.getFechaCreacion().format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    private String obtenerResumenPedido(Pedido pedido) {
        if (pedido.getLineas() == null || pedido.getLineas().isEmpty()) {
            return "Sin productos";
        }

        return pedido.getLineas()
                .stream()
                .map(this::obtenerTextoLinea)
                .toList()
                .stream()
                .reduce((actual, siguiente) -> actual + ", " + siguiente)
                .orElse("Sin productos");
    }

    private String obtenerTextoLinea(LineaPedido lineaPedido) {
        String nombreProducto = lineaPedido.getProducto() != null
                ? lineaPedido.getProducto().getNombre()
                : "Producto";

        return lineaPedido.getCantidad() + "x " + nombreProducto;
    }
}
