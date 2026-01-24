import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservaDto } from './dto/create-reserva.dto';

@Injectable()
export class ReservasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova reserva
   * Valida se cliente e livro existem e se o livro está disponível
   * Atualiza o livro para disponivel = false
   */
  async create(createReservaDto: CreateReservaDto) {
    const { clienteId, livroId, dataReserva, dataPrevistaDevolucao } =
      createReservaDto;

    // Valida se o cliente existe
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${clienteId} não encontrado`);
    }

    // Valida se o livro existe
    const livro = await this.prisma.livro.findUnique({
      where: { id: livroId },
    });

    if (!livro) {
      throw new NotFoundException(`Livro com ID ${livroId} não encontrado`);
    }

    // Verifica se o livro está disponível
    if (!livro.disponivel) {
      throw new ConflictException(
        'Este livro não está disponível para reserva no momento',
      );
    }

    // Valida se a data de devolução é posterior à data de reserva
    const dataReservaDate = new Date(dataReserva);
    const dataPrevistaDevolucaoDate = new Date(dataPrevistaDevolucao);

    if (dataPrevistaDevolucaoDate <= dataReservaDate) {
      throw new BadRequestException(
        'A data prevista de devolução deve ser posterior à data de reserva',
      );
    }

    // Cria a reserva e atualiza o livro em uma transação
    // Cria a reserva
    const reserva = await this.prisma.reserva.create({
      data: {
        clienteId,
        clienteNome: cliente.nome,
        clienteCpf: cliente.cpf,
        livroId,
        dataReserva: dataReservaDate,
        dataPrevistaDevolucao: dataPrevistaDevolucaoDate,
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            cpf: true,
          },
        },
        livro: {
          select: {
            id: true,
            titulo: true,
            autor: true,
            disponivel: true,
          },
        },
      },
    });

    // Atualiza o livro para indisponível
    await this.prisma.livro.update({
      where: { id: livroId },
      data: { disponivel: false },
    });

    return reserva;
  }

  /**
   * Lista todas as reservas
   * Inclui dados básicos do cliente e do livro
   */
  async findAll() {
    const reservas = await this.prisma.reserva.findMany({
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            cpf: true,
          },
        },
        livro: {
          select: {
            id: true,
            titulo: true,
            autor: true,
          },
        },
      },
      orderBy: {
        dataReserva: 'desc',
      },
    });

    return reservas.map((reserva) => this.comClienteSnapshot(reserva));
  }

  /**
   * Lista todas as reservas de um cliente específico
   * Retorna 404 se o cliente não existir
   */
  async findByCliente(clienteId: string) {
    // Verifica se o cliente existe
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${clienteId} não encontrado`);
    }

    // Busca as reservas do cliente
    const reservas = await this.prisma.reserva.findMany({
      where: { clienteId },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            cpf: true,
          },
        },
        livro: {
          select: {
            id: true,
            titulo: true,
            autor: true,
          },
        },
      },
      orderBy: {
        dataReserva: 'desc',
      },
    });

    return reservas.map((reserva) => this.comClienteSnapshot(reserva));
  }

  /**
   * Registra a devolução de um livro
   * Atualiza dataDevolucao e torna o livro disponível novamente
   */
  async devolver(reservaId: string) {
    // Verifica se a reserva existe
    const reserva = await this.prisma.reserva.findUnique({
      where: { id: reservaId },
      include: {
        livro: true,
      },
    });

    if (!reserva) {
      throw new NotFoundException(`Reserva com ID ${reservaId} não encontrada`);
    }

    // Verifica se o livro já foi devolvido
    if (reserva.dataDevolucao) {
      throw new ConflictException('Este livro já foi devolvido');
    }

    const dataDevolucao = new Date();

    // Atualiza a reserva e o livro em uma transação
    // Atualiza a reserva com a data de devolução
    const reservaAtualizada = await this.prisma.reserva.update({
      where: { id: reservaId },
      data: { dataDevolucao },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            cpf: true,
          },
        },
        livro: {
          select: {
            id: true,
            titulo: true,
            autor: true,
            disponivel: true,
          },
        },
      },
    });

    // Atualiza o livro para disponível
    await this.prisma.livro.update({
      where: { id: reserva.livroId },
      data: { disponivel: true },
    });

    return reservaAtualizada;
  }

  /**
   * Identifica reservas em atraso
   * Considera atraso quando dataDevolucao é nula e data atual > dataPrevistaDevolucao
   * Calcula dias de atraso e multa para cada reserva
   */
  async findEmAtraso() {
    const dataAtual = new Date();

    // Busca reservas não devolvidas
    const reservas = await this.prisma.reserva.findMany({
      where: {
        dataDevolucao: null,
        dataPrevistaDevolucao: {
          lt: dataAtual,
        },
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            cpf: true,
          },
        },
        livro: {
          select: {
            id: true,
            titulo: true,
            autor: true,
          },
        },
      },
      orderBy: {
        dataPrevistaDevolucao: 'asc',
      },
    });

    // Calcula dias de atraso e multa para cada reserva
    const reservasComMulta = reservas.map((reserva) => {
      const { diasDeAtraso, multaTotal } = this.calcularMulta(
        reserva.dataPrevistaDevolucao,
        dataAtual,
      );

      return {
        ...this.comClienteSnapshot(reserva),
        diasDeAtraso,
        multaTotal,
      };
    });

    return reservasComMulta;
  }

  /**
   * Calcula a multa por atraso
   * Fórmula: multaTotal = 10 + (10 * 0.05 * diasDeAtraso)
   * Multa fixa: R$ 10,00
   * Acréscimo: 5% da multa fixa por dia de atraso
   */
  private calcularMulta(
    dataPrevistaDevolucao: Date,
    dataAtual: Date,
  ): { diasDeAtraso: number; multaTotal: number } {
    // Calcula a diferença em milissegundos
    const diferencaEmMs =
      dataAtual.getTime() - dataPrevistaDevolucao.getTime();

    // Converte para dias (arredonda para cima)
    const diasDeAtraso = Math.ceil(diferencaEmMs / (1000 * 60 * 60 * 24));

    // Constantes
    const MULTA_FIXA = 10.0;
    const PERCENTUAL_ACRESCIMO = 0.05;

    // Calcula a multa total
    const multaTotal = MULTA_FIXA + MULTA_FIXA * PERCENTUAL_ACRESCIMO * diasDeAtraso;

    return {
      diasDeAtraso,
      multaTotal: Number(multaTotal.toFixed(2)), // Arredonda para 2 casas decimais
    };
  }

  /**
   * Busca uma reserva por ID
   * Lança NotFoundException se não existir
   */
  async findOne(id: string) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            cpf: true,
          },
        },
        livro: {
          select: {
            id: true,
            titulo: true,
            autor: true,
          },
        },
      },
    });

    if (!reserva) {
      throw new NotFoundException(`Reserva com ID ${id} não encontrada`);
    }

    return this.comClienteSnapshot(reserva);
  }

  /**
   * Garante que o nome do cliente apareça no histórico mesmo após exclusão
   */
  private comClienteSnapshot(reserva: any) {
    if (!reserva?.cliente && (reserva?.clienteNome || reserva?.clienteCpf)) {
      return {
        ...reserva,
        cliente: {
          id: reserva.clienteId ?? null,
          nome: reserva.clienteNome,
          cpf: reserva.clienteCpf,
        },
      };
    }

    return reserva;
  }
}
