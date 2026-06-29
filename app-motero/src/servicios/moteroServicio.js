import apiCliente from './apiCliente';

export async function listarMoteros() {
  const respuesta = await apiCliente.get('/moteros');
  return respuesta.data;
}

export async function listarMoterosDisponibles() {
  const respuesta = await apiCliente.get('/moteros/disponibles');
  return respuesta.data;
}

export async function obtenerPedidoActivoMotero(moteroId) {
  const respuesta = await apiCliente.get(`/moteros/${moteroId}/pedido-activo`);
  return respuesta.data;
}

export async function obtenerRutaActivaMotero(moteroId) {
  const respuesta = await apiCliente.get(
    `/rutas-reparto/motero/${moteroId}/activa`
  );
  return respuesta.data;
}

export async function recogerRuta(rutaId) {
  const respuesta = await apiCliente.put(`/rutas-reparto/${rutaId}/recoger`);
  return respuesta.data;
}

export async function seleccionarPedidoRuta(pedidoRutaId) {
  const respuesta = await apiCliente.put(
    `/rutas-reparto/pedidos-ruta/${pedidoRutaId}/seleccionar`
  );
  return respuesta.data;
}

export async function entregarPedidoRuta(pedidoRutaId) {
  const respuesta = await apiCliente.put(
    `/rutas-reparto/pedidos-ruta/${pedidoRutaId}/entregar`
  );
  return respuesta.data;
}

export async function ficharMotero(moteroId) {
  const respuesta = await apiCliente.put(`/moteros/${moteroId}/fichar`);
  return respuesta.data;
}

export async function desconectarMotero(moteroId) {
  const respuesta = await apiCliente.put(`/moteros/${moteroId}/desconectar`);
  return respuesta.data;
}

export async function recogerPedidoActivo(moteroId) {
  const respuesta = await apiCliente.put(
    `/moteros/${moteroId}/pedido-activo/recoger`
  );
  return respuesta.data;
}

export async function entregarPedidoActivo(moteroId) {
  const respuesta = await apiCliente.put(
    `/moteros/${moteroId}/pedido-activo/entregar`
  );
  return respuesta.data;
}