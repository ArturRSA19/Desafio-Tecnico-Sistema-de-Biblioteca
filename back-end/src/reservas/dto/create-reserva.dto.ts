import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateReservaDto {
  @IsString({ message: 'O ID do cliente deve ser uma string' })
  @IsNotEmpty({ message: 'O ID do cliente é obrigatório' })
  clienteId: string;

  @IsString({ message: 'O ID do livro deve ser uma string' })
  @IsNotEmpty({ message: 'O ID do livro é obrigatório' })
  livroId: string;

  @IsDateString(
    {},
    { message: 'A data de reserva deve estar no formato ISO 8601' },
  )
  @IsNotEmpty({ message: 'A data de reserva é obrigatória' })
  dataReserva: string;

  @IsDateString(
    {},
    { message: 'A data prevista de devolução deve estar no formato ISO 8601' },
  )
  @IsNotEmpty({ message: 'A data prevista de devolução é obrigatória' })
  dataPrevistaDevolucao: string;
}
