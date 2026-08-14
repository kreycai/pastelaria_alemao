# Pastelaria Alemão

Sistema de gestão para uma pastelaria: cardápio público, painel do dono, tela de cozinha e
app do balcão. Monorepo TypeScript com **três aplicações** sobre uma única API e um único
banco.

O que separa isso de um CRUD de pedidos: **o sistema conhece a receita de cada pastel**. Cada
pastel é uma lista de matérias-primas com a quantidade em gramas, e o preço de cada
matéria-prima é por quilo. Disso saem duas coisas que um CRUD não dá:

- **o estoque baixa sozinho** a cada pedido, na proporção da receita;
- **o lucro é real**, não estimado — o custo de cada pedido é calculado somando
  `preço/kg × gramas × quantidade` de cada ingrediente.

<!-- Descomente quando as imagens estiverem em docs/img/
| Painel do dono | Cozinha |
|---|---|
| ![Painel](docs/img/admin.png) | ![Cozinha](docs/img/cozinha.png) |

| App do balcão | Cardápio público |
|---|---|
| ![Mobile](docs/img/mobile.png) | ![Cardápio](docs/img/cardapio.png) |
-->

---

## As três aplicações

| App | Stack | Para quem |
|---|---|---|
| **web** | Next.js 15 · App Router · Tailwind v4 · Turbopack | cliente (cardápio) e dono (painel) |
| **api** | NestJS 11 · Swagger em `/docs` · class-validator | ninguém — é o cérebro |
| **mobile** | Expo SDK 54 · React Native 0.81 · Expo Router | balcão e cozinha, no celular |

Compartilham quatro pacotes: `db` (Prisma), `types`, `ui` e `tsconfig`. A regra de negócio
mora **só na API** — web e mobile são clientes dela, e nenhum dos dois fala com o banco.

```
Navegador / TV ──▶ Next.js 15 ──┐
                                 ├──▶ NestJS 11 ──▶ PostgreSQL (Neon)
Expo Go (Android/iOS) ──────────┘
```

---

## O que tem de interessante no código

### O alerta de estoque só dispara na travessia

O jeito ingênuo de avisar "acabou a farinha" é checar se o estoque está abaixo do mínimo
depois de cada pedido. O problema: uma vez abaixo, **todo pedido seguinte dispara o alerta de
novo**, e em meia hora o celular do dono virou spam e ele desligou a notificação.

Aqui o serviço tira uma foto do estoque **antes** e **depois** do decremento, e só notifica os
ingredientes que *cruzaram* o limiar naquele pedido — que estavam acima do mínimo e passaram
para baixo. Quem já estava crítico fica quieto.

```ts
const recemCriticos = depois.filter((d) => {
  const a = antes.find((x) => x.id === d.id);
  const eraOk        = a && Number(a.estoqueGramas) > Number(a.estoqueMinimo);
  const agoraCritico = Number(d.estoqueGramas) <= Number(d.estoqueMinimo);
  return eraOk && agoraCritico;
});
```

O alerta sai como **push nativo** (Expo Push) pros celulares que registraram token.

### Dinheiro não é `float`

Preço é `Decimal(10,2)` e quantidade de insumo é `Decimal(10,3)` no Postgres. Somar centavos
em ponto flutuante acumula erro, e num sistema que fecha caixa isso aparece.

### Fiado como fluxo de primeira classe

`FIADO` é um método de pagamento junto de PIX e cartão, e não uma gambiarra em cima de
"observação". O pedido guarda previsão de pagamento, se já foi pago e quando — e existe uma
tela do dono pra cobrar e uma tela do cliente pra ver o que ele deve. É a forma como pastelaria
de bairro funciona de verdade.

### Duas conexões de banco, de propósito

`DATABASE_URL` aponta pro pooler (PgBouncer) e é o que a aplicação usa em runtime;
`DIRECT_URL` é conexão direta e existe porque **migração de Prisma não funciona através de
pooler**. É uma pegadinha que só aparece quando o deploy quebra.

### Custo e margem no dashboard

