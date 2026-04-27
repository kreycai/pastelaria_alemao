import { prisma } from "../src/index";

async function main() {
  await prisma.itemPedido.deleteMany();
  await prisma.pastelIngrediente.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.pastel.deleteMany();
  await prisma.materiaPrima.deleteMany();
  console.log("✓ Banco resetado com sucesso");
}

main().catch(console.error).finally(() => prisma.$disconnect());
