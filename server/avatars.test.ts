import { describe, expect, it } from "vitest";
import { ownsAvatar } from "./avatars";

const ANA = "ana123";
const blob = (path: string) => `https://abc.public.blob.vercel-storage.com/${path}`;

describe("ownsAvatar", () => {
  it("reconhece a foto que a própria Conta enviou", () => {
    expect(ownsAvatar(blob(`avatars/${ANA}-k3j4h5.png`), ANA)).toBe(true);
    expect(ownsAvatar(blob(`avatars/${ANA}.webp`), ANA)).toBe(true);
  });

  it("não deixa apagar a foto de outra Conta, nem uma de nome parecido", () => {
    expect(ownsAvatar(blob("avatars/bia456-k3j4h5.png"), ANA)).toBe(false);
    expect(ownsAvatar(blob(`avatars/${ANA}9-k3j4h5.png`), ANA)).toBe(false);
    expect(ownsAvatar(blob(`outra-pasta/${ANA}-k3j4h5.png`), ANA)).toBe(false);
  });

  it("deixa em paz a foto do Google, outros sites e o que nem é URL", () => {
    expect(ownsAvatar("https://lh3.googleusercontent.com/a/xyz", ANA)).toBe(false);
    expect(ownsAvatar(`https://blob.vercel-storage.com.evil.com/avatars/${ANA}-x.png`, ANA)).toBe(false);
    expect(ownsAvatar("x", ANA)).toBe(false);
    expect(ownsAvatar(null, ANA)).toBe(false);
  });
});
