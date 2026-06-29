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
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarPedidos();

    const intervalo = setInterval(() => {
      cargarPedidos();
    }, 5000);

    return () => clearInterval(intervalo);
  }, []);

  async function cargarPedidos() {
    try {
      const [datosPedidos, datosRutas] = await Promise.all([
        listarPedidosHd(),
        listarRutasActivas(),
      ]);

      setPedidos(datosPedidos);
      setRutasActivas(datosRutas);

      if (pedidoSeleccionado) {
        const actualizado = datosPedidos.find(
          (pedido) => pedido.id === pedidoSeleccionado.id
        );

        if (actualizado) {
          setPedidoSeleccionado(actualizado);
        }
      }

      setError('');
    } catch (error) {
      setError('No se pudieron cargar los pedidos HD.');
    } finally {
      setCargando(false);
    }
  }

  async function marcarPreparadoYAvisarMotero() {
    if (!pedidoSeleccionado) {
      return;
    }

    try {
      setProcesandoAccion(true);
      setMensaje('');
      setError('');

      const pedidoActualizado = await marcarPedidoPreparado(
        pedidoSeleccionado.id
      );

      setPedidoSeleccionado(pedidoActualizado);
      setMensaje('Pedido preparado. Motero avisado correctamente.');

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

      await avisarRuta(ruta.id);

      setMensaje(
        `Ruta de ${ruta.motero?.nombre || 'motero'} preparada y motero avisado.`
      );

      await cargarPedidos();
    } catch (error) {
      setError('No se pudo avisar la ruta completa.');
    } finally {
      setRutaProcesandoId(null);
    }
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
    (pedido) => pedido.estado === 'ASIGNACION_PREVISTA'
  );

  const pedidosSinRutaTemporal = pedidos.filter(
    (pedido) =>
      pedido.estado !== 'PROGRAMADO' &&
      pedido.estado !== 'ASIGNACION_PREVISTA' &&
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
    if (pedido.plataforma === 'JUST_EAT') {
      return 'JUST EAT';
    }

    if (pedido.plataforma === 'UBER_EATS') {
      return 'UBER EATS';
    }

    return pedido.plataforma;
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
    return pedido.lineas.reduce((total, linea) => total + linea.cantidad, 0);
  }

  function claseEstadoPedido(estado) {
    if (estado === 'PROGRAMADO') {
      return 'estado-hd programado';
    }

    if (estado === 'ASIGNACION_PREVISTA') {
      return 'estado-hd prevista';
    }

    if (estado === 'ASIGNADO_MOTERO') {
      return 'estado-hd asignado';
    }

    if (estado === 'EN_COCINA') {
      return 'estado-hd cocina';
    }

    if (estado === 'PREPARADO' || estado === 'MOTERO_AVISADO') {
      return 'estado-hd preparado';
    }

    if (estado === 'RECOGIDO_ESTABLECIMIENTO' || estado === 'EN_CAMINO') {
      return 'estado-hd en-camino';
    }

    if (estado === 'ENTREGADO') {
      return 'estado-hd entregado';
    }

    if (estado === 'CANCELADO') {
      return 'estado-hd cancelado';
    }

    return 'estado-hd neutro';
  }

  function claseTarjetaPedido(pedido) {
    if (pedido.estado === 'PROGRAMADO') {
      return 'tarjeta-hd programado';
    }

    if (pedido.estado === 'ASIGNACION_PREVISTA') {
      return 'tarjeta-hd prevista';
    }

    if (pedido.estado === 'ENTREGADO') {
      return 'tarjeta-hd entregado';
    }

    if (
      pedido.estado === 'EN_CAMINO' ||
      pedido.estado === 'RECOGIDO_ESTABLECIMIENTO'
    ) {
      return 'tarjeta-hd en-camino';
    }

    if (pedido.estado === 'MOTERO_AVISADO') {
      return 'tarjeta-hd preparado';
    }

    return 'tarjeta-hd';
  }

  function puedeMarcarPreparado(pedido) {
    if (!pedido) {
      return false;
    }

    return (
      pedido.estado === 'EN_COCINA' ||
      pedido.estado === 'ASIGNADO_MOTERO' ||
      pedido.estado === 'PREPARADO'
    );
  }

  function puedeAvisarRuta(ruta) {
    if (ruta.estado !== 'ABIERTA') {
      return false;
    }

    return ruta.pedidos.some(
      (pedidoRuta) =>
        pedidoRuta.pedido.estado === 'ASIGNADO_MOTERO' ||
        pedidoRuta.pedido.estado === 'PREPARADO' ||
        pedidoRuta.pedido.estado === 'EN_COCINA'
    );
  }

  function obtenerTextoEstadoRuta(ruta) {
    if (ruta.estado === 'ABIERTA') {
      return 'Pendiente de preparar';
    }

    if (ruta.estado === 'AVISADA') {
      return 'Motero avisado';
    }

    if (ruta.estado === 'EN_REPARTO') {
      return 'En reparto';
    }

    return ruta.estado;
  }

  function obtenerTextoEstadoPedidoRuta(estado) {
    if (estado === 'EN_ENTREGA') {
      return 'Entrega actual';
    }

    if (estado === 'ENTREGADO') {
      return 'Entregado';
    }

    if (estado === 'PENDIENTE') {
      return 'Pendiente en ruta';
    }

    return estado;
  }

  function contarEntregadosRuta(ruta) {
    return ruta.pedidos.filter((pedidoRuta) => pedidoRuta.estado === 'ENTREGADO')
      .length;
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

          <p className={claseEstadoPedido(pedido.estado)}>{pedido.estado}</p>
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

        {pedido.estado === 'MOTERO_AVISADO' && (
          <div className="aviso-motero-listo">Listo para recogida</div>
        )}

        {(pedido.estado === 'EN_CAMINO' ||
          pedido.estado === 'RECOGIDO_ESTABLECIMIENTO') && (
          <div className="aviso-en-camino">Pedido en camino</div>
        )}
      </button>
    );
  }

  function renderTarjetaPedidoRuta(pedidoRuta) {
    const pedido = pedidoRuta.pedido;

    return (
      <button
        type="button"
        key={pedidoRuta.id}
        className={claseTarjetaPedido(pedido)}
        onClick={() => abrirDetallePedido(pedido)}
      >
        <div className="ruta-pedido-info">
          <span>Orden {pedidoRuta.ordenEntrega}</span>
          <strong>{obtenerTextoEstadoPedidoRuta(pedidoRuta.estado)}</strong>
        </div>

        <div className="tarjeta-hd-arriba">
          <div>
            <strong>{pedido.numeroPedido}</strong>
            <span>{obtenerTextoOrigen(pedido)}</span>
          </div>

          <p className={claseEstadoPedido(pedido.estado)}>{pedido.estado}</p>
        </div>

        <div className="tarjeta-hd-cuerpo">
          <p>{pedido.clienteDireccion || 'Sin dirección'}</p>
          <small>{obtenerTotalProductos(pedido)} productos</small>
        </div>

        {pedidoRuta.estado === 'EN_ENTREGA' && (
          <div className="aviso-en-camino">Entrega actual</div>
        )}

        {pedidoRuta.estado === 'ENTREGADO' && (
          <div className="aviso-pedido-entregado-ruta">
            Entregado a las {obtenerHora(pedidoRuta.fechaEntregado)}
          </div>
        )}

        {pedidoRuta.estado === 'PENDIENTE' && (
          <div className="aviso-motero-listo">Pendiente en ruta</div>
        )}
      </button>
    );
  }

  function renderGrupoRuta(ruta) {
    const totalEntregados = contarEntregadosRuta(ruta);
    const totalPedidos = ruta.pedidos.length;

    return (
      <article key={ruta.id} className="grupo-ruta-motero">
        <div className="grupo-ruta-cabecera">
          <div>
            <span>Ruta #{ruta.id}</span>
            <strong>{ruta.motero?.nombre || 'Sin motero'}</strong>
            <small>{obtenerTextoEstadoRuta(ruta)}</small>
          </div>

          <div className="grupo-ruta-accion">
            <p>
              {totalEntregados}/{totalPedidos} entregados
            </p>

            {puedeAvisarRuta(ruta) && (
              <button
                type="button"
                className="boton-aviso-ruta"
                disabled={rutaProcesandoId === ruta.id}
                onClick={() => avisarRutaCompleta(ruta)}
              >
                {rutaProcesandoId === ruta.id
                  ? 'Avisando...'
                  : 'Ruta lista / avisar motero'}
              </button>
            )}

            {ruta.estado === 'AVISADA' && (
              <span className="etiqueta-ruta-avisada">Ruta avisada</span>
            )}

            {ruta.estado === 'EN_REPARTO' && (
              <span className="etiqueta-ruta-reparto">En reparto</span>
            )}
          </div>
        </div>

        <div className="grupo-ruta-lista">
          {ruta.pedidos.map((pedidoRuta) => renderTarjetaPedidoRuta(pedidoRuta))}
        </div>
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
                {pedidoSeleccionado.estado}
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
                <small>Motero</small>
                <strong>
                  {pedidoSeleccionado.moteroAsignado?.nombre || 'Sin asignar'}
                </strong>
              </article>

              <article className="dato-direccion-hd">
                <small>Dirección</small>
                <strong>
                  {pedidoSeleccionado.clienteDireccion || 'Sin dirección'}
                </strong>
              </article>
            </section>

            <section className="productos-modal-hd">
              <h3>Productos del pedido</h3>

              {pedidoSeleccionado.lineas.map((linea) => (
                <article key={linea.id} className="linea-modal-hd">
                  <div className="linea-modal-principal">
                    <strong>
                      <span>{linea.cantidad}x</span> {linea.producto.nombre}
                    </strong>

                    <small>{linea.producto.categoria}</small>
                  </div>

                  {linea.modificaciones.length > 0 && (
                    <ul>
                      {linea.modificaciones.map((modificacion) => (
                        <li key={modificacion.id}>
                          <strong>{modificacion.tipo}</strong>{' '}
                          {modificacion.descripcion}
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
                  : 'Marcar preparado / avisar motero'}
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
              <p>Asignación prevista</p>
              <span>Reservados para cuando termine una ruta</span>
            </div>
            <strong>
              {pedidosAsignacionPrevista.length + pedidosSinRutaTemporal.length}
            </strong>
          </div>

          <div className="lista-pedidos-hd">
            {pedidosAsignacionPrevista.length === 0 &&
            pedidosSinRutaTemporal.length === 0 ? (
              <p className="vacio-hd">Sin asignaciones previstas.</p>
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
              <p>Pedidos con ruta</p>
              <span>Rutas activas por motero</span>
            </div>
            <strong>{totalPedidosRutasActivas}</strong>
          </div>

          <div className="lista-pedidos-hd">
            {rutasActivas.length === 0 ? (
              <p className="vacio-hd">No hay rutas activas.</p>
            ) : (
              rutasActivas.map((ruta) => renderGrupoRuta(ruta))
            )}
          </div>
        </section>
      </section>
    );
  }

  function renderVistaHistorial() {
    return (
      <section className="panel-historial-principal-hd">
        <div className="cabecera-vista-historial">
          <div>
            <p>Historial HD</p>
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
                    {pedido.estado}
                  </p>
                  <small>
                    {pedido.estado === 'ENTREGADO'
                      ? obtenerHora(pedido.fechaEntregado)
                      : obtenerHora(pedido.fechaCreacion)}
                  </small>
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
          Más adelante aquí veremos pedidos con incidencias, mensajes de cliente,
          reclamaciones y respuestas del restaurante.
        </p>
      </section>
    );
  }

  return (
    <main className="pagina-hd-interno">
      <section className="cabecera-hd-interno">
        <div>
          <p>Control interno</p>
          <h1>HD / Delivery interno</h1>
          <span>Glovo, Just Eat, Uber Eats y pedidos web.</span>
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
          <span>Pedidos</span>
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

      {cargando && <p className="mensaje-hd">Cargando pedidos...</p>}

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