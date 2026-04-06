import { Test, TestingModule } from '@nestjs/testing';
import { CriarReservaUseCase } from './criar-reserva.usecase';
import { Reserva } from '../../domain/entities/reserva.entity';
import { Livro } from '../../domain/entities/livro.entity';
import {
  ClienteNaoEncontradoError,
  LivroNaoEncontradoError,
  LivroIndisponivelError,
  DataDevolucaoInvalidaError,
} from '../../domain/exceptions';

describe('CriarReservaUseCase', () => {
  let useCase: CriarReservaUseCase;

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
        CriarReservaUseCase,
        { provide: 'ReservaRepositoryOutPort', useValue: mockReservaRepo },
        { provide: 'LivroRepositoryOutPort', useValue: mockLivroRepo },
        { provide: 'ClienteRepositoryOutPort', useValue: mockClienteRepo },
        { provide: 'AuditLoggerOutPort', useValue: mockAuditLogger },
      ],
    }).compile();

    useCase = module.get<CriarReservaUseCase>(CriarReservaUseCase);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  const clienteId = '507f1f77bcf86cd799439011';
  const livroId = '507f1f77bcf86cd799439012';

  const input = {
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

    const result = await useCase.execute(input);

    expect(result).toEqual(expect.objectContaining({
      id: '507f1f77bcf86cd799439013',
      clienteId,
      livroId,
    }));
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

    await useCase.execute(input);

    expect(mockLivroRepo.atualizarDisponibilidade).toHaveBeenCalledWith(
      livroId,
      false,
    );
  });

  it('deve lançar ClienteNaoEncontradoError quando cliente não existir', async () => {
    mockClienteRepo.buscarPorId.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(
      ClienteNaoEncontradoError,
    );
    await expect(useCase.execute(input)).rejects.toThrow(
      `Cliente com ID ${clienteId} não encontrado`,
    );

    expect(mockLivroRepo.buscarPorId).not.toHaveBeenCalled();
  });

  it('deve lançar LivroNaoEncontradoError quando livro não existir', async () => {
    mockClienteRepo.buscarPorId.mockResolvedValue(clienteMock);
    mockLivroRepo.buscarPorId.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(
      LivroNaoEncontradoError,
    );
    await expect(useCase.execute(input)).rejects.toThrow(
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

    await expect(useCase.execute(input)).rejects.toThrow(
      LivroIndisponivelError,
    );
    await expect(useCase.execute(input)).rejects.toThrow(
      'Este livro não está disponível para reserva no momento',
    );
  });

  it('deve lançar DataDevolucaoInvalidaError quando data de devolução não for posterior à data de reserva', async () => {
    const inputInvalido = {
      clienteId,
      livroId,
      dataReserva: '2026-01-29T00:00:00.000Z',
      dataPrevistaDevolucao: '2026-01-22T00:00:00.000Z',
    };

    mockClienteRepo.buscarPorId.mockResolvedValue(clienteMock);
    mockLivroRepo.buscarPorId.mockResolvedValue(livroMock);

    await expect(useCase.execute(inputInvalido)).rejects.toThrow(
      DataDevolucaoInvalidaError,
    );
    await expect(useCase.execute(inputInvalido)).rejects.toThrow(
      'A data prevista de devolução deve ser posterior à data de reserva',
    );
  });
});
