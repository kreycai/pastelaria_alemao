import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const validUser = process.env.ADMIN_USERNAME;
  const validPass = process.env.ADMIN_PASSWORD;

  // Sem credencial padrão: se o ambiente não configurou, ninguém entra. Um
  // fallback embutido no código é uma porta aberta que vaza junto com o repo.
  if (!validUser || !validPass) {
    return NextResponse.json(
      { error: "Autenticação não configurada no servidor" },
      { status: 500 },
    );
  }

  if (username !== validUser || password !== validPass) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  const token = await signToken({ username, role: "admin" });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8h
    path: "/",
  });
  return res;
}
