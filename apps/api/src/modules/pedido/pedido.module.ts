import { Module } from "@nestjs/common";
import { PedidoController } from "./pedido.controller";
import { PedidoService } from "./pedido.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [PedidoController],
  providers: [PedidoService],
  exports: [PedidoService],
})
export class PedidoModule {}
