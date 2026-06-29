package com.fastflow.pedidos.dto;

import com.fastflow.pedidos.modelo.enums.TipoModificacion;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModificacionResponse {

    private Long id;

    private TipoModificacion tipo;

    private String descripcion;
}