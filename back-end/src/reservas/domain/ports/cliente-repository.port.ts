export interface ClienteData {
  id: string;
  nome: string;
  cpf: string;
}

export interface ClienteRepositoryPort {
  buscarPorId(id: string): Promise<ClienteData | null>;
}
