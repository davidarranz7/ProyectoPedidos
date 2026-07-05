package com.fastflow.pedidos.configuracion;

import com.fastflow.pedidos.modelo.Motero;
import com.fastflow.pedidos.modelo.Producto;
import com.fastflow.pedidos.modelo.enums.EstadoMotero;
import com.fastflow.pedidos.repositorio.MoteroRepositorio;
import com.fastflow.pedidos.repositorio.ProductoRepositorio;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class CargadorDatosIniciales implements CommandLineRunner {

    private final ProductoRepositorio productoRepositorio;
    private final MoteroRepositorio moteroRepositorio;

    @Override
    public void run(String... args) {
        crearProductosDemoDelivery();
        crearMoterosIniciales();
    }

    private void crearProductosDemoDelivery() {
        if (productoRepositorio.count() > 0) {
            return;
        }

        productoRepositorio.save(crearProducto("DEMO-MENU-001", "Menú delivery demo", "MENU", "9.95"));
        productoRepositorio.save(crearProducto("DEMO-MENU-002", "Menú especial demo", "MENU", "11.95"));
        productoRepositorio.save(crearProducto("DEMO-PROD-001", "Producto principal demo", "PRODUCTO", "7.95"));
        productoRepositorio.save(crearProducto("DEMO-COMP-001", "Complemento demo", "COMPLEMENTO", "3.50"));
        productoRepositorio.save(crearProducto("DEMO-BEB-001", "Bebida demo", "BEBIDA", "2.50"));
        productoRepositorio.save(crearProducto("DEMO-POST-001", "Postre demo", "POSTRE", "3.95"));
    }

    private void crearMoterosIniciales() {
        if (moteroRepositorio.count() > 0) {
            return;
        }

        moteroRepositorio.save(crearMotero("Carlos", EstadoMotero.DISPONIBLE));
        moteroRepositorio.save(crearMotero("Marta", EstadoMotero.DISPONIBLE));
        moteroRepositorio.save(crearMotero("Luis", EstadoMotero.DESCONECTADO));
        moteroRepositorio.save(crearMotero("Andrea", EstadoMotero.DISPONIBLE));
    }

    private Producto crearProducto(String codigoExterno, String nombre, String categoria, String precio) {
        return Producto.builder()
                .codigoExterno(codigoExterno)
                .nombre(nombre)
                .categoria(categoria)
                .precio(new BigDecimal(precio))
                .activo(true)
                .build();
    }

    private Motero crearMotero(String nombre, EstadoMotero estado) {
        return Motero.builder()
                .nombre(nombre)
                .estado(estado)
                .activo(true)
                .build();
    }
}
