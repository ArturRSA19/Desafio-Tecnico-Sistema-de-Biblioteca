import { IsString, IsOptional } from 'class-validator';

export class UpdateLivroDto {
  @IsString({ message: 'O título deve ser uma string' })
  @IsOptional()
  titulo?: string;

  @IsString({ message: 'O autor deve ser uma string' })
  @IsOptional()
  autor?: string;

  @IsString({ message: 'A capa deve ser uma string Base64' })
  @IsOptional()
  capaBase64?: string;
}
