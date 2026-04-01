import { Test, TestingModule } from '@nestjs/testing';
import { ReservaDomainService } from './domain/services/reserva-domain.service';
import { Reserva } from './domain/entities/reserva.entity';
import { Livro } from './domain/entities/livro.entity';
import {
  ClienteNaoEncontradoError,
  LivroNaoEncontradoError,
  LivroIndisponivelError,
  DataDevolucaoInvalidaError,
  ReservaNaoEncontradaError,
  ReservaJaDevolvidaError,
} from './domain/exceptions';
import { CreateReservaDto } from './dto/create-reserva.dto';

describe('ReservaDomainService', () => {
  let service: ReservaDomainService;

  const mockReservaRepo = {
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    buscarTodas: jest.fn(),
    buscarPorCliente: jest.fn(),
    buscarEmAtraso: jest.fn(),
    atualizarDevolucao: jest.fn(),
  };

  const mockLivroRepo = {
    buscarPorId: jest.fn(),
    atualizarDisponibilidade: jest.fn(),
  };

  const mockClienteRepo = {
    buscarPorId: jest.fn(),
  };

  const mockAuditLogger = {
    logEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservaDomainService,
        { provide: 'ReservaRepositoryPort', useValue: mockReservaRepo },
        { provide: 'LivroRepositoryPort', useValue: mockLivroRepo },
        { provide: 'ClienteRepositoryPort', useValue: mockClienteRepo },
        { provide: 'AuditLoggerPort', useValue: mockAuditLogger },
      ],
    }).compile();

    service = module.get<ReservaDomainService>(ReservaDomainService);
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

    const livroMock = new Livro({
      id: livroId,
      titulo: '1984',
      autor: 'George Orwell',
      disponivel: true,
    });

    it('deve criar reserva quando cliente e livro existirem e livro estiver disponível', async () => {
      const reservaCriada = new Reserva({
        id: '507f1f77bcf86cd799439013',
        clienteId,
        clienteNome: clienteMock.nome,
        clienteCpf: clienteMock.cpf,
        livroId,
        dataReserva: new Date('2026-01-22T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-29T00:00:00.000Z'),
        dataDevolucao: null,
        cliente: clienteMock,
        livro: { id: livroId, titulo: '1984', autor: 'George Orwell', disponivel: true },
      });

      mockClienteRepo.buscarPorId.mockResolvedValue(clienteMock);
      mockLivroRepo.buscarPorId.mockResolvedValue(livroMock);
      mockReservaRepo.criar.mockResolvedValue(reservaCriada);

      const result = await service.create(createReservaDto);

      expect(result).toEqual(reservaCriada);
      expect(mockClienteRepo.buscarPorId).toHaveBeenCalledWith(clienteId);
      expect(mockLivroRepo.buscarPorId).toHaveBeenCalledWith(livroId);
    });

    it('deve atualizar o livro para disponivel = false ao criar reserva', async () => {
      const reservaCriada = new Reserva({
        id: '507f1f77bcf86cd799439013',
        clienteId,
        clienteNome: clienteMock.nome,
        clienteCpf: clienteMock.cpf,
        livroId,
        dataReserva: new Date('2026-01-22T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-29T00:00:00.000Z'),
        dataDevolucao: null,
        cliente: clienteMock,
        livro: { id: livroId, titulo: '1984', autor: 'George Orwell', disponivel: true },
      });

      mockClienteRepo.buscarPorId.mockResolvedValue(clienteMock);
      mockLivroRepo.buscarPorId.mockResolvedValue(livroMock);
      mockReservaRepo.criar.mockResolvedValue(reservaCriada);

      await service.create(createReservaDto);

      expect(mockLivroRepo.atualizarDisponibilidade).toHaveBeenCalledWith(
        livroId,
        false,
      );
    });

    it('deve lançar ClienteNaoEncontradoError quando cliente não existir', async () => {
      mockClienteRepo.buscarPorId.mockResolvedValue(null);

      await expect(service.create(createReservaDto)).rejects.toThrow(
        ClienteNaoEncontradoError,
      );
      await expect(service.create(createReservaDto)).rejects.toThrow(
        `Cliente com ID ${clienteId} não encontrado`,
      );

      expect(mockLivroRepo.buscarPorId).not.toHaveBeenCalled();
    });

    it('deve lançar LivroNaoEncontradoError quando livro não existir', async () => {
      mockClienteRepo.buscarPorId.mockResolvedValue(clienteMock);
      mockLivroRepo.buscarPorId.mockResolvedValue(null);

      await expect(service.create(createReservaDto)).rejects.toThrow(
        LivroNaoEncontradoError,
      );
      await expect(service.create(createReservaDto)).rejects.toThrow(
        `Livro com ID ${livroId} não encontrado`,
      );
    });

    it('deve lançar LivroIndisponivelError quando livro estiver indisponível', async () => {
      const livroIndisponivel = new Livro({
        id: livroId,
        titulo: '1984',
        autor: 'George Orwell',
        disponivel: false,
      });

      mockClienteRepo.buscarPorId.mockResolvedValue(clienteMock);
      mockLivroRepo.buscarPorId.mockResolvedValue(livroIndisponivel);

      await expect(service.create(createReservaDto)).rejects.toThrow(
        LivroIndisponivelError,
      );
      await expect(service.create(createReservaDto)).rejects.toThrow(
        'Este livro não está disponível para reserva no momento',
      );
    });

    it('deve lançar DataDevolucaoInvalidaError quando data de devolução não for posterior à data de reserva', async () => {
      const dtoComDatasInvalidas: CreateReservaDto = {
        clienteId,
        livroId,
        dataReserva: '2026-01-29T00:00:00.000Z',
        dataPrevistaDevolucao: '2026-01-22T00:00:00.000Z',
      };

      mockClienteRepo.buscarPorId.mockResolvedValue(clienteMock);
      mockLivroRepo.buscarPorId.mockResolvedValue(livroMock);

      await expect(service.create(dtoComDatasInvalidas)).rejects.toThrow(
        DataDevolucaoInvalidaError,
      );
      await expect(service.create(dtoComDatasInvalidas)).rejects.toThrow(
        'A data prevista de devolução deve ser posterior à data de reserva',
      );
    });
  });

  describe('findAll', () => {
    it('deve listar todas as reservas', async () => {
      const reservas = [
        new Reserva({
          id: '1',
          clienteId: 'cliente1',
          livroId: 'livro1',
          dataReserva: new Date('2026-01-22T00:00:00.000Z'),
          dataPrevistaDevolucao: new Date('2026-01-29T00:00:00.000Z'),
          dataDevolucao: null,
          cliente: { id: 'cliente1', nome: 'João Silva', cpf: '52998224725' },
          livro: { id: 'livro1', titulo: '1984', autor: 'George Orwell' },
        }),
      ];

      mockReservaRepo.buscarTodas.mockResolvedValue(reservas);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(mockReservaRepo.buscarTodas).toHaveBeenCalled();
    });

    it('deve retornar lista vazia quando não houver reservas', async () => {
      mockReservaRepo.buscarTodas.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findByCliente', () => {
    const clienteId = '507f1f77bcf86cd799439011';

    it('deve listar reservas por cliente', async () => {
      const clienteMock = {
        id: clienteId,
        nome: 'João Silva',
        cpf: '52998224725',
      };

      const reservas = [
        new Reserva({
          id: '1',
          clienteId,
          livroId: 'livro1',
          dataReserva: new Date('2026-01-22T00:00:00.000Z'),
          dataPrevistaDevolucao: new Date('2026-01-29T00:00:00.000Z'),
          dataDevolucao: null,
          cliente: clienteMock,
          livro: { id: 'livro1', titulo: '1984', autor: 'George Orwell' },
        }),
      ];

      mockClienteRepo.buscarPorId.mockResolvedValue(clienteMock);
      mockReservaRepo.buscarPorCliente.mockResolvedValue(reservas);

      const result = await service.findByCliente(clienteId);

      expect(result).toHaveLength(1);
      expect(mockClienteRepo.buscarPorId).toHaveBeenCalledWith(clienteId);
      expect(mockReservaRepo.buscarPorCliente).toHaveBeenCalledWith(clienteId);
    });

    it('deve lançar ClienteNaoEncontradoError ao listar reservas de cliente inexistente', async () => {
      mockClienteRepo.buscarPorId.mockResolvedValue(null);

      await expect(service.findByCliente(clienteId)).rejects.toThrow(
        ClienteNaoEncontradoError,
      );
      await expect(service.findByCliente(clienteId)).rejects.toThrow(
        `Cliente com ID ${clienteId} não encontrado`,
      );

      expect(mockReservaRepo.buscarPorCliente).not.toHaveBeenCalled();
    });
  });

  describe('devolver', () => {
    const reservaId = '507f1f77bcf86cd799439013';
    const livroId = '507f1f77bcf86cd799439012';

    it('deve registrar dataDevolucao', async () => {
      const reservaMock = new Reserva({
        id: reservaId,
        clienteId: 'cliente1',
        livroId,
        dataReserva: new Date('2026-01-22T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-29T00:00:00.000Z'),
        dataDevolucao: null,
        livro: { id: livroId, titulo: '1984', autor: 'George Orwell', disponivel: false },
      });

      const reservaDevolvida = new Reserva({
        ...reservaMock.toPlain(),
        dataDevolucao: new Date(),
      });

      mockReservaRepo.buscarPorId.mockResolvedValue(reservaMock);
      mockReservaRepo.atualizarDevolucao.mockResolvedValue(reservaDevolvida);

      const result = await service.devolver(reservaId);

      expect(result.dataDevolucao).toBeDefined();
      expect(result.dataDevolucao).toBeInstanceOf(Date);
    });

    it('deve tornar livro disponível novamente', async () => {
      const reservaMock = new Reserva({
        id: reservaId,
        clienteId: 'cliente1',
        livroId,
        dataReserva: new Date('2026-01-22T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-29T00:00:00.000Z'),
        dataDevolucao: null,
        livro: { id: livroId, titulo: '1984', autor: 'George Orwell', disponivel: false },
      });

      const reservaDevolvida = new Reserva({
        ...reservaMock.toPlain(),
        dataDevolucao: new Date(),
      });

      mockReservaRepo.buscarPorId.mockResolvedValue(reservaMock);
      mockReservaRepo.atualizarDevolucao.mockResolvedValue(reservaDevolvida);

      await service.devolver(reservaId);

      expect(mockLivroRepo.atualizarDisponibilidade).toHaveBeenCalledWith(
        livroId,
        true,
      );
    });

    it('deve lançar ReservaJaDevolvidaError ao tentar devolver reserva já devolvida', async () => {
      const reservaJaDevolvida = new Reserva({
        id: reservaId,
        clienteId: 'cliente1',
        livroId,
        dataReserva: new Date('2026-01-22T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-29T00:00:00.000Z'),
        dataDevolucao: new Date('2026-01-28T00:00:00.000Z'),
        livro: { id: livroId, titulo: '1984', autor: 'George Orwell', disponivel: true },
      });

      mockReservaRepo.buscarPorId.mockResolvedValue(reservaJaDevolvida);

      await expect(service.devolver(reservaId)).rejects.toThrow(
        ReservaJaDevolvidaError,
      );
      await expect(service.devolver(reservaId)).rejects.toThrow(
        'Este livro já foi devolvido',
      );
    });

    it('deve lançar ReservaNaoEncontradaError ao tentar devolver reserva inexistente', async () => {
      mockReservaRepo.buscarPorId.mockResolvedValue(null);

      await expect(service.devolver(reservaId)).rejects.toThrow(
        ReservaNaoEncontradaError,
      );
      await expect(service.devolver(reservaId)).rejects.toThrow(
        `Reserva com ID ${reservaId} não encontrada`,
      );
    });
  });

  describe('findEmAtraso', () => {
    it('deve identificar reservas em atraso corretamente', async () => {
      const reservasEmAtraso = [
        new Reserva({
          id: '1',
          clienteId: 'cliente1',
          livroId: 'livro1',
          dataReserva: new Date('2026-01-15T00:00:00.000Z'),
          dataPrevistaDevolucao: new Date('2026-01-20T00:00:00.000Z'),
          dataDevolucao: null,
          cliente: { id: 'cliente1', nome: 'João Silva', cpf: '52998224725' },
          livro: { id: 'livro1', titulo: '1984', autor: 'George Orwell' },
        }),
      ];

      mockReservaRepo.buscarEmAtraso.mockResolvedValue(reservasEmAtraso);

      const result = await service.findEmAtraso();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('diasDeAtraso');
      expect(result[0]).toHaveProperty('multaTotal');
      expect(result[0].diasDeAtraso).toBeGreaterThan(0);
      expect(result[0].multaTotal).toBeGreaterThan(10);
    });

    it('não deve considerar reserva devolvida como atraso', async () => {
      mockReservaRepo.buscarEmAtraso.mockResolvedValue([]);

      const result = await service.findEmAtraso();

      expect(result).toEqual([]);
      expect(mockReservaRepo.buscarEmAtraso).toHaveBeenCalled();
    });
  });

  describe('Reserva.calcularMulta (entity)', () => {
    it('deve calcular corretamente multa com 1 dia de atraso', () => {
      const reserva = new Reserva({
        id: '1',
        clienteId: 'c1',
        livroId: 'l1',
        dataReserva: new Date('2026-01-15T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-22T00:00:00.000Z'),
      });
      const dataAtual = new Date('2026-01-23T00:00:01.000Z');

      const result = reserva.calcularMulta(dataAtual);

      expect(result.diasDeAtraso).toBe(2);
      expect(result.multaTotal).toBe(11.0);
    });

    it('deve calcular corretamente multa com 5 dias de atraso', () => {
      const reserva = new Reserva({
        id: '1',
        clienteId: 'c1',
        livroId: 'l1',
        dataReserva: new Date('2026-01-10T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-20T00:00:00.000Z'),
      });
      const dataAtual = new Date('2026-01-25T00:00:01.000Z');

      const result = reserva.calcularMulta(dataAtual);

      expect(result.diasDeAtraso).toBe(6);
      expect(result.multaTotal).toBe(13.0);
    });

    it('deve calcular corretamente multa com 10 dias de atraso', () => {
      const reserva = new Reserva({
        id: '1',
        clienteId: 'c1',
        livroId: 'l1',
        dataReserva: new Date('2026-01-05T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-15T00:00:00.000Z'),
      });
      const dataAtual = new Date('2026-01-25T00:00:01.000Z');

      const result = reserva.calcularMulta(dataAtual);

      expect(result.diasDeAtraso).toBe(11);
      expect(result.multaTotal).toBe(15.5);
    });

    it('deve arredondar dias de atraso para cima', () => {
      const reserva = new Reserva({
        id: '1',
        clienteId: 'c1',
        livroId: 'l1',
        dataReserva: new Date('2026-01-15T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-22T12:00:00.000Z'),
      });
      const dataAtual = new Date('2026-01-23T06:00:00.000Z');

      const result = reserva.calcularMulta(dataAtual);

      expect(result.diasDeAtraso).toBe(1);
      expect(result.multaTotal).toBe(10.5);
    });

    it('deve aplicar multa fixa de R$ 10,00', () => {
      const reserva = new Reserva({
        id: '1',
        clienteId: 'c1',
        livroId: 'l1',
        dataReserva: new Date('2026-01-15T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-22T00:00:00.000Z'),
      });
      const dataAtual = new Date('2026-01-23T00:00:01.000Z');

      const result = reserva.calcularMulta(dataAtual);

      expect(result.multaTotal).toBeGreaterThanOrEqual(10);
    });

    it('deve aplicar acréscimo de 5% por dia', () => {
      const reserva = new Reserva({
        id: '1',
        clienteId: 'c1',
        livroId: 'l1',
        dataReserva: new Date('2026-01-15T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-22T00:00:00.000Z'),
      });
      const dataAtual = new Date('2026-01-24T00:00:01.000Z');

      const result = reserva.calcularMulta(dataAtual);

      expect(result.diasDeAtraso).toBe(3);
      expect(result.multaTotal).toBe(11.5);
    });
  });

  describe('findOne', () => {
    const reservaId = '507f1f77bcf86cd799439013';

    it('deve retornar reserva quando existir', async () => {
      const reservaMock = new Reserva({
        id: reservaId,
        clienteId: 'cliente1',
        livroId: 'livro1',
        dataReserva: new Date('2026-01-22T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-29T00:00:00.000Z'),
        dataDevolucao: null,
        cliente: { id: 'cliente1', nome: 'João Silva', cpf: '52998224725' },
        livro: { id: 'livro1', titulo: '1984', autor: 'George Orwell' },
      });

      mockReservaRepo.buscarPorId.mockResolvedValue(reservaMock);

      const result = await service.findOne(reservaId);

      expect(result).toEqual(reservaMock);
      expect(mockReservaRepo.buscarPorId).toHaveBeenCalledWith(reservaId);
    });

    it('deve lançar ReservaNaoEncontradaError ao buscar reserva inexistente', async () => {
      mockReservaRepo.buscarPorId.mockResolvedValue(null);

      await expect(service.findOne(reservaId)).rejects.toThrow(
        ReservaNaoEncontradaError,
      );
      await expect(service.findOne(reservaId)).rejects.toThrow(
        `Reserva com ID ${reservaId} não encontrada`,
      );
    });
  });
});
