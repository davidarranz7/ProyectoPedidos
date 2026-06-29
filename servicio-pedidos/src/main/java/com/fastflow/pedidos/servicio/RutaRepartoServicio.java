package com.fastflow.pedidos.servicio;

import com.fastflow.pedidos.dto.RutaRepartoResponse;
import com.fastflow.pedidos.mapper.RutaRepartoMapper;
import com.fastflow.pedidos.modelo.Motero;
import com.fastflow.pedidos.modelo.Pedido;
import com.fastflow.pedidos.modelo.PedidoRuta;
import com.fastflow.pedidos.modelo.RutaReparto;
import com.fastflow.pedidos.modelo.enums.EstadoMotero;
import com.fastflow.pedidos.modelo.enums.EstadoPedido;
import com.fastflow.pedidos.modelo.enums.EstadoPedidoRuta;
import com.fastflow.pedidos.modelo.enums.EstadoRutaReparto;
import com.fastflow.pedidos.repositorio.MoteroRepositorio;
import com.fastflow.pedidos.repositorio.PedidoRepositorio;
import com.fastflow.pedidos.repositorio.PedidoRutaRepositorio;
import com.fastflow.pedidos.repositorio.RutaRepartoRepositorio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RutaRepartoServicio {

    private static final int MAX_PEDIDOS_ACTIVOS_POR_MOTERO = 3;

    private final RutaRepartoRepositorio rutaRepartoRepositorio;
    private final PedidoRutaRepositorio pedidoRutaRepositorio;
    private final PedidoRepositorio pedidoRepositorio;
    private final MoteroRepositorio moteroRepositorio;
    private final RutaRepartoMapper rutaRepartoMapper;

    @Transactional
    public void agregarPedidoARutaAbierta(Pedido pedido) {
        if (pedido == null || pedido.getId() == null) {
            return;
        }

        if (pedido.getMoteroAsignado() == null) {
            return;
        }

        boolean pedidoYaEstaEnRuta = pedidoRutaRepositorio
                .findByPedido_Id(pedido.getId())
                .isPresent();

        if (pedidoYaEstaEnRuta) {
            return;
        }

        RutaReparto rutaAbierta = obtenerOCrearRutaAbierta(
                pedido.getMoteroAsignado()
        );

        int siguienteOrden = obtenerSiguienteOrden(rutaAbierta.getId());

        PedidoRuta pedidoRuta = PedidoRuta.builder()
                .rutaReparto(rutaAbierta)
                .pedido(pedido)
                .ordenEntrega(siguienteOrden)
                .estado(EstadoPedidoRuta.PENDIENTE)
                .build();

        pedidoRutaRepositorio.save(pedidoRuta);
    }

    @Transactional
    public void repartirPedidosPrevistosEntreMoterosDisponibles() {
        List<Pedido> pedidosEsperando = pedidoRepositorio
                .findByEstadoAndMoteroAsignadoIsNullOrderByFechaCreacionAsc(
                        EstadoPedido.ASIGNACION_PREVISTA
                );

        while (!pedidosEsperando.isEmpty()) {
            Optional<Motero> mejorMotero = buscarMejorMoteroParaPedidoPrevistoReal();

            if (mejorMotero.isEmpty()) {
                return;
            }

            Pedido pedido = pedidosEsperando.remove(0);
            asignarPedidoPrevistoComoRutaReal(pedido, mejorMotero.get());
        }
    }

    @Transactional(readOnly = true)
    public Optional<Motero> buscarMoteroCandidatoAsignacionPrevista() {
        List<RutaReparto> rutasEnReparto = rutaRepartoRepositorio
                .findByEstadoInOrderByFechaCreacionDesc(
                        List.of(EstadoRutaReparto.EN_REPARTO)
                );

        List<RutaCandidata> candidatas = new ArrayList<>();

        for (RutaReparto ruta : rutasEnReparto) {
            List<PedidoRuta> pedidosRuta = pedidoRutaRepositorio
                    .findByRutaReparto_IdOrderByOrdenEntregaAsc(ruta.getId());

            int totalPedidos = pedidosRuta.size();

            if (totalPedidos == 0) {
                continue;
            }

            int pedidosEntregados = (int) pedidosRuta.stream()
                    .filter(pedidoRuta -> pedidoRuta.getEstado() == EstadoPedidoRuta.ENTREGADO)
                    .count();

            int minimoParaAsignacion = (int) Math.ceil(totalPedidos / 2.0);

            if (pedidosEntregados >= minimoParaAsignacion) {
                candidatas.add(
                        new RutaCandidata(
                                ruta.getMotero(),
                                totalPedidos,
                                pedidosEntregados
                        )
                );
            }
        }

        return candidatas.stream()
                .filter(candidata -> candidata.getMotero() != null)
                .filter(candidata -> !pedidoRepositorio.existsByEstadoAndMoteroAsignado_Id(
                        EstadoPedido.ASIGNACION_PREVISTA,
                        candidata.getMotero().getId()
                ))
                .max(
                        Comparator
                                .comparingDouble(RutaCandidata::obtenerPorcentajeEntregado)
                                .thenComparingInt(RutaCandidata::getPedidosEntregados)
                                .thenComparing(
                                        Comparator.comparingInt(RutaCandidata::getPedidosRestantes)
                                                .reversed()
                                )
                )
                .map(RutaCandidata::getMotero);
    }

    @Transactional(readOnly = true)
    public List<RutaRepartoResponse> listarRutasActivas() {
        List<RutaReparto> rutasActivas = rutaRepartoRepositorio
                .findByEstadoInOrderByFechaCreacionDesc(obtenerEstadosRutaActiva());

        return rutasActivas.stream()
                .map(ruta -> {
                    List<PedidoRuta> pedidosRuta = pedidoRutaRepositorio
                            .findByRutaReparto_IdOrderByOrdenEntregaAsc(ruta.getId());

                    return rutaRepartoMapper.convertirRuta(ruta, pedidosRuta);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public RutaRepartoResponse obtenerRutaActivaMotero(Long moteroId) {
        RutaReparto rutaActiva = rutaRepartoRepositorio
                .findFirstByMotero_IdAndEstadoInOrderByFechaCreacionDesc(
                        moteroId,
                        obtenerEstadosRutaActiva()
                )
                .orElse(null);

        if (rutaActiva == null) {
            return null;
        }

        List<PedidoRuta> pedidosRuta = pedidoRutaRepositorio
                .findByRutaReparto_IdOrderByOrdenEntregaAsc(rutaActiva.getId());

        return rutaRepartoMapper.convertirRuta(rutaActiva, pedidosRuta);
    }

    @Transactional
    public RutaRepartoResponse avisarRuta(Long rutaId) {
        RutaReparto rutaReparto = rutaRepartoRepositorio.findById(rutaId)
                .orElseThrow(() -> new RuntimeException("Ruta no encontrada con id: " + rutaId));

        if (rutaReparto.getEstado() == EstadoRutaReparto.FINALIZADA
                || rutaReparto.getEstado() == EstadoRutaReparto.CANCELADA) {
            throw new RuntimeException("No se puede avisar una ruta finalizada o cancelada.");
        }

        List<PedidoRuta> pedidosRuta = pedidoRutaRepositorio
                .findByRutaReparto_IdOrderByOrdenEntregaAsc(rutaReparto.getId());

        if (pedidosRuta.isEmpty()) {
            throw new RuntimeException("La ruta no tiene pedidos.");
        }

        LocalDateTime ahora = LocalDateTime.now();

        rutaReparto.setEstado(EstadoRutaReparto.AVISADA);
        rutaReparto.setFechaAvisada(ahora);

        if (rutaReparto.getMotero() != null) {
            rutaReparto.getMotero().setEstado(EstadoMotero.EN_RECOGIDA);
        }

        for (PedidoRuta pedidoRuta : pedidosRuta) {
            Pedido pedido = pedidoRuta.getPedido();

            if (pedido.getFechaPreparado() == null) {
                pedido.setFechaPreparado(ahora);
            }

            if (pedido.getEstado() == EstadoPedido.ASIGNADO_MOTERO
                    || pedido.getEstado() == EstadoPedido.PREPARADO
                    || pedido.getEstado() == EstadoPedido.EN_COCINA) {
                pedido.setEstado(EstadoPedido.MOTERO_AVISADO);
            }
        }

        RutaReparto rutaGuardada = rutaRepartoRepositorio.save(rutaReparto);

        return rutaRepartoMapper.convertirRuta(rutaGuardada, pedidosRuta);
    }

    @Transactional
    public RutaRepartoResponse recogerRuta(Long rutaId) {
        RutaReparto rutaReparto = rutaRepartoRepositorio.findById(rutaId)
                .orElseThrow(() -> new RuntimeException("Ruta no encontrada con id: " + rutaId));

        if (rutaReparto.getEstado() == EstadoRutaReparto.FINALIZADA
                || rutaReparto.getEstado() == EstadoRutaReparto.CANCELADA) {
            throw new RuntimeException("No se puede recoger una ruta finalizada o cancelada.");
        }

        List<PedidoRuta> pedidosRuta = pedidoRutaRepositorio
                .findByRutaReparto_IdOrderByOrdenEntregaAsc(rutaReparto.getId());

        if (pedidosRuta.isEmpty()) {
            throw new RuntimeException("La ruta no tiene pedidos.");
        }

        LocalDateTime ahora = LocalDateTime.now();

        rutaReparto.setEstado(EstadoRutaReparto.EN_REPARTO);

        if (rutaReparto.getFechaInicioRuta() == null) {
            rutaReparto.setFechaInicioRuta(ahora);
        }

        if (rutaReparto.getMotero() != null) {
            rutaReparto.getMotero().setEstado(EstadoMotero.EN_REPARTO);
        }

        for (PedidoRuta pedidoRuta : pedidosRuta) {
            Pedido pedido = pedidoRuta.getPedido();

            if (pedido.getFechaRecogidoEstablecimiento() == null) {
                pedido.setFechaRecogidoEstablecimiento(ahora);
            }

            if (pedido.getFechaEnCamino() == null) {
                pedido.setFechaEnCamino(ahora);
            }

            if (pedido.getEstado() == EstadoPedido.MOTERO_AVISADO
                    || pedido.getEstado() == EstadoPedido.ASIGNADO_MOTERO
                    || pedido.getEstado() == EstadoPedido.PREPARADO) {
                pedido.setEstado(EstadoPedido.EN_CAMINO);
            }
        }

        PedidoRuta primerPedidoPendiente = pedidosRuta.stream()
                .filter(pedidoRuta -> pedidoRuta.getEstado() == EstadoPedidoRuta.PENDIENTE)
                .findFirst()
                .orElse(null);

        if (primerPedidoPendiente != null) {
            primerPedidoPendiente.setEstado(EstadoPedidoRuta.EN_ENTREGA);
            primerPedidoPendiente.setFechaInicioTramo(ahora);
        }

        RutaReparto rutaGuardada = rutaRepartoRepositorio.save(rutaReparto);

        return rutaRepartoMapper.convertirRuta(rutaGuardada, pedidosRuta);
    }

    @Transactional
    public RutaRepartoResponse seleccionarPedidoRuta(Long pedidoRutaId) {
        PedidoRuta pedidoRutaSeleccionado = pedidoRutaRepositorio.findById(pedidoRutaId)
                .orElseThrow(() -> new RuntimeException("Pedido de ruta no encontrado con id: " + pedidoRutaId));

        RutaReparto rutaReparto = pedidoRutaSeleccionado.getRutaReparto();

        if (rutaReparto.getEstado() != EstadoRutaReparto.EN_REPARTO) {
            throw new RuntimeException("Solo se puede seleccionar un pedido cuando la ruta está en reparto.");
        }

        if (pedidoRutaSeleccionado.getEstado() == EstadoPedidoRuta.ENTREGADO) {
            throw new RuntimeException("No se puede seleccionar un pedido ya entregado.");
        }

        List<PedidoRuta> pedidosRuta = pedidoRutaRepositorio
                .findByRutaReparto_IdOrderByOrdenEntregaAsc(rutaReparto.getId());

        LocalDateTime ahora = LocalDateTime.now();

        for (PedidoRuta pedidoRuta : pedidosRuta) {
            if (pedidoRuta.getEstado() == EstadoPedidoRuta.EN_ENTREGA) {
                pedidoRuta.setEstado(EstadoPedidoRuta.PENDIENTE);
                pedidoRuta.setFechaInicioTramo(null);
            }
        }

        pedidoRutaSeleccionado.setEstado(EstadoPedidoRuta.EN_ENTREGA);
        pedidoRutaSeleccionado.setFechaInicioTramo(ahora);

        return rutaRepartoMapper.convertirRuta(rutaReparto, pedidosRuta);
    }

    @Transactional
    public RutaRepartoResponse entregarPedidoRuta(Long pedidoRutaId) {
        PedidoRuta pedidoRuta = pedidoRutaRepositorio.findById(pedidoRutaId)
                .orElseThrow(() -> new RuntimeException("Pedido de ruta no encontrado con id: " + pedidoRutaId));

        RutaReparto rutaReparto = pedidoRuta.getRutaReparto();

        if (rutaReparto.getEstado() == EstadoRutaReparto.FINALIZADA
                || rutaReparto.getEstado() == EstadoRutaReparto.CANCELADA) {
            throw new RuntimeException("No se puede entregar un pedido de una ruta finalizada o cancelada.");
        }

        if (rutaReparto.getEstado() != EstadoRutaReparto.EN_REPARTO) {
            throw new RuntimeException("La ruta todavía no está en reparto.");
        }

        if (pedidoRuta.getEstado() != EstadoPedidoRuta.EN_ENTREGA) {
            throw new RuntimeException("Solo se puede entregar el pedido que está en entrega.");
        }

        LocalDateTime ahora = LocalDateTime.now();

        pedidoRuta.setEstado(EstadoPedidoRuta.ENTREGADO);
        pedidoRuta.setFechaEntregado(ahora);

        if (pedidoRuta.getFechaInicioTramo() != null) {
            long duracionSegundos = Duration.between(
                    pedidoRuta.getFechaInicioTramo(),
                    ahora
            ).getSeconds();

            pedidoRuta.setDuracionTramoSegundos(duracionSegundos);
        }

        Pedido pedido = pedidoRuta.getPedido();
        pedido.setEstado(EstadoPedido.ENTREGADO);
        pedido.setFechaEntregado(ahora);

        List<PedidoRuta> pedidosRuta = pedidoRutaRepositorio
                .findByRutaReparto_IdOrderByOrdenEntregaAsc(rutaReparto.getId());

        boolean quedanPedidosPendientes = pedidosRuta.stream()
                .anyMatch(item -> item.getEstado() == EstadoPedidoRuta.PENDIENTE);

        revisarPedidosPrevistosSinMotero();

        if (!quedanPedidosPendientes) {
            rutaReparto.setEstado(EstadoRutaReparto.FINALIZADA);
            rutaReparto.setFechaFinalizacion(ahora);

            activarPedidoPrevistoDelMoteroODejarDisponible(rutaReparto.getMotero());
        }

        RutaReparto rutaGuardada = rutaRepartoRepositorio.save(rutaReparto);

        return rutaRepartoMapper.convertirRuta(rutaGuardada, pedidosRuta);
    }

    private void revisarPedidosPrevistosSinMotero() {
        Optional<Motero> candidato = buscarMoteroCandidatoAsignacionPrevista();

        if (candidato.isEmpty()) {
            return;
        }

        List<Pedido> pedidosEsperando = pedidoRepositorio
                .findByEstadoAndMoteroAsignadoIsNullOrderByFechaCreacionAsc(
                        EstadoPedido.ASIGNACION_PREVISTA
                );

        if (pedidosEsperando.isEmpty()) {
            return;
        }

        Pedido pedido = pedidosEsperando.get(0);
        pedido.setMoteroAsignado(candidato.get());

        pedidoRepositorio.save(pedido);
    }

    private void activarPedidoPrevistoDelMoteroODejarDisponible(Motero motero) {
        if (motero == null) {
            return;
        }

        List<Pedido> pedidosPrevistos = pedidoRepositorio
                .findByMoteroAsignado_IdAndEstadoInOrderByFechaCreacionAsc(
                        motero.getId(),
                        List.of(EstadoPedido.ASIGNACION_PREVISTA)
                );

        if (pedidosPrevistos.isEmpty()) {
            motero.setEstado(EstadoMotero.DISPONIBLE);
            repartirPedidosPrevistosEntreMoterosDisponibles();
            return;
        }

        Pedido pedidoPrevisto = pedidosPrevistos.get(0);

        pedidoPrevisto.setEstado(EstadoPedido.ASIGNADO_MOTERO);
        pedidoPrevisto.setMoteroAsignado(motero);
        motero.setEstado(EstadoMotero.ESPERANDO_PREPARADO);

        Pedido pedidoGuardado = pedidoRepositorio.save(pedidoPrevisto);

        agregarPedidoARutaAbierta(pedidoGuardado);

        repartirPedidosPrevistosEntreMoterosDisponibles();
    }

    private Optional<Motero> buscarMejorMoteroParaPedidoPrevistoReal() {
        return moteroRepositorio.findByActivoTrue()
                .stream()
                .filter(this::moteroPuedeRecibirPedidoReal)
                .filter(motero -> contarPedidosActivosMotero(motero.getId()) < MAX_PEDIDOS_ACTIVOS_POR_MOTERO)
                .min(
                        Comparator
                                .comparingLong((Motero motero) -> contarPedidosAsignadosHoy(motero.getId()))
                                .thenComparingInt(motero -> contarPedidosActivosMotero(motero.getId()))
                                .thenComparing(Motero::getId)
                );
    }

    private void asignarPedidoPrevistoComoRutaReal(Pedido pedido, Motero motero) {
        pedido.setMoteroAsignado(motero);
        pedido.setEstado(EstadoPedido.ASIGNADO_MOTERO);

        motero.setEstado(EstadoMotero.ESPERANDO_PREPARADO);

        Pedido pedidoGuardado = pedidoRepositorio.save(pedido);

        agregarPedidoARutaAbierta(pedidoGuardado);
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

    private long contarPedidosAsignadosHoy(Long moteroId) {
        LocalDateTime inicioDia = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime finDia = LocalDateTime.now().toLocalDate().atTime(LocalTime.MAX);

        return pedidoRepositorio.countByMoteroAsignado_IdAndFechaCreacionBetween(
                moteroId,
                inicioDia,
                finDia
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

    private RutaReparto obtenerOCrearRutaAbierta(Motero motero) {
        return rutaRepartoRepositorio
                .findFirstByMotero_IdAndEstadoInOrderByFechaCreacionDesc(
                        motero.getId(),
                        List.of(EstadoRutaReparto.ABIERTA)
                )
                .orElseGet(() -> crearRutaAbierta(motero));
    }

    private RutaReparto crearRutaAbierta(Motero motero) {
        RutaReparto rutaReparto = RutaReparto.builder()
                .motero(motero)
                .estado(EstadoRutaReparto.ABIERTA)
                .build();

        return rutaRepartoRepositorio.save(rutaReparto);
    }

    private int obtenerSiguienteOrden(Long rutaRepartoId) {
        int totalPedidosRuta = pedidoRutaRepositorio
                .findByRutaReparto_IdOrderByOrdenEntregaAsc(rutaRepartoId)
                .size();

        return totalPedidosRuta + 1;
    }

    private List<EstadoRutaReparto> obtenerEstadosRutaActiva() {
        return List.of(
                EstadoRutaReparto.ABIERTA,
                EstadoRutaReparto.AVISADA,
                EstadoRutaReparto.EN_REPARTO
        );
    }

    private static class RutaCandidata {

        private final Motero motero;
        private final int totalPedidos;
        private final int pedidosEntregados;

        private RutaCandidata(Motero motero, int totalPedidos, int pedidosEntregados) {
            this.motero = motero;
            this.totalPedidos = totalPedidos;
            this.pedidosEntregados = pedidosEntregados;
        }

        public Motero getMotero() {
            return motero;
        }

        public int getPedidosEntregados() {
            return pedidosEntregados;
        }

        public int getPedidosRestantes() {
            return totalPedidos - pedidosEntregados;
        }

        public double obtenerPorcentajeEntregado() {
            return (double) pedidosEntregados / totalPedidos;
        }
    }
}