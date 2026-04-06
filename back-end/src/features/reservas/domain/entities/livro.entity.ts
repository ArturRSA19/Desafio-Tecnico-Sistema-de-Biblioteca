export interface LivroProps {
  id: string;
  titulo: string;
  autor: string;
  disponivel: boolean;
}

export class Livro {
  readonly id: string;
  readonly titulo: string;
  readonly autor: string;
  readonly disponivel: boolean;

  constructor(props: LivroProps) {
    this.id = props.id;
    this.titulo = props.titulo;
    this.autor = props.autor;
    this.disponivel = props.disponivel;
  }

  estaDisponivel(): boolean {
    return this.disponivel;
  }
}
