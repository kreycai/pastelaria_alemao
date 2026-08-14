/**
 * Seed de demonstração.
 *
 * ⚠️  APAGA os dados de negócio antes de popular. É seed de demo, para banco de
 *     desenvolvimento — não rode em produção.
 *
 * Popula um mês de operação: matérias-primas com receita ligada a cada pastel,
 * pedidos espalhados pelas semanas (para o dashboard ter faturamento, custo e
 * lucro de verdade), fila viva na cozinha e fiados em aberto.
 *
 *   pnpm --filter @pastelaria/db run db:seed
 *
 * Os pedidos são gravados direto no banco, então o estoque NÃO é decrementado
 * aqui — o saldo de cada matéria-prima é escrito de propósito, com três
 * ingredientes deixados abaixo do mínimo para o painel mostrar o alerta.
 */
import {
  prisma,
  TipoPastel,
  StatusPedido,
  MetodoPagamento,
  UnidadeMateriaPrima,
} from "../src/index";

// ─────────────────────────────────────────────────────────────────────────────
//  Utilitários
// ─────────────────────────────────────────────────────────────────────────────

/** Pseudoaleatório com semente fixa: roda duas vezes, sai igual. */
let _seed = 20260814;
function rnd(): number {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return _seed / 0x7fffffff;
}
const inteiro = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const escolher = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;

const HOJE = new Date();

/** Dia N do mês corrente, em horário de movimento. Nunca no futuro. */
function diaDoMes(dia: number, hora: number, minuto = 0): Date {
  const d = new Date(HOJE.getFullYear(), HOJE.getMonth(), dia, hora, minuto, 0, 0);
  return d > HOJE ? new Date(HOJE.getTime() - 3_600_000) : d;
}
const minutosAtras = (m: number) => new Date(HOJE.getTime() - m * 60_000);
const diasAFrente = (d: number) => new Date(HOJE.getTime() + d * 86_400_000);

/** Placeholder de imagem — troque por foto real para o cardápio ficar melhor. */
const img = (nome: string) =>
  `https://placehold.co/600x400/f4a261/1a1a1a?text=${encodeURIComponent(nome)}`;

// ─────────────────────────────────────────────────────────────────────────────
//  Matérias-primas
//
//  `estoque` e `minimo` são em gramas (ou em unidades, quando a unidade é
//  UNIDADE). Os três marcados como crítico ficam <= mínimo de propósito.
// ─────────────────────────────────────────────────────────────────────────────

