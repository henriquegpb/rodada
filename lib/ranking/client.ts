"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { authClient } from "@/lib/auth-client";
import { importLocalPlays, onPlayReported } from "@/lib/plays/sync";
import { t } from "@/lib/i18n";
import type { GroupDetail, GroupSummary } from "@/server/groups";
import type { Ranking } from "@/server/rankings";
import { MOCK_ME, mockBoard, mockGroup, mockGroups } from "./mock";

/**
 * O lado do navegador dos Rankings e dos Grupos: a Conta logada, as buscas na API (`/api/rankings`,
 * `/api/groups`) e as ações. Quem não entrou vê o Ranking geral, mas não aparece nele.
 */

/** De quanto em quanto tempo um ranking aberto se atualiza. */
const REFRESH_MS = 30_000;

/** O que as telas usam da Conta logada. */
export interface Me {
  id: string;
  name: string;
  handle: string;
  image: string | null;
}

export interface InvitePreview {
  id: string;
  name: string;
  memberCount: number;
  full: boolean;
}

/**
 * `?mock` na URL (fora de produção) troca a Conta, os rankings e os grupos por dados de mentira,
 * para desenhar as telas sem banco. No servidor é sempre falso.
 */
function useMock(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => process.env.NODE_ENV !== "production" && new URLSearchParams(window.location.search).has("mock"),
    () => false,
  );
}

/** Avisados quando algo mudou do nosso lado (Grupo criado, partidas importadas…): buscam de novo. */
const changeListeners = new Set<() => void>();
const changed = () => changeListeners.forEach((l) => l());

/** Pede à API e devolve o JSON; erro com a mensagem do servidor, que já vem pronta para a tela. */
async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      cache: "no-store",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error(t.ranking.offline);
  }
  if (response.status === 204) return undefined as T;
  const json = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
  if (!response.ok) throw new Error(json?.error?.message ?? t.ranking.failed);
  return json as T;
}

/** A última resposta de cada URL: voltar a uma aba mostra na hora o que já tinha, enquanto busca de novo. */
const cache = new Map<string, unknown>();

/**
 * Busca `url` ao abrir, quando algo muda do nosso lado e, com `poll`, a cada `REFRESH_MS` com a
 * aba visível e quando uma partida nova chega ao servidor.
 */
function useApi<T>(url: string | null, poll = false): { data: T | null; error: string | null } {
  const [state, setState] = useState<{ url: string | null; data: T | null; error: string | null }>({
    url: null,
    data: null,
    error: null,
  });

  useEffect(() => {
    if (!url) return;
    let alive = true;
    async function load() {
      if (document.hidden) return;
      try {
        const data = await api<T>(url!);
        cache.set(url!, data);
        if (alive) setState({ url, data, error: null });
      } catch (error) {
        if (alive) setState((s) => ({ url, data: s.url === url ? s.data : null, error: (error as Error).message }));
      }
    }
    void load();
    changeListeners.add(load);
    const timer = poll ? window.setInterval(load, REFRESH_MS) : undefined;
    const off = poll ? onPlayReported(() => void load()) : undefined;
    if (poll) document.addEventListener("visibilitychange", load);
    return () => {
      alive = false;
      changeListeners.delete(load);
      window.clearInterval(timer);
      off?.();
      document.removeEventListener("visibilitychange", load);
    };
  }, [url, poll]);

  if (!url) return { data: null, error: null };
  if (state.url === url) return state;
  return { data: (cache.get(url) as T | undefined) ?? null, error: null };
}

/** A Conta logada: undefined enquanto a sessão carrega, null para quem não entrou. */
export function useMe(): Me | null | undefined {
  const mock = useMock();
  const { data, isPending } = authClient.useSession();
  if (mock) return MOCK_ME;
  if (isPending) return undefined;
  if (!data) return null;
  const { id, name, handle, image } = data.user;
  return { id, name, handle: handle ?? "", image: image ?? null };
}

/**
 * O Ranking do dia: o geral (soma das Notas da Rodada) ou, com `slug`, o de um jogo; com `group`,
 * só entre os membros do Grupo. `dateKey` null (ainda no servidor) não busca nada.
 */
