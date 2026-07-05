import { useEffect, useState } from 'react';
import {
  avisarRuta,
  listarPedidosHd,
  listarRutasActivas,
  marcarPedidoPreparado,
} from '../servicios/pedidoServicio';

function HdInternoPagina() {
  const [pedidos, setPedidos] = useState([]);
  const [rutasActivas, setRutasActivas] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [vistaActiva, setVistaActiva] = useState('pedidos');
  const [cargando, setCargando] = useState(true);
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [rutaProcesandoId, setRutaProcesandoId] = useState(null);
  const [rutasAvisadasAnimadas, setRutasAvisadasAnimadas] = useState([]);
  const [pedidosEntregadosAnimados, setPedidosEntregadosAnimados] = useState([]);
  const [ahora, setAhora] = useState(Date.now());
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarPedidos();

    const intervaloPedidos = setInterval(() => {
      cargarPedidos();
    }, 5000);

    const intervaloReloj = setInterval(() => {
      setAhora(Date.now());
    }, 1000);

    return () => {
      clearInterval(intervaloPedidos);
      clearInterval(intervaloReloj);
    };
  }, []);

  async function cargarPedidos() {
    try {
      const [datosPedidos, datosRutas] = await Promise.all([
        listarPedidosHd(),
        listarRutasActivas(),
      ]);

      setPedidos(datosPedidos || []);

      setRutasActivas((rutasAnteriores) => {
        detectarPedidosEntregadosNuevos(rutasAnteriores, datosRutas || []);
        return datosRutas || [];
      });

      setError('');
    } catch (error) {
      setError('No se pudieron cargar los pedidos de Popeyes Delivery.');
    } finally {
      setCargando(false);
    }
  }

  function detectarPedidosEntregadosNuevos(rutasAnteriores, rutasNuevas) {
    const entregadosAntes = new Set();

    rutasAnteriores.forEach((ruta) => {
      (ruta.pedidos || []).forEach((pedidoRuta) => {
        if (pedidoRuta.estado === 'ENTREGADO') {
          entregadosAntes.add(pedidoRuta.id);
        }
      });
    });

    const nuevosEntregados = [];

    rutasNuevas.forEach((ruta) => {
      (ruta.pedidos || []).forEach((pedidoRuta) => {
        if (
          pedidoRuta.estado === 'ENTREGADO' &&
          !entregadosAntes.has(pedidoRuta.id)
        ) {
          nuevosEntregados.push(pedidoRuta.id);
        }
      });
    });

    if (nuevosEntregados.length === 0) {
      return;
    }

    setPedidosEntregadosAnimados((actuales) => [
      ...new Set([...actuales, ...nuevosEntregados]),
    ]);

    setTimeout(() => {
      setPedidosEntregadosAnimados((actuales) =>
        actuales.filter((id) => !nuevosEntregados.includes(id))
      );
    }, 3500);
  }

  async function marcarPreparadoYAvisarMotero() {
    if (!pedidoSeleccionado) {
      return;
    }

    try {
      setProcesandoAccion(true);
      setMensaje('');
      setError('');

      const itemRuta = buscarItemRutaPedido(pedidoSeleccionado.id);

      if (itemRuta?.ruta) {
        if (!puedeAvisarRuta(itemRuta.ruta)) {
          setMensaje('Esta ruta ya no se puede avisar desde el pedido.');
          await cargarPedidos();
          return;
        }

        activarAnimacionRutaAvisada(itemRuta.ruta.id);

        const rutaActualizada = await avisarRuta(itemRuta.ruta.id);

        const pedidoRutaActualizado = rutaActualizada.pedidos?.find(
          (pedidoRuta) => pedidoRuta.pedido.id === pedidoSeleccionado.id
        );

        if (pedidoRutaActualizado) {
          setPedidoSeleccionado(pedidoRutaActualizado.pedido);
        }

        setMensaje(
          `Ruta de ${
            rutaActualizada.motero?.nombre || 'motero'
          } enviada al repartidor.`
        );

        await cargarPedidos();
        return;
      }

      const pedidoActualizado = await marcarPedidoPreparado(
        pedidoSeleccionado.id
      );

      setPedidoSeleccionado(pedidoActualizado);
      setMensaje('Pedido preparado correctamente.');

      await cargarPedidos();
    } catch (error) {
      setError('No se pudo marcar el pedido como preparado.');
    } finally {
      setProcesandoAccion(false);
    }
  }

  async function avisarRutaCompleta(ruta) {
    try {
      setRutaProcesandoId(ruta.id);
      setMensaje('');
      setError('');

      activarAnimacionRutaAvisada(ruta.id);

      await avisarRuta(ruta.id);

      setMensaje(
        `Ruta de ${ruta.motero?.nombre || 'motero'} enviada al repartidor.`
      );

      await cargarPedidos();
    } catch (error) {
      setError('No se pudo avisar la ruta completa.');
    } finally {
      setRutaProcesandoId(null);
    }
  }

  function activarAnimacionRutaAvisada(rutaId) {
    setRutasAvisadasAnimadas((actuales) => [...new Set([...actuales, rutaId])]);

    setTimeout(() => {
      setRutasAvisadasAnimadas((actuales) =>
        actuales.filter((id) => id !== rutaId)
      );
    }, 3200);
  }

  const pedidosRutasActivas = rutasActivas.flatMap((ruta) =>
    (ruta.pedidos || []).map((pedidoRuta) => ({
      ruta,
      pedidoRuta,
      pedido: pedidoRuta.pedido,
    }))
  );

  const idsPedidosEnRutasActivas = new Set(
    pedidosRutasActivas.map((item) => item.pedido.id)
  );

  const pedidosProgramados = pedidos.filter(
    (pedido) => pedido.estado === 'PROGRAMADO'
  );

  const pedidosHistorial = pedidos.filter(
    (pedido) =>
      (pedido.estado === 'ENTREGADO' || pedido.estado === 'CANCELADO') &&
      !idsPedidosEnRutasActivas.has(pedido.id)
  );

  const pedidosAsignacionPrevista = pedidos.filter(
    (pedido) => pedido.estado === 'PENDIENTE_ASIGNACION'
  );

  const pedidosSinRutaTemporal = pedidos.filter(
    (pedido) =>
      pedido.estado !== 'PROGRAMADO' &&
      pedido.estado !== 'PENDIENTE_ASIGNACION' &&
      pedido.estado !== 'ENTREGADO' &&
      pedido.estado !== 'CANCELADO' &&
      !pedido.moteroAsignado &&
      !idsPedidosEnRutasActivas.has(pedido.id)
  );

  const totalPedidosRutasActivas = pedidosRutasActivas.length;

  const pedidosActivos =
    pedidosAsignacionPrevista.length +
    pedidosSinRutaTemporal.length +
    totalPedidosRutasActivas;

  const pedidosEnCamino = pedidosRutasActivas.filter(
    (item) =>
      item.ruta.estado === 'EN_REPARTO' &&
      item.pedidoRuta.estado !== 'ENTREGADO'
  );

  function obtenerTextoOrigen(pedido) {
    if (!pedido?.plataforma) {
      return 'DELIVERY';
    }

    if (pedido.plataforma === 'JUST_EAT') {
      return 'JUST EAT';
    }

    if (pedido.plataforma === 'UBER_EATS') {
      return 'UBER EATS';
    }

    if (pedido.plataforma === 'POPEYES_DELIVERY') {
      return 'POPEYES';
    }

    if (pedido.plataforma === 'MANUAL_HD') {
      return 'MANUAL HD';
    }

    return pedido.plataforma;
  }

  function obtenerTextoEstadoPedido(estado) {
    if (estado === 'PROGRAMADO') return 'Programado';
    if (estado === 'RECIBIDO') return 'Recibido';
    if (estado === 'EN_PREPARACION') return 'En preparación';
    if (estado === 'PENDIENTE_ASIGNACION') return 'Pendiente';
    if (estado === 'ASIGNADO_MOTERO') return 'Asignado';
    if (estado === 'PREPARADO') return 'Preparado';
    if (estado === 'MOTERO_AVISADO') return 'Avisado';
    if (estado === 'RECOGIDO_ESTABLECIMIENTO') return 'Recogido';
    if (estado === 'EN_CAMINO') return 'En camino';
    if (estado === 'ENTREGADO') return 'Entregado';
    if (estado === 'INCIDENCIA') return 'Incidencia';
    if (estado === 'CANCELADO') return 'Cancelado';

    return estado || 'Sin estado';
  }

  function obtenerTextoEstadoRuta(ruta) {
    if (ruta.estado === 'ABIERTA') return 'Pendiente de recoger';
    if (ruta.estado === 'AVISADA') return 'Motero avisado';
    if (ruta.estado === 'EN_REPARTO') return 'En reparto';
    if (ruta.estado === 'FINALIZADA') return 'Finalizada';

    return ruta.estado;
  }

  function obtenerTextoEstadoPedidoRuta(estado) {
    if (estado === 'EN_ENTREGA') return 'Actual';
    if (estado === 'ENTREGADO') return 'Entregado';
    if (estado === 'PENDIENTE') return 'Pendiente';

    return estado;
  }

  function obtenerHora(fecha) {
    if (!fecha) {
      return '--:--';
    }

    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function obtenerTotalProductos(pedido) {
    if (!pedido?.lineas) {
      return 0;
    }

    return pedido.lineas.reduce(
      (total, linea) => total + Number(linea.cantidad || 0),
      0
    );
  }

  function obtenerNombreProductoLinea(linea) {
    return linea.nombreProducto || linea.producto?.nombre || 'Producto';
  }

  function obtenerCategoriaProductoLinea(linea) {
    return (
      linea.producto?.categoria ||
      linea.codigoProductoExterno ||
      'Producto externo'
    );
  }

  function formatearPrecio(precio) {
    if (precio === null || precio === undefined || precio === '') {
      return '';
    }

    return `${Number(precio || 0).toFixed(2)} €`;
  }

  function obtenerFechaInicioEspera(pedido) {
    return (
      pedido.fechaPreparado ||
      pedido.fechaRecogidoEstablecimiento ||
      pedido.fechaCreacion
    );
  }

  function obtenerFechaFinEspera(pedido, pedidoRuta) {
    if (pedidoRuta?.estado === 'ENTREGADO') {
      return pedidoRuta.fechaEntregado || pedido.fechaEntregado || null;
    }

    if (pedido.estado === 'ENTREGADO') {
      return pedido.fechaEntregado || pedidoRuta?.fechaEntregado || null;
    }

    return null;
  }

  function obtenerMinutosEspera(pedido, pedidoRuta = null) {
    const fechaInicio = obtenerFechaInicioEspera(pedido);

    if (!fechaInicio) {
      return 0;
    }

    const fechaFin = obtenerFechaFinEspera(pedido, pedidoRuta);
    const tiempoFinal = fechaFin ? new Date(fechaFin).getTime() : ahora;
    const diferencia = tiempoFinal - new Date(fechaInicio).getTime();

    if (diferencia <= 0) {
      return 0;
    }

    return Math.floor(diferencia / 60000);
  }

  function formatearEsperaPedido(pedido, pedidoRuta = null) {
    const minutos = obtenerMinutosEspera(pedido, pedidoRuta);

    if (minutos < 1) {
      return '0 min';
    }

    if (minutos < 60) {
      return `${minutos} min`;
    }

    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;

    if (resto === 0) {
      return `${horas} h`;
    }

    return `${horas} h ${resto} min`;
  }

  function claseEsperaPedido(pedido, pedidoRuta = null) {
    const minutos = obtenerMinutosEspera(pedido, pedidoRuta);

    if (pedidoRuta?.estado === 'ENTREGADO' || pedido.estado === 'ENTREGADO') {
      return 'contador-espera-pedido finalizado';
    }

    if (minutos >= 15) {
      return 'contador-espera-pedido urgente';
    }

    if (minutos >= 8) {
      return 'contador-espera-pedido aviso';
    }

    return 'contador-espera-pedido normal';
  }

  function ordenarPedidosRuta(pedidosRuta) {
    return [...(pedidosRuta || [])].sort((a, b) => {
      if (a.estado === 'ENTREGADO' && b.estado !== 'ENTREGADO') return 1;
      if (a.estado !== 'ENTREGADO' && b.estado === 'ENTREGADO') return -1;

      return obtenerMinutosEspera(b.pedido, b) - obtenerMinutosEspera(a.pedido, a);
    });
  }

  function obtenerMayorEsperaRuta(ruta) {
    const pedidosPendientes = (ruta.pedidos || []).filter(
      (pedidoRuta) => pedidoRuta.estado !== 'ENTREGADO'
    );

    if (pedidosPendientes.length === 0) {
      return '0 min';
    }

    const minutos = Math.max(
      ...pedidosPendientes.map((pedidoRuta) =>
        obtenerMinutosEspera(pedidoRuta.pedido, pedidoRuta)
      )
    );

    if (minutos < 60) {
      return `${minutos} min`;
    }

    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;

    return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
  }

  function claseEstadoPedido(estado) {
    if (estado === 'PROGRAMADO') return 'estado-hd programado';
    if (estado === 'PENDIENTE_ASIGNACION') return 'estado-hd prevista';
    if (estado === 'ASIGNADO_MOTERO') return 'estado-hd asignado';

    if (estado === 'EN_PREPARACION' || estado === 'RECIBIDO') {
      return 'estado-hd preparacion';
    }

    if (estado === 'PREPARADO' || estado === 'MOTERO_AVISADO') {
      return 'estado-hd preparado';
    }

    if (estado === 'RECOGIDO_ESTABLECIMIENTO' || estado === 'EN_CAMINO') {
      return 'estado-hd en-camino';
    }

    if (estado === 'ENTREGADO') return 'estado-hd entregado';
    if (estado === 'CANCELADO') return 'estado-hd cancelado';

    return 'estado-hd neutro';
  }

  function claseTarjetaPedido(pedido) {
    if (pedido.estado === 'PROGRAMADO') return 'tarjeta-hd programado';
    if (pedido.estado === 'PENDIENTE_ASIGNACION') return 'tarjeta-hd prevista';
    if (pedido.estado === 'ENTREGADO') return 'tarjeta-hd entregado';

    if (
      pedido.estado === 'EN_CAMINO' ||
      pedido.estado === 'RECOGIDO_ESTABLECIMIENTO'
    ) {
      return 'tarjeta-hd en-camino';
    }

    if (pedido.estado === 'MOTERO_AVISADO' || pedido.estado === 'PREPARADO') {
      return 'tarjeta-hd preparado';
    }

    return 'tarjeta-hd';
  }

  function puedeMarcarPreparado(pedido) {
    if (!pedido) {
      return false;
    }

    const itemRuta = buscarItemRutaPedido(pedido.id);

    if (itemRuta?.ruta) {
      return puedeAvisarRuta(itemRuta.ruta);
    }

    return (
      pedido.estado === 'RECIBIDO' ||
      pedido.estado === 'EN_PREPARACION' ||
      pedido.estado === 'ASIGNADO_MOTERO' ||
      pedido.estado === 'PREPARADO'
    );
  }

  function puedeAvisarRuta(ruta) {
    if (ruta.estado !== 'ABIERTA') {
      return false;
    }

    return (ruta.pedidos || []).some(
      (pedidoRuta) =>
        pedidoRuta.pedido.estado === 'ASIGNADO_MOTERO' ||
        pedidoRuta.pedido.estado === 'PREPARADO' ||
        pedidoRuta.pedido.estado === 'EN_PREPARACION' ||
        pedidoRuta.pedido.estado === 'RECIBIDO'
    );
  }

  function obtenerClaseOrbeRuta(ruta) {
    if (ruta.estado === 'EN_REPARTO') return 'orbe-motero recogiendo';
    if (ruta.estado === 'AVISADA') return 'orbe-motero avisado';
    if (ruta.estado === 'FINALIZADA') return 'orbe-motero finalizado';

    return 'orbe-motero espera';
  }

  function obtenerClasePanelMotero(ruta) {
    if (ruta.estado === 'EN_REPARTO') return 'panel-motero-carril en-reparto';
    if (ruta.estado === 'AVISADA') return 'panel-motero-carril avisado';
    if (ruta.estado === 'FINALIZADA') return 'panel-motero-carril finalizado';

    return 'panel-motero-carril pendiente';
  }

  function obtenerClaseCarrilRuta(ruta) {
    const clases = ['carril-motero-ruta'];

    if (rutasAvisadasAnimadas.includes(ruta.id)) {
      clases.push('ruta-recien-avisada');
    }

    if (ruta.estado === 'EN_REPARTO') {
      clases.push('ruta-en-reparto');
    }

    return clases.join(' ');
  }

  function obtenerClaseTarjetaRuta(pedido, pedidoRuta) {
    const clases = [claseTarjetaPedido(pedido), 'tarjeta-ruta-carril'];

    if (pedidosEntregadosAnimados.includes(pedidoRuta.id)) {
      clases.push('pedido-recien-entregado');
    }

    if (pedidoRuta.estado === 'ENTREGADO') {
      clases.push('pedido-finalizado');
    }

    return clases.join(' ');
  }

  function contarEntregadosRuta(ruta) {
    return (ruta.pedidos || []).filter(
      (pedidoRuta) => pedidoRuta.estado === 'ENTREGADO'
    ).length;
  }

  function buscarItemRutaPedido(pedidoId) {
    return pedidosRutasActivas.find((item) => item.pedido.id === pedidoId);
  }

  function abrirDetallePedido(pedido) {
    setPedidoSeleccionado(pedido);
    setMensaje('');
    setError('');
  }

  function cerrarDetallePedido() {
    setPedidoSeleccionado(null);
    setMensaje('');
    setError('');
  }

  function renderEstadoVisualPedidoRuta(pedidoRuta, ruta) {
    if (pedidoRuta.estado === 'ENTREGADO') {
      return (
        <div className="estado-mini-pedido entregado">
          <span>✓</span>
        </div>
      );
    }

    if (ruta.estado === 'EN_REPARTO' && pedidoRuta.estado === 'EN_ENTREGA') {
      return (
        <div className="estado-mini-pedido recogido">
          <span></span>
        </div>
      );
    }

    if (
      ruta.estado === 'AVISADA' ||
      pedidoRuta.pedido.estado === 'MOTERO_AVISADO'
    ) {
      return (
        <div className="estado-mini-pedido listo">
          <span></span>
        </div>
      );
    }

    return (
      <div className="estado-mini-pedido pendiente">
        <span></span>
      </div>
    );
  }

  function renderTarjetaPedido(pedido, tipo) {
    return (
      <button
        type="button"
        key={pedido.id}
        className={claseTarjetaPedido(pedido)}
        onClick={() => abrirDetallePedido(pedido)}
      >
        <div className="tarjeta-hd-arriba">
          <div>
            <strong>{pedido.numeroPedido}</strong>
            <span>{obtenerTextoOrigen(pedido)}</span>
          </div>

          <p className={claseEstadoPedido(pedido.estado)}>
            {obtenerTextoEstadoPedido(pedido.estado)}
          </p>
        </div>

        <div className="tarjeta-hd-cuerpo">
          <p>{pedido.clienteDireccion || 'Sin dirección'}</p>
          <small>{obtenerTotalProductos(pedido)} productos</small>
        </div>

        {tipo === 'programado' && (
          <div className="tarjeta-programada-hora">
            <span>Hora programada</span>
            <strong>{obtenerHora(pedido.fechaProgramada)}</strong>
          </div>
        )}

        {tipo === 'prevista' && (
          <div className="tarjeta-asignacion-prevista">
            <span>Lo recogerá</span>
            <strong>{pedido.moteroAsignado?.nombre || 'Sin motero'}</strong>
          </div>
        )}

        {tipo === 'sin-ruta' && (
          <div className="tarjeta-asignacion-prevista sin-motero">
            <span>Sin ruta</span>
            <strong>Esperando motero</strong>
          </div>
        )}
      </button>
    );
  }

  function renderTarjetaPedidoRuta(pedidoRuta, ruta) {
    const pedido = pedidoRuta.pedido;

    return (
      <button
        type="button"
        key={pedidoRuta.id}
        className={obtenerClaseTarjetaRuta(pedido, pedidoRuta)}
        onClick={() => abrirDetallePedido(pedido)}
      >
        <div className="pedido-ruta-numero">
          <strong>{pedido.numeroPedido}</strong>
          <span>{obtenerTextoOrigen(pedido)}</span>
        </div>

        <div className="pedido-ruta-centro">
          <strong>{pedido.clienteDireccion || 'Sin dirección'}</strong>
          <span>
            {obtenerTotalProductos(pedido)} productos ·{' '}
            {obtenerTextoEstadoPedidoRuta(pedidoRuta.estado)}
          </span>
        </div>

        <div className={claseEsperaPedido(pedido, pedidoRuta)}>
          <small>
            {pedidoRuta.estado === 'ENTREGADO' ? 'Final' : 'Espera'}
          </small>
          <strong>{formatearEsperaPedido(pedido, pedidoRuta)}</strong>
        </div>

        {renderEstadoVisualPedidoRuta(pedidoRuta, ruta)}
      </button>
    );
  }

  function renderGrupoRuta(ruta) {
    const totalEntregados = contarEntregadosRuta(ruta);
    const totalPedidos = ruta.pedidos?.length || 0;

    return (
      <article key={ruta.id} className={obtenerClaseCarrilRuta(ruta)}>
        <div className="zona-pedidos-carril">
          <div className="titulo-pedidos-carril">
            <span>Pedidos</span>
            <strong>{totalPedidos}</strong>
          </div>

          <div className="lista-pedidos-carril">
            {ordenarPedidosRuta(ruta.pedidos).map((pedidoRuta) =>
              renderTarjetaPedidoRuta(pedidoRuta, ruta)
            )}
          </div>
        </div>

        <aside className={obtenerClasePanelMotero(ruta)}>
          <div className="base-motero-carril">
            <div className={obtenerClaseOrbeRuta(ruta)}>
              <span></span>
            </div>

            <div>
              <span>Repartidor</span>
              <strong>{ruta.motero?.nombre || 'Sin motero'}</strong>
              <small>{obtenerTextoEstadoRuta(ruta)}</small>
              <p>Mayor espera: {obtenerMayorEsperaRuta(ruta)}</p>
              <em>
                {totalEntregados}/{totalPedidos}
              </em>
            </div>
          </div>

          {puedeAvisarRuta(ruta) && (
            <button
              type="button"
              className="boton-aviso-ruta"
              disabled={rutaProcesandoId === ruta.id}
              onClick={() => avisarRutaCompleta(ruta)}
            >
              {rutaProcesandoId === ruta.id ? 'Avisando...' : 'Avisar ruta'}
            </button>
          )}
        </aside>
      </article>
    );
  }

  function renderOverlayDetalle() {
    if (!pedidoSeleccionado) {
      return null;
    }

    return (
      <div className="overlay-detalle-hd" onClick={cerrarDetallePedido}>
        <section
          className="modal-detalle-hd"
          onClick={(evento) => evento.stopPropagation()}
        >
          <div className="modal-detalle-cabecera">
            <div>
              <span>{obtenerTextoOrigen(pedidoSeleccionado)}</span>
              <h2>{pedidoSeleccionado.numeroPedido}</h2>
              <p className={claseEstadoPedido(pedidoSeleccionado.estado)}>
                {obtenerTextoEstadoPedido(pedidoSeleccionado.estado)}
              </p>
            </div>

            <button type="button" onClick={cerrarDetallePedido}>
              Cerrar
            </button>
          </div>

          <div className="modal-detalle-contenido">
            {mensaje && <p className="mensaje-hd">{mensaje}</p>}
            {error && <p className="mensaje-hd error">{error}</p>}

            <section className="datos-pedido-hd">
              <article>
                <small>Entrada</small>
                <strong>{obtenerHora(pedidoSeleccionado.fechaCreacion)}</strong>
              </article>

              {pedidoSeleccionado.fechaProgramada && (
                <article>
                  <small>Programado</small>
                  <strong>
                    {obtenerHora(pedidoSeleccionado.fechaProgramada)}
                  </strong>
                </article>
              )}

              <article>
                <small>Cliente</small>
                <strong>
                  {pedidoSeleccionado.clienteNombre || 'Sin nombre'}
                </strong>
              </article>

              <article>
                <small>Teléfono</small>
                <strong>
                  {pedidoSeleccionado.clienteTelefono || 'Sin teléfono'}
                </strong>
              </article>

              <article>
                <small>Repartidor</small>
                <strong>
                  {pedidoSeleccionado.moteroAsignado?.nombre || 'Sin asignar'}
                </strong>
              </article>

              <article>
                <small>Tiempo</small>
                <strong>{formatearEsperaPedido(pedidoSeleccionado)}</strong>
              </article>

              {pedidoSeleccionado.total !== null &&
                pedidoSeleccionado.total !== undefined && (
                  <article>
                    <small>Total</small>
                    <strong>{formatearPrecio(pedidoSeleccionado.total)}</strong>
                  </article>
                )}

              <article className="dato-direccion-hd">
                <small>Dirección</small>
                <strong>
                  {pedidoSeleccionado.clienteDireccion || 'Sin dirección'}
                </strong>
              </article>
            </section>

            <section className="productos-modal-hd">
              <h3>Productos del pedido</h3>

              {(pedidoSeleccionado.lineas || []).map((linea) => (
                <article key={linea.id} className="linea-modal-hd">
                  <div className="linea-modal-principal">
                    <strong>
                      <span>{linea.cantidad}x</span>{' '}
                      {obtenerNombreProductoLinea(linea)}
                    </strong>

                    <small>
                      {obtenerCategoriaProductoLinea(linea)}
                      {linea.precioUnitario !== null &&
                        linea.precioUnitario !== undefined &&
                        ` · ${formatearPrecio(linea.precioUnitario)}`}
                    </small>
                  </div>

                  {(linea.modificaciones || []).length > 0 && (
                    <ul>
                      {linea.modificaciones.map((modificacion) => (
                        <li key={modificacion.id}>
                          <strong>{modificacion.tipo || 'Modificación'}</strong>{' '}
                          {modificacion.nombre || ''}
                          {modificacion.precio !== null &&
                            modificacion.precio !== undefined &&
                            Number(modificacion.precio) > 0 &&
                            ` · ${formatearPrecio(modificacion.precio)}`}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </section>
          </div>

          <div className="modal-detalle-acciones">
            <button type="button" className="boton-secundario-hd">
              Ver ticket
            </button>

            {puedeMarcarPreparado(pedidoSeleccionado) && (
              <button
                type="button"
                className="boton-principal-hd"
                disabled={procesandoAccion}
                onClick={marcarPreparadoYAvisarMotero}
              >
                {procesandoAccion
                  ? 'Avisando...'
                  : 'Preparado / avisar ruta'}
              </button>
            )}
          </div>
        </section>
      </div>
    );
  }

  function renderVistaPedidos() {
    return (
      <section className="tablero-hd">
        <section className="columna-hd programados">
          <div className="titulo-columna-hd">
            <div>
              <p>Programados</p>
              <span>Con hora prevista</span>
            </div>
            <strong>{pedidosProgramados.length}</strong>
          </div>

          <div className="lista-pedidos-hd">
            {pedidosProgramados.length === 0 ? (
              <p className="vacio-hd">Sin programados.</p>
            ) : (
              pedidosProgramados.map((pedido) =>
                renderTarjetaPedido(pedido, 'programado')
              )
            )}
          </div>
        </section>

        <section className="columna-hd asignacion-prevista">
          <div className="titulo-columna-hd">
            <div>
              <p>Asignación pendiente</p>
              <span>Pedidos esperando repartidor o hueco en ruta</span>
            </div>
            <strong>
              {pedidosAsignacionPrevista.length + pedidosSinRutaTemporal.length}
            </strong>
          </div>

          <div className="lista-pedidos-hd">
            {pedidosAsignacionPrevista.length === 0 &&
            pedidosSinRutaTemporal.length === 0 ? (
              <p className="vacio-hd">Sin pedidos pendientes de asignación.</p>
            ) : (
              <>
                {pedidosAsignacionPrevista.map((pedido) =>
                  renderTarjetaPedido(pedido, 'prevista')
                )}

                {pedidosSinRutaTemporal.map((pedido) =>
                  renderTarjetaPedido(pedido, 'sin-ruta')
                )}
              </>
            )}
          </div>
        </section>

        <section className="columna-hd pedidos-ruta">
          <div className="titulo-columna-hd">
            <div>
              <p>Rutas Popeyes</p>
              <span>Pedidos activos por repartidor y prioridad</span>
            </div>
            <strong>{totalPedidosRutasActivas}</strong>
          </div>

          {rutasActivas.length === 0 ? (
            <p className="vacio-hd">No hay rutas activas.</p>
          ) : (
            <div className="mapa-rutas-moteros">
              {rutasActivas.map((ruta) => renderGrupoRuta(ruta))}
            </div>
          )}
        </section>
      </section>
    );
  }

  function renderVistaHistorial() {
    return (
      <section className="panel-historial-principal-hd">
        <div className="cabecera-vista-historial">
          <div>
            <p>Historial Popeyes Delivery</p>
            <span>Pedidos entregados y cancelados del día</span>
          </div>

          <strong>{pedidosHistorial.length}</strong>
        </div>

        <div className="lista-historial-principal-hd">
          {pedidosHistorial.length === 0 ? (
            <p className="vacio-hd">Todavía no hay pedidos en historial.</p>
          ) : (
            pedidosHistorial.map((pedido) => (
              <button
                type="button"
                key={pedido.id}
                className="fila-historial-hd"
                onClick={() => abrirDetallePedido(pedido)}
              >
                <div>
                  <strong>{pedido.numeroPedido}</strong>
                  <span>
                    {obtenerTextoOrigen(pedido)} ·{' '}
                    {pedido.clienteDireccion || 'Sin dirección'}
                  </span>
                </div>

                <div>
                  <p className={claseEstadoPedido(pedido.estado)}>
                    {obtenerTextoEstadoPedido(pedido.estado)}
                  </p>
                  <small>Tiempo: {formatearEsperaPedido(pedido)}</small>
                </div>
              </button>
            ))
          )}
        </div>
      </section>
    );
  }

  function renderVistaIncidencias() {
    return (
      <section className="panel-historial-principal-hd">
        <div className="cabecera-vista-historial">
          <div>
            <p>Incidencias</p>
            <span>Zona preparada para problemas, mensajes y respuestas</span>
          </div>

          <strong>0</strong>
        </div>

        <p className="vacio-hd">
          Más adelante aquí veremos pedidos con incidencias, mensajes del
          cliente, reclamaciones y respuestas del restaurante.
        </p>
      </section>
    );
  }

  return (
    <main className="pagina-hd-interno">
      <section className="cabecera-hd-interno">
        <div>
          <p>Control Popeyes</p>
          <h1>Popeyes Delivery HD</h1>
          <span>Seguimiento interno de rutas, repartidores y tiempos.</span>
        </div>

        <div className="acciones-cabecera-hd">
          <div>
            <small>Activos</small>
            <strong>{pedidosActivos}</strong>
          </div>

          <div>
            <small>En camino</small>
            <strong>{pedidosEnCamino.length}</strong>
          </div>

          <div>
            <small>Finalizados</small>
            <strong>{pedidosHistorial.length}</strong>
          </div>

          <button type="button" onClick={cargarPedidos}>
            Actualizar
          </button>
        </div>
      </section>

      <nav className="barra-vistas-hd">
        <button
          type="button"
          className={vistaActiva === 'pedidos' ? 'activa' : ''}
          onClick={() => setVistaActiva('pedidos')}
        >
          <span>Operativa</span>
          <strong>{pedidosActivos}</strong>
        </button>

        <button
          type="button"
          className={vistaActiva === 'historial' ? 'activa' : ''}
          onClick={() => setVistaActiva('historial')}
        >
          <span>Historial</span>
          <strong>{pedidosHistorial.length}</strong>
        </button>

        <button
          type="button"
          className={vistaActiva === 'incidencias' ? 'activa' : ''}
          onClick={() => setVistaActiva('incidencias')}
        >
          <span>Incidencias</span>
          <strong>0</strong>
        </button>
      </nav>

      {cargando && <p className="mensaje-hd">Cargando operativa...</p>}

      {mensaje && !pedidoSeleccionado && (
        <p className="mensaje-hd">{mensaje}</p>
      )}

      {error && !pedidoSeleccionado && (
        <p className="mensaje-hd error">{error}</p>
      )}

      <section className="contenido-vista-hd">
        {vistaActiva === 'pedidos' && renderVistaPedidos()}
        {vistaActiva === 'historial' && renderVistaHistorial()}
        {vistaActiva === 'incidencias' && renderVistaIncidencias()}
      </section>

      {renderOverlayDetalle()}
    </main>
  );
}

export default HdInternoPagina;