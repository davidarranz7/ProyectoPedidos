package com.fastflow.pedidos.modelo;

import com.fastflow.pedidos.modelo.enums.EstadoMotero;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "moteros")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Motero {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nombre del repartidor
    @Column(nullable = false)
    private String nombre;

    // Estado actual del motero
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoMotero estado = EstadoMotero.DESCONECTADO;

    // Motero activo en el sistema
    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;
}