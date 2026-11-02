/**
 * Erro de regra de negócio, com o status HTTP e um código estável que o frontend pode tratar
 * ("too_many_groups"). A mensagem já vem pronta para mostrar na tela.
 */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
