import { useEffect, useState } from 'react';
import {
  desconectarMotero,
  entregarPedidoRuta,
  ficharMotero,
  listarMoteros,
  obtenerRutaActivaMotero,
  recogerRuta,
  seleccionarPedidoRuta,
} from '../servicios/moteroServicio';

function MoteroPagina() {
  const [moteros, setMoteros] = useState([]);
  const [moteroSeleccionado, setMoteroSeleccionado] = useState(null);
  const [rutaActiva, setRutaActiva] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoRuta, setCargandoRuta] = useState(false);
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [pedidoRutaProcesandoId, setPedidoRutaProcesandoId] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const moteroSeleccionadoId = moteroSeleccionado?.id;

  useEffect(() => {
    cargarMoteros();
  }, []);

  useEffect(() => {
    if (moteroSeleccionadoId) {
      cargarRutaActiva(moteroSeleccionadoId);
    } else {
      setRutaActiva(null);
    }
  }, [moteroSeleccionadoId]);

  useEffect(() => {
    if (!moteroSeleccionadoId) {
      return;
    }

    const intervalo = setInterval(() => {
      actualizarAutomaticamente(moteroSeleccionadoId);
    }, 5000);

    return () => clearInterval(intervalo);
  }, [moteroSeleccionadoId]);

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

  async function cargarRutaActiva(moteroId) {
    try {
      setCargandoRuta(true);
      const ruta = await obtenerRutaActivaMotero(moteroId);
      setRutaActiva(ruta);
      setError('');
    } catch (error) {
      setRutaActiva(null);
      setError('No se pudo cargar la ruta activa del motero.');
    } finally {
      setCargandoRuta(false);
    }
  }

  async function actualizarAutomaticamente(moteroId) {
    try {
      const datosMoteros = await listarMoteros();
      setMoteros(datosMoteros);

      const moteroActualizado = datosMoteros.find(
        (motero) => motero.id === moteroId
      );

      if (moteroActualizado) {
        setMoteroSeleccionado(moteroActualizado);
      }

      const ruta = await obtenerRutaActivaMotero(moteroId);
      setRutaActiva(ruta);
    } catch (error) {
      // No mostramos error en autoactualización para no molestar al motero.
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
      await cargarRutaActiva(moteroActualizado.id);
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
      setRutaActiva(null);
      setMensaje(`${moteroActualizado.nombre} se ha desconectado.`);

      await cargarMoteros();
    } catch (error) {
      setError('No se pudo desconectar el motero.');
    }
  }

  async function recogerRutaActiva() {
    if (!rutaActiva) {
      setError('No hay ninguna ruta activa para recoger.');
      return;
    }

    try {
      setProcesandoAccion(true);
      setMensaje('');
      setError('');

      const rutaActualizada = await recogerRuta(rutaActiva.id);

      setRutaActiva(rutaActualizada);
      setMensaje('Ruta recogida correctamente. Ya estás en reparto.');

      await cargarMoteros();
    } catch (error) {
      setError('No se pudo recoger la ruta.');
    } finally {
      setProcesandoAccion(false);
    }
  }

  async function seleccionarPedidoActual(pedidoRutaId) {
    try {
      setPedidoRutaProcesandoId(pedidoRutaId);
      setMensaje('');
      setError('');

      const rutaActualizada = await seleccionarPedidoRuta(pedidoRutaId);

      setRutaActiva(rutaActualizada);
      setMensaje('Pedido seleccionado como entrega actual.');
    } catch (error) {
      setError('No se pudo seleccionar este pedido.');
    } finally {
      setPedidoRutaProcesandoId(null);
    }
  }

  async function entregarPedidoDeRuta(pedidoRutaId) {
    try {
      setPedidoRutaProcesandoId(pedidoRutaId);
      setMensaje('');
      setError('');

      const rutaActualizada = await entregarPedidoRuta(pedidoRutaId);

      if (rutaActualizada.estado === 'FINALIZADA') {
        setRutaActiva(null);
        setMensaje('Ruta completada. Todos los pedidos han sido entregados.');
      } else {
        setRutaActiva(rutaActualizada);
        setMensaje('Pedido entregado correctamente.');
      }

      await cargarMoteros();
    } catch (error) {
      setError('No se pudo entregar el pedido.');
    } finally {
      setPedidoRutaProcesandoId(null);
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

  function claseEstadoPedidoRuta(estado) {
    if (estado === 'ENTREGADO') {
      return 'estado-pedido entregado';
    }

    if (estado === 'EN_ENTREGA') {
      return 'estado-pedido actual';
    }

    return 'estado-pedido asignado';
  }

  function obtenerTextoPedidoRuta(estado) {
    if (estado === 'EN_ENTREGA') {
      return 'ENTREGA ACTUAL';
    }

    if (estado === 'ENTREGADO') {
      return 'ENTREGADO';
    }

    return 'PENDIENTE';
  }

  function obtenerTotalProductos(pedido) {
    return pedido.lineas.reduce((total, linea) => total + linea.cantidad, 0);
  }

  function contarEntregados() {
    if (!rutaActiva) {
      return 0;
    }

    return rutaActiva.pedidos.filter(
      (pedidoRuta) => pedidoRuta.estado === 'ENTREGADO'
    ).length;
  }

  function obtenerPedidoActual() {
    if (!rutaActiva) {
      return null;
    }

    return rutaActiva.pedidos.find(
      (pedidoRuta) => pedidoRuta.estado === 'EN_ENTREGA'
    );
  }

  function puedeRecogerRuta() {
    return rutaActiva && rutaActiva.estado === 'AVISADA';
  }

  function puedeSeleccionarPedido(pedidoRuta) {
    return (
      rutaActiva &&
      rutaActiva.estado === 'EN_REPARTO' &&
      pedidoRuta.estado === 'PENDIENTE'
    );
  }

  function puedeEntregarPedido(pedidoRuta) {
    return (
      rutaActiva &&
      rutaActiva.estado === 'EN_REPARTO' &&
      pedidoRuta.estado === 'EN_ENTREGA'
    );
  }

  function renderAvisoRuta() {
    if (!rutaActiva) {
      return null;
    }

    if (rutaActiva.estado === 'ABIERTA') {
      return (
        <p className="aviso-ruta-motero">
          El restaurante todavía está preparando la ruta.
        </p>
      );
    }

    if (rutaActiva.estado === 'AVISADA') {
      return (
        <p className="aviso-ruta-motero listo">
          La ruta ya está lista para recoger.
        </p>
      );
    }

    if (rutaActiva.estado === 'EN_REPARTO') {
      const pedidoActual = obtenerPedidoActual();

      return (
        <p className="aviso-ruta-motero reparto">
          {pedidoActual
            ? `Ahora estás llevando ${pedidoActual.pedido.numeroPedido}.`
            : 'Ruta en reparto. Elige qué pedido estás llevando ahora.'}
        </p>
      );
    }

    return null;
  }

  function renderPedidoRuta(pedidoRuta) {
    const pedido = pedidoRuta.pedido;

    return (
      <article
        key={pedidoRuta.id}
        className={
          pedidoRuta.estado === 'EN_ENTREGA'
            ? 'pedido-activo-motero pedido-en-entrega'
            : 'pedido-activo-motero'
        }
      >
        <div className="pedido-activo-cabecera">
          <div>
            <span>
              Orden {pedidoRuta.ordenEntrega} · {obtenerTextoOrigen(pedido)}
            </span>
            <h3>{pedido.numeroPedido}</h3>
          </div>

          <p className={claseEstadoPedidoRuta(pedidoRuta.estado)}>
            {obtenerTextoPedidoRuta(pedidoRuta.estado)}
          </p>
        </div>

        <div className="datos-pedido-motero">
          <div>
            <small>Cliente</small>
            <strong>{pedido.clienteNombre || 'Sin nombre'}</strong>
          </div>

          <div>
            <small>Teléfono</small>
            <strong>{pedido.clienteTelefono || 'Sin teléfono'}</strong>
          </div>

          <div>
            <small>Productos</small>
            <strong>{obtenerTotalProductos(pedido)}</strong>
          </div>

          <div className="direccion-pedido-motero">
            <small>Dirección</small>
            <strong>{pedido.clienteDireccion || 'Sin dirección'}</strong>
          </div>
        </div>

        <div className="productos-pedido-motero">
          <h4>Productos</h4>

          {pedido.lineas.map((linea) => (
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
          {puedeSeleccionarPedido(pedidoRuta) && (
            <button
              type="button"
              className="boton-secundario-motero"
              disabled={pedidoRutaProcesandoId === pedidoRuta.id}
              onClick={() => seleccionarPedidoActual(pedidoRuta.id)}
            >
              {pedidoRutaProcesandoId === pedidoRuta.id
                ? 'Seleccionando...'
                : 'Estoy llevando este'}
            </button>
          )}

          {puedeEntregarPedido(pedidoRuta) && (
            <button
              type="button"
              className="boton-principal-motero"
              disabled={pedidoRutaProcesandoId === pedidoRuta.id}
              onClick={() => entregarPedidoDeRuta(pedidoRuta.id)}
            >
              {pedidoRutaProcesandoId === pedidoRuta.id
                ? 'Entregando...'
                : 'Entregar pedido'}
            </button>
          )}

          {pedidoRuta.estado === 'ENTREGADO' && (
            <span className="pedido-entregado-motero">Entregado</span>
          )}
        </div>
      </article>
    );
  }

  return (
    <main className="pagina-motero">
      <section className="cabecera-motero">
        <p>App independiente</p>
        <h1>App Motero</h1>
        <span>
          Aquí el motero ficha, consulta su ruta activa y entregará pedidos uno
          por uno.
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

            <div>
              <small>Ruta</small>
              <strong>{rutaActiva ? rutaActiva.estado : 'Sin ruta'}</strong>
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
          <h2>Ruta activa</h2>

          {moteroSeleccionado && (
            <button
              type="button"
              onClick={() => cargarRutaActiva(moteroSeleccionado.id)}
            >
              Actualizar
            </button>
          )}
        </div>

        {!moteroSeleccionado && (
          <p className="vacio">Selecciona un motero para ver su ruta.</p>
        )}

        {moteroSeleccionado && cargandoRuta && (
          <p className="vacio">Cargando ruta activa...</p>
        )}

        {moteroSeleccionado && !cargandoRuta && !rutaActiva && (
          <p className="vacio">Este motero no tiene ninguna ruta activa.</p>
        )}

        {moteroSeleccionado && !cargandoRuta && rutaActiva && (
          <section>
            <div className="resumen-ruta-motero">
              <div>
                <small>Ruta</small>
                <strong>#{rutaActiva.id}</strong>
              </div>

              <div>
                <small>Estado</small>
                <strong>{rutaActiva.estado}</strong>
              </div>

              <div>
                <small>Entregados</small>
                <strong>
                  {contarEntregados()}/{rutaActiva.pedidos.length}
                </strong>
              </div>
            </div>

            {renderAvisoRuta()}

            <div className="acciones-ruta-motero">
              {puedeRecogerRuta() && (
                <button
                  type="button"
                  className="boton-ruta-principal"
                  disabled={procesandoAccion}
                  onClick={recogerRutaActiva}
                >
                  {procesandoAccion
                    ? 'Recogiendo ruta...'
                    : 'Recoger ruta / salir a reparto'}
                </button>
              )}
            </div>

            <div className="lista-pedidos-ruta-motero">
              {rutaActiva.pedidos.map((pedidoRuta) =>
                renderPedidoRuta(pedidoRuta)
              )}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

export default MoteroPagina;