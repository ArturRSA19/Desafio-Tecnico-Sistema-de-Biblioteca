import { describe, expect, it } from 'vitest';
import { DateFormatPipe } from './date-format.pipe';

describe('DateFormatPipe', () => {
  const pipe = new DateFormatPipe();

  it('deve formatar data para DD/MM/YYYY', () => {
    const result = pipe.transform('2024-01-15T12:00:00.000Z');
    // Verifica formato DD/MM/YYYY sem depender de timezone
    expect(result).toMatch(/^\d{2}\/\d{2}\/2024$/);
  });

  it('deve retornar "-" para valor null', () => {
    expect(pipe.transform(null)).toBe('-');
  });

  it('deve retornar "-" para valor vazio', () => {
    expect(pipe.transform('')).toBe('-');
  });

  it('deve adicionar zero à esquerda em dias e meses menores que 10', () => {
    const result = pipe.transform('2024-01-05T12:00:00.000Z');
    // Verifica que tem formato com zeros à esquerda
    expect(result).toMatch(/^\d{2}\/\d{2}\/2024$/);
  });
});
