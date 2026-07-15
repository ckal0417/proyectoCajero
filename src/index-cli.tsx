import 'dotenv/config';
import React, { useState, useEffect } from 'react';
import { render, Box, Text, useApp } from 'ink';
import { TextInput, SelectInput, Card, Spinner } from './Presentation/Console/Components/UI';
import { TarjetaRepositoryPostgres } from './Infrastructure/Database/Repositories/TarjetaRepositoryPostgres';
import { AutenticacionRepositoryPostgres } from './Infrastructure/Database/Repositories/AutenticacionRepositoryPostgres';
import { CuentaRepositoryPostgres } from './Infrastructure/Database/Repositories/CuentaRepositoryPostgres';
import { TransaccionRepositoryPostgres } from './Infrastructure/Database/Repositories/TransaccionRepositoryPostgres';
import { MovimientoRepositoryPostgres } from './Infrastructure/Database/Repositories/MovimientoRepositoryPostgres';
import { PinHasherBcrypt } from './Infrastructure/Persistence/PinHasherBcrypt';
import { PostgresConnection } from './Infrastructure/Database/PostgresConnection';

import { NumeroTarjeta } from './Domain/Value-Objects/NumeroTarjeta';
import { PinTextoPlano } from './Domain/Value-Objects/Pin';
import { Dinero } from './Domain/Value-Objects/Dinero';
import { Tarjeta } from './Domain/Entities/Tarjeta';
import { Cuenta } from './Domain/Entities/Cuenta';
import { Transaccion } from './Domain/Entities/Transaccion';
import { Movimiento } from './Domain/Entities/Movimiento';

// Instanciar los adaptadores de infraestructura
const tarjetaRepo = new TarjetaRepositoryPostgres();
const authRepo = new AutenticacionRepositoryPostgres();
const cuentaRepo = new CuentaRepositoryPostgres();
const transaccionRepo = new TransaccionRepositoryPostgres();
const movimientoRepo = new MovimientoRepositoryPostgres();
const pinHasher = new PinHasherBcrypt();
const dbPool = PostgresConnection.obtenerPool();

type Pantalla = 
    | 'login-tarjeta'
    | 'login-pin'
    | 'menu-principal'
    | 'saldo'
    | 'depositar'
    | 'retirar'
    | 'historial'
    | 'transferir';

