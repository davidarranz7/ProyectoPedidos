package com.fastflow.pedidos.modelo;

import com.fastflow.pedidos.modelo.enums.CategoriaProducto;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "productos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nombre visible del producto
    @Column(nullable = false)
    private String nombre;

    // Categoría principal del producto
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoriaProducto categoria;

    // Precio simulado del producto
    @Column(nullable = false)
    private BigDecimal precio;

    // Producto activo o desactivado
    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;
}