import type { Pastel } from "@pastelaria/types";
import { API_URL } from "@/lib/api";

async function getPasteis(): Promise<Pastel[]> {
  try {
    const res = await fetch(`${API_URL}/pasteis?disponivel=true`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json() as Promise<Pastel[]>;
  } catch { return []; }
}

export default async function CardapioPage(): Promise<JSX.Element> {
  const pasteis = await getPasteis();
  const salgados = pasteis.filter((p) => p.tipo === "SALGADO");
  const doces = pasteis.filter((p) => p.tipo === "DOCE");

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-10">
        <h1 className="mb-2 text-4xl font-black">Cardápio</h1>
        <p className="text-sm" style={{ color: "#71717a" }}>
          Pastéis feitos na hora, com ingredientes frescos.
        </p>
      </div>

      {pasteis.length === 0 ? (
        <div className="rounded-xl py-20 text-center" style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}>
          <div className="mb-3 text-4xl">🥟</div>
          <p style={{ color: "#52525b" }}>Nenhum pastel disponível no momento.</p>
        </div>
      ) : (
        <>
          {[{ label: "Salgados", items: salgados }, { label: "Doces", items: doces }]
            .filter((g) => g.items.length > 0)
            .map((grupo) => (
              <section key={grupo.label} className="mb-10">
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-lg font-bold">{grupo.label}</h2>
                  <div className="h-px flex-1" style={{ backgroundColor: "#27272a" }} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {grupo.items.map((pastel) => (
                    <div key={pastel.id} className="rounded-xl p-5 transition-colors"
                      style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}>
                      <div className="mb-1 font-semibold">{pastel.nome}</div>
                      {pastel.descricao && (
                        <p className="mb-3 text-sm leading-relaxed" style={{ color: "#71717a" }}>
                          {pastel.descricao}
                        </p>
                      )}
                      <div className="mt-auto text-lg font-black" style={{ color: "#eab308" }}>
                        R$ {Number(pastel.preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
        </>
      )}
    </div>
  );
}
