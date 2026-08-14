import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PastelModule } from "./modules/pastel/pastel.module";
import { PedidoModule } from "./modules/pedido/pedido.module";
import { MateriaPrimaModule } from "./modules/materia-prima/materia-prima.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { AuthModule } from "./modules/auth/auth.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ClienteModule } from "./modules/cliente/cliente.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    MateriaPrimaModule,
    PastelModule,
    PedidoModule,
    DashboardModule,
    NotificationsModule,
    ClienteModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
