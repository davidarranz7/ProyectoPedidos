import apiCliente from './apiCliente';

export async function listarPedidosHamburguesas() {
  const respuesta = await apiCliente.get('/cocina/hamburguesas');
  return respuesta.data;
}