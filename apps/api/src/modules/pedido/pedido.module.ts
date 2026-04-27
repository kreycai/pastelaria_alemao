import { Module } from "@nestjs/common";
import { PedidoController } from "./pedido.controller";
import { PedidoService } from "./pedido.service";
import { OrdersGateway } from "./orders.gateway";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [PedidoController],
  providers: [PedidoService, OrdersGateway],
  exports: [PedidoService],
})
export class PedidoModule {}
