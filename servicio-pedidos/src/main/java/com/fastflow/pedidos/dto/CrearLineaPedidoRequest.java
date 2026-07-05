package com.fastflow.pedidos.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrearLineaPedidoRequest {

    // Opcional: producto interno usado por el simulador o entrada manual
    private Long productoId;

    // Opcional: código que vendrá de Glovo, Uber, Just Eat o Popeyes Delivery
    private String codigoProductoExterno;

    // Nombre real recibido desde la plataforma
    private String nombreProducto;

    // Precio unitario recibido desde la plataforma
    private BigDecimal precioUnitario;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad mínima es 1")
    private Integer cantidad;

    @Valid
    @Builder.Default
    private List<CrearModificacionRequest> modificaciones = new ArrayList<>();
}
