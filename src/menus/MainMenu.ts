import * as readline from "readline";
import { BancoService } from "../services/banco/BancoService";
import { CajeroService } from "../services/cajero/CajeroService";
import { Usuario } from "../models/Usuario";
import { Cuenta } from "../models/Cuenta";
import { Evento } from "../events/Evento";
import { Transaccion } from "../models/Transaccion";
import { Consola } from "../utils/Consola";
import { LoginMenu } from "./autenticacion/LoginMenu";
import { DepositoMenu } from "./deposito/DepositoMenu";
import { RetiroMenu } from "./retiro/RetiroMenu";
import { HistorialMenu } from "./historial/HistorialMenu";
import { TransferenciaMenu } from "./Transferencia/TransferenciaMenu";
import { CuentaRepository } from "../repositories/CuentaRepository";
import { TransaccionRepository } from "../repositories/TransaccionRepository";
import { EventBus } from "../events/EventBus";
import { TiposEvento } from "../events/TiposEvento";
import { HistorialSubscriber } from "../subscribers/HistorialSubscriber";
import { AuditoriaSubscriber } from "../subscribers/AuditoriaSubscriber";
import { CorreoSubscriber } from "../subscribers/CorreoSubscriber";
import { LogSubscriber } from "../subscribers/LogSubscriber";
import { DepositoService } from "../services/operaciones/deposito/DepositoService";
import { RetiroService } from "../services/operaciones/retiro/RetiroService";
import { SaldoService } from "../services/operaciones/saldo/SaldoService";
import { HistorialService } from "../services/operaciones/historial/HistorialService";
import { TransferenciaService } from "../services/operaciones/transferencia/TransferenciaService";
import { TransferenciaLocalService } from "../services/operaciones/transferencia/local/TransferenciaLocalService";
import { TransferenciaInterbancariaService } from "../services/operaciones/transferencia/interbancaria/TransferenciaInterbancariaService";
import { BancoIntermediarioService } from "../services/Intermediario/BancoIntermediarioService";
import { ConsultarSaldoCommand } from "../commands/ConsultarSaldoCommand";
import { DepositarCommand } from "../commands/DepositarCommand";
import { RetirarCommand } from "../commands/RetirarCommand";
import { HistorialCommand } from "../commands/HistorialCommand";
import { TransferirCommand } from "../commands/TransferirCommand";

export class MainMenu {

    private usuario: Usuario | null = null;

    private cajeroService!: CajeroService;

    constructor(
        private bancoService: BancoService,
        private consola: readline.Interface
    ) {}

    public iniciar(): void {

        const loginMenu = new LoginMenu(
            this.bancoService,
            this.consola
        );

        loginMenu.iniciar((usuario) => {

            this.usuario = usuario;

            this.prepararSesion();

        });

    }

