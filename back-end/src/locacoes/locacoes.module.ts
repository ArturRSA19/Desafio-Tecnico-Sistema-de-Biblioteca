import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LocacoesController } from './locacoes.controller';
import { LocacoesService } from './locacoes.service';

@Module({
  imports: [PrismaModule],
  controllers: [LocacoesController],
  providers: [LocacoesService],
})
export class LocacoesModule {}
