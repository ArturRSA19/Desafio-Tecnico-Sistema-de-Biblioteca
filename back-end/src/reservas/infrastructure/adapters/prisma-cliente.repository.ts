import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ClienteRepositoryPort,
  ClienteData,
} from '../../domain/ports/cliente-repository.port';

@Injectable()
export class PrismaClienteRepository implements ClienteRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<ClienteData | null> {
    const record = await this.prisma.cliente.findUnique({
      where: { id },
      select: { id: true, nome: true, cpf: true },
    });

    return record ?? null;
  }
}
