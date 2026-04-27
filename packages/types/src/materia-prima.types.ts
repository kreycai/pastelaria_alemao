export interface MateriaPrima {
  id: string;
  nome: string;
  precoKg: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateMateriaPrimaDto = Pick<MateriaPrima, "nome" | "precoKg">;
export type UpdateMateriaPrimaDto = Partial<CreateMateriaPrimaDto>;
