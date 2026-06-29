package com.fastflow.pedidos.mapper;

import com.fastflow.pedidos.dto.PedidoRutaResponse;
import com.fastflow.pedidos.dto.RutaRepartoResponse;
import com.fastflow.pedidos.modelo.PedidoRuta;
import com.fastflow.pedidos.modelo.RutaReparto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class RutaRepartoMapper {

    private final PedidoMapper pedidoMapper;

    public RutaRepartoResponse convertirRuta(
            RutaReparto rutaReparto,
            List<PedidoRuta> pedidosRuta
    ) {
        if (rutaReparto == null) {
            return null;
        }

        return RutaRepartoResponse.builder()
                .id(rutaReparto.getId())
                .motero(pedidoMapper.convertirMotero(rutaReparto.getMotero()))
                .estado(rutaReparto.getEstado())
                .fechaCreacion(rutaReparto.getFechaCreacion())
                .fechaAvisada(rutaReparto.getFechaAvisada())
                .fechaInicioRuta(rutaReparto.getFechaInicioRuta())
                .fechaFinalizacion(rutaReparto.getFechaFinalizacion())
                .pedidos(convertirPedidosRuta(pedidosRuta))
                .build();
    }

    public PedidoRutaResponse convertirPedidoRuta(PedidoRuta pedidoRuta) {
        if (pedidoRuta == null) {
            return null;
        }

        return PedidoRutaResponse.builder()
                .id(pedidoRuta.getId())
                .ordenEntrega(pedidoRuta.getOrdenEntrega())
                .estado(pedidoRuta.getEstado())
                .fechaInicioTramo(pedidoRuta.getFechaInicioTramo())
                .fechaEntregado(pedidoRuta.getFechaEntregado())
                .duracionTramoSegundos(pedidoRuta.getDuracionTramoSegundos())
                .pedido(pedidoMapper.convertirPedido(pedidoRuta.getPedido()))
                .build();
    }

    public List<PedidoRutaResponse> convertirPedidosRuta(List<PedidoRuta> pedidosRuta) {
        if (pedidosRuta == null) {
            return new ArrayList<>();
        }

        return pedidosRuta.stream()
                .map(this::convertirPedidoRuta)
                .toList();
    }
}