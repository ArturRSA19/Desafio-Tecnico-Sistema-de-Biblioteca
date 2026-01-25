import { describe, expect, it } from 'vitest';
import { FormControl } from '@angular/forms';
import { cpfValidator } from './cpf.validator';

describe('cpfValidator', () => {
  const validator = cpfValidator();

  it('deve retornar null para CPF válido', () => {
    const control = new FormControl('123.456.789-09');
    expect(validator(control)).toBeNull();
  });

  it('deve retornar null para CPF válido sem formatação', () => {
    const control = new FormControl('12345678909');
    expect(validator(control)).toBeNull();
  });

  it('deve retornar null para campo vazio', () => {
    const control = new FormControl('');
    expect(validator(control)).toBeNull();
  });

  it('deve retornar erro para CPF com dígitos todos iguais', () => {
    const control = new FormControl('111.111.111-11');
    expect(validator(control)).toEqual({ cpfInvalido: true });
  });

  it('deve retornar erro para CPF inválido', () => {
    const control = new FormControl('123.456.789-00');
    expect(validator(control)).toEqual({ cpfInvalido: true });
  });

  it('deve retornar erro para CPF com tamanho incorreto', () => {
    const control = new FormControl('123.456.789');
    expect(validator(control)).toEqual({ cpfInvalido: true });
  });

  it('deve retornar erro para CPF com segundo dígito verificador incorreto', () => {
    const control = new FormControl('123.456.789-08');
    expect(validator(control)).toEqual({ cpfInvalido: true });
  });
});
