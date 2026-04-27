import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { PastelService } from "./pastel.service";
import { CreatePastelDto } from "./dto/create-pastel.dto";
import { UpdatePastelDto } from "./dto/update-pastel.dto";

@ApiTags("pasteis")
@Controller("pasteis")
export class PastelController {
  constructor(private readonly pastelService: PastelService) {}

  @Get()
  @ApiOperation({ summary: "Listar todos os pastéis" })
  @ApiQuery({ name: "disponivel", required: false, type: Boolean })
  findAll(@Query("disponivel") disponivel?: string) {
    if (disponivel === "true") return this.pastelService.findDisponiveis();
    return this.pastelService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar pastel por ID" })
  findOne(@Param("id") id: string) {
    return this.pastelService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Criar novo pastel" })
  create(@Body() dto: CreatePastelDto) {
    return this.pastelService.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualizar pastel" })
  update(@Param("id") id: string, @Body() dto: UpdatePastelDto) {
    return this.pastelService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover pastel" })
  remove(@Param("id") id: string) {
    return this.pastelService.remove(id);
  }
}
