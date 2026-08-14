import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { NotificationsService } from "./notifications.service";

class RegisterTokenDto {
  @IsString()
  token!: string;
}

@ApiTags("notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post("register")
  @ApiOperation({ summary: "Registrar push token do dispositivo" })
  register(@Body() dto: RegisterTokenDto) {
    this.notificationsService.register(dto.token);
    return { ok: true };
  }
}
