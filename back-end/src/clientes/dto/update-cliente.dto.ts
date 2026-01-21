import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateClienteDto {
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string' })
  nome?: string;

  @IsOptional()
  @IsString({ message: 'O CPF deve ser uma string' })
  @Length(11, 14, { message: 'O CPF deve ter entre 11 e 14 caracteres' })
  cpf?: string;
}
