import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';

/**
 * Les services ne parlent pas HTTP (séance 2) : ils lèvent une DomainError
 * qui dit ce qui ne va pas, et ce filtre la traduit en code HTTP, à un seul
 * endroit pour toute l'API.
 */
export type DomainErrorKind = 'invalid' | 'forbidden' | 'not-found' | 'conflict';

export class DomainError extends Error {
  constructor(
    readonly kind: DomainErrorKind,
    message: string,
  ) {
    super(message);
  }
}

/** Ce dont le filtre a besoin de la réponse Express : sans dépendre de ses types. */
interface JsonResponse {
  status(code: number): { json(body: unknown): void };
}

const STATUS: Record<DomainErrorKind, HttpStatus> = {
  invalid: HttpStatus.BAD_REQUEST, // 400
  forbidden: HttpStatus.FORBIDDEN, // 403
  'not-found': HttpStatus.NOT_FOUND, // 404
  conflict: HttpStatus.CONFLICT, // 409
};

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost): void {
    const status = STATUS[error.kind];
    host.switchToHttp().getResponse<JsonResponse>().status(status).json({
      statusCode: status,
      message: error.message,
    });
  }
}
