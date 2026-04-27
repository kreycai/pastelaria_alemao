import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";

@WebSocketGateway({ cors: { origin: "*" } })
export class OrdersGateway {
  @WebSocketServer()
  server!: Server;

  emitNovoPedido(pedido: unknown) {
    this.server.emit("novo-pedido", pedido);
  }

  emitStatusAtualizado(pedido: unknown) {
    this.server.emit("status-atualizado", pedido);
  }
}
