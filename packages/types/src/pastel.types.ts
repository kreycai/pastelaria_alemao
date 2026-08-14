export type TipoPastel = "SALGADO" | "DOCE";

export interface Pastel {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  tipo: TipoPastel;
  disponivel: boolean;
  imagemUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePastelDto = Omit<Pastel, "id" | "createdAt" | "updatedAt">;
export type UpdatePastelDto = Partial<CreatePastelDto>;
