# pastelaria_alemao — Referência do Projeto

## Visão Geral
Turborepo monorepo para gestão de pastelaria. Três apps + pacotes compartilhados.
Package manager: **pnpm**. Todos os comandos `pnpm` rodam da raiz do monorepo.

---

## Arquitetura

```
Browsers / TV ──▶ Next.js 15   (:3000) ──┐
                                          ├──▶ NestJS 11 (:3001) ──▶ NeonTech PostgreSQL
Expo Go (Android/iOS) ───────────────────┘
           ▲
           └── WebSocket (socket.io) ── tela /cozinha em tempo real
```

## Workspaces

| Package              | Caminho           | Descrição                              |
|----------------------|-------------------|----------------------------------------|
| `@pastelaria/web`    | `apps/web`        | Next.js 15, porta 3000                 |
| `@pastelaria/api`    | `apps/api`        | NestJS 11, porta 3001, Swagger em /docs|
| `@pastelaria/mobile` | `apps/mobile`     | Expo SDK 54, RN 0.81.5                 |
| `@pastelaria/db`     | `packages/db`     | Prisma client + schema (NeonTech)      |
| `@pastelaria/types`  | `packages/types`  | Tipos TypeScript compartilhados        |
| `@pastelaria/ui`     | `packages/ui`     | Componentes React compartilhados       |
| `@pastelaria/tsconfig`| `packages/tsconfig`| Configs TS base/nextjs/nestjs         |

---

## Comandos Essenciais

```bash
pnpm dev                                      # Sobe web + api em paralelo
pnpm --filter @pastelaria/web dev             # Só Next.js (Turbopack)
pnpm --filter @pastelaria/api dev             # Só NestJS
pnpm --filter @pastelaria/mobile dev          # Expo (expo start)
pnpm install                                  # Instalar deps (parar servidores antes — EPERM no Windows)
pnpm --filter @pastelaria/db run db:generate  # Regenerar Prisma Client após mudar schema
pnpm --filter @pastelaria/db run db:migrate   # Rodar migrações no NeonTech
pnpm db:studio                                # Prisma Studio
```

## Variáveis de Ambiente
Arquivo: `apps/api/.env` (copiar de `.env.example`)

```
DATABASE_URL=postgresql://...?sslmode=require   # Pooled via PgBouncer — runtime
DIRECT_URL=postgresql://...?sslmode=require     # Conexão direta — migrações Prisma
JWT_SECRET=<qualquer string>
ADMIN_USERNAME=admin                            # Padrão: "admin"
ADMIN_PASSWORD=pastelaria123                    # Padrão: "pastelaria123"
AUTH_SECRET=<secret>                            # JWT do web (padrão: "pastelaria-alemao-secret-jwt-2024")
```

**Mobile:** `API_URL` está hardcoded em `apps/mobile/src/lib/api.ts` — alterar para o IP da máquina na rede local (ex: `http://192.168.x.x:3001`).

---

## Web App — apps/web

**Stack:** Next.js 15 · App Router · TypeScript · TailwindCSS v4 · Turbopack · `react-icons/lu`

### Rotas

| Rota                         | Tipo   | Descrição                                          |
|------------------------------|--------|----------------------------------------------------|
| `/`                          | Server | Landing: hero, info cards, top vendidos, cardápio  |
| `/cardapio`                  | Server | Cardápio completo (salgados + doces)               |
| `/login`                     | Client | Login admin — chama `POST /auth/login` na API      |
| `/admin`                     | Server | Dashboard: KPIs hoje/mês, top pastéis, alertas     |
| `/admin/pedidos`             | Client | Caixa: registrar pedido + acompanhar status        |
| `/admin/fiados`              | Client | Fiados pendentes/pagos + previsão de pagamento     |
| `/admin/pasteis`             | Client | CRUD de pastéis                                    |
| `/admin/estoque`             | Client | Lista de compras (itens abaixo do mínimo)          |
| `/admin/materias-primas`     | Client | CRUD matérias-primas + ajuste de estoque           |
| `/cozinha`                   | Client | Display da cozinha (3 colunas, WebSocket)          |

### Estrutura de Arquivos Chave

```
apps/web/src/
  middleware.ts              # Protege /admin/:path* via cookie auth_token (JWT 8h)
  lib/
    api.ts                   # API_URL + apiFetch (server e client side)
    auth.ts                  # signToken / verifyToken via jose (JWT)
  app/
    layout.tsx               # Root layout + estilos globais
    NavLinks.tsx             # "use client" — botão Cardápio (event handler)
    admin/
      layout.tsx             # Sidebar layout (SidebarNav + children)
      SidebarNav.tsx         # Nav com react-icons/lu, "use client"
      page.tsx               # Dashboard (Server Component)
```

