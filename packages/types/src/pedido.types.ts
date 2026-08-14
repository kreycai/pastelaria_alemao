export type StatusPedido =
  | "PENDENTE"
  | "EM_PREPARO"
  | "PRONTO"
  | "ENTREGUE"
  | "CANCELADO";

export interface ItemPedido {
  id: string;
  quantidade: number;
  precoUnit: number;
  pastelId: string;
  pedidoId: string;
}

export interface Pedido {
  id: string;
  status: StatusPedido;
  total: number;
  observacao: string | null;
  clienteId: string | null;
  itens: ItemPedido[];
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePedidoDto = {
  clienteId?: string;
  observacao?: string;
  itens: Array<{ pastelId: string; quantidade: number }>;
};
