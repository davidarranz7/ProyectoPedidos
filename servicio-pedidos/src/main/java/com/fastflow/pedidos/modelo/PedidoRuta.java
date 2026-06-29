package com.fastflow.pedidos.modelo;

import com.fastflow.pedidos.modelo.enums.EstadoPedidoRuta;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "pedidos_ruta")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PedidoRuta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Ruta a la que pertenece este pedido
    @ManyToOne(optional = false)
    @JoinColumn(name = "ruta_reparto_id", nullable = false)
    private RutaReparto rutaReparto;

    // Pedido real del sistema
    @ManyToOne(optional = false)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    // Orden de entrega dentro de la ruta
    @Column(nullable = false)
    private Integer ordenEntrega;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoPedidoRuta estado = EstadoPedidoRuta.PENDIENTE;

    private LocalDateTime fechaInicioTramo;

    private LocalDateTime fechaEntregado;

    private Long duracionTramoSegundos;
}