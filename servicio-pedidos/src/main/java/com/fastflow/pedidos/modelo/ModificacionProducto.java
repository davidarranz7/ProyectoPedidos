package com.fastflow.pedidos.modelo;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "modificaciones_producto")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModificacionProducto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Línea de pedido a la que pertenece esta modificación
    @ManyToOne(optional = false)
    @JoinColumn(name = "linea_pedido_id", nullable = false)
    private LineaPedido lineaPedido;

    // Código real recibido desde Glovo, Uber, Just Eat o Popeyes Delivery
    private String codigoExterno;

    // Nombre visible del extra o modificación
    private String nombre;

    // Tipo recibido desde la plataforma: extra, quitar, nota, salsa, etc.
    private String tipo;

    // Precio de la modificación si lo trae la plataforma
    private BigDecimal precio;
}
