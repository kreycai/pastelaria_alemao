export const API_URL = "https://pastelaria-alemao.onrender.com";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Erro ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface Pastel {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  tipo: "SALGADO" | "DOCE";
  disponivel: boolean;
}

export interface MateriaPrima {
  id: string;
  nome: string;
  unidade: "KG" | "UNIDADE";
  estoqueGramas: number;
  estoqueMinimo: number;
}

export interface ItemPedido {
  id: string;
  quantidade: number;
  precoUnit: number;
  pastel: { nome: string };
}

export interface Pedido {
  id: string;
  status: "PENDENTE" | "EM_PREPARO" | "PRONTO" | "ENTREGUE" | "CANCELADO";
  total: number;
  observacao: string | null;
  metodoPagamento: "DINHEIRO" | "PIX" | "CARTAO_DEBITO" | "CARTAO_CREDITO" | "FIADO";
  // Pedido avulso guarda o nome solto em `nomeCliente` ("Balcão", "Mesa 4");
  // pedido de cliente cadastrado guarda a relação. Use `quemPediu` para os dois.
  nomeCliente: string | null;
  cliente: { nome: string } | null;
  fiadoPago: boolean;
  fiadoPagoEm: string | null;
  previsaoPagamento: string | null;
  createdAt: string;
  itens: ItemPedido[];
}

/** Nome a chamar quando o pedido ficar pronto: o avulso ou o do cadastro. */
export function quemPediu(p: Pedido): string | null {
  return p.nomeCliente ?? p.cliente?.nome ?? null;
}
