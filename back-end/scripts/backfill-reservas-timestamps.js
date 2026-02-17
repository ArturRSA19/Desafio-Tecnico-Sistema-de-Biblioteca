const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const reservasSemCreatedAt = await prisma.reserva.findMany({
    where: { createdAt: null },
    select: {
      id: true,
      dataReserva: true,
      dataPrevistaDevolucao: true,
      dataDevolucao: true,
    },
  });

  let atualizadas = 0;

  for (const reserva of reservasSemCreatedAt) {
    const dataBase = reserva.dataReserva ?? reserva.dataPrevistaDevolucao ?? reserva.dataDevolucao ?? new Date();

    await prisma.reserva.update({
      where: { id: reserva.id },
      data: {
        createdAt: dataBase,
      },
    });

    atualizadas += 1;
  }

  const reservasSemUpdatedAt = await prisma.reserva.findMany({
    where: { updatedAt: null },
    select: {
      id: true,
      createdAt: true,
      dataReserva: true,
      dataPrevistaDevolucao: true,
      dataDevolucao: true,
    },
  });

  for (const reserva of reservasSemUpdatedAt) {
    const dataBase =
      reserva.createdAt ??
      reserva.dataDevolucao ??
      reserva.dataPrevistaDevolucao ??
      reserva.dataReserva ??
      new Date();

    await prisma.reserva.update({
      where: { id: reserva.id },
      data: {
        updatedAt: dataBase,
      },
    });

    atualizadas += 1;
  }

  console.log(`Backfill concluído. Registros atualizados: ${atualizadas}`);
}

main()
  .catch((error) => {
    console.error('Erro no backfill de timestamps de reservas:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