export function useBoard({ dateKey, slug, group }: { dateKey: string | null; slug?: string; group?: string }) {
  const mock = useMock();
  const params = new URLSearchParams({ kind: "daily", date: dateKey ?? "" });
  if (slug) params.set("slug", slug);
  if (group) params.set("group", group);
  const { data, error } = useApi<Ranking>(dateKey && !mock ? `/api/rankings?${params}` : null, true);
  const fake = useMemo(() => (mock && dateKey ? mockBoard(dateKey, slug, group) : null), [mock, dateKey, slug, group]);
  return fake ? { board: fake, error: null } : { board: data, error };
}

/** Os Grupos da Conta, na ordem em que entrou. Sem login, nenhum. */
export function useGroups(me: Me | null | undefined): { groups: GroupSummary[] | null; error: string | null } {
  const mock = useMock();
  const { data, error } = useApi<GroupSummary[]>(me && !mock ? "/api/groups" : null);
  if (mock) return { groups: mockGroups(), error: null };
  if (me === null) return { groups: [], error: null };
  return { groups: data, error };
}

/** Um Grupo com os membros. */
export function useGroup(id: string | null): GroupDetail | null {
  const mock = useMock();
  const { data } = useApi<GroupDetail>(id && !mock ? `/api/groups/${encodeURIComponent(id)}` : null);
  return mock && id ? mockGroup(id) : data;
}

/** O que o link de convite mostra antes de entrar. */
export function useInvite(code: string): { invite: InvitePreview | null; error: string | null } {
  const { data, error } = useApi<InvitePreview>(`/api/groups/invites/${encodeURIComponent(code)}`);
  return { invite: data, error };
}

export async function createGroup(name: string): Promise<GroupSummary> {
  const group = await api<GroupSummary>("/api/groups", "POST", { name });
  changed();
  return group;
}

export async function joinGroup(code: string): Promise<GroupSummary> {
  const group = await api<GroupSummary>("/api/groups/join", "POST", { code: code.trim() });
  changed();
  return group;
}

export async function leaveGroup(id: string): Promise<void> {
  await api(`/api/groups/${encodeURIComponent(id)}/leave`, "POST");
  changed();
}

/** O Grupo aberto por último, para a tela de Grupos voltar nele (e abrir no que acabou de entrar). */
const GROUP_KEY = "rodada:group:v1";

export function lastGroup(): string | null {
  try {
    return localStorage.getItem(GROUP_KEY);
  } catch {
    return null;
  }
}

export function rememberGroup(id: string) {
  try {
    localStorage.setItem(GROUP_KEY, id);
  } catch {
    // Modo privado: abre no primeiro Grupo.
  }
}

/** Entrar com o Google: sai para o Google e volta para `callbackURL` já logado. */
export function signInWithGoogle(callbackURL: string) {
  return authClient.signIn.social({ provider: "google", callbackURL });
}

/** Manda o link mágico para o e-mail; clicar nele volta para `callbackURL` já logado. */
export async function sendLoginLink(email: string, callbackURL: string) {
  const { error } = await authClient.signIn.magicLink({ email: email.trim(), callbackURL });
  if (error) throw new Error(error.message ?? t.login.failed);
}

export async function signOut() {
  await authClient.signOut();
  changed();
}

/** Contas que já levaram as partidas deste navegador (o servidor só aceita uma importação por Conta). */
const IMPORTED_KEY = "rodada:imported:v1";

/**
 * Logo depois do login, leva as partidas guardadas neste navegador para a Conta: quem jogou antes de
 * entrar aparece no ranking de hoje com o que já fez. Vai no `Providers`, uma vez para o app todo.
 */
export function useImportOnLogin() {
  const { data } = authClient.useSession();
  const id = data?.user.id;
  useEffect(() => {
    if (!id) return;
    let done: string[] = [];
    try {
      done = JSON.parse(localStorage.getItem(IMPORTED_KEY) ?? "[]") as string[];
    } catch {
      // Lista corrompida: tenta de novo; o servidor recusa a segunda importação.
    }
    if (done.includes(id)) return;
    void importLocalPlays().then((result) => {
      if (!result) return;
      try {
        localStorage.setItem(IMPORTED_KEY, JSON.stringify([...done, id]));
      } catch {
        // Sem armazenamento: tenta de novo na próxima vez, sem efeito.
      }
      if (result.accepted) changed();
    });
  }, [id]);
}
