import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { LivrosService } from './livros.service';
import { CreateLivroDto } from './dto/create-livro.dto';
import { UpdateLivroDto } from './dto/update-livro.dto';

@Controller('livros')
export class LivrosController {
  constructor(private readonly livrosService: LivrosService) {}

  /**
   * POST /livros
   * Cria um novo livro
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createLivroDto: CreateLivroDto) {
    return this.livrosService.create(createLivroDto);
  }

  /**
   * GET /livros
   * Lista todos os livros
   * Query params opcionais:
   * - disponivel: true|false (filtra por disponibilidade)
   * - updatedAfter: ISO 8601 date string (para carga incremental)
   */
  @Get()
  findAll(
    @Query('disponivel') disponivel?: string,
    @Query('updatedAfter') updatedAfter?: string,
  ) {
    const disponivelBoolean =
      disponivel === 'true' ? true : disponivel === 'false' ? false : undefined;
    
    const updatedAfterDate = updatedAfter ? new Date(updatedAfter) : undefined;
    
    return this.livrosService.findAll(disponivelBoolean, updatedAfterDate);
  }

  /**
   * GET /livros/:id
   * Busca um livro por ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.livrosService.findOne(id);
  }

  /**
   * PATCH /livros/:id
   * Atualiza um livro (apenas titulo e autor)
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLivroDto: UpdateLivroDto) {
    return this.livrosService.update(id, updateLivroDto);
  }

  /**
   * DELETE /livros/:id
   * Remove um livro (apenas se estiver disponível)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.livrosService.remove(id);
  }
}
