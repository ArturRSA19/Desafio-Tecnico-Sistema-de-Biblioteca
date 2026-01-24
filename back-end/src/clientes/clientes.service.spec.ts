import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

describe('ClientesService', () => {
  let service: ClientesService;
  let prismaService: PrismaService;

  // Mock do PrismaService
  const mockPrismaService = {
    cliente: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    reserva: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ClientesService>(ClientesService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Limpa todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createClienteDto: CreateClienteDto = {
      nome: 'João da Silva',
      cpf: '529.982.247-25',
    };

    const clienteCriado = {
      id: '507f1f77bcf86cd799439011',
      nome: 'João da Silva',
      cpf: '52998224725',
    };

    it('deve criar um cliente quando CPF for válido e não existir duplicidade', async () => {
      // Arrange
      mockPrismaService.cliente.findUnique.mockResolvedValue(null);
      mockPrismaService.cliente.create.mockResolvedValue(clienteCriado);

      // Act
      const result = await service.create(createClienteDto);

      // Assert
      expect(result).toEqual(clienteCriado);
      expect(mockPrismaService.cliente.findUnique).toHaveBeenCalledWith({
        where: { cpf: '52998224725' },
      });
      expect(mockPrismaService.cliente.create).toHaveBeenCalledWith({
        data: {
          nome: 'João da Silva',
          cpf: '52998224725',
        },
      });
    });

    it('deve normalizar o CPF antes de salvar', async () => {
      // Arrange
      const dtoComCPFFormatado: CreateClienteDto = {
        nome: 'João da Silva',
        cpf: '529.982.247-25',
      };

      mockPrismaService.cliente.findUnique.mockResolvedValue(null);
      mockPrismaService.cliente.create.mockResolvedValue(clienteCriado);

      // Act
      await service.create(dtoComCPFFormatado);

      // Assert
      expect(mockPrismaService.cliente.create).toHaveBeenCalledWith({
        data: {
          nome: 'João da Silva',
          cpf: '52998224725', // CPF normalizado (sem pontos e traço)
        },
      });
    });

    it('deve lançar BadRequestException ao tentar criar cliente com CPF inválido', async () => {
      // Arrange
      const dtoComCPFInvalido: CreateClienteDto = {
        nome: 'João da Silva',
        cpf: '123.456.789-00', // CPF inválido
      };

      // Act & Assert
      await expect(service.create(dtoComCPFInvalido)).rejects.toThrow(BadRequestException);
      await expect(service.create(dtoComCPFInvalido)).rejects.toThrow('CPF inválido');

      // Verifica que não tentou acessar o banco
      expect(mockPrismaService.cliente.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaService.cliente.create).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException ao tentar criar cliente com CPF já existente', async () => {
      // Arrange
      const clienteExistente = {
        id: '507f1f77bcf86cd799439011',
        nome: 'Outro Cliente',
        cpf: '52998224725',
      };

      mockPrismaService.cliente.findUnique.mockResolvedValue(clienteExistente);

      // Act & Assert
      await expect(service.create(createClienteDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createClienteDto)).rejects.toThrow(
        'Já existe um cliente cadastrado com este CPF',
      );

      expect(mockPrismaService.cliente.findUnique).toHaveBeenCalledWith({
        where: { cpf: '52998224725' },
      });
      expect(mockPrismaService.cliente.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de clientes ordenada por nome', async () => {
      // Arrange
      const clientes = [
        { id: '1', nome: 'Ana Silva', cpf: '52998224725' },
        { id: '2', nome: 'Bruno Santos', cpf: '86156445002' },
      ];

      mockPrismaService.cliente.findMany.mockResolvedValue(clientes);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(clientes);
      expect(mockPrismaService.cliente.findMany).toHaveBeenCalledWith({
        orderBy: {
          nome: 'asc',
        },
      });
    });

    it('deve retornar lista vazia quando não houver clientes', async () => {
      // Arrange
      mockPrismaService.cliente.findMany.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(mockPrismaService.cliente.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const clienteId = '507f1f77bcf86cd799439011';

    it('deve retornar cliente quando existir', async () => {
      // Arrange
      const cliente = {
        id: clienteId,
        nome: 'João da Silva',
        cpf: '52998224725',
      };

      mockPrismaService.cliente.findUnique.mockResolvedValue(cliente);

      // Act
      const result = await service.findOne(clienteId);

      // Assert
      expect(result).toEqual(cliente);
      expect(mockPrismaService.cliente.findUnique).toHaveBeenCalledWith({
        where: { id: clienteId },
      });
    });

    it('deve lançar NotFoundException ao buscar cliente inexistente', async () => {
      // Arrange
      mockPrismaService.cliente.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(clienteId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(clienteId)).rejects.toThrow('Cliente não encontrado');

      expect(mockPrismaService.cliente.findUnique).toHaveBeenCalledWith({
        where: { id: clienteId },
      });
    });
  });

  describe('update', () => {
    const clienteId = '507f1f77bcf86cd799439011';

    it('deve atualizar apenas o nome quando CPF não for fornecido', async () => {
      // Arrange
      const clienteExistente = {
        id: clienteId,
        nome: 'João da Silva',
        cpf: '52998224725',
      };

      const updateDto: UpdateClienteDto = {
        nome: 'João Silva Santos',
      };

      const clienteAtualizado = {
        ...clienteExistente,
        nome: 'João Silva Santos',
      };

      mockPrismaService.cliente.findUnique.mockResolvedValue(clienteExistente);
      mockPrismaService.cliente.update.mockResolvedValue(clienteAtualizado);

      // Act
      const result = await service.update(clienteId, updateDto);

      // Assert
      expect(result).toEqual(clienteAtualizado);
      expect(mockPrismaService.cliente.update).toHaveBeenCalledWith({
        where: { id: clienteId },
        data: {
          nome: 'João Silva Santos',
        },
      });
    });

    it('deve atualizar nome e CPF quando ambos forem fornecidos e CPF for válido', async () => {
      // Arrange
      const clienteExistente = {
        id: clienteId,
        nome: 'João da Silva',
        cpf: '52998224725',
      };

      const updateDto: UpdateClienteDto = {
        nome: 'João Silva Santos',
        cpf: '693.319.870-72',
      };

      const clienteAtualizado = {
        id: clienteId,
        nome: 'João Silva Santos',
        cpf: '69331987072',
      };

      // Mock para findOne (verifica se cliente existe)
      mockPrismaService.cliente.findUnique
        .mockResolvedValueOnce(clienteExistente)
        // Mock para verificar duplicidade de CPF
        .mockResolvedValueOnce(null);

      mockPrismaService.cliente.update.mockResolvedValue(clienteAtualizado);

      // Act
      const result = await service.update(clienteId, updateDto);

      // Assert
      expect(result).toEqual(clienteAtualizado);
      expect(mockPrismaService.cliente.update).toHaveBeenCalledWith({
        where: { id: clienteId },
        data: {
          nome: 'João Silva Santos',
          cpf: '69331987072',
        },
      });
    });

    it('deve lançar NotFoundException ao tentar atualizar cliente inexistente', async () => {
      // Arrange
      const updateDto: UpdateClienteDto = {
        nome: 'João Silva Santos',
      };

      mockPrismaService.cliente.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(clienteId, updateDto)).rejects.toThrow(NotFoundException);
      await expect(service.update(clienteId, updateDto)).rejects.toThrow('Cliente não encontrado');

      expect(mockPrismaService.cliente.update).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException ao atualizar com CPF inválido', async () => {
      // Arrange
      const clienteExistente = {
        id: clienteId,
        nome: 'João da Silva',
        cpf: '52998224725',
      };

      const updateDto: UpdateClienteDto = {
        nome: 'João Silva Santos',
        cpf: '123.456.789-00', // CPF inválido
      };

      mockPrismaService.cliente.findUnique.mockResolvedValue(clienteExistente);

      // Act & Assert
      await expect(service.update(clienteId, updateDto)).rejects.toThrow(BadRequestException);
      await expect(service.update(clienteId, updateDto)).rejects.toThrow('CPF inválido');

      expect(mockPrismaService.cliente.update).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException ao tentar atualizar para CPF já existente em outro cliente', async () => {
      // Arrange
      const clienteExistente = {
        id: clienteId,
        nome: 'João da Silva',
        cpf: '52998224725',
      };

      const outroCliente = {
        id: '507f1f77bcf86cd799439099', // ID diferente
        nome: 'Maria Santos',
        cpf: '69331987072',
      };

      const updateDto: UpdateClienteDto = {
        nome: 'João Silva Santos',
        cpf: '693.319.870-72', // CPF já existe em outro cliente
      };

      // Mock para findOne (verifica se cliente existe) - primeira chamada
      mockPrismaService.cliente.findUnique.mockResolvedValueOnce(clienteExistente);
      
      // Mock para verificar duplicidade de CPF (encontra outro cliente) - segunda chamada
      mockPrismaService.cliente.findUnique.mockResolvedValueOnce(outroCliente);

      // Act & Assert
      await expect(service.update(clienteId, updateDto)).rejects.toThrow(
        'Já existe outro cliente cadastrado com este CPF',
      );

      expect(mockPrismaService.cliente.update).not.toHaveBeenCalled();
    });

    it('deve permitir atualizar para o mesmo CPF do próprio cliente', async () => {
      // Arrange
      const clienteExistente = {
        id: clienteId,
        nome: 'João da Silva',
        cpf: '52998224725',
      };

      const updateDto: UpdateClienteDto = {
        nome: 'João Silva Santos',
        cpf: '529.982.247-25', // Mesmo CPF, apenas formatado diferente
      };

      const clienteAtualizado = {
        id: clienteId,
        nome: 'João Silva Santos',
        cpf: '52998224725',
      };

      // Mock para findOne (verifica se cliente existe)
      mockPrismaService.cliente.findUnique
        .mockResolvedValueOnce(clienteExistente)
        // Mock para verificar duplicidade de CPF (encontra o próprio cliente)
        .mockResolvedValueOnce(clienteExistente);

      mockPrismaService.cliente.update.mockResolvedValue(clienteAtualizado);

      // Act
      const result = await service.update(clienteId, updateDto);

      // Assert
      expect(result).toEqual(clienteAtualizado);
      expect(mockPrismaService.cliente.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const clienteId = '507f1f77bcf86cd799439011';

    it('deve remover cliente existente', async () => {
      // Arrange
      const cliente = {
        id: clienteId,
        nome: 'João da Silva',
        cpf: '52998224725',
      };

      mockPrismaService.cliente.findUnique.mockResolvedValue(cliente);
      mockPrismaService.reserva.count.mockResolvedValue(0);
      mockPrismaService.cliente.delete.mockResolvedValue(cliente);

      // Act
      const result = await service.remove(clienteId);

      // Assert
      expect(result).toEqual({ message: 'Cliente removido com sucesso' });
      expect(mockPrismaService.cliente.findUnique).toHaveBeenCalledWith({
        where: { id: clienteId },
      });
      expect(mockPrismaService.reserva.count).toHaveBeenCalledWith({
        where: { clienteId: clienteId },
      });
      expect(mockPrismaService.cliente.delete).toHaveBeenCalledWith({
        where: { id: clienteId },
      });
    });

    it('deve lançar NotFoundException ao tentar remover cliente inexistente', async () => {
      // Arrange
      mockPrismaService.cliente.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(clienteId)).rejects.toThrow(NotFoundException);
      await expect(service.remove(clienteId)).rejects.toThrow('Cliente não encontrado');

      expect(mockPrismaService.cliente.delete).not.toHaveBeenCalled();
    });
  });
});
