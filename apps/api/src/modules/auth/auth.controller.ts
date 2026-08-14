import {
  Body,
  Controller,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
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
    const validUser = this.config.get<string>("ADMIN_USERNAME");
    const validPass = this.config.get<string>("ADMIN_PASSWORD");
    // Sem credencial padrão: fallback embutido no código vaza junto com o repo.
    if (!validUser || !validPass) {
      throw new ServiceUnavailableException("Autenticação não configurada no servidor");
    }
    if (dto.username !== validUser || dto.password !== validPass) {
      throw new UnauthorizedException("Credenciais inválidas");
    }
    return { ok: true };
  }
}
