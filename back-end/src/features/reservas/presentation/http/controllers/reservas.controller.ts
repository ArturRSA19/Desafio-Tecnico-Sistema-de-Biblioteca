import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  HttpCode,
  HttpStatus,
  UseFilters,
  Inject,
} from '@nestjs/common';
import type { CriarReservaInPort } from '../../../application/ports/in/criar-reserva.in.port';
import type { DevolverReservaInPort } from '../../../application/ports/in/devolver-reserva.in.port';
import type { BuscarTodasReservasInPort } from '../../../application/ports/in/buscar-todas-reservas.in.port';
import type { BuscarReservaInPort } from '../../../application/ports/in/buscar-reserva.in.port';
import type { BuscarReservasPorClienteInPort } from '../../../application/ports/in/buscar-reservas-por-cliente.in.port';
import type { BuscarReservasEmAtrasoInPort } from '../../../application/ports/in/buscar-reservas-em-atraso.in.port';
import { CreateReservaRequestDto } from '../dto/request/create-reserva-request.dto';
import { DomainExceptionFilter } from '../filters/domain-exception.filter';

@Controller('reservas')
@UseFilters(DomainExceptionFilter)
export class ReservasController {
  constructor(
    @Inject('CriarReservaInPort')
    private readonly criarReserva: CriarReservaInPort,
    @Inject('DevolverReservaInPort')
    private readonly devolverReserva: DevolverReservaInPort,
    @Inject('BuscarTodasReservasInPort')
    private readonly buscarTodasReservas: BuscarTodasReservasInPort,
    @Inject('BuscarReservaInPort')
    private readonly buscarReserva: BuscarReservaInPort,
    @Inject('BuscarReservasPorClienteInPort')
    private readonly buscarReservasPorCliente: BuscarReservasPorClienteInPort,
    @Inject('BuscarReservasEmAtrasoInPort')
    private readonly buscarReservasEmAtraso: BuscarReservasEmAtrasoInPort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateReservaRequestDto) {
    return this.criarReserva.execute({
      clienteId: dto.clienteId,
      livroId: dto.livroId,
      dataReserva: dto.dataReserva,
      dataPrevistaDevolucao: dto.dataPrevistaDevolucao,
    });
  }

  @Get()
  findAll() {
    return this.buscarTodasReservas.execute();
  }

  @Get('em-atraso')
  findEmAtraso() {
    return this.buscarReservasEmAtraso.execute();
  }

  @Get('cliente/:clienteId')
  findByCliente(@Param('clienteId') clienteId: string) {
    return this.buscarReservasPorCliente.execute(clienteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.buscarReserva.execute(id);
  }

  @Patch(':id/devolver')
  devolver(@Param('id') id: string) {
    return this.devolverReserva.execute(id);
  }
}
