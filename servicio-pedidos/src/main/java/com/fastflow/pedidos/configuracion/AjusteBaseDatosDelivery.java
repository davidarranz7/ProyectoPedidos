package com.fastflow.pedidos.configuracion;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(0)
@RequiredArgsConstructor
public class AjusteBaseDatosDelivery implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        limpiarChecksAntiguos();
        prepararColumnasNuevas();
        normalizarDatosAntiguos();
    }

    private void limpiarChecksAntiguos() {
        ejecutar("ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_origen_check");
        ejecutar("ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_plataforma_check");
        ejecutar("ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_estado_check");
        ejecutar("ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_categoria_check");
        ejecutar("ALTER TABLE modificaciones_producto DROP CONSTRAINT IF EXISTS modificaciones_producto_tipo_check");
    }

    private void prepararColumnasNuevas() {
        ejecutar("ALTER TABLE lineas_pedido ADD COLUMN IF NOT EXISTS codigo_producto_externo varchar(255)");
        ejecutar("ALTER TABLE lineas_pedido ADD COLUMN IF NOT EXISTS nombre_producto varchar(255)");
        ejecutar("ALTER TABLE lineas_pedido ADD COLUMN IF NOT EXISTS precio_unitario numeric(38,2)");

        ejecutar("ALTER TABLE lineas_pedido ALTER COLUMN producto_id DROP NOT NULL");

        ejecutar("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS id_externo varchar(255)");
        ejecutar("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS total numeric(38,2)");
        ejecutar("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pagado boolean");

        ejecutar("ALTER TABLE productos ADD COLUMN IF NOT EXISTS codigo_externo varchar(255)");

        ejecutar("ALTER TABLE modificaciones_producto ADD COLUMN IF NOT EXISTS codigo_externo varchar(255)");
        ejecutar("ALTER TABLE modificaciones_producto ADD COLUMN IF NOT EXISTS nombre varchar(255)");
        ejecutar("ALTER TABLE modificaciones_producto ADD COLUMN IF NOT EXISTS precio numeric(38,2)");
    }

    private void normalizarDatosAntiguos() {
        ejecutar("UPDATE pedidos SET origen = 'DELIVERY' WHERE origen IN ('HD', 'SALA', 'KIOSKO', 'MOBILE')");
        ejecutar("UPDATE pedidos SET plataforma = 'MANUAL_HD' WHERE plataforma IN ('WEB', 'LOCAL')");
        ejecutar("UPDATE pedidos SET estado = 'EN_PREPARACION' WHERE estado = 'EN_COCINA'");
        ejecutar("UPDATE pedidos SET estado = 'PENDIENTE_ASIGNACION' WHERE estado = 'ASIGNACION_PREVISTA'");
        ejecutar("UPDATE pedidos SET pagado = true WHERE pagado IS NULL");

        ejecutar("UPDATE lineas_pedido SET nombre_producto = COALESCE((SELECT productos.nombre FROM productos WHERE productos.id = lineas_pedido.producto_id), 'Producto') WHERE nombre_producto IS NULL OR nombre_producto = ''");
        ejecutar("UPDATE lineas_pedido SET precio_unitario = COALESCE((SELECT productos.precio FROM productos WHERE productos.id = lineas_pedido.producto_id), 0) WHERE precio_unitario IS NULL");
        ejecutar("ALTER TABLE lineas_pedido ALTER COLUMN nombre_producto SET NOT NULL");
    }

    private void ejecutar(String sql) {
        try {
            jdbcTemplate.execute(sql);
        } catch (Exception error) {
            System.out.println("Aviso ajuste BD delivery: " + error.getMessage());
        }
    }
}