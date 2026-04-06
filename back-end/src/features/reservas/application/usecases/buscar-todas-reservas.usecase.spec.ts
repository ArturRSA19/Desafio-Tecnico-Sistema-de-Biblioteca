import { Test, TestingModule } from '@nestjs/testing';
import { BuscarTodasReservasUseCase } from './buscar-todas-reservas.usecase';
import { Reserva } from '../../domain/entities/reserva.entity';

describe('BuscarTodasReservasUseCase', () => {
  let useCase: BuscarTodasReservasUseCase;

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
        BuscarTodasReservasUseCase,
        { provide: 'ReservaRepositoryOutPort', useValue: mockReservaRepo },
      ],
    }).compile();

    useCase = module.get<BuscarTodasReservasUseCase>(BuscarTodasReservasUseCase);
    jest.clearAllMocks();
  });

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

    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining({ id: '1', clienteId: 'cliente1' }));
    expect(mockReservaRepo.buscarTodas).toHaveBeenCalled();
  });

  it('deve retornar lista vazia quando não houver reservas', async () => {
    mockReservaRepo.buscarTodas.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });
});
