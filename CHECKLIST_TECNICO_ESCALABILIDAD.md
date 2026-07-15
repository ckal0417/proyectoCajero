# Checklist Tecnico para Escalar a Miles de Transacciones por Minuto

## Objetivo operativo
- [ ] Soportar al menos 3000 transacciones por minuto sostenidas.
- [ ] Mantener p95 < 300 ms y p99 < 600 ms en operaciones criticas.
- [ ] Mantener tasa de error < 0.5% bajo carga sostenida.
- [ ] Cero inconsistencias de saldo en pruebas concurrentes.

## Fase 1: Consistencia transaccional (Prioridad Critica)

### 1.1 Unificar transaccion por operacion
- [x] Deposito: actualizar saldo + registrar transaccion + registrar movimiento en una sola transaccion SQL.
- [x] Retiro: actualizar saldo + registrar transaccion + registrar movimiento en una sola transaccion SQL.
- [x] Transferencia: debito origen + credito destino + registro de transaccion/movimientos en una sola transaccion SQL.

Criterio de aceptacion:
- [ ] No existe camino donde saldo cambie sin movimiento asociado.
- [ ] Ante fallo intermedio, se hace rollback completo.

Evidencia:
- [ ] Prueba automatizada que fuerza error a mitad de flujo y valida rollback total.

### 1.2 Evitar condiciones de carrera
- [x] Implementar bloqueo de filas con SELECT ... FOR UPDATE para cuentas afectadas.
- [x] En transferencias, bloquear cuentas por orden de id para reducir deadlocks.
- [x] Reemplazar read-modify-write no atomico por SQL atomico en debitos.

Criterio de aceptacion:
- [ ] Dos retiros concurrentes no permiten saldo negativo.
- [ ] No se observan lost updates en stress test concurrente.

Evidencia:
- [ ] Test concurrente con N hilos/clientes sobre misma cuenta.

Estado actual de fase 1:
- Implementado en API HTTP de operaciones en src/Presentation/Http/controllers/OperacionesController.ts.
- Implementada idempotencia persistente en BD para deposito, retiro y transferencia.
- Pendiente: pruebas automatizadas de evidencia (1.1, 1.2 y 1.3).

### 1.3 Idempotencia
- [x] Agregar idempotency key para endpoints de deposito, retiro y transferencia.
- [x] Persistir llave y resultado para reintentos seguros.

Criterio de aceptacion:
- [ ] Repetir misma solicitud con misma llave no duplica cargos/abonos.

## Fase 2: Base de datos y rendimiento de consultas

### 2.1 Indices para patrones reales
- [ ] Crear indice compuesto para historial: Movimiento(id_cuenta, fecha DESC).
- [ ] Revisar indices de consultas criticas de autenticacion y operaciones.

Criterio de aceptacion:
- [ ] EXPLAIN ANALYZE sin sequential scans en consultas hot path.
- [ ] Tiempo de consulta de historial estable con alto volumen de datos.

### 2.2 Pool de conexiones
- [ ] Configurar en Pool: max, idleTimeoutMillis y connectionTimeoutMillis.
- [ ] Definir tamano de pool por instancia segun capacidad de PostgreSQL.
- [ ] Evaluar PgBouncer si hay multiples replicas de API.

Criterio de aceptacion:
- [ ] Sin saturacion de conexiones en pruebas de carga.

## Fase 3: Runtime y despliegue

### 3.1 Modo produccion
- [ ] Ejecutar API compilada (dist) en produccion; no usar ts-node.
- [ ] Separar migraciones del arranque de la API.

Criterio de aceptacion:
- [ ] Despliegue inicia sin ejecutar migraciones en cada boot.
- [ ] Startup estable y rapido.

### 3.2 Escalado horizontal
- [ ] Ejecutar multiples replicas de API detras de balanceador.
- [ ] Definir politicas de autoscaling por CPU, memoria y latencia.

Criterio de aceptacion:
- [ ] Al aumentar replicas, sube throughput sin romper consistencia.

## Fase 4: Resiliencia y proteccion de carga

- [ ] Implementar rate limiting por IP y por tarjeta/usuario.
- [ ] Configurar timeouts HTTP y de base de datos.
- [ ] Definir limites de payload y validaciones estrictas.
- [ ] Aplicar backpressure en picos.

Criterio de aceptacion:
- [ ] Bajo pico, el sistema degrada de forma controlada y no colapsa.

## Fase 5: Observabilidad

- [ ] Agregar metricas de negocio y tecnicas: RPS, p95, p99, errores, saturacion de pool.
- [ ] Medir lock waits y deadlocks en PostgreSQL.
- [ ] Instrumentar trazas por operacion critica.
- [ ] Ajustar logging para reducir I/O en alto trafico.

Criterio de aceptacion:
- [ ] Dashboard con KPIs minimos y alertas accionables.

## Fase 6: Seguridad de produccion

- [ ] Eliminar secretos por defecto en JWT y DB.
- [ ] Garantizar hash de PIN en todos los entornos.
- [ ] Rotacion de secretos y politicas de configuracion por entorno.

Criterio de aceptacion:
- [ ] No hay secretos hardcodeados ni datos sensibles en texto plano.

## Fase 7: Pruebas de carga y salida a produccion

### 7.1 Escenarios de carga
- [ ] Definir mezcla realista de trafico (saldo, deposito, retiro, transferencia, login).
- [ ] Crear pruebas de carga con ramp-up, sostenido y stress.
- [ ] Ejecutar pruebas con dataset volumetrico representativo.

### 7.2 Gates de salida
- [ ] Throughput >= 3000 tx/min sostenidas.
- [ ] p95 < 300 ms en endpoints criticos.
- [ ] Error rate < 0.5%.
- [ ] Cero inconsistencias de saldo en reconciliacion final.

Evidencia:
- [ ] Reporte de carga con graficas y conclusiones.
- [ ] Acta de capacidad con limite actual y plan de crecimiento.

## Orden recomendado de ejecucion
1. Fase 1 (consistencia y concurrencia)
2. Fase 2 (indices y pool)
3. Fase 3 (runtime y despliegue)
4. Fase 4 (resiliencia)
5. Fase 5 (observabilidad)
6. Fase 6 (seguridad)
7. Fase 7 (pruebas de carga y go/no-go)

## RACI minimo sugerido
- [ ] Backend: Fase 1, 3 y parte de 4.
- [ ] DBA: Fase 2 y soporte de 1.
- [ ] DevOps/SRE: Fase 3, 4 y 5.
- [ ] QA performance: Fase 7.

## Definicion de terminado global
- [ ] Todos los checks de fases completados.
- [ ] Metas de rendimiento y consistencia cumplidas en 2 corridas consecutivas.
- [ ] Riesgos residuales documentados con plan de mitigacion.
