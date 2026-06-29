package com.fastflow.pedidos.dto;

import com.fastflow.pedidos.modelo.enums.EstadoRutaReparto;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RutaRepartoResponse {

    private Long id;

    private MoteroResponse motero;

    private EstadoRutaReparto estado;

    private LocalDateTime fechaCreacion;

    private LocalDateTime fechaAvisada;

    private LocalDateTime fechaInicioRuta;

    private LocalDateTime fechaFinalizacion;

    @Builder.Default
    private List<PedidoRutaResponse> pedidos = new ArrayList<>();
}