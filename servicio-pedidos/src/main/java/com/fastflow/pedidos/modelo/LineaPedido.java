package com.fastflow.pedidos.modelo;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lineas_pedido")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LineaPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Pedido al que pertenece esta línea
    @ManyToOne(optional = false)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    // Producto pedido
    @ManyToOne(optional = false)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    // Cantidad de ese producto
    @Column(nullable = false)
    private Integer cantidad;

    // Modificaciones de este producto
    @OneToMany(mappedBy = "lineaPedido", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ModificacionProducto> modificaciones = new ArrayList<>();
}