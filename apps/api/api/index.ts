import type { IncomingMessage, ServerResponse } from "http";
import path from "path";

// require dinâmico impede o esbuild de tentar embutir o bundle do webpack
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { server, ready } = require(path.resolve(__dirname, "../dist/main")) as {
  server: (req: IncomingMessage, res: ServerResponse) => void;
  ready: Promise<void>;
};

export default async (req: IncomingMessage, res: ServerResponse) => {
  await ready;
  server(req, res);
};
