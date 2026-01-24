import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLivroDto } from './dto/create-livro.dto';
import { UpdateLivroDto } from './dto/update-livro.dto';

@Injectable()
export class LivrosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo livro
   * O campo disponivel é definido automaticamente como true
   */
  async create(createLivroDto: CreateLivroDto) {
    const { titulo, autor } = createLivroDto;

    const livro = await this.prisma.livro.create({
      data: {
        titulo,
        autor,
        disponivel: true,
      },
    });

    return livro;
  }

  /**
   * Lista todos os livros
   * Permite filtro opcional por disponibilidade
   */
  async findAll(disponivel?: boolean) {
    const where = {
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      ...(disponivel !== undefined ? { disponivel } : {}),
    };

    const livros = await this.prisma.livro.findMany({
      where,
      orderBy: {
        titulo: 'asc',
      },
    });

    return livros;
  }

  /**
   * Busca um livro por ID
   * Lança NotFoundException se não existir
   */
  async findOne(id: string) {
    const livro = await this.prisma.livro.findFirst({
      where: {
        id,
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
    });

    if (!livro) {
      throw new NotFoundException(`Livro com ID ${id} não encontrado`);
    }

    return livro;
  }

  /**
   * Atualiza um livro
   * Permite atualizar apenas titulo e autor
   * O campo disponivel não pode ser atualizado manualmente
   */
  async update(id: string, updateLivroDto: UpdateLivroDto) {
    // Verifica se o livro existe
    await this.findOne(id);

    const { titulo, autor } = updateLivroDto;

    const livro = await this.prisma.livro.update({
      where: { id },
      data: {
        ...(titulo && { titulo }),
        ...(autor && { autor }),
      },
    });

    return livro;
  }

  /**
   * Remove um livro
   * Só permite remover se o livro estiver disponível (disponivel = true)
   * Lança ConflictException se o livro estiver indisponível (reservado)
   */
  async remove(id: string) {
    // Verifica se o livro existe
    const livro = await this.findOne(id);

    // Verifica se o livro está disponível
    if (!livro.disponivel) {
      throw new ConflictException(
        'Não é possível remover um livro que está reservado',
      );
    }

    await this.prisma.livro.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        disponivel: false,
      },
    });

    return {
      message: 'Livro removido com sucesso',
    };
  }
}
