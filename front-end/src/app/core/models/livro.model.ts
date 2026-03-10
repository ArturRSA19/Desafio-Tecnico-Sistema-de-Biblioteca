export interface Livro {
  id: string;
  titulo: string;
  autor: string;
  capaBase64?: string;
  disponivel: boolean;
}

export interface CreateLivroDto {
  titulo: string;
  autor: string;
  capaBase64?: string;
}

export interface UpdateLivroDto {
  titulo?: string;
  autor?: string;
  capaBase64?: string;
}
