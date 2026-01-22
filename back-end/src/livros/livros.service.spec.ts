import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { LivrosService } from './livros.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLivroDto } from './dto/create-livro.dto';
import { UpdateLivroDto } from './dto/update-livro.dto';

describe('LivrosService', () => {
  let service: LivrosService;
  let prismaService: PrismaService;

  // Mock do PrismaService
  const mockPrismaService = {
    livro: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LivrosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LivrosService>(LivrosService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Limpa todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createLivroDto: CreateLivroDto = {
      titulo: '1984',
      autor: 'George Orwell',
    };

    it('deve criar um livro com disponivel = true por padrão', async () => {
      // Arrange
      const livroCriado = {
        id: '507f1f77bcf86cd799439011',
        titulo: '1984',
        autor: 'George Orwell',
        disponivel: true,
      };

      mockPrismaService.livro.create.mockResolvedValue(livroCriado);

      // Act
      const result = await service.create(createLivroDto);

      // Assert
      expect(result).toEqual(livroCriado);
      expect(result.disponivel).toBe(true);
      expect(mockPrismaService.livro.create).toHaveBeenCalledWith({
        data: {
          titulo: '1984',
          autor: 'George Orwell',
          disponivel: true,
        },
      });
    });

    it('deve criar livro com os dados fornecidos', async () => {
      // Arrange
      const livroCriado = {
        id: '507f1f77bcf86cd799439011',
        titulo: '1984',
        autor: 'George Orwell',
        disponivel: true,
      };

      mockPrismaService.livro.create.mockResolvedValue(livroCriado);

      // Act
      const result = await service.create(createLivroDto);

      // Assert
      expect(result.titulo).toBe('1984');
      expect(result.autor).toBe('George Orwell');
      expect(mockPrismaService.livro.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os livros quando não houver filtro', async () => {
      // Arrange
      const livros = [
        {
          id: '1',
          titulo: '1984',
          autor: 'George Orwell',
          disponivel: true,
        },
        {
          id: '2',
          titulo: 'Admirável Mundo Novo',
          autor: 'Aldous Huxley',
          disponivel: false,
        },
      ];

      mockPrismaService.livro.findMany.mockResolvedValue(livros);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(livros);
      expect(result).toHaveLength(2);
      expect(mockPrismaService.livro.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: {
          titulo: 'asc',
        },
      });
    });

    it('deve retornar apenas livros disponíveis quando filtrar por disponivel = true', async () => {
      // Arrange
      const livrosDisponiveis = [
        {
          id: '1',
          titulo: '1984',
          autor: 'George Orwell',
          disponivel: true,
        },
      ];

      mockPrismaService.livro.findMany.mockResolvedValue(livrosDisponiveis);

      // Act
      const result = await service.findAll(true);

      // Assert
      expect(result).toEqual(livrosDisponiveis);
      expect(result.every((livro) => livro.disponivel === true)).toBe(true);
      expect(mockPrismaService.livro.findMany).toHaveBeenCalledWith({
        where: { disponivel: true },
        orderBy: {
          titulo: 'asc',
        },
      });
    });

    it('deve retornar apenas livros indisponíveis quando filtrar por disponivel = false', async () => {
      // Arrange
      const livrosIndisponiveis = [
        {
          id: '2',
          titulo: 'Admirável Mundo Novo',
          autor: 'Aldous Huxley',
          disponivel: false,
        },
      ];

      mockPrismaService.livro.findMany.mockResolvedValue(livrosIndisponiveis);

      // Act
      const result = await service.findAll(false);

      // Assert
      expect(result).toEqual(livrosIndisponiveis);
      expect(result.every((livro) => livro.disponivel === false)).toBe(true);
      expect(mockPrismaService.livro.findMany).toHaveBeenCalledWith({
        where: { disponivel: false },
        orderBy: {
          titulo: 'asc',
        },
      });
    });

    it('deve retornar lista vazia quando não houver livros', async () => {
      // Arrange
      mockPrismaService.livro.findMany.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('deve ordenar livros por título em ordem crescente', async () => {
      // Arrange
      const livros = [
        {
          id: '1',
          titulo: 'A',
          autor: 'Autor A',
          disponivel: true,
        },
        {
          id: '2',
          titulo: 'B',
          autor: 'Autor B',
          disponivel: true,
        },
      ];

      mockPrismaService.livro.findMany.mockResolvedValue(livros);

      // Act
      await service.findAll();

      // Assert
      expect(mockPrismaService.livro.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: {
          titulo: 'asc',
        },
      });
    });
  });

  describe('findOne', () => {
    const livroId = '507f1f77bcf86cd799439011';

    it('deve retornar livro quando existir', async () => {
      // Arrange
      const livro = {
        id: livroId,
        titulo: '1984',
        autor: 'George Orwell',
        disponivel: true,
      };

      mockPrismaService.livro.findUnique.mockResolvedValue(livro);

      // Act
      const result = await service.findOne(livroId);

      // Assert
      expect(result).toEqual(livro);
      expect(mockPrismaService.livro.findUnique).toHaveBeenCalledWith({
        where: { id: livroId },
      });
    });

    it('deve lançar NotFoundException ao buscar livro inexistente', async () => {
      // Arrange
      mockPrismaService.livro.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(livroId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(livroId)).rejects.toThrow(
        `Livro com ID ${livroId} não encontrado`,
      );

      expect(mockPrismaService.livro.findUnique).toHaveBeenCalledWith({
        where: { id: livroId },
      });
    });
  });

  describe('update', () => {
    const livroId = '507f1f77bcf86cd799439011';

    it('deve atualizar título do livro', async () => {
      // Arrange
      const livroExistente = {
        id: livroId,
        titulo: '1984',
        autor: 'George Orwell',
        disponivel: true,
      };

      const updateDto: UpdateLivroDto = {
        titulo: '1984 - Edição Especial',
      };

      const livroAtualizado = {
        ...livroExistente,
        titulo: '1984 - Edição Especial',
      };

      mockPrismaService.livro.findUnique.mockResolvedValue(livroExistente);
      mockPrismaService.livro.update.mockResolvedValue(livroAtualizado);

      // Act
      const result = await service.update(livroId, updateDto);

      // Assert
      expect(result).toEqual(livroAtualizado);
      expect(mockPrismaService.livro.update).toHaveBeenCalledWith({
        where: { id: livroId },
        data: {
          titulo: '1984 - Edição Especial',
        },
      });
    });

    it('deve atualizar autor do livro', async () => {
      // Arrange
      const livroExistente = {
        id: livroId,
        titulo: '1984',
        autor: 'George Orwell',
        disponivel: true,
      };

      const updateDto: UpdateLivroDto = {
        autor: 'Eric Arthur Blair',
      };

      const livroAtualizado = {
        ...livroExistente,
        autor: 'Eric Arthur Blair',
      };

      mockPrismaService.livro.findUnique.mockResolvedValue(livroExistente);
      mockPrismaService.livro.update.mockResolvedValue(livroAtualizado);

      // Act
      const result = await service.update(livroId, updateDto);

      // Assert
      expect(result).toEqual(livroAtualizado);
      expect(mockPrismaService.livro.update).toHaveBeenCalledWith({
        where: { id: livroId },
        data: {
          autor: 'Eric Arthur Blair',
        },
      });
    });

    it('deve atualizar título e autor simultaneamente', async () => {
      // Arrange
      const livroExistente = {
        id: livroId,
        titulo: '1984',
        autor: 'George Orwell',
        disponivel: true,
      };

      const updateDto: UpdateLivroDto = {
        titulo: '1984 - Edição Especial',
        autor: 'Eric Arthur Blair',
      };

      const livroAtualizado = {
        id: livroId,
        titulo: '1984 - Edição Especial',
        autor: 'Eric Arthur Blair',
        disponivel: true,
      };

      mockPrismaService.livro.findUnique.mockResolvedValue(livroExistente);
      mockPrismaService.livro.update.mockResolvedValue(livroAtualizado);

      // Act
      const result = await service.update(livroId, updateDto);

      // Assert
      expect(result).toEqual(livroAtualizado);
      expect(mockPrismaService.livro.update).toHaveBeenCalledWith({
        where: { id: livroId },
        data: {
          titulo: '1984 - Edição Especial',
          autor: 'Eric Arthur Blair',
        },
      });
    });

    it('deve não incluir campo disponivel no update', async () => {
      // Arrange
      const livroExistente = {
        id: livroId,
        titulo: '1984',
        autor: 'George Orwell',
        disponivel: true,
      };

      const updateDto: UpdateLivroDto = {
        titulo: '1984 - Edição Especial',
      };

      const livroAtualizado = {
        ...livroExistente,
        titulo: '1984 - Edição Especial',
      };

      mockPrismaService.livro.findUnique.mockResolvedValue(livroExistente);
      mockPrismaService.livro.update.mockResolvedValue(livroAtualizado);

      // Act
      await service.update(livroId, updateDto);

      // Assert
      const updateCall = mockPrismaService.livro.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('disponivel');
    });

    it('deve lançar NotFoundException ao tentar atualizar livro inexistente', async () => {
      // Arrange
      const updateDto: UpdateLivroDto = {
        titulo: '1984 - Edição Especial',
      };

      mockPrismaService.livro.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(livroId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(livroId, updateDto)).rejects.toThrow(
        `Livro com ID ${livroId} não encontrado`,
      );

      expect(mockPrismaService.livro.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const livroId = '507f1f77bcf86cd799439011';

    it('deve remover livro quando estiver disponível', async () => {
      // Arrange
      const livroDisponivel = {
        id: livroId,
        titulo: '1984',
        autor: 'George Orwell',
        disponivel: true,
      };

      mockPrismaService.livro.findUnique.mockResolvedValue(livroDisponivel);
      mockPrismaService.livro.delete.mockResolvedValue(livroDisponivel);

      // Act
      const result = await service.remove(livroId);

      // Assert
      expect(result).toEqual({ message: 'Livro removido com sucesso' });
      expect(mockPrismaService.livro.findUnique).toHaveBeenCalledWith({
        where: { id: livroId },
      });
      expect(mockPrismaService.livro.delete).toHaveBeenCalledWith({
        where: { id: livroId },
      });
    });

    it('deve lançar ConflictException ao tentar remover livro indisponível', async () => {
      // Arrange
      const livroIndisponivel = {
        id: livroId,
        titulo: '1984',
        autor: 'George Orwell',
        disponivel: false,
      };

      mockPrismaService.livro.findUnique.mockResolvedValue(livroIndisponivel);

      // Act & Assert
      await expect(service.remove(livroId)).rejects.toThrow(ConflictException);
      await expect(service.remove(livroId)).rejects.toThrow(
        'Não é possível remover um livro que está reservado',
      );

      expect(mockPrismaService.livro.delete).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException ao tentar remover livro inexistente', async () => {
      // Arrange
      mockPrismaService.livro.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(livroId)).rejects.toThrow(NotFoundException);
      await expect(service.remove(livroId)).rejects.toThrow(
        `Livro com ID ${livroId} não encontrado`,
      );

      expect(mockPrismaService.livro.delete).not.toHaveBeenCalled();
    });
  });
});
