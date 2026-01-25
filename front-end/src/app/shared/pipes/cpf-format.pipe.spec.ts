import { describe, expect, it } from 'vitest';
import { CpfFormatPipe } from './cpf-format.pipe';

describe('CpfFormatPipe', () => {
  const pipe = new CpfFormatPipe();

  it('deve formatar CPF com 11 dígitos', () => {
    expect(pipe.transform('12345678909')).toBe('123.456.789-09');
  });

  it('deve retornar string vazia para valor vazio', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('deve retornar valor original se não tiver 11 dígitos', () => {
    expect(pipe.transform('123456789')).toBe('123456789');
  });

  it('deve formatar CPF já com pontuação', () => {
    expect(pipe.transform('123.456.789-09')).toBe('123.456.789-09');
  });
});
