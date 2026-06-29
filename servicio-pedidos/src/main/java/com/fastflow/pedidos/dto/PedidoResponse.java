package com.fastflow.pedidos.dto;

import com.fastflow.pedidos.modelo.enums.EstadoPedido;
import com.fastflow.pedidos.modelo.enums.OrigenPedido;
import com.fastflow.pedidos.modelo.enums.PlataformaPedido;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PedidoResponse {

    private Long id;

    private String numeroPedido;

    private OrigenPedido origen;

    private PlataformaPedido plataforma;

    private EstadoPedido estado;

    private String clienteNombre;

    private String clienteDireccion;

    private String clienteTelefono;

    private MoteroResponse moteroAsignado;

    private LocalDateTime fechaCreacion;

    private LocalDateTime fechaProgramada;

    private LocalDateTime fechaPreparado;

    private LocalDateTime fechaRecogidoEstablecimiento;

    private LocalDateTime fechaEnCamino;

    private LocalDateTime fechaEntregado;

    @Builder.Default
    private List<LineaPedidoResponse> lineas = new ArrayList<>();
}