const App = () => {
    const { exit } = useApp();
    const [pantalla, setPantalla] = useState<Pantalla>('login-tarjeta');
    const [loading, setLoading] = useState(false);
    
    // Inputs
    const [tarjetaInput, setTarjetaInput] = useState('');
    const [pinInput, setPinInput] = useState('');
    const [montoInput, setMontoInput] = useState('');
    const [destinoInput, setDestinoInput] = useState('');

    // Estado del usuario autenticado (Dominio)
    const [tarjeta, setTarjeta] = useState<Tarjeta | null>(null);
    const [cuenta, setCuenta] = useState<Cuenta | null>(null);
    const [clienteNombre, setClienteNombre] = useState('Cliente Fuego');
    
    // Resultados e historial
    const [mensajeError, setMensajeError] = useState<string | null>(null);
    const [mensajeExito, setMensajeExito] = useState<string | null>(null);
    const [movimientos, setMovimientos] = useState<Array<{ tipo: string; monto: number; fecha: string }>>([]);

    // --- ACCIÓN: LOGIN TARJETA ---
    const handleLoginTarjeta = async () => {
        if (tarjetaInput.length === 0) return;
        setLoading(true);
        setMensajeError(null);
        try {
            const numeroTarjetaVO = NumeroTarjeta.desde(tarjetaInput);
            const tarjetaEntidad = await tarjetaRepo.buscarPorNumero(numeroTarjetaVO);
            if (!tarjetaEntidad) {
                setMensajeError('Tarjeta no encontrada');
                setLoading(false);
                return;
            }
            if (!tarjetaEntidad.estaActiva()) {
                setMensajeError('La tarjeta no está activa');
                setLoading(false);
                return;
            }
            setTarjeta(tarjetaEntidad);
            setPantalla('login-pin');
        } catch (error: any) {
            setMensajeError(error.message || 'Error al validar tarjeta');
        } finally {
            setLoading(false);
        }
    };

    // --- ACCIÓN: LOGIN PIN ---
    const handleLoginPin = async () => {
        if (!tarjeta || pinInput.length === 0) return;
        setLoading(true);
        setMensajeError(null);
        try {
            const pinPlano = PinTextoPlano.desde(pinInput);
            const autenticacion = await authRepo.buscarPorIdTarjeta(tarjeta.obtenerId()!);
            if (!autenticacion) {
                setMensajeError('Autenticación no encontrada');
                setLoading(false);
                return;
            }

            const pinValido = await autenticacion.verificarPin(pinPlano, pinHasher);
            await authRepo.guardar(autenticacion);

            if (!pinValido) {
                setMensajeError(`PIN incorrecto. Intentos fallidos: ${autenticacion.obtenerIntentos()}`);
                setLoading(false);
                return;
            }

            // Obtener cuenta
            const cuentaEntidad = await cuentaRepo.buscarPorId(tarjeta.obtenerIdCuenta());
            if (!cuentaEntidad) {
                setMensajeError('Cuenta asociada no encontrada');
                setLoading(false);
                return;
            }

            // Obtener nombre del cliente (consulta directa para la interfaz)
            const clientRes = await dbPool.query(
                `SELECT c.nombres, c.apellidos FROM BancoFuego.Cliente c 
                 INNER JOIN BancoFuego.Cuenta cu ON cu.id_cliente = c.id_cliente 
                 WHERE cu.id_cuenta = $1`,
                [cuentaEntidad.obtenerId()]
            );
            if (clientRes.rowCount !== null && clientRes.rowCount > 0) {
                const cli = clientRes.rows[0] as any;
                setClienteNombre(`${cli.nombres} ${cli.apellidos}`);
            }

            setCuenta(cuentaEntidad);
            setPantalla('menu-principal');
        } catch (error: any) {
            setMensajeError(error.message || 'Error de autenticación');
        } finally {
            setLoading(false);
        }
    };

    // --- ACCIÓN: DEPOSITAR ---
    const handleDepositar = async () => {
        const monto = Number(montoInput);
        if (isNaN(monto) || monto <= 0 || !cuenta) {
            setMensajeError('Monto inválido');
            return;
        }
        setLoading(true);
        setMensajeError(null);
        setMensajeExito(null);
        try {
            const montoDinero = Dinero.desde(monto);
            const { saldoAnterior, saldoNuevo } = cuenta.depositar(montoDinero);
            
            // Actualizar cuenta en BD
            await cuentaRepo.actualizar(cuenta);
            
            // Guardar Transacción
            const tx = Transaccion.crear({
                tipo: 'DEPOSITO',
                monto: montoDinero,
                estado: 'EXITOSA',
                descripcion: 'Depósito por Cajero TUI',
            });
            const txGuardada = await transaccionRepo.guardar(tx);

            // Guardar Movimiento
            const mov = Movimiento.crear({
                tipo: 'DEPOSITO',
                monto: montoDinero,
                saldoAnterior,
                saldoNuevo,
                idCuenta: cuenta.obtenerId()!,
                idTransaccion: txGuardada.obtenerId()!,
            });
            await movimientoRepo.guardar(mov);

            setMensajeExito(`¡Depósito exitoso! Saldo nuevo: $${saldoNuevo.toNumber()}`);
            setMontoInput('');
            setPantalla('menu-principal');
        } catch (error: any) {
            setMensajeError(error.message || 'Error realizando depósito');
        } finally {
            setLoading(false);
        }
    };

    // --- ACCIÓN: RETIRAR ---
    const handleRetirar = async () => {
        const monto = Number(montoInput);
        if (isNaN(monto) || monto <= 0 || !cuenta) {
            setMensajeError('Monto inválido');
            return;
        }
        setLoading(true);
        setMensajeError(null);
        setMensajeExito(null);
        try {
            const montoDinero = Dinero.desde(monto);
            const { saldoAnterior, saldoNuevo } = cuenta.retirar(montoDinero);

            // Actualizar cuenta en BD
            await cuentaRepo.actualizar(cuenta);

            // Guardar Transacción
            const tx = Transaccion.crear({
                tipo: 'RETIRO',
                monto: montoDinero,
                estado: 'EXITOSA',
                descripcion: 'Retiro por Cajero TUI',
            });
            const txGuardada = await transaccionRepo.guardar(tx);

            // Guardar Movimiento
            const mov = Movimiento.crear({
                tipo: 'RETIRO',
                monto: montoDinero,
                saldoAnterior,
                saldoNuevo,
                idCuenta: cuenta.obtenerId()!,
                idTransaccion: txGuardada.obtenerId()!,
            });
            await movimientoRepo.guardar(mov);

            setMensajeExito(`¡Retiro exitoso! Saldo nuevo: $${saldoNuevo.toNumber()}`);
            setMontoInput('');
            setPantalla('menu-principal');
        } catch (error: any) {
            setMensajeError(error.message || 'Error realizando retiro');
        } finally {
            setLoading(false);
        }
    };

    // --- ACCIÓN: TRANSFERIR ---
    const handleTransferir = async () => {
        const monto = Number(montoInput);
        if (isNaN(monto) || monto <= 0 || !cuenta || destinoInput.length === 0) {
            setMensajeError('Parámetros de transferencia inválidos');
            return;
        }
        setLoading(true);
        setMensajeError(null);
        setMensajeExito(null);
        try {
            // 1. Buscar cuenta destino por número de cuenta en BD
            const resDest = await dbPool.query(
                "SELECT id_cuenta FROM BancoFuego.Cuenta WHERE numero_cuenta = $1 LIMIT 1",
                [destinoInput]
            );

            if (resDest.rowCount === 0) {
                setMensajeError('Cuenta destino no encontrada');
                setLoading(false);
                return;
            }

            const idCuentaDestino = resDest.rows[0].id_cuenta;
            
            if (idCuentaDestino === cuenta.obtenerId()) {
                setMensajeError('La cuenta destino debe ser distinta a la origen');
                setLoading(false);
                return;
            }

            const cuentaDestino = await cuentaRepo.buscarPorId(idCuentaDestino);
            if (!cuentaDestino) {
                setMensajeError('Error cargando cuenta destino');
                setLoading(false);
                return;
            }

            // 2. Operar negocio
            const montoDinero = Dinero.desde(monto);
            const { saldoAnterior: antOrigen, saldoNuevo: nuevoOrigen } = cuenta.retirar(montoDinero);
            const { saldoAnterior: antDest, saldoNuevo: nuevoDest } = cuentaDestino.depositar(montoDinero);

            // 3. Persistir cuentas
            await cuentaRepo.actualizar(cuenta);
            await cuentaRepo.actualizar(cuentaDestino);

            // 4. Registrar Transacción
            const tx = Transaccion.crear({
                tipo: 'TRANSFERENCIAINTERNA',
                monto: montoDinero,
                estado: 'EXITOSA',
                descripcion: `Transferencia a cuenta ${destinoInput}`,
            });
            const txGuardada = await transaccionRepo.guardar(tx);

            // 5. Registrar Movimientos (Origen y Destino)
            const movOrigen = Movimiento.crear({
                tipo: 'TRANSFERENCIAINTERNA',
                monto: montoDinero,
                saldoAnterior: antOrigen,
                saldoNuevo: nuevoOrigen,
                idCuenta: cuenta.obtenerId()!,
                idTransaccion: txGuardada.obtenerId()!,
            });
            const movDest = Movimiento.crear({
                tipo: 'TRANSFERENCIAINTERNA',
                monto: montoDinero,
                saldoAnterior: antDest,
                saldoNuevo: nuevoDest,
                idCuenta: cuentaDestino.obtenerId()!,
                idTransaccion: txGuardada.obtenerId()!,
            });

            await movimientoRepo.guardar(movOrigen);
            await movimientoRepo.guardar(movDest);

            setMensajeExito(`¡Transferencia exitosa! Enviados $${monto} a cuenta ${destinoInput}`);
            setMontoInput('');
            setDestinoInput('');
            setPantalla('menu-principal');
        } catch (error: any) {
            setMensajeError(error.message || 'Error en transferencia');
        } finally {
            setLoading(false);
        }
    };

    // --- ACCIÓN: CARGAR HISTORIAL ---
    const cargarHistorial = async () => {
        if (!cuenta) return;
        setLoading(true);
        setMensajeError(null);
        try {
            const res = await dbPool.query(
                `SELECT tipo, monto, fecha FROM BancoFuego.Movimiento 
                 WHERE id_cuenta = $1 ORDER BY fecha DESC LIMIT 10`,
                [cuenta.obtenerId()]
            );
            const list = res.rows.map((row: any) => ({
                tipo: row.tipo,
                monto: Number(row.monto),
                fecha: new Date(row.fecha).toLocaleString(),
            }));
            setMovimientos(list);
        } catch (error: any) {
            setMensajeError(error.message || 'Error cargando historial');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (pantalla === 'historial') {
            cargarHistorial();
        }
    }, [pantalla]);

    // --- RENDERIZADO DE PANTALLAS ---
    return (
        <Box flexDirection="column" padding={1} gap={1} width={80}>
            {/* LOGO BANCO FUEGO */}
            <Box flexDirection="column" alignItems="center">
                <Text color="red" bold>
                    {"  ██████╗  █████╗  ██████╗ ███████╗██████╗  ██████╗ "}
                </Text>
                <Text color="red" bold>
                    {" ██╔════╝ ██╔══██╗██╔═══██╗██╔════╝██╔══██╗██╔═══██╗"}
                </Text>
                <Text color="orange" bold>
                    {" ██║      ███████║██║   ██║█████╗  ██████╔╝██║   ██║"}
                </Text>
                <Text color="orange" bold>
                    {" ██║      ██╔══██║██║   ██║██╔══╝  ██╔══██╗██║   ██║"}
                </Text>
                <Text color="yellow" bold>
                    {" ╚██████╗ ██║  ██║╚██████╔╝███████╗██║  ██║╚██████╔╝"}
                </Text>
                <Text color="yellow" bold>
                    {"  ╚══════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝ "}
                </Text>
                <Text color="gray">--- SISTEMA DE CAJERO AUTOMÁTICO TUI ---</Text>
            </Box>

            {/* MENSAJES GLOBALES */}
            {mensajeError && (
                <Box borderStyle="single" borderColor="red" paddingX={1}>
                    <Text color="red" bold>ERROR: {mensajeError}</Text>
                </Box>
            )}
            {mensajeExito && (
                <Box borderStyle="single" borderColor="green" paddingX={1}>
                    <Text color="green" bold>{mensajeExito}</Text>
                </Box>
            )}

            {loading && <Spinner message="Procesando transacción con BancoFuego..." />}

            {/* CONTROL DE VISTAS */}
            {!loading && (() => {
                switch (pantalla) {
                    case 'login-tarjeta':
                        return (
                            <Card title="Ingresar Tarjeta" borderColor="cyan">
                                <Text>Por favor ingrese su número de tarjeta (16 dígitos):</Text>
                                <TextInput
                                    value={tarjetaInput}
                                    onChange={setTarjetaInput}
                                    onSubmit={handleLoginTarjeta}
                                    placeholder="4111111111111111"
                                    isActive={pantalla === 'login-tarjeta'}
                                />
                                <Text color="gray" dimColor>Presione ENTER para continuar. Ctrl+C para salir.</Text>
                            </Card>
                        );
                    case 'login-pin':
                        return (
                            <Card title="Ingresar PIN" borderColor="cyan">
                                <Text>Ingrese su código PIN de seguridad (4 dígitos):</Text>
                                <TextInput
                                    value={pinInput}
                                    onChange={setPinInput}
                                    onSubmit={handleLoginPin}
                                    placeholder="••••"
                                    mask="•"
                                    isActive={pantalla === 'login-pin'}
                                />
                                <Text color="gray" dimColor>Presione ENTER para verificar PIN.</Text>
                            </Card>
                        );
                    case 'menu-principal':
                        return (
                            <Card title={`Bienvenido, ${clienteNombre}`} borderColor="magenta">
                                <Text color="cyan" bold>Seleccione una operación utilizando las flechas (↑ / ↓):</Text>
                                <Box marginY={1}>
                                    <SelectInput
                                        options={[
                                            { label: 'Consultar Saldo', value: 'saldo' },
                                            { label: 'Depositar Efectivo', value: 'depositar' },
                                            { label: 'Retirar Efectivo', value: 'retirar' },
                                            { label: 'Transferencia entre Cuentas', value: 'transferir' },
                                            { label: 'Historial de Transacciones', value: 'historial' },
                                            { label: 'Salir / Retirar Tarjeta', value: 'salir' },
                                        ]}
                                        onSelect={(val) => {
                                            setMensajeExito(null);
                                            setMensajeError(null);
                                            if (val === 'salir') {
                                                setTarjeta(null);
                                                setCuenta(null);
                                                setTarjetaInput('');
                                                setPinInput('');
                                                setPantalla('login-tarjeta');
                                                setMensajeExito('Tarjeta retirada. ¡Gracias por usar Banco Fuego!');
                                            } else {
                                                setPantalla(val as Pantalla);
                                            }
                                        }}
                                        isActive={pantalla === 'menu-principal'}
                                    />
                                </Box>
                            </Card>
                        );
                    case 'saldo':
                        return (
                            <Card title="Consulta de Saldo" borderColor="yellow">
                                <Box flexDirection="column" gap={1} alignItems="center" marginY={1}>
                                    <Text>Tu saldo disponible es actualmente de:</Text>
                                    <Text color="green" bold>
                                        ${cuenta?.obtenerSaldo().toNumber().toFixed(2)} USD
                                    </Text>
                                </Box>
                                <Box marginTop={1}>
                                    <SelectInput
                                        options={[{ label: 'Volver al Menú Principal', value: 'menu' }]}
                                        onSelect={() => setPantalla('menu-principal')}
                                        isActive={pantalla === 'saldo'}
                                    />
                                </Box>
                            </Card>
                        );
                    case 'depositar':
                        return (
                            <Card title="Depositar Efectivo" borderColor="green">
                                <Text>Ingrese la cantidad de dinero a depositar ($):</Text>
                                <TextInput
                                    value={montoInput}
                                    onChange={setMontoInput}
                                    onSubmit={handleDepositar}
                                    placeholder="Ej. 100"
                                    isActive={pantalla === 'depositar'}
                                />
                                <Box marginTop={1} flexDirection="column" gap={0}>
                                    <Text color="gray" dimColor>Presione ENTER para confirmar depósito.</Text>
                                    <Box marginTop={1}>
                                        <SelectInput
                                            options={[{ label: 'Cancelar y Volver', value: 'menu' }]}
                                            onSelect={() => {
                                                setMontoInput('');
                                                setPantalla('menu-principal');
                                            }}
                                            isActive={false} // El TextInput tiene el foco
                                        />
                                    </Box>
                                </Box>
                            </Card>
                        );
                    case 'retirar':
                        return (
                            <Card title="Retirar Dinero" borderColor="red">
                                <Text>Ingrese la cantidad de dinero a retirar ($):</Text>
                                <TextInput
                                    value={montoInput}
                                    onChange={setMontoInput}
                                    onSubmit={handleRetirar}
                                    placeholder="Ej. 50"
                                    isActive={pantalla === 'retirar'}
                                />
                                <Box marginTop={1} flexDirection="column" gap={0}>
                                    <Text color="gray" dimColor>Presione ENTER para confirmar retiro.</Text>
                                    <Box marginTop={1}>
                                        <SelectInput
                                            options={[{ label: 'Cancelar y Volver', value: 'menu' }]}
                                            onSelect={() => {
                                                setMontoInput('');
                                                setPantalla('menu-principal');
                                            }}
                                            isActive={false}
                                        />
                                    </Box>
                                </Box>
                            </Card>
                        );
                    case 'transferir':
                        return (
                            <Card title="Transferencia de Dinero" borderColor="cyan">
                                <Text>1. Ingrese el número de cuenta destino (10 dígitos):</Text>
                                <TextInput
                                    value={destinoInput}
                                    onChange={setDestinoInput}
                                    onSubmit={() => {}} // No hace submit directo aquí, pasa al monto
                                    placeholder="Ej. 2200000002"
                                    isActive={destinoInput.length < 10} // Foco en cuenta primero
                                />

                                {destinoInput.length >= 10 && (
                                    <>
                                        <Box marginTop={1}>
                                            <Text>2. Ingrese el monto a transferir ($):</Text>
                                        </Box>
                                        <TextInput
                                            value={montoInput}
                                            onChange={setMontoInput}
                                            onSubmit={handleTransferir}
                                            placeholder="Ej. 200"
                                            isActive={destinoInput.length >= 10}
                                        />
                                    </>
                                )}

                                <Box marginTop={1} flexDirection="column">
                                    {destinoInput.length >= 10 ? (
                                        <Text color="gray" dimColor>Presione ENTER para realizar transferencia.</Text>
                                    ) : (
                                        <Text color="gray" dimColor>Complete el número de cuenta destino.</Text>
                                    )}
                                    <Box marginTop={1}>
                                        <SelectInput
                                            options={[{ label: 'Cancelar y Volver', value: 'menu' }]}
                                            onSelect={() => {
                                                setDestinoInput('');
                                                setMontoInput('');
                                                setPantalla('menu-principal');
                                            }}
                                            isActive={false}
                                        />
                                    </Box>
                                </Box>
                            </Card>
                        );
                    case 'historial':
                        return (
                            <Card title="Últimos Movimientos" borderColor="magenta">
                                {movimientos.length === 0 ? (
                                    <Text color="gray">No se registran movimientos en esta cuenta.</Text>
                                ) : (
                                    <Box flexDirection="column" gap={0} marginY={1}>
                                        {movimientos.map((m, index) => (
                                            <Box key={index} justifyContent="space-between">
                                                <Text color="gray">{m.fecha}</Text>
                                                <Text color={m.tipo === 'RETIRO' || m.tipo.startsWith('TRANS') ? 'red' : 'green'} bold>
                                                    {m.tipo.toUpperCase()}:
                                                </Text>
                                                <Text bold>${m.monto.toFixed(2)}</Text>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                                <Box marginTop={1}>
                                    <SelectInput
                                        options={[{ label: 'Volver al Menú Principal', value: 'menu' }]}
                                        onSelect={() => setPantalla('menu-principal')}
                                        isActive={pantalla === 'historial'}
                                    />
                                </Box>
                            </Card>
                        );
                }
            })()}
        </Box>
    );
};

render(<App />);
