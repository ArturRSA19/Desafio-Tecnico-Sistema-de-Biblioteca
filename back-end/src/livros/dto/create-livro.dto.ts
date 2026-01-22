import { IsString, IsNotEmpty } from 'class-validator';

export class CreateLivroDto {
  @IsString({ message: 'O título deve ser uma string' })
  @IsNotEmpty({ message: 'O título é obrigatório' })
  titulo: string;

  @IsString({ message: 'O autor deve ser uma string' })
  @IsNotEmpty({ message: 'O autor é obrigatório' })
  autor: string;
}
