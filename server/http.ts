import { unstable_rethrow } from "next/navigation";
import { auth } from "./auth";
import { AppError } from "./errors";

/** Costura entre as rotas HTTP e os módulos do servidor: sessão, corpo JSON e erros. */

/** O id da Conta logada; 401 sem sessão. */
export async function requireAccount(request: Request): Promise<string> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new AppError(401, "unauthenticated", "Entre na sua Conta para continuar");
  return session.user.id;
}

/** O id da Conta logada, ou undefined para quem não entrou. */
export async function optionalAccount(request: Request): Promise<string | undefined> {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user.id;
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError(400, "invalid_json", "Corpo da requisição não é JSON");
  }
}

/**
 * Responde com o resultado em JSON, e transforma AppError em `{ error: { code, message } }` com o
 * status certo. Qualquer outro erro vira 500 sem detalhes.
 */
export async function respond(run: () => Promise<unknown>): Promise<Response> {
  try {
    const result = await run();
    return result === undefined ? new Response(null, { status: 204 }) : Response.json(result);
  } catch (error) {
    // Erros internos do Next (ler a URL no prerender, notFound…) seguem para ele, não viram 500.
    unstable_rethrow(error);
    if (error instanceof AppError) {
      return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status });
    }
    console.error(error);
    return Response.json({ error: { code: "internal", message: "Algo deu errado. Tente de novo." } }, { status: 500 });
  }
}
