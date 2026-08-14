import { SignJWT, jwtVerify } from "jose";

// Sem valor padrão de propósito: um segredo de assinatura embutido no código é
// um segredo público. Se AUTH_SECRET não estiver no ambiente, é melhor a rota
// falhar alto do que assinar token com uma chave que qualquer um conhece.
//
// A leitura é preguiçosa (dentro da função, não no topo do módulo) para não
// quebrar o build, que roda sem as variáveis de runtime.
function chave(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET não definida. Defina no ambiente (.env em desenvolvimento, " +
        "variável do projeto em produção) antes de autenticar.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(chave());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, chave());
    return payload;
  } catch {
    return null;
  }
}
