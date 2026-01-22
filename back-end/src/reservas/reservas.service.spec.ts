import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservaDto } from './dto/create-reserva.dto';

describe('ReservasService', () => {
  let service: ReservasService;
  let prismaService: PrismaService;

  // Mock do PrismaService
  const mockPrismaService = {
    cliente: {
      findUnique: jest.fn(),
    },
    livro: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    reserva: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservasService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReservasService>(ReservasService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Limpa todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const clienteId = '507f1f77bcf86cd799439011';
    const livroId = '507f1f77bcf86cd799439012';

    const createReservaDto: CreateReservaDto = {
      clienteId,
      livroId,
      dataReserva: '2026-01-22T00:00:00.000Z',
      dataPrevistaDevolucao: '2026-01-29T00:00:00.000Z',
    };

    const clienteMock = {
      id: clienteId,
      nome: 'João da Silva',
      cpf: '52998224725',
    };

    const livroMock = {
      id: livroId,
      titulo: '1984',
      autor: 'George Orwell',
      disponivel: true,
    };

    it('deve criar reserva quando cliente e livro existirem e livro estiver disponível', async () => {
      // Arrange
      const reservaCriada = {
        id: '507f1f77bcf86cd799439013',
        clienteId,
        livroId,
        dataReserva: new Date('2026-01-22T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-29T00:00:00.000Z'),
        dataDevolucao: null,
        cliente: clienteMock,
        livro: livroMock,
      };

      mockPrismaService.cliente.findUnique.mockResolvedValue(clienteMock);
      mockPrismaService.livro.findUnique.mockResolvedValue(livroMock);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrismaService);
      });
      mockPrismaService.reserva.create.mockResolvedValue(reservaCriada);

      // Act
      const result = await service.create(createReservaDto);

      // Assert
      expect(result).toEqual(reservaCriada);
      expect(mockPrismaService.cliente.findUnique).toHaveBeenCalledWith({
        where: { id: clienteId },
      });
      expect(mockPrismaService.livro.findUnique).toHaveBeenCalledWith({
        where: { id: livroId },
      });
    });

    it('deve atualizar o livro para disponivel = false ao criar reserva', async () => {
      // Arrange
      const reservaCriada = {
        id: '507f1f77bcf86cd799439013',
        clienteId,
        livroId,
        dataReserva: new Date('2026-01-22T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-29T00:00:00.000Z'),
        dataDevolucao: null,
        cliente: clienteMock,
        livro: livroMock,
      };

      mockPrismaService.cliente.findUnique.mockResolvedValue(clienteMock);
      mockPrismaService.livro.findUnique.mockResolvedValue(livroMock);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrismaService);
      });
      mockPrismaService.reserva.create.mockResolvedValue(reservaCriada);

      // Act
      await service.create(createReservaDto);

      // Assert
      expect(mockPrismaService.livro.update).toHaveBeenCalledWith({
        where: { id: livroId },
        data: { disponivel: false },
      });
    });

    it('deve lançar NotFoundException quando cliente não existir', async () => {
      // Arrange
      mockPrismaService.cliente.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createReservaDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createReservaDto)).rejects.toThrow(
        `Cliente com ID ${clienteId} não encontrado`,
      );

      expect(mockPrismaService.livro.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando livro não existir', async () => {
      // Arrange
      mockPrismaService.cliente.findUnique.mockResolvedValue(clienteMock);
      mockPrismaService.livro.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createReservaDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createReservaDto)).rejects.toThrow(
        `Livro com ID ${livroId} não encontrado`,
      );

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException quando livro estiver indisponível', async () => {
      // Arrange
      const livroIndisponivel = {
        ...livroMock,
        disponivel: false,
      };

      mockPrismaService.cliente.findUnique.mockResolvedValue(clienteMock);
      mockPrismaService.livro.findUnique.mockResolvedValue(livroIndisponivel);

      // Act & Assert
      await expect(service.create(createReservaDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createReservaDto)).rejects.toThrow(
        'Este livro não está disponível para reserva no momento',
      );

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException quando data de devolução não for posterior à data de reserva', async () => {
      // Arrange
      const dtoComDatasInvalidas: CreateReservaDto = {
        clienteId,
        livroId,
        dataReserva: '2026-01-29T00:00:00.000Z',
        dataPrevistaDevolucao: '2026-01-22T00:00:00.000Z', // Data anterior
      };

      mockPrismaService.cliente.findUnique.mockResolvedValue(clienteMock);
      mockPrismaService.livro.findUnique.mockResolvedValue(livroMock);

      // Act & Assert
      await expect(service.create(dtoComDatasInvalidas)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(dtoComDatasInvalidas)).rejects.toThrow(
        'A data prevista de devolução deve ser posterior à data de reserva',
      );

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('deve listar todas as reservas', async () => {
      // Arrange
      const reservas = [
        {
          id: '1',
          clienteId: 'cliente1',
          livroId: 'livro1',
          dataReserva: new Date('2026-01-22T00:00:00.000Z'),
          dataPrevistaDevolucao: new Date('2026-01-29T00:00:00.000Z'),
          dataDevolucao: null,
          cliente: {
            id: 'cliente1',
            nome: 'João Silva',
            cpf: '52998224725',
          },
          livro: {
            id: 'livro1',
            titulo: '1984',
            autor: 'George Orwell',
          },
        },
      ];

      mockPrismaService.reserva.findMany.mockResolvedValue(reservas);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(reservas);
      expect(mockPrismaService.reserva.findMany).toHaveBeenCalledWith({
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
    });

    it('deve retornar lista vazia quando não houver reservas', async () => {
      // Arrange
      mockPrismaService.reserva.findMany.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findByCliente', () => {
    const clienteId = '507f1f77bcf86cd799439011';

    it('deve listar reservas por cliente', async () => {
      // Arrange
      const clienteMock = {
        id: clienteId,
        nome: 'João Silva',
        cpf: '52998224725',
      };

      const reservas = [
        {
          id: '1',
          clienteId,
          livroId: 'livro1',
          dataReserva: new Date('2026-01-22T00:00:00.000Z'),
          dataPrevistaDevolucao: new Date('2026-01-29T00:00:00.000Z'),
          dataDevolucao: null,
          cliente: clienteMock,
          livro: {
            id: 'livro1',
            titulo: '1984',
            autor: 'George Orwell',
          },
        },
      ];

      mockPrismaService.cliente.findUnique.mockResolvedValue(clienteMock);
      mockPrismaService.reserva.findMany.mockResolvedValue(reservas);

      // Act
      const result = await service.findByCliente(clienteId);

      // Assert
      expect(result).toEqual(reservas);
      expect(mockPrismaService.cliente.findUnique).toHaveBeenCalledWith({
        where: { id: clienteId },
      });
      expect(mockPrismaService.reserva.findMany).toHaveBeenCalledWith({
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
    });

    it('deve lançar NotFoundException ao listar reservas de cliente inexistente', async () => {
      // Arrange
      mockPrismaService.cliente.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByCliente(clienteId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByCliente(clienteId)).rejects.toThrow(
        `Cliente com ID ${clienteId} não encontrado`,
      );

      expect(mockPrismaService.reserva.findMany).not.toHaveBeenCalled();
    });
  });

  describe('devolver', () => {
    const reservaId = '507f1f77bcf86cd799439013';
    const livroId = '507f1f77bcf86cd799439012';

    it('deve registrar dataDevolucao', async () => {
      // Arrange
      const reservaMock = {
        id: reservaId,
        clienteId: 'cliente1',
        livroId,
        dataReserva: new Date('2026-01-22T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-29T00:00:00.000Z'),
        dataDevolucao: null,
        livro: {
          id: livroId,
          titulo: '1984',
          autor: 'George Orwell',
          disponivel: false,
        },
      };

      const reservaDevolvida = {
        ...reservaMock,
        dataDevolucao: new Date(),
      };

      mockPrismaService.reserva.findUnique.mockResolvedValue(reservaMock);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrismaService);
      });
      mockPrismaService.reserva.update.mockResolvedValue(reservaDevolvida);

      // Act
      const result = await service.devolver(reservaId);

      // Assert
      expect(result.dataDevolucao).toBeDefined();
      expect(result.dataDevolucao).toBeInstanceOf(Date);
    });

    it('deve tornar livro disponível novamente', async () => {
      // Arrange
      const reservaMock = {
        id: reservaId,
        clienteId: 'cliente1',
        livroId,
        dataReserva: new Date('2026-01-22T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-29T00:00:00.000Z'),
        dataDevolucao: null,
        livro: {
          id: livroId,
          titulo: '1984',
          autor: 'George Orwell',
          disponivel: false,
        },
      };

      mockPrismaService.reserva.findUnique.mockResolvedValue(reservaMock);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrismaService);
      });
      mockPrismaService.reserva.update.mockResolvedValue({
        ...reservaMock,
        dataDevolucao: new Date(),
      });

      // Act
      await service.devolver(reservaId);

      // Assert
      expect(mockPrismaService.livro.update).toHaveBeenCalledWith({
        where: { id: livroId },
        data: { disponivel: true },
      });
    });

    it('deve lançar ConflictException ao tentar devolver reserva já devolvida', async () => {
      // Arrange
      const reservaJaDevolvida = {
        id: reservaId,
        clienteId: 'cliente1',
        livroId,
        dataReserva: new Date('2026-01-22T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-29T00:00:00.000Z'),
        dataDevolucao: new Date('2026-01-28T00:00:00.000Z'), // Já devolvido
        livro: {
          id: livroId,
          titulo: '1984',
          autor: 'George Orwell',
          disponivel: true,
        },
      };

      mockPrismaService.reserva.findUnique.mockResolvedValue(
        reservaJaDevolvida,
      );

      // Act & Assert
      await expect(service.devolver(reservaId)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.devolver(reservaId)).rejects.toThrow(
        'Este livro já foi devolvido',
      );

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException ao tentar devolver reserva inexistente', async () => {
      // Arrange
      mockPrismaService.reserva.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.devolver(reservaId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.devolver(reservaId)).rejects.toThrow(
        `Reserva com ID ${reservaId} não encontrada`,
      );

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('findEmAtraso', () => {
    it('deve identificar reservas em atraso corretamente', async () => {
      // Arrange
      const reservasEmAtraso = [
        {
          id: '1',
          clienteId: 'cliente1',
          livroId: 'livro1',
          dataReserva: new Date('2026-01-15T00:00:00.000Z'),
          dataPrevistaDevolucao: new Date('2026-01-20T00:00:00.000Z'),
          dataDevolucao: null,
          cliente: {
            id: 'cliente1',
            nome: 'João Silva',
            cpf: '52998224725',
          },
          livro: {
            id: 'livro1',
            titulo: '1984',
            autor: 'George Orwell',
          },
        },
      ];

      mockPrismaService.reserva.findMany.mockResolvedValue(reservasEmAtraso);

      // Act
      const result = await service.findEmAtraso();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('diasDeAtraso');
      expect(result[0]).toHaveProperty('multaTotal');
      expect(result[0].diasDeAtraso).toBeGreaterThan(0);
      expect(result[0].multaTotal).toBeGreaterThan(10);
    });

    it('não deve considerar reserva devolvida como atraso', async () => {
      // Arrange
      mockPrismaService.reserva.findMany.mockResolvedValue([]);

      // Act
      const result = await service.findEmAtraso();

      // Assert
      expect(result).toEqual([]);
      expect(mockPrismaService.reserva.findMany).toHaveBeenCalled();
    });
  });

  describe('calcularMulta', () => {
    it('deve calcular corretamente multa com 1 dia de atraso', () => {
      // Arrange
      const dataPrevistaDevolucao = new Date('2026-01-22T00:00:00.000Z');
      const dataAtual = new Date('2026-01-23T00:00:01.000Z'); // Mais de 1 dia

      // Act - usando reflexão para acessar método privado
      const result = (service as any).calcularMulta(
        dataPrevistaDevolucao,
        dataAtual,
      );

      // Assert
      expect(result.diasDeAtraso).toBe(2);
      // Fórmula: 10 + (10 * 0.05 * 2) = 11.00
      expect(result.multaTotal).toBe(11.0);
    });

    it('deve calcular corretamente multa com 5 dias de atraso', () => {
      // Arrange
      const dataPrevistaDevolucao = new Date('2026-01-20T00:00:00.000Z');
      const dataAtual = new Date('2026-01-25T00:00:01.000Z');

      // Act
      const result = (service as any).calcularMulta(
        dataPrevistaDevolucao,
        dataAtual,
      );

      // Assert
      expect(result.diasDeAtraso).toBe(6);
      // Fórmula: 10 + (10 * 0.05 * 6) = 13.00
      expect(result.multaTotal).toBe(13.0);
    });

    it('deve calcular corretamente multa com 10 dias de atraso', () => {
      // Arrange
      const dataPrevistaDevolucao = new Date('2026-01-15T00:00:00.000Z');
      const dataAtual = new Date('2026-01-25T00:00:01.000Z');

      // Act
      const result = (service as any).calcularMulta(
        dataPrevistaDevolucao,
        dataAtual,
      );

      // Assert
      expect(result.diasDeAtraso).toBe(11);
      // Fórmula: 10 + (10 * 0.05 * 11) = 15.50
      expect(result.multaTotal).toBe(15.5);
    });

    it('deve arredondar dias de atraso para cima', () => {
      // Arrange
      const dataPrevistaDevolucao = new Date('2026-01-22T12:00:00.000Z');
      const dataAtual = new Date('2026-01-23T06:00:00.000Z'); // 18 horas = 0.75 dia

      // Act
      const result = (service as any).calcularMulta(
        dataPrevistaDevolucao,
        dataAtual,
      );

      // Assert
      expect(result.diasDeAtraso).toBe(1); // Arredonda para cima
      expect(result.multaTotal).toBe(10.5);
    });

    it('deve aplicar multa fixa de R$ 10,00', () => {
      // Arrange
      const dataPrevistaDevolucao = new Date('2026-01-22T00:00:00.000Z');
      const dataAtual = new Date('2026-01-23T00:00:01.000Z');

      // Act
      const result = (service as any).calcularMulta(
        dataPrevistaDevolucao,
        dataAtual,
      );

      // Assert
      // Multa deve ser maior ou igual a 10
      expect(result.multaTotal).toBeGreaterThanOrEqual(10);
    });

    it('deve aplicar acréscimo de 5% por dia', () => {
      // Arrange
      const dataPrevistaDevolucao = new Date('2026-01-22T00:00:00.000Z');
      const dataAtual = new Date('2026-01-24T00:00:01.000Z'); // 2 dias completos

      // Act
      const result = (service as any).calcularMulta(
        dataPrevistaDevolucao,
        dataAtual,
      );

      // Assert
      expect(result.diasDeAtraso).toBe(3);
      // 3 dias * 5% = 15% de acréscimo
      // 10 + (10 * 0.15) = 11.50
      expect(result.multaTotal).toBe(11.5);
    });
  });

  describe('findOne', () => {
    const reservaId = '507f1f77bcf86cd799439013';

    it('deve retornar reserva quando existir', async () => {
      // Arrange
      const reservaMock = {
        id: reservaId,
        clienteId: 'cliente1',
        livroId: 'livro1',
        dataReserva: new Date('2026-01-22T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-29T00:00:00.000Z'),
        dataDevolucao: null,
        cliente: {
          id: 'cliente1',
          nome: 'João Silva',
          cpf: '52998224725',
        },
        livro: {
          id: 'livro1',
          titulo: '1984',
          autor: 'George Orwell',
        },
      };

      mockPrismaService.reserva.findUnique.mockResolvedValue(reservaMock);

      // Act
      const result = await service.findOne(reservaId);

      // Assert
      expect(result).toEqual(reservaMock);
      expect(mockPrismaService.reserva.findUnique).toHaveBeenCalledWith({
        where: { id: reservaId },
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
    });

    it('deve lançar NotFoundException ao buscar reserva inexistente', async () => {
      // Arrange
      mockPrismaService.reserva.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(reservaId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(reservaId)).rejects.toThrow(
        `Reserva com ID ${reservaId} não encontrada`,
      );
    });
  });
});
