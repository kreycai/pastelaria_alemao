import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly tokens = new Set<string>();

  register(token: string) {
    this.tokens.add(token);
    this.logger.log(`Push token registrado (total: ${this.tokens.size})`);
  }

  async sendStockCriticalAlert(items: { nome: string }[]): Promise<void> {
    if (this.tokens.size === 0 || items.length === 0) return;

    const body =
      items.length === 1
        ? `"${items[0]!.nome}" atingiu o estoque mínimo`
        : `${items.length} ingredientes atingiram o estoque mínimo`;

    const messages = [...this.tokens].map((to) => ({
      to,
      title: "Estoque crítico",
      body,
      sound: "default",
      data: { type: "stock_critical", items: items.map((i) => i.nome) },
      channelId: "stock-alerts",
    }));

    try {
      const res = await fetch("https://exp.host/--/expo-push/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(messages),
      }) as unknown as { ok: boolean; status: number };
      if (!res.ok) {
        this.logger.warn(`Expo Push retornou ${res.status}`);
      }
    } catch (err) {
      this.logger.warn(`Falha ao enviar push: ${err}`);
    }
  }
}
