package com.fastflow.pedidos.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModificacionResponse {

    private Long id;

    private String codigoExterno;

    private String nombre;

    private String tipo;

    private BigDecimal precio;
}
