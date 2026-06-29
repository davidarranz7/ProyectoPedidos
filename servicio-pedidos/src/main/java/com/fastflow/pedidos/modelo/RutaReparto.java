package com.fastflow.pedidos.modelo;

import com.fastflow.pedidos.modelo.enums.EstadoRutaReparto;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rutas_reparto")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RutaReparto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Motero dueño de la ruta
    @ManyToOne(optional = false)
    @JoinColumn(name = "motero_id", nullable = false)
    private Motero motero;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoRutaReparto estado = EstadoRutaReparto.ABIERTA;

    @Column(nullable = false)
    private LocalDateTime fechaCreacion;

    private LocalDateTime fechaAvisada;

    private LocalDateTime fechaInicioRuta;

    private LocalDateTime fechaFinalizacion;

    @OneToMany(mappedBy = "rutaReparto", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PedidoRuta> pedidosRuta = new ArrayList<>();

    @PrePersist
    public void antesDeGuardar() {
        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now();
        }
    }
}