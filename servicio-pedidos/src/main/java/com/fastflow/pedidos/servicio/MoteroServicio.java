package com.fastflow.pedidos.servicio;

import com.fastflow.pedidos.dto.MoteroResponse;
import com.fastflow.pedidos.dto.PedidoResponse;
import com.fastflow.pedidos.mapper.PedidoMapper;
import com.fastflow.pedidos.modelo.Motero;
import com.fastflow.pedidos.modelo.Pedido;
import com.fastflow.pedidos.modelo.enums.EstadoMotero;
import com.fastflow.pedidos.modelo.enums.EstadoPedido;
import com.fastflow.pedidos.repositorio.MoteroRepositorio;
import com.fastflow.pedidos.repositorio.PedidoRepositorio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MoteroServicio {

    private final MoteroRepositorio moteroRepositorio;
    private final PedidoRepositorio pedidoRepositorio;
    private final PedidoMapper pedidoMapper;
    private final RutaRepartoServicio rutaRepartoServicio;

    @Transactional(readOnly = true)
    public List<MoteroResponse> listarMoteros() {
        List<Motero> moteros = moteroRepositorio.findByActivoTrue();
        return pedidoMapper.convertirMoteros(moteros);
    }

    @Transactional(readOnly = true)
    public List<MoteroResponse> listarMoterosDisponibles() {
        List<Motero> moteros = moteroRepositorio.findByEstadoAndActivoTrue(EstadoMotero.DISPONIBLE);
        return pedidoMapper.convertirMoteros(moteros);
    }

    @Transactional
    public MoteroResponse ficharMotero(Long moteroId) {
        Motero motero = buscarMotero(moteroId);

        motero.setEstado(EstadoMotero.DISPONIBLE);

        rutaRepartoServicio.repartirPedidosPrevistosEntreMoterosDisponibles();

        Motero moteroGuardado = moteroRepositorio.save(motero);

        return pedidoMapper.convertirMotero(moteroGuardado);
    }

    @Transactional
    public MoteroResponse desconectarMotero(Long moteroId) {
        Motero motero = buscarMotero(moteroId);

        motero.setEstado(EstadoMotero.DESCONECTADO);

        Motero moteroGuardado = moteroRepositorio.save(motero);

        return pedidoMapper.convertirMotero(moteroGuardado);
    }

    @Transactional(readOnly = true)
    public PedidoResponse obtenerPedidoActivoMotero(Long moteroId) {
        buscarMotero(moteroId);

        Pedido pedido = buscarPedidoActivoMotero(moteroId);

        if (pedido == null) {
            return null;
        }

        return pedidoMapper.convertirPedido(pedido);
    }

    @Transactional
    public PedidoResponse recogerPedidoActivo(Long moteroId) {
        Motero motero = buscarMotero(moteroId);
        Pedido pedido = buscarPedidoActivoMoteroObligatorio(moteroId);

        LocalDateTime ahora = LocalDateTime.now();

        pedido.setEstado(EstadoPedido.EN_CAMINO);
        pedido.setFechaRecogidoEstablecimiento(ahora);
        pedido.setFechaEnCamino(ahora);

        motero.setEstado(EstadoMotero.EN_REPARTO);

        Pedido pedidoGuardado = pedidoRepositorio.save(pedido);

        return pedidoMapper.convertirPedido(pedidoGuardado);
    }

    @Transactional
    public PedidoResponse entregarPedidoActivo(Long moteroId) {
        Motero motero = buscarMotero(moteroId);
        Pedido pedido = buscarPedidoActivoMoteroObligatorio(moteroId);

        pedido.setEstado(EstadoPedido.ENTREGADO);
        pedido.setFechaEntregado(LocalDateTime.now());

        motero.setEstado(EstadoMotero.DISPONIBLE);

        Pedido pedidoGuardado = pedidoRepositorio.save(pedido);

        return pedidoMapper.convertirPedido(pedidoGuardado);
    }

    private Pedido buscarPedidoActivoMotero(Long moteroId) {
        List<EstadoPedido> estadosActivos = List.of(
                EstadoPedido.ASIGNADO_MOTERO,
                EstadoPedido.PREPARADO,
                EstadoPedido.MOTERO_AVISADO,
                EstadoPedido.RECOGIDO_ESTABLECIMIENTO,
                EstadoPedido.EN_CAMINO
        );

        return pedidoRepositorio
                .findFirstByMoteroAsignado_IdAndEstadoInOrderByFechaCreacionDesc(
                        moteroId,
                        estadosActivos
                )
                .orElse(null);
    }

    private Pedido buscarPedidoActivoMoteroObligatorio(Long moteroId) {
        Pedido pedido = buscarPedidoActivoMotero(moteroId);

        if (pedido == null) {
            throw new RuntimeException("El motero no tiene ningún pedido activo.");
        }

        return pedido;
    }

    private Motero buscarMotero(Long moteroId) {
        return moteroRepositorio.findById(moteroId)
                .orElseThrow(() -> new RuntimeException("Motero no encontrado con id: " + moteroId));
    }
}