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
} from '@nestjs/common';
import { ReservaDomainService } from '../../domain/services/reserva-domain.service';
import { CreateReservaDto } from '../../dto/create-reserva.dto';
import { DomainExceptionFilter } from './domain-exception.filter';

@Controller('reservas')
@UseFilters(DomainExceptionFilter)
export class ReservasController {
  constructor(private readonly reservasService: ReservaDomainService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createReservaDto: CreateReservaDto) {
    return this.reservasService.create(createReservaDto);
  }

  @Get()
  findAll() {
    return this.reservasService.findAll();
  }

  @Get('em-atraso')
  findEmAtraso() {
    return this.reservasService.findEmAtraso();
  }

  @Get('cliente/:clienteId')
  findByCliente(@Param('clienteId') clienteId: string) {
    return this.reservasService.findByCliente(clienteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservasService.findOne(id);
  }

  @Patch(':id/devolver')
  devolver(@Param('id') id: string) {
    return this.reservasService.devolver(id);
  }
}
