export interface ClienteSnapshot {
  id: string | null;
  nome: string;
  cpf: string;
}

export interface ReservaProps {
  id?: string;
  clienteId: string | null;
  clienteNome?: string | null;
  clienteCpf?: string | null;
  livroId: string;
  dataReserva: Date;
  dataPrevistaDevolucao: Date;
  dataDevolucao?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  cliente?: ClienteSnapshot | null;
  livro?: { id: string; titulo: string; autor: string; disponivel?: boolean } | null;
}

export class Reserva {
  readonly id?: string;
  readonly clienteId: string | null;
  readonly clienteNome?: string | null;
  readonly clienteCpf?: string | null;
  readonly livroId: string;
  readonly dataReserva: Date;
  readonly dataPrevistaDevolucao: Date;
  readonly dataDevolucao?: Date | null;
  readonly createdAt?: Date | null;
  readonly updatedAt?: Date | null;
  readonly cliente?: ClienteSnapshot | null;
  readonly livro?: { id: string; titulo: string; autor: string; disponivel?: boolean } | null;

  constructor(props: ReservaProps) {
    this.id = props.id;
    this.clienteId = props.clienteId;
    this.clienteNome = props.clienteNome ?? null;
    this.clienteCpf = props.clienteCpf ?? null;
    this.livroId = props.livroId;
    this.dataReserva = props.dataReserva;
    this.dataPrevistaDevolucao = props.dataPrevistaDevolucao;
    this.dataDevolucao = props.dataDevolucao ?? null;
    this.createdAt = props.createdAt ?? null;
    this.updatedAt = props.updatedAt ?? null;
    this.cliente = props.cliente ?? null;
    this.livro = props.livro ?? null;
  }

  estaDevolvida(): boolean {
    return this.dataDevolucao !== null && this.dataDevolucao !== undefined;
  }

  estaEmAtraso(dataAtual: Date): boolean {
    return !this.estaDevolvida() && dataAtual > this.dataPrevistaDevolucao;
  }

  /**
   * Calcula a multa por atraso.
   * Fórmula: multaTotal = MULTA_FIXA + (MULTA_FIXA * PERCENTUAL_ACRESCIMO * diasDeAtraso)
   * Multa fixa: R$ 10,00
   * Acréscimo: 5% da multa fixa por dia de atraso
   */
  calcularMulta(dataAtual: Date): { diasDeAtraso: number; multaTotal: number } {
    const diferencaEmMs =
      dataAtual.getTime() - this.dataPrevistaDevolucao.getTime();

    const diasDeAtraso = Math.ceil(diferencaEmMs / (1000 * 60 * 60 * 24));

    const MULTA_FIXA = 10.0;
    const PERCENTUAL_ACRESCIMO = 0.05;

    const multaTotal =
      MULTA_FIXA + MULTA_FIXA * PERCENTUAL_ACRESCIMO * diasDeAtraso;

    return {
      diasDeAtraso,
      multaTotal: Number(multaTotal.toFixed(2)),
    };
  }

  /**
   * Valida se a data prevista de devolução é posterior à data de reserva.
   */
  static validarDatas(dataReserva: Date, dataPrevistaDevolucao: Date): boolean {
    return dataPrevistaDevolucao > dataReserva;
  }

  /**
   * Garante que o nome do cliente apareça no histórico mesmo após exclusão.
   * Retorna a reserva com o campo `cliente` preenchido via snapshot se necessário.
   */
  comClienteSnapshot(): Reserva {
    if (!this.cliente && (this.clienteNome || this.clienteCpf)) {
      return new Reserva({
        ...this.toPlain(),
        cliente: {
          id: this.clienteId ?? null,
          nome: this.clienteNome!,
          cpf: this.clienteCpf!,
        },
      });
    }
    return this;
  }

  toPlain(): ReservaProps {
    return {
      id: this.id,
      clienteId: this.clienteId,
      clienteNome: this.clienteNome,
      clienteCpf: this.clienteCpf,
      livroId: this.livroId,
      dataReserva: this.dataReserva,
      dataPrevistaDevolucao: this.dataPrevistaDevolucao,
      dataDevolucao: this.dataDevolucao,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      cliente: this.cliente,
      livro: this.livro,
    };
  }
}
