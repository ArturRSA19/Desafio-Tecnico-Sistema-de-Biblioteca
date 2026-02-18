import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLivroDto } from './dto/create-livro.dto';
import { UpdateLivroDto } from './dto/update-livro.dto';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';

type ElasticBookDocument = {
  id?: string;
  _id?: string;
  titulo?: string;
  autor?: string;
  disponivel?: boolean;
};

@Injectable()
export class LivrosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

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
        deletedAt: null,
      },
    });

    return livro;
  }

  /**
   * Lista todos os livros
   * Permite filtro opcional por disponibilidade e data de atualização (carga incremental)
   */
  async findAll(disponivel?: boolean, updatedAfter?: Date) {
    const where: any = {};

    if (disponivel !== undefined) {
      where.disponivel = disponivel;
    }

    // Filtro incremental: busca apenas livros modificados após a data especificada
    if (updatedAfter) {
      where.updatedAt = {
        gt: updatedAfter,
      };
    }

    // Exclui livros soft-deleted (inclui registros antigos sem campo deletedAt)
    const whereComSoftDelete = {
      AND: [
        where,
        {
          OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
        },
      ],
    };

    const livros = await this.prisma.livro.findMany({
      where: whereComSoftDelete,
      orderBy: {
        updatedAt: 'desc', // Ordena por data de atualização (mais recentes primeiro)
      },
    });

    return livros;
  }

  async search(query?: string) {
    const term = query?.trim();

    if (!term) {
      return this.findAll();
    }

    const client = this.elasticsearchService.getClient();

    const response = await client.search<ElasticBookDocument>({
      index: 'books',
      size: 1000,
      query: {
        multi_match: {
          query: term,
          fields: ['titulo', 'autor'],
          fuzziness: 'AUTO',
        },
      },
    });

    const elasticIds = response.hits.hits
      .map((hit) => {
        const source = hit._source;

        return source?.id ?? source?._id ?? hit._id;
      })
      .filter((id): id is string => Boolean(id));

    if (elasticIds.length > 0) {
      const livrosMongo = await this.prisma.livro.findMany({
        where: {
          AND: [
            {
              id: { in: elasticIds },
            },
            {
              OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
            },
          ],
        },
      });

      const livroPorId = new Map(livrosMongo.map((livro) => [livro.id, livro]));

      const livrosConsistentes = elasticIds
        .map((id) => {
          const livro = livroPorId.get(id);

          if (!livro) {
            return null;
          }

          return {
            id: livro.id,
            titulo: livro.titulo,
            autor: livro.autor,
            disponivel: livro.disponivel,
          };
        })
        .filter((livro): livro is NonNullable<typeof livro> => livro !== null);

      if (livrosConsistentes.length > 0) {
        return livrosConsistentes;
      }
    }

    return this.findAll();
  }

  /**
   * Busca um livro por ID
   * Lança NotFoundException se não existir
   */
  async findOne(id: string) {
    const livro = await this.prisma.livro.findUnique({
      where: { id },
    });

    if (!livro || livro.deletedAt) {
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

    try {
      await this.prisma.livro.delete({
        where: { id },
      });
    } catch (error) {
      if (!this.isLivroReservaRelationError(error)) {
        throw error;
      }

      await this.prisma.livro.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          disponivel: false,
        },
      });
    }

    return {
      message: 'Livro removido com sucesso',
    };
  }

  private isLivroReservaRelationError(error: unknown) {
    const code = (error as { code?: string })?.code;
    return code === 'P2014';
  }
}