### Auth Flow (Web)
1. `/login` envia `POST /auth/login` para API → valida credenciais → `{ ok: true }`
2. Web cria JWT com `signToken({ role: "admin" })` → seta cookie `auth_token` (8h)
3. Middleware verifica cookie em toda rota `/admin/*`

### Ícones — react-icons v5 (Lucide)
**Nomes mudaram no v5** — erros comuns:
```
LuAlertTriangle  → LuTriangleAlert   ✓
LuAlertCircle   → LuCircleAlert      ✓
LuCheckCircle   → LuCircleCheck      ✓
```
Todos os outros ícones usados: `LuLayoutDashboard`, `LuReceipt`, `LuNotebook`, `LuChefHat`,
`LuPackage`, `LuShoppingCart`, `LuMonitor`, `LuClock`, `LuMapPin`, `LuCreditCard`, `LuUtensils`,
`LuTrendingUp`, `LuUtensilsCrossed`, `LuCake`, `LuBanknote`, `LuRefreshCw`, `LuSmartphone`,
`LuFileText`, `LuCalendar`, `LuCheck`.

### Função diasAte (fiados)
**Não usar `setHours` + `Math.ceil`** — gera bug de fuso horário onde `Math.ceil(-0.4) = 0`.
Implementação correta (em `admin/page.tsx` e `admin/fiados/page.tsx`):
```ts
function diasAte(data: string): number {
  const dl = new Date(data.split("T")[0] + "T00:00:00.000Z");
  const td = new Date(new Date().toISOString().split("T")[0] + "T00:00:00.000Z");
  return Math.round((dl.getTime() - td.getTime()) / 86400000);
}
// FIADO VENCIDO = diasAte(previsaoPagamento) <= 0   (não < 0)
```

---

## API — apps/api

**Stack:** NestJS 11 · TypeScript · Prisma · class-validator · Swagger em `/docs`

### Módulos e Endpoints

```
POST   /auth/login                  Body: { username, password } → { ok: true }

GET    /pasteis
POST   /pasteis                     Body: { nome, descricao?, preco, tipo, disponivel }
PATCH  /pasteis/:id
DELETE /pasteis/:id

GET    /pedidos                     Todos os pedidos (desc por data)
POST   /pedidos                     Cria pedido, desconta estoque, emite socket, notifica se crítico
GET    /pedidos/fiados              Só pedidos FIADO (query ?nome= para filtrar)
GET    /pedidos/:id
PATCH  /pedidos/:id/status          Body: { status: StatusPedido }
PATCH  /pedidos/:id/pagar-fiado     Marca fiadoPago=true, fiadoPagoEm=now
PATCH  /pedidos/:id/previsao        Body: { previsaoPagamento: string|null }
DELETE /pedidos/:id

GET    /materias-primas
POST   /materias-primas             Body: { nome, unidade, precoKg, estoqueMinimo }
PATCH  /materias-primas/:id
DELETE /materias-primas/:id
PATCH  /materias-primas/:id/estoque Body: { quantidade: number }  (±gramas/unidades)

GET    /dashboard/stats             KPIs hoje+mês, top pastéis do mês, estoqueAlerta
GET    /dashboard/top-pasteis       Top vendidos all-time (sem filtro de data)

POST   /notifications/register      Body: { token: string }  — registra push token
```

### WebSocket (socket.io — mesma porta 3001)
Gateway em `apps/api/src/modules/pedido/orders.gateway.ts`. CORS `origin: "*"`.
Eventos emitidos para todos os clientes conectados:
- `novo-pedido` — disparado em `POST /pedidos`
- `status-atualizado` — disparado em `PATCH /pedidos/:id/status`

### Push Notifications (Expo Push API)
- Tokens armazenados **em memória** (Set no `NotificationsService`) — reset ao reiniciar servidor
- Mobile re-registra o token toda vez que abre a área admin
- Disparo: ao criar pedido, compara estoque **antes e depois** do decremento
- Só notifica itens que **cruzaram** o limiar (eram OK → agora críticos) — evita spam
- Envia para `https://exp.host/--/expo-push/v2/push/send`

### Enums do Prisma
```
StatusPedido:    PENDENTE | EM_PREPARO | PRONTO | ENTREGUE | CANCELADO
MetodoPagamento: DINHEIRO | PIX | CARTAO_DEBITO | CARTAO_CREDITO | FIADO
TipoPastel:      SALGADO | DOCE
UnidadeMateriaPrima: KG | UNIDADE
```

---

## Mobile — apps/mobile

**Stack:** Expo SDK 54 · React Native 0.81.5 · expo-router v6 · TypeScript

### Versões Pinadas (SDK 54 — não alterar sem cuidado)
```json
"expo": "~54.0.0",           "expo-router": "~6.0.23",
"expo-notifications": "~0.29.0",  "expo-secure-store": "~15.0.8",
"react": "19.1.4",           "react-native": "~0.81.5",
"@expo/metro-runtime": "~6.1.2"
```

