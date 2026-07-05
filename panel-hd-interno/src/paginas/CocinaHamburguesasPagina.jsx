import { useEffect, useState } from 'react';
import { listarPedidosHamburguesas } from '../servicios/cocinaServicio';

function CocinaHamburguesasPagina() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarPedidos();

    const intervalo = setInterval(() => {
      cargarPedidos();
    }, 5000);

    return () => clearInterval(intervalo);
  }, []);

  async function cargarPedidos() {
    try {
      const datos = await listarPedidosHamburguesas();
      setPedidos(datos);
      setError('');
    } catch (error) {
      setError('No se pudieron cargar los pedidos de cocina.');
    } finally {
      setCargando(false);
    }
  }

  function pintarOrigen(pedido) {
    if (pedido.origen === 'HD') {
      return pedido.plataforma;
    }

    return pedido.origen;
  }

  return (
    <main className="pagina">
      <section className="cabecera cocina">
        <div>
          <p className="etiqueta">Pantalla de cocina</p>
          <h1>Hamburguesas / Wraps / Ensaladas</h1>
          <p>
            Aquí solo aparecen los productos que corresponden a esta estación.
          </p>
        </div>

        <button className="boton-secundario" onClick={cargarPedidos}>
          Actualizar
        </button>
      </section>

      {cargando && <p className="mensaje">Cargando pedidos...</p>}
      {error && <p className="mensaje error">{error}</p>}

      {!cargando && pedidos.length === 0 && (
        <section className="panel">
          <p className="vacio">No hay pedidos pendientes para hamburguesas.</p>
        </section>
      )}

      <section className="tablero-cocina">
        {pedidos.map((pedido) => (
          <article key={pedido.id} className="ticket-cocina">
            <header className="ticket-cabecera">
              <div>
                <strong>{pedido.numeroPedido}</strong>
                <span>{pintarOrigen(pedido)}</span>
              </div>

              <small>{pedido.estado}</small>
            </header>

            <div className="ticket-productos">
              {pedido.lineas.map((linea) => (
                <div key={linea.id} className="producto-cocina">
                  <div className="producto-cocina-principal">
                    <strong>{linea.cantidad}x</strong>
                    <span>{linea.producto.nombre}</span>
                  </div>

                  {linea.modificaciones.length > 0 && (
                    <ul className="lista-modificaciones">
                      {linea.modificaciones.map((modificacion) => (
                        <li key={modificacion.id}>
                          {modificacion.tipo} {modificacion.descripcion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default CocinaHamburguesasPagina;