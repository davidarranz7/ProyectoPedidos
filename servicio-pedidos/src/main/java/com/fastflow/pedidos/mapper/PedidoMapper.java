package com.fastflow.pedidos.mapper;

import com.fastflow.pedidos.dto.LineaPedidoResponse;
import com.fastflow.pedidos.dto.ModificacionResponse;
import com.fastflow.pedidos.dto.MoteroResponse;
import com.fastflow.pedidos.dto.PedidoResponse;
import com.fastflow.pedidos.dto.ProductoResponse;
import com.fastflow.pedidos.modelo.LineaPedido;
import com.fastflow.pedidos.modelo.ModificacionProducto;
import com.fastflow.pedidos.modelo.Motero;
import com.fastflow.pedidos.modelo.Pedido;
import com.fastflow.pedidos.modelo.Producto;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class PedidoMapper {

    public PedidoResponse convertirPedido(Pedido pedido) {
        if (pedido == null) {
            return null;
        }

        return PedidoResponse.builder()
                .id(pedido.getId())
                .numeroPedido(pedido.getNumeroPedido())
                .origen(pedido.getOrigen())
                .plataforma(pedido.getPlataforma())
                .estado(pedido.getEstado())
                .clienteNombre(pedido.getClienteNombre())
                .clienteDireccion(pedido.getClienteDireccion())
                .clienteTelefono(pedido.getClienteTelefono())
                .moteroAsignado(convertirMotero(pedido.getMoteroAsignado()))
                .fechaCreacion(pedido.getFechaCreacion())
                .fechaProgramada(pedido.getFechaProgramada())
                .fechaPreparado(pedido.getFechaPreparado())
                .fechaRecogidoEstablecimiento(pedido.getFechaRecogidoEstablecimiento())
                .fechaEnCamino(pedido.getFechaEnCamino())
                .fechaEntregado(pedido.getFechaEntregado())
                .lineas(convertirLineas(pedido.getLineas()))
                .build();
    }

    public ProductoResponse convertirProducto(Producto producto) {
        if (producto == null) {
            return null;
        }

        return ProductoResponse.builder()
                .id(producto.getId())
                .nombre(producto.getNombre())
                .categoria(producto.getCategoria())
                .precio(producto.getPrecio())
                .activo(producto.getActivo())
                .build();
    }

    public MoteroResponse convertirMotero(Motero motero) {
        if (motero == null) {
            return null;
        }

        return MoteroResponse.builder()
                .id(motero.getId())
                .nombre(motero.getNombre())
                .estado(motero.getEstado())
                .activo(motero.getActivo())
                .build();
    }

    public LineaPedidoResponse convertirLinea(LineaPedido lineaPedido) {
        if (lineaPedido == null) {
            return null;
        }

        return LineaPedidoResponse.builder()
                .id(lineaPedido.getId())
                .producto(convertirProducto(lineaPedido.getProducto()))
                .cantidad(lineaPedido.getCantidad())
                .modificaciones(convertirModificaciones(lineaPedido.getModificaciones()))
                .build();
    }

    public ModificacionResponse convertirModificacion(ModificacionProducto modificacionProducto) {
        if (modificacionProducto == null) {
            return null;
        }

        return ModificacionResponse.builder()
                .id(modificacionProducto.getId())
                .tipo(modificacionProducto.getTipo())
                .descripcion(modificacionProducto.getDescripcion())
                .build();
    }

    public List<PedidoResponse> convertirPedidos(List<Pedido> pedidos) {
        if (pedidos == null) {
            return new ArrayList<>();
        }

        return pedidos.stream()
                .map(this::convertirPedido)
                .toList();
    }

    public List<LineaPedidoResponse> convertirLineas(List<LineaPedido> lineas) {
        if (lineas == null) {
            return new ArrayList<>();
        }

        return lineas.stream()
                .map(this::convertirLinea)
                .toList();
    }

    public List<ModificacionResponse> convertirModificaciones(List<ModificacionProducto> modificaciones) {
        if (modificaciones == null) {
            return new ArrayList<>();
        }

        return modificaciones.stream()
                .map(this::convertirModificacion)
                .toList();
    }

    public List<MoteroResponse> convertirMoteros(List<Motero> moteros) {
        if (moteros == null) {
            return new ArrayList<>();
        }

        return moteros.stream()
                .map(this::convertirMotero)
                .toList();
    }
}