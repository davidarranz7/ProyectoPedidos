import apiCliente from './apiCliente';

export async function crearPedidoHd(datosPedido) {
  const respuesta = await apiCliente.post('/hd/pedidos', datosPedido);
  return respuesta.data;
}