import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ClienteService } from "./cliente.service";

@ApiTags("clientes")
@Controller("clientes")
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  @Get()
  @ApiOperation({ summary: "Buscar clientes por nome" })
  @ApiQuery({ name: "nome", required: true })
  search(@Query("nome") nome: string) {
    return this.clienteService.search(nome ?? "");
  }

  @Post()
  @ApiOperation({ summary: "Criar novo cliente" })
  create(@Body("nome") nome: string) {
    return this.clienteService.create(nome);
  }
}
