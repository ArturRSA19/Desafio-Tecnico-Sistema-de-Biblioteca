import { Test, TestingModule } from '@nestjs/testing';
import { BuscarReservaUseCase } from './buscar-reserva.usecase';
import { Reserva } from '../../domain/entities/reserva.entity';
import { ReservaNaoEncontradaError } from '../../domain/exceptions';

describe('BuscarReservaUseCase', () => {
  let useCase: BuscarReservaUseCase;

  const mockReservaRepo = {
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    buscarTodas: jest.fn(),
    buscarPorCliente: jest.fn(),
    buscarEmAtraso: jest.fn(),
    atualizarDevolucao: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuscarReservaUseCase,
        { provide: 'ReservaRepositoryOutPort', useValue: mockReservaRepo },
      ],
    }).compile();

    useCase = module.get<BuscarReservaUseCase>(BuscarReservaUseCase);
    jest.clearAllMocks();
  });

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

    const result = await useCase.execute(reservaId);

    expect(result).toEqual(expect.objectContaining({ id: reservaId, clienteId: 'cliente1' }));
    expect(mockReservaRepo.buscarPorId).toHaveBeenCalledWith(reservaId);
  });

  it('deve lançar ReservaNaoEncontradaError ao buscar reserva inexistente', async () => {
    mockReservaRepo.buscarPorId.mockResolvedValue(null);

    await expect(useCase.execute(reservaId)).rejects.toThrow(
      ReservaNaoEncontradaError,
    );
    await expect(useCase.execute(reservaId)).rejects.toThrow(
      `Reserva com ID ${reservaId} não encontrada`,
    );
  });
});
