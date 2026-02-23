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
import { AuditLoggerService } from '../audit/audit-logger.service';
import { TipoEvento } from '../audit/enums/tipo-evento.enum';

@Injectable()
export class ClientesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  /**
   * Cria um novo cliente
   */
  async create(createClienteDto: CreateClienteDto) {
    const { nome, cpf, telefone } = createClienteDto;

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
        telefone,
      },
    });

    // Audit Trail – fire-and-forget
    this.auditLogger.logEvent(TipoEvento.REGISTRO_CLIENTE, cliente.id, {
      nome: cliente.nome,
      cpf: cliente.cpf,
      telefone: cliente.telefone,
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

    const { nome, cpf, telefone } = updateClienteDto;

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
      const clienteAtualizado = await this.prisma.cliente.update({
        where: { id },
        data: {
          nome,
          cpf: cpfNormalizado,
          telefone,
        },
      });

      // Audit Trail – fire-and-forget
      this.auditLogger.logEvent(TipoEvento.EDITADO_CLIENTE, id, {
        nome: clienteAtualizado.nome,
        cpf: clienteAtualizado.cpf,
        telefone: clienteAtualizado.telefone,
      });

      return clienteAtualizado;
    }

    // Atualiza sem modificar o CPF
    const clienteAtualizado = await this.prisma.cliente.update({
      where: { id },
      data: {
        nome,
        telefone,
      },
    });

    // Audit Trail – fire-and-forget
    this.auditLogger.logEvent(TipoEvento.EDITADO_CLIENTE, id, {
      nome: clienteAtualizado.nome,
      cpf: clienteAtualizado.cpf,
      telefone: clienteAtualizado.telefone,
    });

    return clienteAtualizado;
  }

  /**
   * Remove um cliente
   */
  async remove(id: string) {
    // Verifica se o cliente existe
    await this.findOne(id);

    // Verifica se há reservas pendentes (não devolvidas)
    const reservasPendentes = await this.prisma.reserva.count({
      where: {
        clienteId: id,
        dataDevolucao: null,
      },
    });

    if (reservasPendentes > 0) {
      throw new ConflictException(
        'Não é possível excluir o cliente pois existem livros ainda não devolvidos',
      );
    }

    // Verifica se o cliente possui histórico de reservas
    const totalReservas = await this.prisma.reserva.count({
      where: {
        clienteId: id,
      },
    });

    if (totalReservas > 0) {
      throw new ConflictException(
        'Não é possível excluir o cliente pois existem registros de reservas no histórico. Os dados devem ser mantidos para fins de auditoria',
      );
    }

    // Audit Trail – capturamos os dados antes de remover
    const clienteParaRemover = await this.prisma.cliente.findUnique({
      where: { id },
    });

    // Remove o cliente
    await this.prisma.cliente.delete({
      where: { id },
    });

    // Audit Trail – fire-and-forget
    this.auditLogger.logEvent(TipoEvento.EXCLUIDO_CLIENTE, id, {
      nome: clienteParaRemover?.nome,
      cpf: clienteParaRemover?.cpf,
      telefone: clienteParaRemover?.telefone,
    });

    return { message: 'Cliente removido com sucesso' };
  }
}
