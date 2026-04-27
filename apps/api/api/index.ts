import type { IncomingMessage, ServerResponse } from "http";

// Importa o bundle webpack (compilado com emitDecoratorMetadata via ts-loader)
// O esbuild do @vercel/node não suporta decoradores NestJS — por isso usamos o bundle
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { server, ready } = require("../dist/main") as {
  server: (req: IncomingMessage, res: ServerResponse) => void;
  ready: Promise<void>;
};

export default async (req: IncomingMessage, res: ServerResponse) => {
  await ready;
  server(req, res);
};
