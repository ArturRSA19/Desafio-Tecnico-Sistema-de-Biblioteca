import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateClienteDto {
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @IsString({ message: 'O nome deve ser uma string' })
  nome: string;

  @IsNotEmpty({ message: 'O CPF é obrigatório' })
  @IsString({ message: 'O CPF deve ser uma string' })
  @Length(11, 14, { message: 'O CPF deve ter entre 11 e 14 caracteres' })
  cpf: string;

  @IsNotEmpty({ message: 'O telefone é obrigatório' })
  @IsString({ message: 'O telefone deve ser uma string' })
  @Length(10, 15, { message: 'O telefone deve ter entre 10 e 15 caracteres' })
  telefone: string;
}
