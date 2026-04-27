import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "../src/app.module";
import express from "express";
import type { IncomingMessage, ServerResponse } from "http";

const server = express();

const ready = (async () => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: "*" });
  const config = new DocumentBuilder()
    .setTitle("Pastelaria Alemão API")
    .setDescription("API da Pastelaria Alemão")
    .setVersion("1.0")
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));
  await app.init();
})();

export default async (req: IncomingMessage, res: ServerResponse) => {
  await ready;
  server(req as express.Request, res as express.Response);
};
