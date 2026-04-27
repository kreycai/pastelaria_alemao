import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { MetodoPagamento } from "@pastelaria/db";

export class ItemPedidoDto {
  @ApiProperty({ example: "clz123abc456" })
  @IsString()
  pastelId!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantidade!: number;
}

export class CreatePedidoDto {
  @ApiPropertyOptional({ example: "clz789def012" })
  @IsString()
  @IsOptional()
  clienteId?: string;

  @ApiPropertyOptional({ example: "Sem cebola, por favor" })
  @IsString()
  @IsOptional()
  observacao?: string;

  @ApiPropertyOptional({ enum: MetodoPagamento, default: "DINHEIRO" })
  @IsEnum(MetodoPagamento)
  @IsOptional()
  metodoPagamento?: MetodoPagamento;

  @ApiPropertyOptional({ example: "João da Silva" })
  @IsString()
  @IsOptional()
  nomeCliente?: string;

  @ApiPropertyOptional({ example: "2026-05-01" })
  @IsDateString()
  @IsOptional()
  previsaoPagamento?: string;

  @ApiProperty({ type: [ItemPedidoDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoDto)
  itens!: ItemPedidoDto[];
}
