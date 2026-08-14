import { PartialType } from "@nestjs/swagger";
import { CreatePastelDto } from "./create-pastel.dto";

export class UpdatePastelDto extends PartialType(CreatePastelDto) {}
