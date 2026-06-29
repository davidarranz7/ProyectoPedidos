package com.fastflow.pedidos.dto;

import com.fastflow.pedidos.modelo.enums.EstadoPedidoRuta;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PedidoRutaResponse {

    private Long id;

    private Integer ordenEntrega;

    private EstadoPedidoRuta estado;

    private LocalDateTime fechaInicioTramo;

    private LocalDateTime fechaEntregado;

    private Long duracionTramoSegundos;

    private PedidoResponse pedido;
}