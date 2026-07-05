package com.fastflow.pedidos.modelo;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
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

    // Pedido al que pertenece esta lÃ­nea
    @ManyToOne(optional = false)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    // Producto interno opcional, usado por el simulador o entrada manual
    @ManyToOne
    @JoinColumn(name = "producto_id")
    private Producto producto;

    // CÃ³digo real del producto en la plataforma externa
    private String codigoProductoExterno;

    // Nombre congelado del producto cuando entra el pedido
    private String nombreProducto;

    // Precio unitario recibido desde la plataforma
    private BigDecimal precioUnitario;

    // Cantidad de ese producto
    @Column(nullable = false)
    private Integer cantidad;

    // Extras/modificaciones de este producto
    @OneToMany(mappedBy = "lineaPedido", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ModificacionProducto> modificaciones = new ArrayList<>();
}
