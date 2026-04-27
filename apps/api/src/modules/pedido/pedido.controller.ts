import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { IsDateString, IsOptional } from "class-validator";
import { StatusPedido } from "@pastelaria/db";
import { PedidoService } from "./pedido.service";
import { CreatePedidoDto } from "./dto/create-pedido.dto";

class PrevisaoDto {
  @IsDateString()
  @IsOptional()
  previsaoPagamento?: string | null;
}

@ApiTags("pedidos")
@Controller("pedidos")
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  @Get()
  @ApiOperation({ summary: "Listar todos os pedidos" })
  findAll() {
    return this.pedidoService.findAll();
  }

  @Get("fiados")
  @ApiOperation({ summary: "Listar fiados (filtra por ?nome= ou ?clienteId=)" })
  findFiados(@Query("nome") nome?: string, @Query("clienteId") clienteId?: string) {
    return this.pedidoService.findFiados(nome, clienteId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar pedido por ID" })
  findOne(@Param("id") id: string) {
    return this.pedidoService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Criar novo pedido" })
  create(@Body() dto: CreatePedidoDto) {
    return this.pedidoService.create(dto);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Atualizar status do pedido" })
  updateStatus(@Param("id") id: string, @Body("status") status: StatusPedido) {
    return this.pedidoService.updateStatus(id, status);
  }

  @Patch(":id/pagar-fiado")
  @ApiOperation({ summary: "Marcar fiado como pago" })
  pagarFiado(@Param("id") id: string) {
    return this.pedidoService.pagarFiado(id);
  }

  @Patch(":id/previsao")
  @ApiOperation({ summary: "Atualizar previsão de pagamento" })
  atualizarPrevisao(@Param("id") id: string, @Body() dto: PrevisaoDto) {
    return this.pedidoService.atualizarPrevisao(id, dto.previsaoPagamento ?? null);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Cancelar/remover pedido" })
  remove(@Param("id") id: string) {
    return this.pedidoService.remove(id);
  }
}
