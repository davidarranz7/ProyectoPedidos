import apiCliente from './apiCliente';

export async function listarProductos() {
  const respuesta = await apiCliente.get('/productos');
  return respuesta.data;
}