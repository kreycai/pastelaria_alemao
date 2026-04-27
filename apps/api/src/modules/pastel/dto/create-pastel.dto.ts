import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export enum TipoPastelEnum {
  SALGADO = "SALGADO",
  DOCE = "DOCE",
}

export class IngredienteDto {
  @ApiProperty({ example: "clz123abc456" })
  @IsString()
  materiaPrimaId!: string;

  @ApiProperty({ example: 150, description: "Quantidade em gramas" })
  @IsNumber()
  @Min(0.001)
  quantidadeGramas!: number;
}

export class CreatePastelDto {
  @ApiProperty({ example: "Pastel de Frango" })
  @IsString()
  nome!: string;

  @ApiPropertyOptional({ example: "Frango desfiado com catupiry" })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({ example: 8.5 })
  @IsNumber()
  @Min(0)
  preco!: number;

  @ApiProperty({ enum: TipoPastelEnum })
  @IsEnum(TipoPastelEnum)
  tipo!: TipoPastelEnum;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  disponivel?: boolean;

  @ApiPropertyOptional({ example: "https://example.com/pastel.jpg" })
  @IsUrl()
  @IsOptional()
  imagemUrl?: string;

  @ApiPropertyOptional({ type: [IngredienteDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => IngredienteDto)
  ingredientes?: IngredienteDto[];
}
