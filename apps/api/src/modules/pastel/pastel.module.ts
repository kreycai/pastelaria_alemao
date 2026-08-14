import { Module } from "@nestjs/common";
import { PastelController } from "./pastel.controller";
import { PastelService } from "./pastel.service";

@Module({
  controllers: [PastelController],
  providers: [PastelService],
  exports: [PastelService],
})
export class PastelModule {}
