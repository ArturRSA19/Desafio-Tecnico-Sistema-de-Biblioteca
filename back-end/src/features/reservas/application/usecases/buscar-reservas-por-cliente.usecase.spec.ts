import { Test, TestingModule } from '@nestjs/testing';
import { BuscarReservasPorClienteUseCase } from './buscar-reservas-por-cliente.usecase';
import { Reserva } from '../../domain/entities/reserva.entity';
import { ClienteNaoEncontradoError } from '../../domain/exceptions';

describe('BuscarReservasPorClienteUseCase', () => {
  let useCase: BuscarReservasPorClienteUseCase;

  const mockReservaRepo = {
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    buscarTodas: jest.fn(),
    buscarPorCliente: jest.fn(),
    buscarEmAtraso: jest.fn(),
    atualizarDevolucao: jest.fn(),
  };

  const mockClienteRepo = {
    buscarPorId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuscarReservasPorClienteUseCase,
        { provide: 'ReservaRepositoryOutPort', useValue: mockReservaRepo },
        { provide: 'ClienteRepositoryOutPort', useValue: mockClienteRepo },
      ],
    }).compile();

    useCase = module.get<BuscarReservasPorClienteUseCase>(BuscarReservasPorClienteUseCase);
    jest.clearAllMocks();
  });

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

    const result = await useCase.execute(clienteId);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining({ id: '1', clienteId }));
    expect(mockClienteRepo.buscarPorId).toHaveBeenCalledWith(clienteId);
    expect(mockReservaRepo.buscarPorCliente).toHaveBeenCalledWith(clienteId);
  });

  it('deve lançar ClienteNaoEncontradoError ao listar reservas de cliente inexistente', async () => {
    mockClienteRepo.buscarPorId.mockResolvedValue(null);

    await expect(useCase.execute(clienteId)).rejects.toThrow(
      ClienteNaoEncontradoError,
    );
    await expect(useCase.execute(clienteId)).rejects.toThrow(
      `Cliente com ID ${clienteId} não encontrado`,
    );

    expect(mockReservaRepo.buscarPorCliente).not.toHaveBeenCalled();
  });
});
