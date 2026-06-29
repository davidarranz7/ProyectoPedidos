package com.fastflow.pedidos.modelo;

import com.fastflow.pedidos.modelo.enums.TipoModificacion;
import jakarta.persistence.*;
import lombok.*;

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

    // Línea de pedido a la que pertenece la modificación
    @ManyToOne(optional = false)
    @JoinColumn(name = "linea_pedido_id", nullable = false)
    private LineaPedido lineaPedido;

    // SIN, EXTRA o NOTA
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoModificacion tipo;

    // Ejemplo: bacon, pepinillos, tomate, queso
    @Column(nullable = false)
    private String descripcion;
}