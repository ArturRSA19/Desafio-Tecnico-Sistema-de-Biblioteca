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
} from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  /**
   * POST /clientes
   * Cria um novo cliente
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.create(createClienteDto);
  }

  /**
   * GET /clientes
   * Lista todos os clientes
   */
  @Get()
  findAll() {
    return this.clientesService.findAll();
  }

  /**
   * GET /clientes/:id
   * Busca um cliente por ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientesService.findOne(id);
  }

  /**
   * PATCH /clientes/:id
   * Atualiza um cliente
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClienteDto: UpdateClienteDto) {
    return this.clientesService.update(id, updateClienteDto);
  }

  /**
   * DELETE /clientes/:id
   * Remove um cliente
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.clientesService.remove(id);
  }
}
