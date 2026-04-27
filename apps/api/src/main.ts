import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import express from "express";

export const server = express();

export const ready = (async () => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
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

if (!process.env.VERCEL) {
  const port = process.env.PORT ?? process.env.API_PORT ?? 3001;
  void ready.then(() => {
    server.listen(Number(port), () => {
      console.log(`API rodando em http://localhost:${port}`);
      console.log(`Swagger: http://localhost:${port}/docs`);
    });
  });
}
