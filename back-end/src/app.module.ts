import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ClientesModule } from './clientes/clientes.module';
import { LivrosModule } from './livros/livros.module';
import { ReservasModule } from './reservas/reservas.module';
import { LocacoesModule } from './locacoes/locacoes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.DATABASE_URL || ''),
    PrismaModule,
    ClientesModule,
    LivrosModule,
    ReservasModule,
    LocacoesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}