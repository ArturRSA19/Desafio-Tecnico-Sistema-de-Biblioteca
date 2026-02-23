export enum TipoEvento {
  // ── Clientes ─────────────────────────────────────────────────────────────
  REGISTRO_CLIENTE = 'REGISTRO_CLIENTE',
  EDITADO_CLIENTE = 'EDITADO_CLIENTE',
  EXCLUIDO_CLIENTE = 'EXCLUIDO_CLIENTE',

  // ── Livros ────────────────────────────────────────────────────────────────
  REGISTRO_LIVRO = 'REGISTRO_LIVRO',
  EDITADO_LIVRO = 'EDITADO_LIVRO',
  EXCLUIDO_LIVRO = 'EXCLUIDO_LIVRO',

  // ── Reservas / Locações ───────────────────────────────────────────────────
  RESERVA_LIVRO = 'RESERVA_LIVRO',
  DEVOLUCAO_LIVRO = 'DEVOLUCAO_LIVRO',
}
