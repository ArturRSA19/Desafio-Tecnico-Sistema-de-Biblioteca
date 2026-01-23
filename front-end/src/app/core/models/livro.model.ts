export interface Livro {
  id: string;
  titulo: string;
  autor: string;
  disponivel: boolean;
}

export interface CreateLivroDto {
  titulo: string;
  autor: string;
}

export interface UpdateLivroDto {
  titulo?: string;
  autor?: string;
}