### Estrutura de Navegação
```
app/
  index.tsx                  → Redirect para /(admin)/(tabs)/pedidos
  (admin)/
    _layout.tsx              Stack (login + (tabs)), headerShown: false
    login.tsx                Tela de login — POST /auth/login → saveAdminSession()
    (tabs)/
      _layout.tsx            Auth check + registerForPushNotifications() no mount
      pedidos.tsx            Lista de pedidos + formulário novo pedido
      novo-pedido.tsx        Registro rápido de pedido
      estoque.tsx            Gestão de estoque
```

### Arquivos Lib (src/lib/)
| Arquivo           | Responsabilidade                                      |
|-------------------|-------------------------------------------------------|
| `api.ts`          | `API_URL` + `apiFetch<T>` + interfaces compartilhadas |
| `store.ts`        | `getAdminSession / saveAdminSession / clearAdminSession` via expo-secure-store |
| `notifications.ts`| `registerForPushNotifications()` — permissão + Expo token + POST /notifications/register |

### Auth Flow (Mobile)
1. Login chama `POST /auth/login` na API → `{ ok: true }` → `saveAdminSession()` (SecureStore)
2. `(tabs)/_layout.tsx` lê SecureStore no mount; se vazio, redireciona para login
3. Ao autenticar, chama `registerForPushNotifications()` silenciosamente

### Gotchas Mobile
- **API_URL** em `src/lib/api.ts`: alterar para IP da máquina (ex: `http://192.168.15.60:3001`)
- `pnpm install` com servidor dev rodando falha com EPERM (arquivo bloqueado) — parar Node antes
- Push notifications não funcionam em emulador — necessário Expo Go em dispositivo físico
- Para push funcionar em Expo Go: usuário deve estar logado na conta Expo no dispositivo

---

## Banco de Dados — packages/db

**Prisma 5 + NeonTech Serverless PostgreSQL**
Duas URLs obrigatórias: `DATABASE_URL` (pooled, runtime) e `DIRECT_URL` (direta, migrations).

### Modelos Principais

| Model              | Campos notáveis                                                               |
|--------------------|-------------------------------------------------------------------------------|
| `Pastel`           | nome, descricao?, preco (Decimal), tipo, disponivel, imagemUrl?               |
| `Pedido`           | status, total, metodoPagamento, nomeCliente?, previsaoPagamento? (DateTime), fiadoPago, fiadoPagoEm? |
| `ItemPedido`       | pedidoId, pastelId, quantidade, precoUnit                                     |
| `MateriaPrima`     | nome, unidade, precoKg (Decimal), estoqueGramas (Decimal), estoqueMinimo      |
| `PastelIngrediente`| pastelId, materiaPrimaId, quantidadeGramas                                    |
| `Cliente`          | nome, telefone?, email? (unique)                                              |

### Fluxo de Fiado
```
1. POST /pedidos { metodoPagamento: "FIADO", nomeCliente: "..." }
2. PATCH /pedidos/:id/previsao { previsaoPagamento: "2026-05-01" }   ← opcional
3. PATCH /pedidos/:id/pagar-fiado                                     ← marca como pago
```
Dashboard mostra vencidos onde: `!fiadoPago && previsaoPagamento != null && diasAte <= 0`

### Fluxo de Estoque
- Ingredientes decrementam automaticamente ao criar pedido (via `PastelIngrediente.quantidadeGramas × quantidade`)
- `PATCH /materias-primas/:id/estoque { quantidade }` — ajuste manual (positivo = entrada, negativo = saída)
- `estoqueAlerta` no dashboard: itens onde `estoqueGramas <= estoqueMinimo`

---

## Armadilhas Conhecidas

| Problema | Causa | Solução |
|----------|-------|---------|
| `Export LuAlertTriangle doesn't exist` | react-icons v5 renomeou ícones | Usar `LuTriangleAlert`, `LuCircleAlert`, `LuCircleCheck` |
| Fiado vencido não aparece no dashboard | `Math.ceil(-0.4) = 0`, bug de fuso | Usar `diasAte` com split("T")[0] + `<= 0` |
| EPERM no `pnpm install` | Node/dev-server com arquivo aberto | Parar todos os processos Node antes de instalar |
| Mobile tela branca | Versão react-native incompatível com expo | Manter exatamente SDK 54 pins acima |
| Event handlers em Server Component | Next.js não passa funções ao cliente | Extrair para componente com `"use client"` |
| Push token perdido após restart da API | Tokens em memória (in-memory Set) | App re-registra ao abrir — comportamento esperado |
| API_URL no mobile não conecta | IP hardcoded no source | Alterar `src/lib/api.ts` para IP da máquina local |
