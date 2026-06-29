package com.fastflow.pedidos.configuracion;

import com.fastflow.pedidos.modelo.Motero;
import com.fastflow.pedidos.modelo.Producto;
import com.fastflow.pedidos.modelo.enums.CategoriaProducto;
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
        crearProductosIniciales();
        crearMoterosIniciales();
    }

    private void crearProductosIniciales() {
        if (productoRepositorio.count() > 0) {
            return;
        }

        productoRepositorio.save(crearProducto("Chicken Burger", CategoriaProducto.HAMBURGUESA, "8.95"));
        productoRepositorio.save(crearProducto("Doble Chicken Burger", CategoriaProducto.HAMBURGUESA, "10.95"));
        productoRepositorio.save(crearProducto("Burger BBQ Bacon", CategoriaProducto.HAMBURGUESA, "9.95"));

        productoRepositorio.save(crearProducto("Wrap BBQ", CategoriaProducto.WRAP, "7.95"));
        productoRepositorio.save(crearProducto("Wrap Classic", CategoriaProducto.WRAP, "7.50"));

        productoRepositorio.save(crearProducto("Ensalada César", CategoriaProducto.ENSALADA_PRINCIPAL, "8.50"));

        productoRepositorio.save(crearProducto("Patatas normales", CategoriaProducto.COMPLEMENTO, "2.95"));
        productoRepositorio.save(crearProducto("Patatas Gouda", CategoriaProducto.COMPLEMENTO, "3.95"));
        productoRepositorio.save(crearProducto("Aros de cebolla", CategoriaProducto.COMPLEMENTO, "3.50"));
        productoRepositorio.save(crearProducto("Green Salad", CategoriaProducto.COMPLEMENTO, "3.20"));

        productoRepositorio.save(crearProducto("Alitas x6", CategoriaProducto.POLLO, "5.95"));
        productoRepositorio.save(crearProducto("Tiras de pollo x3", CategoriaProducto.POLLO, "5.50"));
        productoRepositorio.save(crearProducto("Piezas de pollo x2", CategoriaProducto.POLLO, "6.50"));
        productoRepositorio.save(crearProducto("Caja mixta", CategoriaProducto.POLLO, "9.95"));

        productoRepositorio.save(crearProducto("Coca-Cola", CategoriaProducto.BEBIDA, "2.50"));
        productoRepositorio.save(crearProducto("Agua", CategoriaProducto.BEBIDA, "1.80"));
        productoRepositorio.save(crearProducto("Fanta Naranja", CategoriaProducto.BEBIDA, "2.50"));

        productoRepositorio.save(crearProducto("Helado vainilla", CategoriaProducto.POSTRE, "3.50"));
        productoRepositorio.save(crearProducto("Brownie", CategoriaProducto.POSTRE, "3.95"));

        productoRepositorio.save(crearProducto("Salsa BBQ", CategoriaProducto.SALSA, "0.60"));
        productoRepositorio.save(crearProducto("Salsa Deluxe", CategoriaProducto.SALSA, "0.60"));
        productoRepositorio.save(crearProducto("Salsa Picante", CategoriaProducto.SALSA, "0.60"));
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

    private Producto crearProducto(String nombre, CategoriaProducto categoria, String precio) {
        return Producto.builder()
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