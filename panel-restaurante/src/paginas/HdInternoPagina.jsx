import { useEffect, useState } from 'react';
import {
  listarPedidosHd,
  marcarPedidoPreparado,
} from '../servicios/pedidoServicio';

function HdInternoPagina() {
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [vistaActiva, setVistaActiva] = useState('pedidos');
  const [cargando, setCargando] = useState(true);
  const [procesandoAccion, setProcesandoAccion] = useState(false);
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
      const datos = await listarPedidosHd();
      setPedidos(datos);

      if (pedidoSeleccionado) {
        const actualizado = datos.find(
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

  const pedidosProgramados = pedidos.filter(
    (pedido) => pedido.estado === 'PROGRAMADO'
  );

  const pedidosActivos = pedidos.filter(
    (pedido) =>
      pedido.estado !== 'ENTREGADO' &&
      pedido.estado !== 'CANCELADO' &&
      pedido.estado !== 'PROGRAMADO'
  );

  const pedidosHistorial = pedidos.filter(
    (pedido) => pedido.estado === 'ENTREGADO' || pedido.estado === 'CANCELADO'
  );

  const pedidosSinAsignar = pedidosActivos.filter(
    (pedido) => !pedido.moteroAsignado
  );

  const pedidosAsignados = pedidosActivos.filter(
    (pedido) => pedido.moteroAsignado
  );

  const pedidosEnCamino = pedidosAsignados.filter(
    (pedido) =>
      pedido.estado === 'EN_CAMINO' ||
      pedido.estado === 'RECOGIDO_ESTABLECIMIENTO'
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

    if (
      pedido.estado === 'EN_CAMINO' ||
      pedido.estado === 'RECOGIDO_ESTABLECIMIENTO'
    ) {
      return 'tarjeta-hd en-camino';
    }

    if (pedido.estado === 'PREPARADO' || pedido.estado === 'MOTERO_AVISADO') {
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

        {tipo === 'asignado' && (
          <div className="tarjeta-hd-motero">
            <span>Motero</span>
            <strong>{pedido.moteroAsignado?.nombre || 'Sin asignar'}</strong>
          </div>
        )}

        {(pedido.estado === 'EN_CAMINO' ||
          pedido.estado === 'RECOGIDO_ESTABLECIMIENTO') && (
          <div className="aviso-en-camino">Pedido en camino</div>
        )}
      </button>
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

        <section className="columna-hd sin-asignar">
          <div className="titulo-columna-hd">
            <div>
              <p>Pedidos sin asignar</p>
              <span>Entrantes pendientes de motero</span>
            </div>
            <strong>{pedidosSinAsignar.length}</strong>
          </div>

          <div className="lista-pedidos-hd">
            {pedidosSinAsignar.length === 0 ? (
              <p className="vacio-hd">No hay pedidos sin asignar.</p>
            ) : (
              pedidosSinAsignar.map((pedido) =>
                renderTarjetaPedido(pedido, 'sin-asignar')
              )
            )}
          </div>
        </section>

        <section className="columna-hd asignados">
          <div className="titulo-columna-hd">
            <div>
              <p>Pedidos asignados</p>
              <span>Con motero asignado</span>
            </div>
            <strong>{pedidosAsignados.length}</strong>
          </div>

          <div className="lista-pedidos-hd">
            {pedidosAsignados.length === 0 ? (
              <p className="vacio-hd">No hay pedidos asignados.</p>
            ) : (
              pedidosAsignados.map((pedido) =>
                renderTarjetaPedido(pedido, 'asignado')
              )
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
            <strong>{pedidosActivos.length}</strong>
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
          <strong>{pedidosActivos.length}</strong>
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