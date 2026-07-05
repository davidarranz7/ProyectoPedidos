package com.fastflow.pedidos.modelo;

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

    // Código externo de la plataforma si existe
    private String codigoExterno;

    // Nombre visible del producto
    @Column(nullable = false)
    private String nombre;

    // Categoría recibida como texto desde la plataforma o simulador
    private String categoria;

    // Precio del producto
    @Column(nullable = false)
    private BigDecimal precio;

    // Producto activo o desactivado
    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;
}
