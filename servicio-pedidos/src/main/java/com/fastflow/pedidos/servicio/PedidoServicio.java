package com.fastflow.pedidos.servicio;

import com.fastflow.pedidos.dto.CrearLineaPedidoRequest;
import com.fastflow.pedidos.dto.CrearModificacionRequest;
import com.fastflow.pedidos.dto.CrearPedidoHdRequest;
import com.fastflow.pedidos.dto.PedidoResponse;
import com.fastflow.pedidos.mapper.PedidoMapper;
import com.fastflow.pedidos.modelo.LineaPedido;
import com.fastflow.pedidos.modelo.ModificacionProducto;
import com.fastflow.pedidos.modelo.Motero;
import com.fastflow.pedidos.modelo.Pedido;
import com.fastflow.pedidos.modelo.Producto;
import com.fastflow.pedidos.modelo.enums.CategoriaProducto;
import com.fastflow.pedidos.modelo.enums.EstadoMotero;
import com.fastflow.pedidos.modelo.enums.EstadoPedido;
import com.fastflow.pedidos.modelo.enums.OrigenPedido;
import com.fastflow.pedidos.modelo.enums.PlataformaPedido;
import com.fastflow.pedidos.repositorio.MoteroRepositorio;
import com.fastflow.pedidos.repositorio.PedidoRepositorio;
import com.fastflow.pedidos.repositorio.ProductoRepositorio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PedidoServicio {

    private static final int MAX_PEDIDOS_ACTIVOS_POR_MOTERO = 3;

    private final PedidoRepositorio pedidoRepositorio;
    private final ProductoRepositorio productoRepositorio;
    private final MoteroRepositorio moteroRepositorio;
    private final PedidoMapper pedidoMapper;
    private final RutaRepartoServicio rutaRepartoServicio;

    @Transactional
    public PedidoResponse crearPedidoHd(CrearPedidoHdRequest request) {
        validarPlataformaHd(request.getPlataforma());

        LocalDateTime ahora = LocalDateTime.now();
        boolean esProgramado = request.getFechaProgramada() != null
                && request.getFechaProgramada().isAfter(ahora);

        Pedido pedido = Pedido.builder()
                .numeroPedido(generarNumeroPedidoVisible(request.getPlataforma(), ahora))
                .origen(OrigenPedido.HD)
                .plataforma(request.getPlataforma())
                .estado(esProgramado ? EstadoPedido.PROGRAMADO : EstadoPedido.EN_COCINA)
                .clienteNombre(request.getClienteNombre())
                .clienteDireccion(request.getClienteDireccion())
                .clienteTelefono(request.getClienteTelefono())
                .fechaCreacion(ahora)
                .fechaProgramada(request.getFechaProgramada())
                .build();

        for (CrearLineaPedidoRequest lineaRequest : request.getLineas()) {
            Producto producto = productoRepositorio.findById(lineaRequest.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + lineaRequest.getProductoId()));

            LineaPedido lineaPedido = LineaPedido.builder()
                    .pedido(pedido)
                    .producto(producto)
                    .cantidad(lineaRequest.getCantidad())
                    .build();

            if (lineaRequest.getModificaciones() != null) {
                for (CrearModificacionRequest modificacionRequest : lineaRequest.getModificaciones()) {
                    ModificacionProducto modificacion = ModificacionProducto.builder()
                            .lineaPedido(lineaPedido)
                            .tipo(modificacionRequest.getTipo())
                            .descripcion(modificacionRequest.getDescripcion())
                            .build();

                    lineaPedido.getModificaciones().add(modificacion);
                }
            }

            pedido.getLineas().add(lineaPedido);
        }

        if (!esProgramado) {
            asignarPedidoODejarEnPrevision(pedido);
        }

        Pedido pedidoGuardado = pedidoRepositorio.save(pedido);

        if (pedidoGuardado.getEstado() == EstadoPedido.ASIGNADO_MOTERO
                && pedidoGuardado.getMoteroAsignado() != null) {
            rutaRepartoServicio.agregarPedidoARutaAbierta(pedidoGuardado);
        }

        return pedidoMapper.convertirPedido(pedidoGuardado);
    }

    @Transactional
    public List<PedidoResponse> listarPedidosHd() {
        activarPedidosProgramadosVencidos();

        List<Pedido> pedidos = pedidoRepositorio.findByOrigenOrderByFechaCreacionDesc(OrigenPedido.HD);
        return pedidoMapper.convertirPedidos(pedidos);
    }

    @Transactional
    public List<PedidoResponse> listarPedidosCocinaHamburguesas() {
        activarPedidosProgramadosVencidos();

        List<Pedido> pedidos = pedidoRepositorio.findAllByOrderByFechaCreacionDesc();

        return pedidos.stream()
                .filter(pedido -> pedido.getEstado() != EstadoPedido.PROGRAMADO)
                .filter(pedido -> pedido.getEstado() != EstadoPedido.ENTREGADO)
                .filter(pedido -> pedido.getEstado() != EstadoPedido.CANCELADO)
                .map(this::filtrarPedidoParaHamburguesas)
                .filter(pedido -> !pedido.getLineas().isEmpty())
                .map(pedidoMapper::convertirPedido)
                .toList();
    }

    @Transactional
    public PedidoResponse marcarPedidoPreparadoYAvisarMotero(Long pedidoId) {
        Pedido pedido = pedidoRepositorio.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado con id: " + pedidoId));

        pedido.setFechaPreparado(LocalDateTime.now());

        if (pedido.getMoteroAsignado() == null) {
            pedido.setEstado(EstadoPedido.PREPARADO);
        } else {
            pedido.setEstado(EstadoPedido.MOTERO_AVISADO);
            pedido.getMoteroAsignado().setEstado(EstadoMotero.EN_RECOGIDA);
        }

        Pedido pedidoGuardado = pedidoRepositorio.save(pedido);

        return pedidoMapper.convertirPedido(pedidoGuardado);
    }

    @Transactional
    public void activarPedidosProgramadosVencidos() {
        List<Pedido> pedidosProgramados = pedidoRepositorio
                .findByEstadoAndFechaProgramadaLessThanEqual(
                        EstadoPedido.PROGRAMADO,
                        LocalDateTime.now()
                );

        for (Pedido pedido : pedidosProgramados) {
            pedido.setEstado(EstadoPedido.EN_COCINA);
            asignarPedidoODejarEnPrevision(pedido);
        }

        List<Pedido> pedidosGuardados = pedidoRepositorio.saveAll(pedidosProgramados);

        for (Pedido pedidoGuardado : pedidosGuardados) {
            if (pedidoGuardado.getEstado() == EstadoPedido.ASIGNADO_MOTERO
                    && pedidoGuardado.getMoteroAsignado() != null) {
                rutaRepartoServicio.agregarPedidoARutaAbierta(pedidoGuardado);
            }
        }
    }

    private void asignarPedidoODejarEnPrevision(Pedido pedido) {
        Optional<Motero> mejorMotero = buscarMejorMoteroParaNuevaRuta();

        if (mejorMotero.isPresent()) {
            asignarMoteroReal(pedido, mejorMotero.get());
            return;
        }

        Optional<Motero> candidatoPrevisto = rutaRepartoServicio
                .buscarMoteroCandidatoAsignacionPrevista();

        pedido.setEstado(EstadoPedido.ASIGNACION_PREVISTA);
        pedido.setMoteroAsignado(candidatoPrevisto.orElse(null));
    }

    private void asignarMoteroReal(Pedido pedido, Motero motero) {
        pedido.setMoteroAsignado(motero);
        pedido.setEstado(EstadoPedido.ASIGNADO_MOTERO);

        if (motero.getEstado() == EstadoMotero.DISPONIBLE
                || motero.getEstado() == EstadoMotero.ASIGNADO) {
            motero.setEstado(EstadoMotero.ESPERANDO_PREPARADO);
        }
    }

    private Optional<Motero> buscarMejorMoteroParaNuevaRuta() {
        return moteroRepositorio.findByActivoTrue()
                .stream()
                .filter(this::moteroPuedeRecibirPedidoReal)
                .filter(motero -> contarPedidosActivosMotero(motero.getId()) < MAX_PEDIDOS_ACTIVOS_POR_MOTERO)
                .min(
                        Comparator
                                .comparingInt((Motero motero) -> contarPedidosActivosMotero(motero.getId()))
                                .thenComparing(Motero::getId)
                );
    }

    private boolean moteroPuedeRecibirPedidoReal(Motero motero) {
        return motero.getEstado() == EstadoMotero.DISPONIBLE
                || motero.getEstado() == EstadoMotero.ESPERANDO_PREPARADO
                || motero.getEstado() == EstadoMotero.ASIGNADO
                || motero.getEstado() == EstadoMotero.EN_RECOGIDA;
    }

    private int contarPedidosActivosMotero(Long moteroId) {
        return (int) pedidoRepositorio.countByMoteroAsignado_IdAndEstadoIn(
                moteroId,
                obtenerEstadosRutaReal()
        );
    }

    private List<EstadoPedido> obtenerEstadosRutaReal() {
        return List.of(
                EstadoPedido.ASIGNADO_MOTERO,
                EstadoPedido.PREPARADO,
                EstadoPedido.MOTERO_AVISADO,
                EstadoPedido.RECOGIDO_ESTABLECIMIENTO,
                EstadoPedido.EN_CAMINO
        );
    }

    private Pedido filtrarPedidoParaHamburguesas(Pedido pedidoOriginal) {
        List<LineaPedido> lineasHamburguesas = pedidoOriginal.getLineas()
                .stream()
                .filter(this::esProductoDePantallaHamburguesas)
                .toList();

        return Pedido.builder()
                .id(pedidoOriginal.getId())
                .numeroPedido(pedidoOriginal.getNumeroPedido())
                .origen(pedidoOriginal.getOrigen())
                .plataforma(pedidoOriginal.getPlataforma())
                .estado(pedidoOriginal.getEstado())
                .clienteNombre(pedidoOriginal.getClienteNombre())
                .clienteDireccion(pedidoOriginal.getClienteDireccion())
                .clienteTelefono(pedidoOriginal.getClienteTelefono())
                .moteroAsignado(pedidoOriginal.getMoteroAsignado())
                .fechaCreacion(pedidoOriginal.getFechaCreacion())
                .fechaProgramada(pedidoOriginal.getFechaProgramada())
                .fechaPreparado(pedidoOriginal.getFechaPreparado())
                .fechaRecogidoEstablecimiento(pedidoOriginal.getFechaRecogidoEstablecimiento())
                .fechaEnCamino(pedidoOriginal.getFechaEnCamino())
                .fechaEntregado(pedidoOriginal.getFechaEntregado())
                .lineas(lineasHamburguesas)
                .build();
    }

    private boolean esProductoDePantallaHamburguesas(LineaPedido lineaPedido) {
        CategoriaProducto categoria = lineaPedido.getProducto().getCategoria();

        return categoria == CategoriaProducto.HAMBURGUESA
                || categoria == CategoriaProducto.WRAP
                || categoria == CategoriaProducto.ENSALADA_PRINCIPAL;
    }

    private String generarNumeroPedidoVisible(PlataformaPedido plataforma, LocalDateTime fechaPedido) {
        String prefijo = obtenerPrefijoPedido(plataforma);
        String prefijoConGuion = prefijo + "-";

        LocalDateTime inicioDia = fechaPedido.toLocalDate().atStartOfDay();
        LocalDateTime finDia = fechaPedido.toLocalDate().atTime(LocalTime.MAX);

        long totalPedidosHoy = pedidoRepositorio.countByNumeroPedidoStartingWithAndFechaCreacionBetween(
                prefijoConGuion,
                inicioDia,
                finDia
        );

        long siguienteNumero = totalPedidosHoy + 1;

        return prefijoConGuion + String.format("%03d", siguienteNumero);
    }

    private String obtenerPrefijoPedido(PlataformaPedido plataforma) {
        return switch (plataforma) {
            case GLOVO -> "GLOVO";
            case JUST_EAT -> "JUST";
            case UBER_EATS -> "UBER";
            case WEB -> "WEB";
            case LOCAL -> "LOCAL";
        };
    }

    private void validarPlataformaHd(PlataformaPedido plataforma) {
        if (plataforma == PlataformaPedido.LOCAL) {
            throw new RuntimeException("Un pedido HD no puede tener plataforma LOCAL");
        }
    }
}