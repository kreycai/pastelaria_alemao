import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { IsNumber } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

class AjustarEstoqueDto {
  @ApiProperty({ description: "Quantidade a adicionar (negativo para remover)" })
  @IsNumber()
  quantidade!: number;
}
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { MateriaPrimaService } from "./materia-prima.service";
import { CreateMateriaPrimaDto } from "./dto/create-materia-prima.dto";
import { UpdateMateriaPrimaDto } from "./dto/update-materia-prima.dto";

@ApiTags("materias-primas")
@Controller("materias-primas")
export class MateriaPrimaController {
  constructor(private readonly service: MateriaPrimaService) {}

  @Get()
  @ApiOperation({ summary: "Listar todas as matérias-primas" })
  findAll() {
    return this.service.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar matéria-prima por ID" })
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Criar matéria-prima" })
  create(@Body() dto: CreateMateriaPrimaDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualizar matéria-prima" })
  update(@Param("id") id: string, @Body() dto: UpdateMateriaPrimaDto) {
    return this.service.update(id, dto);
  }

  @Patch(":id/estoque")
  @ApiOperation({ summary: "Ajustar estoque (entrada/saída em gramas)" })
  ajustarEstoque(@Param("id") id: string, @Body() dto: AjustarEstoqueDto) {
    return this.service.ajustarEstoque(id, dto.quantidade);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover matéria-prima" })
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
