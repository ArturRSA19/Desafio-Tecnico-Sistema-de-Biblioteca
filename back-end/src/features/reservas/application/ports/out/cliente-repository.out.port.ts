export interface ClienteData {
  id: string;
  nome: string;
  cpf: string;
}

export interface ClienteRepositoryOutPort {
  buscarPorId(id: string): Promise<ClienteData | null>;
}
