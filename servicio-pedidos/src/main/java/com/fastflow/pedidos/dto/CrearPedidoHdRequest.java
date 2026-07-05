package com.fastflow.pedidos.dto;

import com.fastflow.pedidos.modelo.enums.PlataformaPedido;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrearPedidoHdRequest {

    private String idExterno;

    private PlataformaPedido plataforma;

    private String clienteNombre;

    private String clienteDireccion;

    private String clienteTelefono;

    private BigDecimal total;

    private Boolean pagado;

    private LocalDateTime fechaProgramada;

    @Builder.Default
    private List<CrearLineaPedidoRequest> lineas = new ArrayList<>();
}
