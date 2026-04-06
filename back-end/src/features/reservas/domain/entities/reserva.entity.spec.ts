import { Reserva } from './reserva.entity';

describe('Reserva Entity', () => {
  describe('calcularMulta', () => {
    it('deve calcular corretamente multa com 1 dia de atraso', () => {
      const reserva = new Reserva({
        id: '1',
        clienteId: 'c1',
        livroId: 'l1',
        dataReserva: new Date('2026-01-15T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-22T00:00:00.000Z'),
      });
      const dataAtual = new Date('2026-01-23T00:00:01.000Z');

      const result = reserva.calcularMulta(dataAtual);

      expect(result.diasDeAtraso).toBe(2);
      expect(result.multaTotal).toBe(11.0);
    });

    it('deve calcular corretamente multa com 5 dias de atraso', () => {
      const reserva = new Reserva({
        id: '1',
        clienteId: 'c1',
        livroId: 'l1',
        dataReserva: new Date('2026-01-10T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-20T00:00:00.000Z'),
      });
      const dataAtual = new Date('2026-01-25T00:00:01.000Z');

      const result = reserva.calcularMulta(dataAtual);

      expect(result.diasDeAtraso).toBe(6);
      expect(result.multaTotal).toBe(13.0);
    });

    it('deve calcular corretamente multa com 10 dias de atraso', () => {
      const reserva = new Reserva({
        id: '1',
        clienteId: 'c1',
        livroId: 'l1',
        dataReserva: new Date('2026-01-05T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-15T00:00:00.000Z'),
      });
      const dataAtual = new Date('2026-01-25T00:00:01.000Z');

      const result = reserva.calcularMulta(dataAtual);

      expect(result.diasDeAtraso).toBe(11);
      expect(result.multaTotal).toBe(15.5);
    });

    it('deve arredondar dias de atraso para cima', () => {
      const reserva = new Reserva({
        id: '1',
        clienteId: 'c1',
        livroId: 'l1',
        dataReserva: new Date('2026-01-15T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-22T12:00:00.000Z'),
      });
      const dataAtual = new Date('2026-01-23T06:00:00.000Z');

      const result = reserva.calcularMulta(dataAtual);

      expect(result.diasDeAtraso).toBe(1);
      expect(result.multaTotal).toBe(10.5);
    });

    it('deve aplicar multa fixa de R$ 10,00', () => {
      const reserva = new Reserva({
        id: '1',
        clienteId: 'c1',
        livroId: 'l1',
        dataReserva: new Date('2026-01-15T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-22T00:00:00.000Z'),
      });
      const dataAtual = new Date('2026-01-23T00:00:01.000Z');

      const result = reserva.calcularMulta(dataAtual);

      expect(result.multaTotal).toBeGreaterThanOrEqual(10);
    });

    it('deve aplicar acréscimo de 5% por dia', () => {
      const reserva = new Reserva({
        id: '1',
        clienteId: 'c1',
        livroId: 'l1',
        dataReserva: new Date('2026-01-15T00:00:00.000Z'),
        dataPrevistaDevolucao: new Date('2026-01-22T00:00:00.000Z'),
      });
      const dataAtual = new Date('2026-01-24T00:00:01.000Z');

      const result = reserva.calcularMulta(dataAtual);

      expect(result.diasDeAtraso).toBe(3);
      expect(result.multaTotal).toBe(11.5);
    });
  });
});
