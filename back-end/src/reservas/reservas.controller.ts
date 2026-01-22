import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  /**
   * POST /reservas
   * Cria uma nova reserva
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createReservaDto: CreateReservaDto) {
    return this.reservasService.create(createReservaDto);
  }

  /**
   * GET /reservas
   * Lista todas as reservas
   */
  @Get()
  findAll() {
    return this.reservasService.findAll();
  }

  /**
   * GET /reservas/em-atraso
   * Lista reservas em atraso com cálculo de multa
   * IMPORTANTE: Esta rota deve vir ANTES de /reservas/:id
   * para não conflitar com o parâmetro dinâmico
   */
  @Get('em-atraso')
  findEmAtraso() {
    return this.reservasService.findEmAtraso();
  }

  /**
   * GET /reservas/cliente/:clienteId
   * Lista todas as reservas de um cliente específico
   */
  @Get('cliente/:clienteId')
  findByCliente(@Param('clienteId') clienteId: string) {
    return this.reservasService.findByCliente(clienteId);
  }

  /**
   * GET /reservas/:id
   * Busca uma reserva por ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservasService.findOne(id);
  }

  /**
   * PATCH /reservas/:id/devolver
   * Registra a devolução de um livro
   */
  @Patch(':id/devolver')
  devolver(@Param('id') id: string) {
    return this.reservasService.devolver(id);
  }
}
