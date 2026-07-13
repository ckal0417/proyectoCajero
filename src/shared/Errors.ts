export class DomainError extends Error {
    constructor(message: string, public readonly code: string, public readonly statusCode: number = 400) {
        super(message);
        this.name = new.target.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class ValidationError extends DomainError {
    constructor(message: string, code: string = 'VALIDATION_ERROR', statusCode: number = 400) {
        super(message, code, statusCode);
    }
}

export class BusinessRuleError extends DomainError {
    constructor(message: string, code: string = 'BUSINESS_RULE_ERROR', statusCode: number = 409) {
        super(message, code, statusCode);
    }
}

export class TarjetaNoEncontradaError extends BusinessRuleError {
    constructor(message: string = 'Tarjeta no encontrada') {
        super(message, 'TARJETA_NO_ENCONTRADA', 404);
    }
}

export class TarjetaNoUsableError extends BusinessRuleError {
    constructor(message: string = 'La tarjeta no puede usarse en este momento') {
        super(message, 'TARJETA_NO_USABLE', 403);
    }
}

export class TarjetaBloqueadaError extends TarjetaNoUsableError {
    constructor(message: string = 'La tarjeta está bloqueada') {
        super(message);
        Object.defineProperty(this, 'code', { value: 'TARJETA_BLOQUEADA', configurable: true });
        Object.defineProperty(this, 'statusCode', { value: 403, configurable: true });
    }
}

export class TarjetaVencidaError extends TarjetaNoUsableError {
    constructor(message: string = 'La tarjeta está vencida') {
        super(message);
        Object.defineProperty(this, 'code', { value: 'TARJETA_VENCIDA', configurable: true });
        Object.defineProperty(this, 'statusCode', { value: 403, configurable: true });
    }
}

export class AutenticacionNoEncontradaError extends BusinessRuleError {
    constructor(message: string = 'No existe autenticación registrada para esta tarjeta') {
        super(message, 'AUTENTICACION_NO_ENCONTRADA', 404);
    }
}

export class PinIncorrectoError extends BusinessRuleError {
    constructor(message: string = 'PIN incorrecto') {
        super(message, 'PIN_INCORRECTO', 401);
    }
}

export class CuentaNoEncontradaError extends BusinessRuleError {
    constructor(message: string = 'Cuenta no encontrada') {
        super(message, 'CUENTA_NO_ENCONTRADA', 404);
    }
}

export class CuentaInactivaError extends BusinessRuleError {
    constructor(message: string = 'La cuenta no está activa') {
        super(message, 'CUENTA_INACTIVA', 409);
    }
}

export class FondosInsuficientesError extends BusinessRuleError {
    constructor(message: string = 'Fondos insuficientes') {
        super(message, 'FONDOS_INSUFICIENTES', 409);
    }
}

export class MontoInvalidoError extends ValidationError {
    constructor(message: string) {
        super(message, 'MONTO_INVALIDO', 400);
    }
}

export class OperacionNoSoportadaError extends BusinessRuleError {
    constructor(message: string) {
        super(message, 'OPERACION_NO_SOPORTADA', 501);
    }
}
