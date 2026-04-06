import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../../audit/audit.module';

// Presentation
import { ReservasController } from './presentation/http/controllers/reservas.controller';

// Use Cases
import { CriarReservaUseCase } from './application/usecases/criar-reserva.usecase';
import { DevolverReservaUseCase } from './application/usecases/devolver-reserva.usecase';
import { BuscarTodasReservasUseCase } from './application/usecases/buscar-todas-reservas.usecase';
import { BuscarReservaUseCase } from './application/usecases/buscar-reserva.usecase';
import { BuscarReservasPorClienteUseCase } from './application/usecases/buscar-reservas-por-cliente.usecase';
import { BuscarReservasEmAtrasoUseCase } from './application/usecases/buscar-reservas-em-atraso.usecase';

// Adapters (Secondary / Driven)
import { PrismaReservaRepository } from './infra/persistence/prisma/prisma-reserva.repository';
import { PrismaLivroRepository } from './infra/persistence/prisma/prisma-livro.repository';
import { PrismaClienteRepository } from './infra/persistence/prisma/prisma-cliente.repository';
import { ElasticsearchAuditAdapter } from './infra/audit/elasticsearch-audit.adapter';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ReservasController],
  providers: [
    // Output Ports → Adapters (Secondary)
    { provide: 'ReservaRepositoryOutPort', useClass: PrismaReservaRepository },
    { provide: 'LivroRepositoryOutPort', useClass: PrismaLivroRepository },
    { provide: 'ClienteRepositoryOutPort', useClass: PrismaClienteRepository },
    { provide: 'AuditLoggerOutPort', useClass: ElasticsearchAuditAdapter },

    // Input Ports → Use Cases
    { provide: 'CriarReservaInPort', useClass: CriarReservaUseCase },
    { provide: 'DevolverReservaInPort', useClass: DevolverReservaUseCase },
    { provide: 'BuscarTodasReservasInPort', useClass: BuscarTodasReservasUseCase },
    { provide: 'BuscarReservaInPort', useClass: BuscarReservaUseCase },
    { provide: 'BuscarReservasPorClienteInPort', useClass: BuscarReservasPorClienteUseCase },
    { provide: 'BuscarReservasEmAtrasoInPort', useClass: BuscarReservasEmAtrasoUseCase },
  ],
})
export class ReservasModule {}
