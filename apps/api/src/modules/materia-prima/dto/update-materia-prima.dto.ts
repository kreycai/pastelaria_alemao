import { PartialType } from "@nestjs/swagger";
import { CreateMateriaPrimaDto } from "./create-materia-prima.dto";

export class UpdateMateriaPrimaDto extends PartialType(CreateMateriaPrimaDto) {}
