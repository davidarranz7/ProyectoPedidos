import apiCliente from './apiCliente';

export async function listarPedidosHd() {
  const respuesta = await apiCliente.get('/hd/pedidos');
  return respuesta.data;
}

export async function marcarPedidoPreparado(pedidoId) {
  const respuesta = await apiCliente.put(`/hd/pedidos/${pedidoId}/preparado`);
  return respuesta.data;
}

export async function listarRutasActivas() {
  const respuesta = await apiCliente.get('/rutas-reparto/activas');
  return respuesta.data;
}

export async function avisarRuta(rutaId) {
  const respuesta = await apiCliente.put(`/rutas-reparto/${rutaId}/avisar`);
  return respuesta.data;
}