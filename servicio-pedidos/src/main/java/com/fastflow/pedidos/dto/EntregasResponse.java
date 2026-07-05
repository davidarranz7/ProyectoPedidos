package com.fastflow.pedidos.dto;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntregasResponse {

    @Builder.Default
    private List<PedidoEntregaResponse> kioskoSinPagar = new ArrayList<>();

    @Builder.Default
    private List<PedidoEntregaResponse> enPreparacion = new ArrayList<>();

    @Builder.Default
    private List<PedidoEntregaResponse> listos = new ArrayList<>();
}