import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { ReservasController } from './infrastructure/http/reservas.controller';
import { ReservaDomainService } from './domain/services/reserva-domain.service';
import { PrismaReservaRepository } from './infrastructure/adapters/prisma-reserva.repository';
import { PrismaLivroRepository } from './infrastructure/adapters/prisma-livro.repository';
import { PrismaClienteRepository } from './infrastructure/adapters/prisma-cliente.repository';
import { ElasticsearchAuditAdapter } from './infrastructure/adapters/elasticsearch-audit.adapter';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ReservasController],
  providers: [
    ReservaDomainService,
    {
      provide: 'ReservaRepositoryPort',
      useClass: PrismaReservaRepository,
    },
    {
      provide: 'LivroRepositoryPort',
      useClass: PrismaLivroRepository,
    },
    {
      provide: 'ClienteRepositoryPort',
      useClass: PrismaClienteRepository,
    },
    {
      provide: 'AuditLoggerPort',
      useClass: ElasticsearchAuditAdapter,
    },
  ],
  exports: [ReservaDomainService],
})
export class ReservasModule {}
