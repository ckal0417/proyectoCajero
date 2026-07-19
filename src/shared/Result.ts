import { ERROR_CATALOG, ErrorCategory, ErrorCode } from './ErrorCatalog';

export interface AppError<TCode extends string = string, TDetails = unknown> {
    readonly code: TCode;
    readonly category: ErrorCategory | 'UNKNOWN';
    readonly message: string;
    readonly retryable: boolean;
    readonly details?: TDetails;
    readonly cause?: unknown;
    readonly correlationId?: string;
}

export interface Success<TValue> {
    readonly ok: true;
    readonly value: TValue;
}

export interface Failure<TCode extends string = string, TDetails = unknown> {
    readonly ok: false;
    readonly error: AppError<TCode, TDetails>;
}

export type Result<TValue, TCode extends string = string, TDetails = unknown> =
    | Success<TValue>
    | Failure<TCode, TDetails>;

export function success<TValue>(value: TValue): Success<TValue> {
    return { ok: true, value };
}

export function failure<TCode extends string, TDetails = unknown>(
    error: AppError<TCode, TDetails>,
): Failure<TCode, TDetails> {
    return { ok: false, error };
}

export function failFromCatalog<TCode extends ErrorCode, TDetails = unknown>(args: {
    code: TCode;
    message?: string;
    details?: TDetails;
    cause?: unknown;
    correlationId?: string;
}): Failure<TCode, TDetails> {
    const entry = ERROR_CATALOG[args.code];
    return failure({
        code: args.code,
        category: entry.category,
        message: args.message ?? entry.defaultMessage,
        retryable: entry.retryable,
        details: args.details,
        cause: args.cause,
        correlationId: args.correlationId,
    });
}

export function isSuccess<TValue, TCode extends string, TDetails>(
    result: Result<TValue, TCode, TDetails>,
): result is Success<TValue> {
    return result.ok;
}

export function isFailure<TValue, TCode extends string, TDetails>(
    result: Result<TValue, TCode, TDetails>,
): result is Failure<TCode, TDetails> {
    return !result.ok;
}

export function mapResult<TIn, TOut, TCode extends string, TDetails>(
    result: Result<TIn, TCode, TDetails>,
    mapper: (value: TIn) => TOut,
): Result<TOut, TCode, TDetails> {
    if (result.ok) {
        return success(mapper(result.value));
    }
    return result;
}

export async function mapResultAsync<TIn, TOut, TCode extends string, TDetails>(
    result: Result<TIn, TCode, TDetails>,
    mapper: (value: TIn) => Promise<TOut>,
): Promise<Result<TOut, TCode, TDetails>> {
    if (result.ok) {
        return success(await mapper(result.value));
    }
    return result;
}
