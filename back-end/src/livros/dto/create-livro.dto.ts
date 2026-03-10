import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateLivroDto {
  @IsString({ message: 'O título deve ser uma string' })
  @IsNotEmpty({ message: 'O título é obrigatório' })
  titulo: string;

  @IsString({ message: 'O autor deve ser uma string' })
  @IsNotEmpty({ message: 'O autor é obrigatório' })
  autor: string;

  @IsString({ message: 'A capa deve ser uma string Base64' })
  @IsOptional()
  capaBase64?: string;
}
