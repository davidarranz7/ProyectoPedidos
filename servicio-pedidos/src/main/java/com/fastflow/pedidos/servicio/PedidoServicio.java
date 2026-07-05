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
        validarLineasPedido(request);

        LocalDateTime ahora = LocalDateTime.now();

        boolean esProgramado = request.getFechaProgramada() != null
                && request.getFechaProgramada().isAfter(ahora);

        Pedido pedido = Pedido.builder()
                .numeroPedido(generarNumeroPedidoVisible(request.getPlataforma(), ahora))
                .idExterno(request.getIdExterno())
                .origen(OrigenPedido.DELIVERY)
                .plataforma(request.getPlataforma())
                .estado(esProgramado ? EstadoPedido.PROGRAMADO : EstadoPedido.EN_PREPARACION)
                .clienteNombre(request.getClienteNombre())
                .clienteDireccion(request.getClienteDireccion())
                .clienteTelefono(request.getClienteTelefono())
                .total(request.getTotal())
                .pagado(request.getPagado() != null ? request.getPagado() : true)
                .fechaCreacion(ahora)
                .fechaProgramada(request.getFechaProgramada())
                .build();

        for (CrearLineaPedidoRequest lineaRequest : request.getLineas()) {
            LineaPedido lineaPedido = crearLineaPedido(pedido, lineaRequest);
            pedido.getLineas().add(lineaPedido);
        }

        if (!esProgramado) {
            asignarPedidoODejarPendiente(pedido);
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

        List<Pedido> pedidos = pedidoRepositorio.findByOrigenOrderByFechaCreacionDesc(OrigenPedido.DELIVERY);

        return pedidoMapper.convertirPedidos(pedidos);
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
            pedido.setEstado(EstadoPedido.EN_PREPARACION);
            asignarPedidoODejarPendiente(pedido);
        }

        List<Pedido> pedidosGuardados = pedidoRepositorio.saveAll(pedidosProgramados);

        for (Pedido pedidoGuardado : pedidosGuardados) {
            if (pedidoGuardado.getEstado() == EstadoPedido.ASIGNADO_MOTERO
                    && pedidoGuardado.getMoteroAsignado() != null) {
                rutaRepartoServicio.agregarPedidoARutaAbierta(pedidoGuardado);
            }
        }
    }

    private LineaPedido crearLineaPedido(Pedido pedido, CrearLineaPedidoRequest lineaRequest) {
        Producto producto = null;

        if (lineaRequest.getProductoId() != null) {
            producto = productoRepositorio.findById(lineaRequest.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + lineaRequest.getProductoId()));
        }

        String codigoProductoExterno = lineaRequest.getCodigoProductoExterno();
        String nombreProducto = lineaRequest.getNombreProducto();
        var precioUnitario = lineaRequest.getPrecioUnitario();

        if (producto != null) {
            if (codigoProductoExterno == null || codigoProductoExterno.isBlank()) {
                codigoProductoExterno = producto.getCodigoExterno();
            }

            if (nombreProducto == null || nombreProducto.isBlank()) {
                nombreProducto = producto.getNombre();
            }

            if (precioUnitario == null) {
                precioUnitario = producto.getPrecio();
            }
        }

        if (nombreProducto == null || nombreProducto.isBlank()) {
            throw new RuntimeException("El nombre del producto es obligatorio");
        }

        LineaPedido lineaPedido = LineaPedido.builder()
                .pedido(pedido)
                .producto(producto)
                .codigoProductoExterno(codigoProductoExterno)
                .nombreProducto(nombreProducto)
                .precioUnitario(precioUnitario)
                .cantidad(lineaRequest.getCantidad())
                .build();

        if (lineaRequest.getModificaciones() != null) {
            for (CrearModificacionRequest modificacionRequest : lineaRequest.getModificaciones()) {
                ModificacionProducto modificacion = ModificacionProducto.builder()
                        .lineaPedido(lineaPedido)
                        .codigoExterno(modificacionRequest.getCodigoExterno())
                        .nombre(modificacionRequest.getNombre())
                        .tipo(modificacionRequest.getTipo())
                        .precio(modificacionRequest.getPrecio())
                        .build();

                lineaPedido.getModificaciones().add(modificacion);
            }
        }

        return lineaPedido;
    }

    private void validarLineasPedido(CrearPedidoHdRequest request) {
        if (request.getLineas() == null || request.getLineas().isEmpty()) {
            throw new RuntimeException("El pedido debe tener al menos una línea");
        }
    }

    private void asignarPedidoODejarPendiente(Pedido pedido) {
        Optional<Motero> mejorMotero = buscarMejorMoteroParaNuevaRuta();

        if (mejorMotero.isPresent()) {
            asignarMoteroReal(pedido, mejorMotero.get());
            return;
        }

        Optional<Motero> candidatoPrevisto = rutaRepartoServicio
                .buscarMoteroCandidatoAsignacionPrevista();

        pedido.setEstado(EstadoPedido.PENDIENTE_ASIGNACION);
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

    private String generarNumeroPedidoVisible(PlataformaPedido plataforma, LocalDateTime fechaPedido) {
        String prefijo = obtenerPrefijoPedido(plataforma);

        String fecha = String.format(
                "%04d%02d%02d",
                fechaPedido.getYear(),
                fechaPedido.getMonthValue(),
                fechaPedido.getDayOfMonth()
        );

        String prefijoConFecha = prefijo + "-" + fecha + "-";

        LocalDateTime inicioDia = fechaPedido.toLocalDate().atStartOfDay();
        LocalDateTime finDia = fechaPedido.toLocalDate().atTime(LocalTime.MAX);

        long totalPedidosHoy = pedidoRepositorio.countByNumeroPedidoStartingWithAndFechaCreacionBetween(
                prefijoConFecha,
                inicioDia,
                finDia
        );

        long siguienteNumero = totalPedidosHoy + 1;

        return prefijoConFecha + String.format("%03d", siguienteNumero);
    }

    private String obtenerPrefijoPedido(PlataformaPedido plataforma) {
        return switch (plataforma) {
            case GLOVO -> "GLOVO";
            case JUST_EAT -> "JUST";
            case UBER_EATS -> "UBER";
            case POPEYES_DELIVERY -> "POPEYES";
            case MANUAL_HD -> "MANUAL";
        };
    }

    private void validarPlataformaHd(PlataformaPedido plataforma) {
        if (plataforma == null) {
            throw new RuntimeException("La plataforma del pedido es obligatoria");
        }
    }
}