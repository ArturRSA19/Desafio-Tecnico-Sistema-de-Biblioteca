import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  ClienteRepositoryOutPort,
  ClienteData,
} from '../../../application/ports/out/cliente-repository.out.port';

@Injectable()
export class PrismaClienteRepository implements ClienteRepositoryOutPort {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<ClienteData | null> {
    const record = await this.prisma.cliente.findUnique({
      where: { id },
      select: { id: true, nome: true, cpf: true },
    });

    return record ?? null;
  }
}
