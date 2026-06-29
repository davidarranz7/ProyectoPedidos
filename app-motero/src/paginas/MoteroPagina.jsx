import { useEffect, useState } from 'react';
import {
  desconectarMotero,
  entregarPedidoActivo,
  ficharMotero,
  listarMoteros,
  obtenerPedidoActivoMotero,
  recogerPedidoActivo,
} from '../servicios/moteroServicio';

function MoteroPagina() {
  const [moteros, setMoteros] = useState([]);
  const [moteroSeleccionado, setMoteroSeleccionado] = useState(null);
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoPedido, setCargandoPedido] = useState(false);
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    cargarMoteros();
  }, []);

  useEffect(() => {
    if (moteroSeleccionado) {
      cargarPedidoActivo(moteroSeleccionado.id);
    } else {
      setPedidoActivo(null);
    }
  }, [moteroSeleccionado]);

  async function cargarMoteros() {
    try {
      const datos = await listarMoteros();
      setMoteros(datos);

      if (moteroSeleccionado) {
        const actualizado = datos.find(
          (motero) => motero.id === moteroSeleccionado.id
        );

        if (actualizado) {
          setMoteroSeleccionado(actualizado);
        }
      }

      setError('');
    } catch (error) {
      setError('No se pudieron cargar los moteros.');
    } finally {
      setCargando(false);
    }
  }

  async function cargarPedidoActivo(moteroId) {
    try {
      setCargandoPedido(true);
      const pedido = await obtenerPedidoActivoMotero(moteroId);
      setPedidoActivo(pedido);
    } catch (error) {
      setPedidoActivo(null);
      setError('No se pudo cargar el pedido activo del motero.');
    } finally {
      setCargandoPedido(false);
    }
  }

  async function fichar() {
    if (!moteroSeleccionado) {
      setError('Selecciona un motero primero.');
      return;
    }

    try {
      setMensaje('');
      setError('');

      const moteroActualizado = await ficharMotero(moteroSeleccionado.id);
      setMoteroSeleccionado(moteroActualizado);
      setMensaje(`${moteroActualizado.nombre} ha fichado correctamente.`);
      await cargarMoteros();
      await cargarPedidoActivo(moteroActualizado.id);
    } catch (error) {
      setError('No se pudo fichar el motero.');
    }
  }

  async function desconectar() {
    if (!moteroSeleccionado) {
      setError('Selecciona un motero primero.');
      return;
    }

    try {
      setMensaje('');
      setError('');

      const moteroActualizado = await desconectarMotero(moteroSeleccionado.id);
      setMoteroSeleccionado(moteroActualizado);
      setPedidoActivo(null);
      setMensaje(`${moteroActualizado.nombre} se ha desconectado.`);
      await cargarMoteros();
    } catch (error) {
      setError('No se pudo desconectar el motero.');
    }
  }

  async function marcarPedidoRecogido() {
    if (!moteroSeleccionado) {
      setError('Selecciona un motero primero.');
      return;
    }

    try {
      setProcesandoAccion(true);
      setMensaje('');
      setError('');

      const pedidoActualizado = await recogerPedidoActivo(
        moteroSeleccionado.id
      );

      setPedidoActivo(pedidoActualizado);
      setMensaje('Pedido marcado como recogido. El pedido está en camino.');

      await cargarMoteros();
    } catch (error) {
      setError('No se pudo marcar el pedido como recogido.');
    } finally {
      setProcesandoAccion(false);
    }
  }

  async function marcarPedidoEntregado() {
    if (!moteroSeleccionado) {
      setError('Selecciona un motero primero.');
      return;
    }

    try {
      setProcesandoAccion(true);
      setMensaje('');
      setError('');

      await entregarPedidoActivo(moteroSeleccionado.id);

      setPedidoActivo(null);
      setMensaje('Pedido entregado correctamente.');

      await cargarMoteros();
    } catch (error) {
      setError('No se pudo marcar el pedido como entregado.');
    } finally {
      setProcesandoAccion(false);
    }
  }

  function seleccionarMotero(motero) {
    setMoteroSeleccionado(motero);
    setMensaje('');
    setError('');
  }

  function obtenerTextoOrigen(pedido) {
    if (pedido.plataforma === 'JUST_EAT') {
      return 'JUST EAT';
    }

    if (pedido.plataforma === 'UBER_EATS') {
      return 'UBER EATS';
    }

    return pedido.plataforma;
  }

  function claseEstado(estado) {
    if (estado === 'DISPONIBLE') {
      return 'estado disponible';
    }

    if (estado === 'DESCONECTADO') {
      return 'estado desconectado';
    }

    return 'estado ocupado';
  }

  function claseEstadoPedido(estado) {
    if (estado === 'ASIGNADO_MOTERO') {
      return 'estado-pedido asignado';
    }

    if (estado === 'PREPARADO' || estado === 'MOTERO_AVISADO') {
      return 'estado-pedido preparado';
    }

    if (estado === 'RECOGIDO_ESTABLECIMIENTO' || estado === 'EN_CAMINO') {
      return 'estado-pedido camino';
    }

    return 'estado-pedido neutro';
  }

  function puedeRecogerPedido() {
    if (!pedidoActivo) {
      return false;
    }

    return (
      pedidoActivo.estado === 'ASIGNADO_MOTERO' ||
      pedidoActivo.estado === 'PREPARADO' ||
      pedidoActivo.estado === 'MOTERO_AVISADO'
    );
  }

  function puedeEntregarPedido() {
    if (!pedidoActivo) {
      return false;
    }

    return (
      pedidoActivo.estado === 'RECOGIDO_ESTABLECIMIENTO' ||
      pedidoActivo.estado === 'EN_CAMINO'
    );
  }

  return (
    <main className="pagina-motero">
      <section className="cabecera-motero">
        <p>App independiente</p>
        <h1>App Motero</h1>
        <span>
          Aquí el motero ficha, consulta su pedido activo y actualiza el reparto.
        </span>
      </section>

      <section className="panel-motero">
        <h2>Selecciona tu usuario</h2>

        {cargando && <p className="mensaje">Cargando moteros...</p>}
        {error && <p className="mensaje error">{error}</p>}
        {mensaje && <p className="mensaje correcto">{mensaje}</p>}

        <div className="lista-moteros">
          {moteros.map((motero) => (
            <button
              type="button"
              key={motero.id}
              className={
                moteroSeleccionado?.id === motero.id
                  ? 'tarjeta-motero seleccionada'
                  : 'tarjeta-motero'
              }
              onClick={() => seleccionarMotero(motero)}
            >
              <div>
                <strong>{motero.nombre}</strong>
                <span>ID motero: {motero.id}</span>
              </div>

              <p className={claseEstado(motero.estado)}>{motero.estado}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="panel-motero">
        <h2>Estado actual</h2>

        {!moteroSeleccionado ? (
          <p className="vacio">Selecciona un motero para gestionar su turno.</p>
        ) : (
          <div className="estado-actual">
            <div>
              <small>Motero</small>
              <strong>{moteroSeleccionado.nombre}</strong>
            </div>

            <div>
              <small>Estado</small>
              <strong>{moteroSeleccionado.estado}</strong>
            </div>

            <div className="acciones-motero">
              <button className="boton-fichar" onClick={fichar}>
                Fichar / poner disponible
              </button>

              <button className="boton-desconectar" onClick={desconectar}>
                Desconectar
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="panel-motero">
        <div className="titulo-pedido-activo">
          <h2>Pedido asignado</h2>

          {moteroSeleccionado && (
            <button
              type="button"
              onClick={() => cargarPedidoActivo(moteroSeleccionado.id)}
            >
              Actualizar
            </button>
          )}
        </div>

        {!moteroSeleccionado && (
          <p className="vacio">Selecciona un motero para ver su pedido.</p>
        )}

        {moteroSeleccionado && cargandoPedido && (
          <p className="vacio">Cargando pedido activo...</p>
        )}

        {moteroSeleccionado && !cargandoPedido && !pedidoActivo && (
          <p className="vacio">
            Este motero no tiene ningún pedido activo asignado.
          </p>
        )}

        {moteroSeleccionado && !cargandoPedido && pedidoActivo && (
          <article className="pedido-activo-motero">
            <div className="pedido-activo-cabecera">
              <div>
                <span>{obtenerTextoOrigen(pedidoActivo)}</span>
                <h3>{pedidoActivo.numeroPedido}</h3>
              </div>

              <p className={claseEstadoPedido(pedidoActivo.estado)}>
                {pedidoActivo.estado}
              </p>
            </div>

            <div className="datos-pedido-motero">
              <div>
                <small>Cliente</small>
                <strong>{pedidoActivo.clienteNombre || 'Sin nombre'}</strong>
              </div>

              <div>
                <small>Teléfono</small>
                <strong>{pedidoActivo.clienteTelefono || 'Sin teléfono'}</strong>
              </div>

              <div className="direccion-pedido-motero">
                <small>Dirección</small>
                <strong>
                  {pedidoActivo.clienteDireccion || 'Sin dirección'}
                </strong>
              </div>
            </div>

            <div className="productos-pedido-motero">
              <h4>Productos</h4>

              {pedidoActivo.lineas.map((linea) => (
                <article key={linea.id} className="linea-pedido-motero">
                  <div>
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
            </div>

            <div className="acciones-pedido-motero">
              <button type="button" className="boton-secundario-motero">
                Ver ruta
              </button>

              {puedeRecogerPedido() && (
                <button
                  type="button"
                  className="boton-principal-motero"
                  disabled={procesandoAccion}
                  onClick={marcarPedidoRecogido}
                >
                  {procesandoAccion ? 'Actualizando...' : 'Pedido recogido'}
                </button>
              )}

              {puedeEntregarPedido() && (
                <button
                  type="button"
                  className="boton-principal-motero"
                  disabled={procesandoAccion}
                  onClick={marcarPedidoEntregado}
                >
                  {procesandoAccion ? 'Actualizando...' : 'Pedido entregado'}
                </button>
              )}
            </div>

            <p className="nota-motero">
              Cuando el pedido se entrega, desaparece de esta pantalla porque
              pasa a historial.
            </p>
          </article>
        )}
      </section>
    </main>
  );
}

export default MoteroPagina;