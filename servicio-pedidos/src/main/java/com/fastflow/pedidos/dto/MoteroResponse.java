package com.fastflow.pedidos.dto;

import com.fastflow.pedidos.modelo.enums.EstadoMotero;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MoteroResponse {

    private Long id;

    private String nombre;

    private EstadoMotero estado;

    private Boolean activo;
}