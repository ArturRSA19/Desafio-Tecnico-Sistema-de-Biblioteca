import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { validarCPF, normalizarCPF } from './utils/cpf.utils';

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo cliente
   */
  async create(createClienteDto: CreateClienteDto) {
    const { nome, cpf } = createClienteDto;

    // Normaliza o CPF
    const cpfNormalizado = normalizarCPF(cpf);

    // Valida o CPF
    if (!validarCPF(cpfNormalizado)) {
      throw new BadRequestException('CPF inválido');
    }

    // Verifica se já existe cliente com esse CPF
    const clienteExistente = await this.prisma.cliente.findUnique({
      where: { cpf: cpfNormalizado },
    });

    if (clienteExistente) {
      throw new ConflictException('Já existe um cliente cadastrado com este CPF');
    }

    // Cria o cliente
    const cliente = await this.prisma.cliente.create({
      data: {
        nome,
        cpf: cpfNormalizado,
      },
    });

    return cliente;
  }

  /**
   * Lista todos os clientes
   */
  async findAll() {
    return await this.prisma.cliente.findMany({
      orderBy: {
        nome: 'asc',
      },
    });
  }

  /**
   * Busca um cliente por ID
   */
  async findOne(id: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return cliente;
  }

  /**
   * Atualiza um cliente
   */
  async update(id: string, updateClienteDto: UpdateClienteDto) {
    // Verifica se o cliente existe
    await this.findOne(id);

    const { nome, cpf } = updateClienteDto;

    // Se o CPF está sendo atualizado
    if (cpf) {
      const cpfNormalizado = normalizarCPF(cpf);

      // Valida o novo CPF
      if (!validarCPF(cpfNormalizado)) {
        throw new BadRequestException('CPF inválido');
      }

      // Verifica se o novo CPF não conflita com outro cliente
      const clienteComMesmoCPF = await this.prisma.cliente.findUnique({
        where: { cpf: cpfNormalizado },
      });

      if (clienteComMesmoCPF && clienteComMesmoCPF.id !== id) {
        throw new ConflictException('Já existe outro cliente cadastrado com este CPF');
      }

      // Atualiza com CPF normalizado
      return await this.prisma.cliente.update({
        where: { id },
        data: {
          nome,
          cpf: cpfNormalizado,
        },
      });
    }

    // Atualiza apenas o nome
    return await this.prisma.cliente.update({
      where: { id },
      data: {
        nome,
      },
    });
  }

  /**
   * Remove um cliente
   */
  async remove(id: string) {
    // Verifica se o cliente existe
    await this.findOne(id);

    // Remove o cliente
    await this.prisma.cliente.delete({
      where: { id },
    });

    return { message: 'Cliente removido com sucesso' };
  }
}
