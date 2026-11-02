import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";
import { t } from "@/lib/i18n";

const TITLE = "Política de privacidade";
const UPDATED = "2 de novembro de 2026";
const CONTACT = "https://github.com/henriquegpb/rodada/issues";

export const metadata: Metadata = {
  title: TITLE,
  ...pageMetadata({
    title: `${TITLE} · ${t.brand.name}`,
    description: "O que o Rodada guarda sobre quem joga, para quê e como pedir para apagar.",
    path: "/privacidade",
  }),
};

export default function PrivacyPage() {
  return (
    <article className="flex max-w-2xl flex-col gap-8">
      <header>
        <h1 className="font-display text-5xl leading-[0.95]">{TITLE}</h1>
        <p className="mt-3 text-sm text-muted-foreground">Atualizada em {UPDATED}.</p>
      </header>

      <Section title="Sem conta">
        Dá para jogar sem entrar. As partidas, sequências e estatísticas ficam só no seu navegador
        (armazenamento local) e não vão para o nosso servidor.
      </Section>

      <Section title="Com conta">
        Ao entrar com o Google ou por um link no e-mail, guardamos seu nome, e-mail e foto (a do Google
        ou a que você enviar), um nome de usuário e as partidas do dia que você terminar: as tentativas e
        o resultado. As partidas que já estavam no navegador vão para a conta no primeiro login. Isso
        serve para montar o ranking, os grupos, as conquistas e o seu perfil. Seu nome, nome de usuário,
        foto e resultados aparecem no ranking e para os membros dos seus grupos. Seu e-mail não aparece
        para ninguém.
      </Section>

      <Section title="Cookies e medição">
        Usamos um cookie só para manter você logado. Medimos visitas com o Vercel Web Analytics, que não
        usa cookies nem identifica você.
      </Section>

      <Section title="Com quem os dados ficam">
        Não vendemos nem compartilhamos seus dados. Eles ficam em serviços que mantêm o site no ar:
        Vercel (hospedagem e fotos), Neon (banco de dados), Google (login) e Resend (envio do link de
        login).
      </Section>

      <Section title="Apagar seus dados">
        Peça a exclusão da conta pelo{" "}
        <a href={CONTACT} className="text-primary underline underline-offset-2">
          GitHub do projeto
        </a>
        . Apagamos a conta, as partidas e a foto; os grupos que eram seus passam para outro membro.
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl">{title}</h2>
      <p className="mt-2 leading-relaxed text-muted-foreground">{children}</p>
    </section>
  );
}
