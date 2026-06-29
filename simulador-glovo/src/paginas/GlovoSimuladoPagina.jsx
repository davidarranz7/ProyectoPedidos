import { useEffect, useState } from 'react';
import { crearPedidoHd } from '../servicios/pedidoServicio';
import { listarProductos } from '../servicios/productoServicio';

function GlovoSimuladoPagina() {
  const [productos, setProductos] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [plataforma, setPlataforma] = useState('GLOVO');
  const [clienteNombre, setClienteNombre] = useState('Cliente Glovo');
  const [clienteDireccion, setClienteDireccion] = useState('Calle Ejemplo 12');
  const [clienteTelefono, setClienteTelefono] = useState('600000000');
  const [tipoPedido, setTipoPedido] = useState('normal');
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    try {
      const datos = await listarProductos();
      setProductos(datos);
      setError('');
    } catch (error) {
      setError('No se pudieron cargar los productos.');
    } finally {
      setCargando(false);
    }
  }

  function agregarProducto(producto) {
    const lineaExistente = lineas.find(
      (linea) => linea.productoId === producto.id
    );

    if (lineaExistente) {
      setLineas(
        lineas.map((linea) =>
          linea.productoId === producto.id
            ? { ...linea, cantidad: linea.cantidad + 1 }
            : linea
        )
      );
      return;
    }

    setLineas([
      ...lineas,
      {
        productoId: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria,
        cantidad: 1,
        modificaciones: [],
      },
    ]);
  }

  function quitarProducto(productoId) {
    const lineaExistente = lineas.find((linea) => linea.productoId === productoId);

    if (!lineaExistente) {
      return;
    }

    if (lineaExistente.cantidad <= 1) {
      setLineas(lineas.filter((linea) => linea.productoId !== productoId));
      return;
    }

    setLineas(
      lineas.map((linea) =>
        linea.productoId === productoId
          ? { ...linea, cantidad: linea.cantidad - 1 }
          : linea
      )
    );
  }

  function eliminarLinea(productoId) {
    setLineas(lineas.filter((linea) => linea.productoId !== productoId));
  }

  function cambiarModificacion(productoId, texto) {
    setLineas(
      lineas.map((linea) => {
        if (linea.productoId !== productoId) {
          return linea;
        }

        if (!texto.trim()) {
          return {
            ...linea,
            modificaciones: [],
          };
        }

        return {
          ...linea,
          modificaciones: [
            {
              tipo: 'NOTA',
              descripcion: texto,
            },
          ],
        };
      })
    );
  }

  function obtenerNotaLinea(linea) {
    if (!linea.modificaciones || linea.modificaciones.length === 0) {
      return '';
    }

    return linea.modificaciones[0].descripcion;
  }

  function formatearFechaProgramadaParaBackend(valor) {
    if (!valor) {
      return null;
    }

    if (valor.length === 16) {
      return `${valor}:00`;
    }

    return valor;
  }

  async function enviarPedido() {
    if (lineas.length === 0) {
      setError('Añade al menos un producto.');
      return;
    }

    if (tipoPedido === 'programado' && !fechaProgramada) {
      setError('Selecciona la fecha y hora programada.');
      return;
    }

    try {
      setEnviando(true);
      setMensaje('');
      setError('');

      const datosPedido = {
        plataforma,
        clienteNombre,
        clienteDireccion,
        clienteTelefono,
        fechaProgramada:
          tipoPedido === 'programado'
            ? formatearFechaProgramadaParaBackend(fechaProgramada)
            : null,
        lineas: lineas.map((linea) => ({
          productoId: linea.productoId,
          cantidad: linea.cantidad,
          modificaciones: linea.modificaciones,
        })),
      };

      const pedidoCreado = await crearPedidoHd(datosPedido);

      if (pedidoCreado.estado === 'PROGRAMADO') {
        setMensaje(
          `Pedido programado creado: ${pedidoCreado.numeroPedido}. Saldrá a cocina a su hora.`
        );
      } else {
        setMensaje(
          `Pedido creado: ${pedidoCreado.numeroPedido}. Estado: ${pedidoCreado.estado}.`
        );
      }

      setLineas([]);
      setClienteNombre('Cliente Glovo');
      setClienteDireccion('Calle Ejemplo 12');
      setClienteTelefono('600000000');
      setTipoPedido('normal');
      setFechaProgramada('');
    } catch (error) {
      setError('No se pudo crear el pedido.');
    } finally {
      setEnviando(false);
    }
  }

  const productosPorCategoria = productos.reduce((grupos, producto) => {
    const categoria = producto.categoria || 'OTROS';

    if (!grupos[categoria]) {
      grupos[categoria] = [];
    }

    grupos[categoria].push(producto);

    return grupos;
  }, {});

  return (
    <main className="pagina-glovo">
      <section className="cabecera-glovo">
        <div>
          <p>Simulador externo</p>
          <h1>Simulador Glovo</h1>
          <span>
            Crea pedidos HD normales o programados para probar el panel interno.
          </span>
        </div>

        <div className="estado-glovo">
          <small>Puerto</small>
          <strong>5174</strong>
        </div>
      </section>

      {mensaje && <p className="mensaje-glovo correcto">{mensaje}</p>}
      {error && <p className="mensaje-glovo error">{error}</p>}

      <section className="layout-glovo">
        <section className="panel-glovo">
          <h2>Datos del pedido</h2>

          <label>
            Plataforma
            <select
              value={plataforma}
              onChange={(evento) => setPlataforma(evento.target.value)}
            >
              <option value="GLOVO">Glovo</option>
              <option value="JUST_EAT">Just Eat</option>
              <option value="UBER_EATS">Uber Eats</option>
              <option value="WEB">Web</option>
            </select>
          </label>

          <label>
            Cliente
            <input
              value={clienteNombre}
              onChange={(evento) => setClienteNombre(evento.target.value)}
            />
          </label>

          <label>
            Dirección
            <input
              value={clienteDireccion}
              onChange={(evento) => setClienteDireccion(evento.target.value)}
            />
          </label>

          <label>
            Teléfono
            <input
              value={clienteTelefono}
              onChange={(evento) => setClienteTelefono(evento.target.value)}
            />
          </label>

          <div className="tipo-pedido-glovo">
            <button
              type="button"
              className={tipoPedido === 'normal' ? 'activo' : ''}
              onClick={() => setTipoPedido('normal')}
            >
              Pedido inmediato
            </button>

            <button
              type="button"
              className={tipoPedido === 'programado' ? 'activo' : ''}
              onClick={() => setTipoPedido('programado')}
            >
              Pedido programado
            </button>
          </div>

          {tipoPedido === 'programado' && (
            <label>
              Fecha y hora programada
              <input
                type="datetime-local"
                value={fechaProgramada}
                onChange={(evento) => setFechaProgramada(evento.target.value)}
              />
            </label>
          )}
        </section>

        <section className="panel-glovo productos-glovo">
          <h2>Productos</h2>

          {cargando && <p className="vacio-glovo">Cargando productos...</p>}

          {!cargando &&
            Object.entries(productosPorCategoria).map(([categoria, lista]) => (
              <div key={categoria} className="grupo-productos-glovo">
                <h3>{categoria}</h3>

                <div className="grid-productos-glovo">
                  {lista.map((producto) => (
                    <button
                      type="button"
                      key={producto.id}
                      className="producto-glovo"
                      onClick={() => agregarProducto(producto)}
                    >
                      <strong>{producto.nombre}</strong>
                      <span>{Number(producto.precio).toFixed(2)} €</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </section>

        <section className="panel-glovo resumen-glovo">
          <h2>Pedido actual</h2>

          {lineas.length === 0 ? (
            <p className="vacio-glovo">Todavía no has añadido productos.</p>
          ) : (
            <div className="lineas-glovo">
              {lineas.map((linea) => (
                <article key={linea.productoId} className="linea-glovo">
                  <div className="linea-glovo-superior">
                    <div>
                      <strong>
                        {linea.cantidad}x {linea.nombre}
                      </strong>
                      <span>{linea.categoria}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => eliminarLinea(linea.productoId)}
                    >
                      Eliminar
                    </button>
                  </div>

                  <div className="controles-linea-glovo">
                    <button
                      type="button"
                      onClick={() => quitarProducto(linea.productoId)}
                    >
                      -
                    </button>

                    <strong>{linea.cantidad}</strong>

                    <button
                      type="button"
                      onClick={() =>
                        agregarProducto({
                          id: linea.productoId,
                          nombre: linea.nombre,
                          categoria: linea.categoria,
                        })
                      }
                    >
                      +
                    </button>
                  </div>

                  <label>
                    Nota / modificación
                    <input
                      placeholder="Ej: sin tomate, extra salsa..."
                      value={obtenerNotaLinea(linea)}
                      onChange={(evento) =>
                        cambiarModificacion(linea.productoId, evento.target.value)
                      }
                    />
                  </label>
                </article>
              ))}
            </div>
          )}

          <button
            type="button"
            className="boton-enviar-glovo"
            disabled={enviando}
            onClick={enviarPedido}
          >
            {enviando
              ? 'Enviando...'
              : tipoPedido === 'programado'
                ? 'Crear pedido programado'
                : 'Crear pedido inmediato'}
          </button>
        </section>
      </section>
    </main>
  );
}

export default GlovoSimuladoPagina;