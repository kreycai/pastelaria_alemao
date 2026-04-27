import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";

export enum UnidadeMateriaPrima {
  KG = "KG",
  UNIDADE = "UNIDADE",
}

export class CreateMateriaPrimaDto {
  @ApiProperty({ example: "Frango" })
  @IsString()
  nome!: string;

  @ApiProperty({ enum: UnidadeMateriaPrima, default: UnidadeMateriaPrima.KG })
  @IsEnum(UnidadeMateriaPrima)
  @IsOptional()
  unidade?: UnidadeMateriaPrima;

  @ApiProperty({ example: 20.5, description: "Preço por kg (ou por unidade)" })
  @IsNumber()
  @Min(0)
  precoKg!: number;

  @ApiProperty({ example: 0, description: "Estoque mínimo antes do alerta" })
  @IsNumber()
  @Min(0)
  @IsOptional()
  estoqueMinimo?: number;
}
