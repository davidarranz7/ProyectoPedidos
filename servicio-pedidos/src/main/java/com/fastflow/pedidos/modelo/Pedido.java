package com.fastflow.pedidos.modelo;

import com.fastflow.pedidos.modelo.enums.EstadoPedido;
import com.fastflow.pedidos.modelo.enums.OrigenPedido;
import com.fastflow.pedidos.modelo.enums.PlataformaPedido;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pedidos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String numeroPedido;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrigenPedido origen;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlataformaPedido plataforma;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoPedido estado = EstadoPedido.RECIBIDO;

    private String clienteNombre;

    private String clienteDireccion;

    private String clienteTelefono;

    @ManyToOne
    @JoinColumn(name = "motero_id")
    private Motero moteroAsignado;

    @Column(nullable = false)
    private LocalDateTime fechaCreacion;

    private LocalDateTime fechaProgramada;

    private LocalDateTime fechaPreparado;

    private LocalDateTime fechaRecogidoEstablecimiento;

    private LocalDateTime fechaEnCamino;

    private LocalDateTime fechaEntregado;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LineaPedido> lineas = new ArrayList<>();

    @PrePersist
    public void antesDeGuardar() {
        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now();
        }
    }
}