    private prepararSesion(): void {

        if (!this.usuario) {
            return;
        }

        const cuenta = this.usuario.obtenerCuenta();

        const cuentaRepository = new CuentaRepository([
            cuenta
        ]);

        const transaccionRepository = new TransaccionRepository();

        const eventBus = new EventBus();

        const historialSubscriber =
            new HistorialSubscriber(
                transaccionRepository
            );

        const logSubscriber =
            new LogSubscriber();

        const auditoriaSubscriber =
            new AuditoriaSubscriber();

        const correoSubscriber =
            new CorreoSubscriber();

        eventBus.suscribir(
            TiposEvento.DEPOSITO_REALIZADO,
            evento =>
                historialSubscriber.manejar(
                    evento as Evento<Transaccion>
                )
        );

        eventBus.suscribir(
            TiposEvento.RETIRO_REALIZADO,
            evento =>
                historialSubscriber.manejar(
                    evento as Evento<Transaccion>
                )
        );

        eventBus.suscribir(
            TiposEvento.DEPOSITO_REALIZADO,
            evento => logSubscriber.manejar(evento)
        );

        eventBus.suscribir(
            TiposEvento.RETIRO_REALIZADO,
            evento => logSubscriber.manejar(evento)
        );

        eventBus.suscribir(
            TiposEvento.DEPOSITO_REALIZADO,
            evento => auditoriaSubscriber.manejar(evento)
        );

        eventBus.suscribir(
            TiposEvento.RETIRO_REALIZADO,
            evento => auditoriaSubscriber.manejar(evento)
        );

        eventBus.suscribir(
            TiposEvento.DEPOSITO_REALIZADO,
            evento => correoSubscriber.manejar(evento)
        );

        eventBus.suscribir(
            TiposEvento.RETIRO_REALIZADO,
            evento => correoSubscriber.manejar(evento)
        );

        const depositoService =
            new DepositoService(
                cuentaRepository,
                eventBus
            );

        const retiroService =
            new RetiroService(
                cuentaRepository,
                eventBus
            );

        const saldoService =
            new SaldoService(
                cuentaRepository
            );

        const historialService =
            new HistorialService(
                transaccionRepository
            );

        const bancoIntermediarioService =
            new BancoIntermediarioService();

        const transferenciaLocalService =
            new TransferenciaLocalService();

        const transferenciaInterbancariaService =
            new TransferenciaInterbancariaService(
                bancoIntermediarioService
            );

        const transferenciaService =
            new TransferenciaService(
                transferenciaLocalService,
                transferenciaInterbancariaService
            );

        this.cajeroService =
            new CajeroService(
                cuenta
            );

        this.cajeroService.registrarComando(
            new ConsultarSaldoCommand(
                saldoService
            )
        );

        this.cajeroService.registrarComando(
            new DepositarCommand(
                depositoService
            )
        );
        this.cajeroService.registrarComando(
            new RetirarCommand(
                retiroService
            )
        );

        this.cajeroService.registrarComando(
            new HistorialCommand(
                historialService
            )
        );

        this.cajeroService.registrarComando(
            new TransferirCommand(
                transferenciaService
            )
        );

        Consola.limpiar();

        this.mostrarMenu();

    }

    private mostrarMenu(): void {

        if (!this.usuario) {
            return;
        }

        const cuenta = this.usuario.obtenerCuenta();

        Consola.limpiar();

        Consola.titulo("CAJERO AUTOMÁTICO");

        Consola.informacion(
            `Titular: ${this.usuario.obtenerNombre()}`
        );

        Consola.informacion(
            `Número de cuenta: ${cuenta.obtenerNumeroCuenta()}`
        );

        Consola.informacion(
            `Tipo de cuenta: ${cuenta.obtenerTipoCuenta()}`
        );

        Consola.informacion("");

        Consola.informacion("1. Consultar saldo");
        Consola.informacion("2. Depositar dinero");
        Consola.informacion("3. Retirar dinero");
        Consola.informacion("4. Ver historial");
        Consola.informacion("5. Transferencias");
        Consola.informacion("6. Salir");

        Consola.informacion("");

        this.consola.question(

            "Seleccione una opción: ",

            (opcion: string) => {

                this.ejecutarOpcion(opcion);

            }

        );

    }

    private ejecutarOpcion(
        opcion: string
    ): void {

        if (!this.usuario || !this.cajeroService) {
            return;
        }

        const cuenta = this.usuario.obtenerCuenta();

        switch (opcion) {

            case "1":

                this.cajeroService.ejecutar(
                    "saldo",
                    cuenta
                );

                this.continuar();

                break;

            case "2":

                new DepositoMenu(

                    cuenta,

                    this.cajeroService,

                    this.consola

                ).iniciar(() => this.mostrarMenu());

                break;

            case "3":

                new RetiroMenu(

                    cuenta,

                    this.cajeroService,

                    this.consola

                ).iniciar(() => this.mostrarMenu());

                break;

            case "4":

                new HistorialMenu(

                    cuenta,

                    this.cajeroService,

                    this.consola

                ).iniciar(() => this.mostrarMenu());

                break;

            case "5":

                new TransferenciaMenu(

                    cuenta,

                    this.cajeroService,

                    this.consola

                ).iniciar(() => this.mostrarMenu());

                break;

            case "6":

                Consola.limpiar();

                Consola.informacion(
                    "Gracias por utilizar el cajero."
                );

                this.consola.close();

                break;

            default:

                Consola.error(
                    "Opción inválida."
                );

                this.continuar();

                break;

        }

    }

    private continuar(): void {

        this.consola.question(

            "\nPresione ENTER para continuar...",

            () => {

                this.mostrarMenu();

            }

        );

    }

}