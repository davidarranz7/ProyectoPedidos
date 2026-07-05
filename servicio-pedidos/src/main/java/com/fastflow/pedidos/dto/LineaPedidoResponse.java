package com.fastflow.pedidos.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LineaPedidoResponse {

    private Long id;

    private ProductoResponse producto;

    private String codigoProductoExterno;

    private String nombreProducto;

    private BigDecimal precioUnitario;

    private Integer cantidad;

    @Builder.Default
    private List<ModificacionResponse> modificaciones = new ArrayList<>();
}
