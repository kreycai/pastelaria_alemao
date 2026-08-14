import { Controller, Get, Query, BadRequestException } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { DashboardService } from "./dashboard.service";

@ApiTags("dashboard")
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("stats")
  @ApiOperation({ summary: "Estatísticas do dashboard" })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get("top-pasteis")
  @ApiOperation({ summary: "Pastéis mais vendidos de todos os tempos" })
  getTopPasteis() {
    return this.dashboardService.getTopPasteis();
  }

  @Get("periodo")
  @ApiOperation({ summary: "Faturamento por período personalizado" })
  @ApiQuery({ name: "de", required: true, example: "2026-01-01" })
  @ApiQuery({ name: "ate", required: true, example: "2026-01-31" })
  getPeriodo(@Query("de") de: string, @Query("ate") ate: string) {
    if (!de || !ate) throw new BadRequestException("Parâmetros de e ate são obrigatórios");
    const deDate = new Date(de + "T00:00:00.000Z");
    const ateDate = new Date(ate + "T23:59:59.999Z");
    if (isNaN(deDate.getTime()) || isNaN(ateDate.getTime())) {
      throw new BadRequestException("Datas inválidas");
    }
    return this.dashboardService.getPeriodo(deDate, ateDate);
  }
}
