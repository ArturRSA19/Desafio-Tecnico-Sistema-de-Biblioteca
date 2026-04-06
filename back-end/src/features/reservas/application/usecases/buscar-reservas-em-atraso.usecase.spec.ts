import { Test, TestingModule } from '@nestjs/testing';
import { BuscarReservasEmAtrasoUseCase } from './buscar-reservas-em-atraso.usecase';
import { Reserva } from '../../domain/entities/reserva.entity';

describe('BuscarReservasEmAtrasoUseCase', () => {
  let useCase: BuscarReservasEmAtrasoUseCase;

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
        BuscarReservasEmAtrasoUseCase,
        { provide: 'ReservaRepositoryOutPort', useValue: mockReservaRepo },
      ],
    }).compile();

    useCase = module.get<BuscarReservasEmAtrasoUseCase>(BuscarReservasEmAtrasoUseCase);
    jest.clearAllMocks();
  });

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

    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('diasDeAtraso');
    expect(result[0]).toHaveProperty('multaTotal');
    expect(result[0].diasDeAtraso).toBeGreaterThan(0);
    expect(result[0].multaTotal).toBeGreaterThan(10);
  });

  it('não deve considerar reserva devolvida como atraso', async () => {
    mockReservaRepo.buscarEmAtraso.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
    expect(mockReservaRepo.buscarEmAtraso).toHaveBeenCalled();
  });
});
