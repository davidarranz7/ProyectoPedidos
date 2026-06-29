package com.fastflow.pedidos.dto;

import com.fastflow.pedidos.modelo.enums.TipoModificacion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrearModificacionRequest {

    @NotNull(message = "El tipo de modificación es obligatorio")
    private TipoModificacion tipo;

    @NotBlank(message = "La descripción de la modificación es obligatoria")
    private String descripcion;
}