import { Test, TestingModule } from '@nestjs/testing';
import { DevolverReservaUseCase } from './devolver-reserva.usecase';
import { Reserva } from '../../domain/entities/reserva.entity';
import {
  ReservaNaoEncontradaError,
  ReservaJaDevolvidaError,
} from '../../domain/exceptions';

describe('DevolverReservaUseCase', () => {
  let useCase: DevolverReservaUseCase;

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

  const mockAuditLogger = {
    logEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevolverReservaUseCase,
        { provide: 'ReservaRepositoryOutPort', useValue: mockReservaRepo },
        { provide: 'LivroRepositoryOutPort', useValue: mockLivroRepo },
        { provide: 'AuditLoggerOutPort', useValue: mockAuditLogger },
      ],
    }).compile();

    useCase = module.get<DevolverReservaUseCase>(DevolverReservaUseCase);
    jest.clearAllMocks();
  });

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

    const result = await useCase.execute(reservaId);

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

    await useCase.execute(reservaId);

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

    await expect(useCase.execute(reservaId)).rejects.toThrow(
      ReservaJaDevolvidaError,
    );
    await expect(useCase.execute(reservaId)).rejects.toThrow(
      'Este livro já foi devolvido',
    );
  });

  it('deve lançar ReservaNaoEncontradaError ao tentar devolver reserva inexistente', async () => {
    mockReservaRepo.buscarPorId.mockResolvedValue(null);

    await expect(useCase.execute(reservaId)).rejects.toThrow(
      ReservaNaoEncontradaError,
    );
    await expect(useCase.execute(reservaId)).rejects.toThrow(
      `Reserva com ID ${reservaId} não encontrada`,
    );
  });
});