`/admin` mostra pedidos, faturamento, custo e lucro do dia e do mês, os cinco pasteis mais
vendidos, a distribuição de pedidos por status e a lista de ingredientes em estoque crítico.
O custo vem da receita, ingrediente por ingrediente.

---

## Domínio

```
MateriaPrima ──< PastelIngrediente >── Pastel ──< ItemPedido >── Pedido ──> Cliente
  (preço/kg,        (gramas)            (preço)    (qtd, preço      (status,
   estoque,                                          na hora)       pagamento,
   mínimo)                                                          fiado)
```

`ItemPedido` guarda `precoUnit` no momento da venda: mudar o preço do pastel amanhã **não
reescreve o histórico** de faturamento.

Ciclo do pedido: `PENDENTE → EM_PREPARO → PRONTO → ENTREGUE` (ou `CANCELADO`, que sai de
todos os cálculos).

---

## Rodando

Precisa de Node ≥ 20, pnpm ≥ 9 e um PostgreSQL (o projeto usa [Neon](https://neon.tech)).

```bash
pnpm install

cp .env.example .env                # preencher DATABASE_URL e DIRECT_URL
cp .env .env.api && mv .env.api apps/api/.env    # a API lê o dela

pnpm db:generate                    # gera o Prisma Client
pnpm db:migrate                     # cria as tabelas
pnpm db:seed                        # dados de demonstração

pnpm dev                            # web :3000 + api :3001
```

> São dois arquivos porque o alvo é diferente: as ferramentas de banco (Prisma, seed) leem o
> `.env` da **raiz**, e o NestJS lê o de `apps/api/`. Os valores são os mesmos.

O seed popula **um mês de operação**: 22 matérias-primas com receita ligada a cada um dos 16
pastéis, mais de 100 pedidos espalhados pelas semanas (sexta e sábado vendem mais, domingo
menos), oito pedidos na fila da cozinha agora mesmo, fiados em aberto — um deles vencido — e
três ingredientes abaixo do mínimo, pro painel ter o que alertar. A semente do gerador é fixa,
então rodar duas vezes dá o mesmo resultado.

> ⚠️ O seed **apaga** os dados de negócio antes de popular. É para banco de desenvolvimento.

Individualmente:

```bash
pnpm --filter @pastelaria/web dev      # Next.js  → localhost:3000
pnpm --filter @pastelaria/api dev      # NestJS   → localhost:3001  (docs em /docs)
pnpm --filter @pastelaria/mobile dev   # Expo     → QR code no Expo Go
```

> No celular físico, `localhost` não resolve. Ajuste a URL da API em
> `apps/mobile/src/lib/api.ts` pro IP da máquina na rede local.

### Rotas

| Rota | Quem usa |
|---|---|
| `/` · `/cardapio` | cliente — landing e cardápio |
| `/cozinha` | cozinha — fila de produção, atualiza a cada 5s |
| `/admin` | dono — faturamento, custo, lucro, alertas |
| `/admin/pedidos` · `/pasteis` · `/materias-primas` · `/estoque` · `/fiados` | dono |
| `/login` | admin |

---

## Limitações conhecidas

Estão aqui porque são decisões, não descuidos — e porque um sistema desse tamanho não precisa
resolver problema que não tem.

- **Autenticação é mínima.** A API compara usuário e senha contra variável de ambiente e não
  emite token; os endpoints não têm guard. Funciona porque o painel roda na rede da loja, mas
  não é o que eu escreveria pra uma API exposta. O caminho é JWT com guard por rota.
- **A criação de pedido não é transacional.** O pedido é criado e depois os insumos são
  decrementados. Se o processo morrer no meio, o estoque fica adiantado. `prisma.$transaction`
  resolve.
- **O dashboard carrega o mês inteiro na memória** pra somar custo, porque o custo depende da
  receita de cada item. Para uma pastelaria são centenas de linhas por mês e é irrelevante;
  em outra escala isso vira agregação no banco.

---

## Stack

TypeScript · Turborepo · pnpm workspaces · NestJS 11 · Next.js 15 · React Native / Expo 54 ·
Prisma · PostgreSQL (Neon) · TailwindCSS v4 · Swagger/OpenAPI · Expo Push Notifications ·
deploy do web na Vercel
