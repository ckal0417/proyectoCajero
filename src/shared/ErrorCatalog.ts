export type ErrorCategory =
    | 'VALIDATION'
    | 'DOMAIN'
    | 'SECURITY'
    | 'INTEGRATION'
    | 'TECHNICAL';

export interface ErrorCatalogDefinition {
    readonly category: ErrorCategory;
    readonly defaultMessage: string;
    readonly httpStatus: number;
    readonly retryable: boolean;
    readonly exposeMessage: boolean;
}

export const ERROR_CATALOG = {
    INVALID_REQUEST: {
        category: 'VALIDATION',
        defaultMessage: 'Solicitud invalida',
        httpStatus: 400,
        retryable: false,
        exposeMessage: true,
    },
    INVALID_PARAMS: {
        category: 'VALIDATION',
        defaultMessage: 'Parametros invalidos',
        httpStatus: 400,
        retryable: false,
        exposeMessage: true,
    },
    MONTO_INVALIDO: {
        category: 'VALIDATION',
        defaultMessage: 'Monto invalido',
        httpStatus: 400,
        retryable: false,
        exposeMessage: true,
    },
    VALIDATION_ERROR: {
        category: 'VALIDATION',
        defaultMessage: 'Error de validacion',
        httpStatus: 400,
        retryable: false,
        exposeMessage: true,
    },
    BUSINESS_RULE_ERROR: {
        category: 'DOMAIN',
        defaultMessage: 'Regla de negocio no cumplida',
        httpStatus: 409,
        retryable: false,
        exposeMessage: true,
    },
    TARJETA_NO_ENCONTRADA: {
        category: 'DOMAIN',
        defaultMessage: 'Tarjeta no encontrada',
        httpStatus: 404,
        retryable: false,
        exposeMessage: true,
    },
    TARJETA_NO_USABLE: {
        category: 'DOMAIN',
        defaultMessage: 'La tarjeta no puede usarse en este momento',
        httpStatus: 403,
        retryable: false,
        exposeMessage: true,
    },
    TARJETA_BLOQUEADA: {
        category: 'DOMAIN',
        defaultMessage: 'La tarjeta esta bloqueada',
        httpStatus: 403,
        retryable: false,
        exposeMessage: true,
    },
    TARJETA_VENCIDA: {
        category: 'DOMAIN',
        defaultMessage: 'La tarjeta esta vencida',
        httpStatus: 403,
        retryable: false,
        exposeMessage: true,
    },
    AUTENTICACION_NO_ENCONTRADA: {
        category: 'DOMAIN',
        defaultMessage: 'No existe autenticacion registrada para esta tarjeta',
        httpStatus: 404,
        retryable: false,
        exposeMessage: true,
    },
    PIN_INCORRECTO: {
        category: 'SECURITY',
        defaultMessage: 'PIN incorrecto',
        httpStatus: 401,
        retryable: false,
        exposeMessage: true,
    },
    CUENTA_NO_ENCONTRADA: {
        category: 'DOMAIN',
        defaultMessage: 'Cuenta no encontrada',
        httpStatus: 404,
        retryable: false,
        exposeMessage: true,
    },
    CUENTA_INACTIVA: {
        category: 'DOMAIN',
        defaultMessage: 'La cuenta no esta activa',
        httpStatus: 409,
        retryable: false,
        exposeMessage: true,
    },
    FONDOS_INSUFICIENTES: {
        category: 'DOMAIN',
        defaultMessage: 'Fondos insuficientes',
        httpStatus: 409,
        retryable: false,
        exposeMessage: true,
    },
    OPERACION_NO_SOPORTADA: {
        category: 'DOMAIN',
        defaultMessage: 'Operacion no soportada',
        httpStatus: 501,
        retryable: false,
        exposeMessage: true,
    },
    TOKEN_NO_PROPORCIONADO: {
        category: 'SECURITY',
        defaultMessage: 'Token no proporcionado',
        httpStatus: 401,
        retryable: false,
        exposeMessage: true,
    },
    TOKEN_INVALIDO_O_EXPIRADO: {
        category: 'SECURITY',
        defaultMessage: 'Token invalido o expirado',
        httpStatus: 401,
        retryable: false,
        exposeMessage: true,
    },
    NO_AUTORIZADO: {
        category: 'SECURITY',
        defaultMessage: 'No autorizado',
        httpStatus: 401,
        retryable: false,
        exposeMessage: true,
    },
    INTEGRATION_TIMEOUT: {
        category: 'INTEGRATION',
        defaultMessage: 'Timeout en servicio bancario externo',
        httpStatus: 503,
        retryable: true,
        exposeMessage: false,
    },
    INTEGRATION_UNAVAILABLE: {
        category: 'INTEGRATION',
        defaultMessage: 'Servicio bancario externo no disponible',
        httpStatus: 503,
        retryable: true,
        exposeMessage: false,
    },
    INTEGRATION_BAD_RESPONSE: {
        category: 'INTEGRATION',
        defaultMessage: 'Respuesta invalida del servicio bancario externo',
        httpStatus: 502,
        retryable: false,
        exposeMessage: false,
    },
    INTERNAL_SERVER_ERROR: {
        category: 'TECHNICAL',
        defaultMessage: 'Error interno del servidor',
        httpStatus: 500,
        retryable: false,
        exposeMessage: false,
    },
    IDP_CONFLICT: {
        category: 'TECHNICAL',
        defaultMessage: 'Conflicto de idempotencia',
        httpStatus: 409,
        retryable: false,
        exposeMessage: true,
    },
} as const satisfies Record<string, ErrorCatalogDefinition>;

export type ErrorCode = keyof typeof ERROR_CATALOG;

export function getCatalogEntry(code: ErrorCode): (typeof ERROR_CATALOG)[ErrorCode] {
    return ERROR_CATALOG[code];
}

export function isCatalogErrorCode(code: string): code is ErrorCode {
    return code in ERROR_CATALOG;
}
