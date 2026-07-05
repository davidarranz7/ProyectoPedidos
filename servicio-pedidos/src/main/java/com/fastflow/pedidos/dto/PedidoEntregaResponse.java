package com.fastflow.pedidos.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PedidoEntregaResponse {

    private Long id;

    private String numeroPedido;

    private String clienteNombre;

    private String resumen;

    private String horaEntrada;
}