const MATERIAS = [
  { nome: "Massa de pastel (folha)", unidade: UnidadeMateriaPrima.KG, precoKg: 12.90, estoque: 18_000, minimo: 5_000 },
  { nome: "Queijo mussarela", unidade: UnidadeMateriaPrima.KG, precoKg: 42.90, estoque: 9_500, minimo: 3_000 },
  { nome: "Carne moída", unidade: UnidadeMateriaPrima.KG, precoKg: 38.50, estoque: 2_800, minimo: 3_000 }, // crítico
  { nome: "Frango desfiado", unidade: UnidadeMateriaPrima.KG, precoKg: 29.90, estoque: 6_200, minimo: 2_500 },
  { nome: "Catupiry", unidade: UnidadeMateriaPrima.KG, precoKg: 54.00, estoque: 3_100, minimo: 1_500 },
  { nome: "Presunto", unidade: UnidadeMateriaPrima.KG, precoKg: 32.00, estoque: 2_400, minimo: 1_500 },
  { nome: "Calabresa", unidade: UnidadeMateriaPrima.KG, precoKg: 28.90, estoque: 3_600, minimo: 1_500 },
  { nome: "Palmito", unidade: UnidadeMateriaPrima.KG, precoKg: 68.00, estoque: 900, minimo: 1_000 },        // crítico
  { nome: "Camarão limpo", unidade: UnidadeMateriaPrima.KG, precoKg: 129.90, estoque: 1_400, minimo: 800 },
  { nome: "Queijo parmesão", unidade: UnidadeMateriaPrima.KG, precoKg: 89.00, estoque: 1_100, minimo: 600 },
  { nome: "Queijo provolone", unidade: UnidadeMateriaPrima.KG, precoKg: 76.00, estoque: 800, minimo: 500 },
  { nome: "Tomate", unidade: UnidadeMateriaPrima.KG, precoKg: 8.90, estoque: 4_500, minimo: 2_000 },
  { nome: "Orégano", unidade: UnidadeMateriaPrima.KG, precoKg: 62.00, estoque: 380, minimo: 150 },
  { nome: "Azeitona picada", unidade: UnidadeMateriaPrima.KG, precoKg: 34.00, estoque: 1_600, minimo: 800 },
  { nome: "Milho verde", unidade: UnidadeMateriaPrima.KG, precoKg: 14.50, estoque: 2_200, minimo: 1_000 },
  { nome: "Chocolate ao leite", unidade: UnidadeMateriaPrima.KG, precoKg: 46.90, estoque: 3_400, minimo: 1_200 },
  { nome: "Banana", unidade: UnidadeMateriaPrima.KG, precoKg: 6.90, estoque: 5_800, minimo: 2_000 },
  { nome: "Doce de leite", unidade: UnidadeMateriaPrima.KG, precoKg: 28.00, estoque: 2_100, minimo: 1_000 },
  { nome: "Goiabada", unidade: UnidadeMateriaPrima.KG, precoKg: 22.00, estoque: 1_900, minimo: 800 },
  { nome: "Coco ralado", unidade: UnidadeMateriaPrima.KG, precoKg: 39.00, estoque: 620, minimo: 700 },       // crítico
  { nome: "Açúcar com canela", unidade: UnidadeMateriaPrima.KG, precoKg: 9.80, estoque: 2_800, minimo: 1_000 },
  { nome: "Óleo de fritura", unidade: UnidadeMateriaPrima.KG, precoKg: 11.50, estoque: 24_000, minimo: 8_000 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Pastéis, com receita em gramas
// ─────────────────────────────────────────────────────────────────────────────

type Receita = [ingrediente: string, gramas: number][];

const PASTEIS: {
  nome: string;
  descricao: string;
  preco: number;
  tipo: TipoPastel;
  disponivel?: boolean;
  receita: Receita;
}[] = [
  {
    nome: "Pastel de Queijo", preco: 9.00, tipo: TipoPastel.SALGADO,
    descricao: "Mussarela derretida na massa fininha e crocante.",
    receita: [["Massa de pastel (folha)", 45], ["Queijo mussarela", 55], ["Óleo de fritura", 15]],
  },
  {
    nome: "Pastel de Carne", preco: 10.00, tipo: TipoPastel.SALGADO,
    descricao: "Carne moída temperada na hora, com azeitona.",
    receita: [["Massa de pastel (folha)", 45], ["Carne moída", 60], ["Azeitona picada", 8], ["Óleo de fritura", 15]],
  },
  {
    nome: "Pastel de Carne com Queijo", preco: 12.00, tipo: TipoPastel.SALGADO,
    descricao: "A carne temperada com mussarela por cima.",
    receita: [["Massa de pastel (folha)", 45], ["Carne moída", 45], ["Queijo mussarela", 30], ["Óleo de fritura", 15]],
  },
  {
    nome: "Pastel de Frango com Catupiry", preco: 12.00, tipo: TipoPastel.SALGADO,
    descricao: "Frango desfiado no requeijão cremoso.",
    receita: [["Massa de pastel (folha)", 45], ["Frango desfiado", 55], ["Catupiry", 35], ["Óleo de fritura", 15]],
  },
  {
    nome: "Pastel de Pizza", preco: 11.00, tipo: TipoPastel.SALGADO,
    descricao: "Presunto, mussarela, tomate e orégano.",
    receita: [["Massa de pastel (folha)", 45], ["Presunto", 30], ["Queijo mussarela", 35],
              ["Tomate", 25], ["Orégano", 2], ["Óleo de fritura", 15]],
  },
  {
    nome: "Pastel de Calabresa", preco: 11.00, tipo: TipoPastel.SALGADO,
    descricao: "Calabresa fatiada com mussarela.",
    receita: [["Massa de pastel (folha)", 45], ["Calabresa", 50], ["Queijo mussarela", 25], ["Óleo de fritura", 15]],
  },
  {
    nome: "Pastel de Palmito", preco: 13.00, tipo: TipoPastel.SALGADO,
    descricao: "Palmito em cubos com creme e mussarela.",
    receita: [["Massa de pastel (folha)", 45], ["Palmito", 50], ["Queijo mussarela", 25], ["Óleo de fritura", 15]],
  },
  {
    nome: "Pastel Quatro Queijos", preco: 14.00, tipo: TipoPastel.SALGADO,
    descricao: "Mussarela, parmesão, provolone e catupiry.",
    receita: [["Massa de pastel (folha)", 45], ["Queijo mussarela", 25], ["Queijo parmesão", 15],
              ["Queijo provolone", 15], ["Catupiry", 20], ["Óleo de fritura", 15]],
  },
  {
    nome: "Pastel de Camarão", preco: 19.00, tipo: TipoPastel.SALGADO,
    descricao: "Camarão limpo no catupiry. O mais pedido no fim de semana.",
    receita: [["Massa de pastel (folha)", 45], ["Camarão limpo", 45], ["Catupiry", 30], ["Óleo de fritura", 15]],
  },
  {
    nome: "Pastel de Frango com Milho", preco: 11.50, tipo: TipoPastel.SALGADO,
    descricao: "Frango desfiado com milho verde.",
    receita: [["Massa de pastel (folha)", 45], ["Frango desfiado", 45], ["Milho verde", 30], ["Óleo de fritura", 15]],
  },
  {
    nome: "Pastel de Chocolate", preco: 10.00, tipo: TipoPastel.DOCE,
    descricao: "Chocolate ao leite derretido.",
    receita: [["Massa de pastel (folha)", 45], ["Chocolate ao leite", 50], ["Óleo de fritura", 15]],
  },
  {
    nome: "Pastel de Banana com Canela", preco: 9.50, tipo: TipoPastel.DOCE,
    descricao: "Banana em rodelas com açúcar e canela por cima.",
    receita: [["Massa de pastel (folha)", 45], ["Banana", 60], ["Açúcar com canela", 8], ["Óleo de fritura", 15]],
  },
  {
    nome: "Pastel Romeu e Julieta", preco: 10.50, tipo: TipoPastel.DOCE,
    descricao: "Goiabada com mussarela — o clássico.",
    receita: [["Massa de pastel (folha)", 45], ["Goiabada", 40], ["Queijo mussarela", 30], ["Óleo de fritura", 15]],
  },
  {
    nome: "Pastel de Doce de Leite", preco: 10.00, tipo: TipoPastel.DOCE,
    descricao: "Doce de leite cremoso.",
    receita: [["Massa de pastel (folha)", 45], ["Doce de leite", 50], ["Óleo de fritura", 15]],
  },
  {
    nome: "Pastel Prestígio", preco: 11.00, tipo: TipoPastel.DOCE,
    descricao: "Chocolate com coco ralado.",
    receita: [["Massa de pastel (folha)", 45], ["Chocolate ao leite", 35], ["Coco ralado", 25], ["Óleo de fritura", 15]],
  },
  {
    nome: "Pastel de Bacalhau", preco: 21.00, tipo: TipoPastel.SALGADO, disponivel: false,
    descricao: "Sazonal — volta na Semana Santa.",
    receita: [["Massa de pastel (folha)", 45], ["Óleo de fritura", 15]],
  },
];

const CLIENTES = [
  { nome: "Dona Cida", telefone: "+55 11 98888-1010", email: "cida.souza@email.com" },
  { nome: "Seu Jorge", telefone: "+55 11 97777-2020" },
  { nome: "Marcelo do Mercado", telefone: "+55 11 96666-3030" },
  { nome: "Rafaela Lima", telefone: "+55 11 95555-4040", email: "rafa.lima@email.com" },
  { nome: "Sandra Oficina", telefone: "+55 11 94444-5050" },
  { nome: "Tiago Pinheiro", telefone: "+55 11 93333-6060", email: "tiago.p@email.com" },
  { nome: "Dona Neide", telefone: "+55 11 92222-7070" },
  { nome: "Fábio Barbearia", telefone: "+55 11 91111-8080" },
  { nome: "Célia Portaria", telefone: "+55 11 90000-9090" },
  { nome: "Wesley Entregas", telefone: "+55 11 98765-1234" },
];

const AVULSOS = [
  "Balcão", "Cliente do balcão", "Mesa 2", "Mesa 4", "Mesa 5",
  "Retirada — Ana", "Retirada — Léo", "iFood", "Delivery — Vila Nova",
];

// ─────────────────────────────────────────────────────────────────────────────

async function limpar() {
  console.log("⚠️  apagando dados de negócio existentes…");
  await prisma.itemPedido.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.pastelIngrediente.deleteMany();
  await prisma.pastel.deleteMany();
  await prisma.materiaPrima.deleteMany();
  await prisma.cliente.deleteMany();
}

async function main() {
  await limpar();

  // ─── Matérias-primas ──────────────────────────────────────────────────────
  const idMateria = new Map<string, string>();
  for (const m of MATERIAS) {
    const criada = await prisma.materiaPrima.create({
      data: {
        nome: m.nome,
        unidade: m.unidade,
        precoKg: m.precoKg,
        estoqueGramas: m.estoque,
        estoqueMinimo: m.minimo,
      },
    });
    idMateria.set(m.nome, criada.id);
  }
  const criticos = MATERIAS.filter((m) => m.estoque <= m.minimo);
  console.log(`✓ ${MATERIAS.length} matérias-primas · ${criticos.length} abaixo do mínimo`);
  console.log(`  (${criticos.map((c) => c.nome).join(", ")})`);

  // ─── Pastéis e receitas ───────────────────────────────────────────────────
  const pasteis: { id: string; nome: string; preco: number; disponivel: boolean }[] = [];
  for (const p of PASTEIS) {
    const criado = await prisma.pastel.create({
      data: {
        nome: p.nome,
        descricao: p.descricao,
        preco: p.preco,
        tipo: p.tipo,
        disponivel: p.disponivel ?? true,
        imagemUrl: img(p.nome.replace(/^Pastel (de |)/, "")),
        ingredientes: {
          create: p.receita.map(([nome, gramas]) => ({
            materiaPrimaId: idMateria.get(nome)!,
            quantidadeGramas: gramas,
          })),
        },
      },
    });
    pasteis.push({
      id: criado.id, nome: criado.nome,
      preco: Number(criado.preco), disponivel: criado.disponivel,
    });
  }
  const nIngredientes = PASTEIS.reduce((a, p) => a + p.receita.length, 0);
  console.log(`✓ ${PASTEIS.length} pastéis · ${nIngredientes} linhas de receita`);

  // Só os disponíveis entram em pedido novo.
  const vendaveis = pasteis.filter((p) => p.disponivel);
  // Pesos: os campeões aparecem mais, pra lista de "mais vendidos" ter cara.
  const CATALOGO_PONDERADO = vendaveis.flatMap((p) => {
    const peso =
      /Queijo$|Carne$/.test(p.nome) ? 5 :
      /Frango com Catupiry|Pizza|Chocolate/.test(p.nome) ? 4 :
      /Camarão|Quatro Queijos/.test(p.nome) ? 2 : 3;
    return Array(peso).fill(p) as typeof vendaveis;
  });

  // ─── Clientes ─────────────────────────────────────────────────────────────
  const clientes: { id: string; nome: string }[] = [];
  for (const c of CLIENTES) {
    const criado = await prisma.cliente.create({ data: c });
    clientes.push({ id: criado.id, nome: criado.nome });
  }
  console.log(`✓ ${CLIENTES.length} clientes cadastrados`);

  // ─── Pedidos ──────────────────────────────────────────────────────────────

  /** Cria um pedido com 1 a 4 itens sorteados e devolve o total. */
  async function criarPedido(opts: {
    createdAt: Date;
    status: StatusPedido;
    metodo: MetodoPagamento;
    clienteId?: string;
    nomeCliente?: string;
    previsaoPagamento?: Date | null;
    fiadoPago?: boolean;
    fiadoPagoEm?: Date | null;
    observacao?: string | null;
  }): Promise<number> {
    const itens: { pastelId: string; quantidade: number; precoUnit: number }[] = [];
    const quantosItens = inteiro(1, 4);
    for (let k = 0; k < quantosItens; k++) {
      const p = escolher(CATALOGO_PONDERADO);
      const existente = itens.find((i) => i.pastelId === p.id);
      const qtd = inteiro(1, 3);
      if (existente) existente.quantidade += qtd;
      else itens.push({ pastelId: p.id, quantidade: qtd, precoUnit: p.preco });
    }
    const total = itens.reduce((a, i) => a + i.precoUnit * i.quantidade, 0);

    await prisma.pedido.create({
      data: {
        status: opts.status,
        total,
        observacao: opts.observacao ?? null,
        clienteId: opts.clienteId,
        metodoPagamento: opts.metodo,
        nomeCliente: opts.nomeCliente,
        previsaoPagamento: opts.previsaoPagamento ?? null,
        fiadoPago: opts.fiadoPago ?? false,
        fiadoPagoEm: opts.fiadoPagoEm ?? null,
        createdAt: opts.createdAt,
        itens: { create: itens },
      },
    });
    return total;
  }

  const OBSERVACOES = [
    "Sem azeitona.", "Bem passado.", "Cortar ao meio.", "Sem cebola.",
    "Para viagem.", "Caprichar no queijo.", null, null, null, null,
  ];
  const METODOS_NORMAIS = [
    MetodoPagamento.PIX, MetodoPagamento.PIX, MetodoPagamento.PIX,
    MetodoPagamento.DINHEIRO, MetodoPagamento.DINHEIRO,
    MetodoPagamento.CARTAO_DEBITO, MetodoPagamento.CARTAO_DEBITO,
    MetodoPagamento.CARTAO_CREDITO,
  ];

  let nPedidos = 0;
  let faturamentoMes = 0;

  // ── Histórico do mês: dias anteriores, todos entregues (mais alguns cancelados).
  for (let dia = 1; dia < HOJE.getDate(); dia++) {
    const diaDaSemana = new Date(HOJE.getFullYear(), HOJE.getMonth(), dia).getDay();
    // Sexta e sábado vendem mais; domingo fecha mais cedo.
    const movimento = diaDaSemana === 5 || diaDaSemana === 6 ? inteiro(9, 14)
      : diaDaSemana === 0 ? inteiro(3, 6)
      : inteiro(5, 9);

    for (let n = 0; n < movimento; n++) {
      const hora = inteiro(11, 21);
      const cancelado = rnd() < 0.04;
      const comCadastro = rnd() < 0.4;
      const cliente = comCadastro ? escolher(clientes) : null;

      const total = await criarPedido({
        createdAt: diaDoMes(dia, hora, inteiro(0, 59)),
        status: cancelado ? StatusPedido.CANCELADO : StatusPedido.ENTREGUE,
        metodo: escolher(METODOS_NORMAIS),
        clienteId: cliente?.id,
        nomeCliente: cliente ? undefined : escolher(AVULSOS),
        observacao: escolher(OBSERVACOES),
      });
      nPedidos++;
      if (!cancelado) faturamentoMes += total;
    }
  }

  // ── Fiados: alguns pagos, outros em aberto (um deles vencido).
  const FIADOS: { cliente: string; dia: number; pago: boolean; vencimentoDias: number }[] = [
    { cliente: "Dona Cida", dia: 3, pago: true, vencimentoDias: -6 },
    { cliente: "Seu Jorge", dia: 4, pago: true, vencimentoDias: -4 },
    { cliente: "Marcelo do Mercado", dia: 6, pago: false, vencimentoDias: -2 }, // vencido
    { cliente: "Sandra Oficina", dia: 8, pago: false, vencimentoDias: 3 },
    { cliente: "Fábio Barbearia", dia: 9, pago: false, vencimentoDias: 6 },
    { cliente: "Célia Portaria", dia: 10, pago: false, vencimentoDias: 10 },
    { cliente: "Dona Neide", dia: 11, pago: true, vencimentoDias: -1 },
    { cliente: "Wesley Entregas", dia: 12, pago: false, vencimentoDias: 14 },
  ];
  let fiadoAberto = 0;
  for (const f of FIADOS) {
    const cliente = clientes.find((c) => c.nome === f.cliente)!;
    const criadoEm = diaDoMes(Math.min(f.dia, Math.max(1, HOJE.getDate() - 1)), inteiro(12, 20));
    const total = await criarPedido({
      createdAt: criadoEm,
      status: StatusPedido.ENTREGUE,
      metodo: MetodoPagamento.FIADO,
      clienteId: cliente.id,
      previsaoPagamento: diasAFrente(f.vencimentoDias),
      fiadoPago: f.pago,
      fiadoPagoEm: f.pago ? diasAFrente(f.vencimentoDias) : null,
      observacao: f.pago ? null : "Anotado na caderneta.",
    });
    nPedidos++;
    faturamentoMes += total;
    if (!f.pago) fiadoAberto += total;
  }

  // ── HOJE: pedidos já entregues ao longo do dia (para o quadro "hoje").
  let faturamentoHoje = 0;
  const pedidosDeHoje = inteiro(7, 11);
  for (let n = 0; n < pedidosDeHoje; n++) {
    const comCadastro = rnd() < 0.4;
    const cliente = comCadastro ? escolher(clientes) : null;
    const total = await criarPedido({
      createdAt: minutosAtras(inteiro(120, 480)),
      status: StatusPedido.ENTREGUE,
      metodo: escolher(METODOS_NORMAIS),
      clienteId: cliente?.id,
      nomeCliente: cliente ? undefined : escolher(AVULSOS),
      observacao: escolher(OBSERVACOES),
    });
    nPedidos++;
    faturamentoHoje += total;
    faturamentoMes += total;
  }

  // ── A FILA VIVA: é isso que aparece na tela da cozinha agora.
  //    Os tempos são escalonados pra fila parecer real: o que entrou primeiro
  //    já está pronto, o que acabou de chegar está pendente.
  const FILA: { status: StatusPedido; minutos: number }[] = [
    { status: StatusPedido.PRONTO, minutos: 14 },
    { status: StatusPedido.PRONTO, minutos: 11 },
    { status: StatusPedido.EM_PREPARO, minutos: 9 },
    { status: StatusPedido.EM_PREPARO, minutos: 7 },
    { status: StatusPedido.EM_PREPARO, minutos: 5 },
    { status: StatusPedido.PENDENTE, minutos: 4 },
    { status: StatusPedido.PENDENTE, minutos: 2 },
    { status: StatusPedido.PENDENTE, minutos: 1 },
  ];
  for (const f of FILA) {
    const comCadastro = rnd() < 0.4;
    const cliente = comCadastro ? escolher(clientes) : null;
    const total = await criarPedido({
      createdAt: minutosAtras(f.minutos),
      status: f.status,
      metodo: escolher(METODOS_NORMAIS),
      clienteId: cliente?.id,
      nomeCliente: cliente ? undefined : escolher(AVULSOS),
      observacao: escolher(OBSERVACOES),
    });
    nPedidos++;
    faturamentoHoje += total;
    faturamentoMes += total;
  }

  // ─── Resumo ───────────────────────────────────────────────────────────────
  const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const porStatus = await prisma.pedido.groupBy({ by: ["status"], _count: { id: true } });

  console.log(`✓ ${nPedidos} pedidos no mês`);
  console.log(`  ${porStatus.map((s) => `${s.status}: ${s._count.id}`).join(" · ")}`);
  console.log(`✓ faturamento — hoje ${brl(faturamentoHoje)} · mês ${brl(faturamentoMes)}`);
  console.log(`✓ fiado em aberto: ${brl(fiadoAberto)}`);
  console.log("");
  console.log("  /cozinha  → 8 pedidos na fila (3 pendentes, 3 em preparo, 2 prontos)");
  console.log("  /admin    → faturamento, custo e lucro saem da receita de cada pastel");
  console.log("  /admin/fiados → 5 fiados em aberto, 1 deles vencido");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
