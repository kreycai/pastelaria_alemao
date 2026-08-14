import { Body, Controller, Post, UnauthorizedException } from "@nestjs/common";
import { ApiOperation, ApiProperty, ApiTags } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { ConfigService } from "@nestjs/config";

class LoginDto {
  @ApiProperty() @IsString() username!: string;
  @ApiProperty() @IsString() password!: string;
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private config: ConfigService) {}

  @Post("login")
  @ApiOperation({ summary: "Login do administrador" })
  login(@Body() dto: LoginDto) {
    const validUser = this.config.get("ADMIN_USERNAME") ?? "admin";
    const validPass = this.config.get("ADMIN_PASSWORD") ?? "pastelaria123";
    if (dto.username !== validUser || dto.password !== validPass) {
      throw new UnauthorizedException("Credenciais inválidas");
    }
    return { ok: true };
  }
}
