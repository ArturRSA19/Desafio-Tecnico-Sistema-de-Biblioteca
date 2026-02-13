import { Module } from '@nestjs/common';
import { LivrosService } from './livros.service';
import { LivrosController } from './livros.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';

@Module({
  imports: [PrismaModule, ElasticsearchModule],
  controllers: [LivrosController],
  providers: [LivrosService],
  exports: [LivrosService],
})
export class LivrosModule {}
