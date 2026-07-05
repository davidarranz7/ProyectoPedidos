package com.fastflow.pedidos.modelo;

import com.fastflow.pedidos.modelo.enums.EstadoPedido;
import com.fastflow.pedidos.modelo.enums.OrigenPedido;
import com.fastflow.pedidos.modelo.enums.PlataformaPedido;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
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

    // Número visible interno de FastFlow
    @Column(nullable = false)
    private String numeroPedido;

    // ID real que venga de Glovo, Uber, Just Eat o Popeyes Delivery
    private String idExterno;

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

    // Total del pedido si la plataforma lo envía
    private BigDecimal total;

    // Si el pedido ya viene pagado desde la plataforma
    @Builder.Default
    private Boolean pagado = true;

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

        if (pagado == null) {
            pagado = true;
        }
    }
}
