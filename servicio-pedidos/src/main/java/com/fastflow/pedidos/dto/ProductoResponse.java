package com.fastflow.pedidos.dto;

import com.fastflow.pedidos.modelo.enums.CategoriaProducto;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductoResponse {

    private Long id;

    private String nombre;

    private CategoriaProducto categoria;

    private BigDecimal precio;

    private Boolean activo;
}