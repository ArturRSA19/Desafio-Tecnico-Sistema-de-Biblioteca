import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { AuditLoggerService } from './audit-logger.service';

@Module({
  imports: [ElasticsearchModule],
  providers: [AuditLoggerService],
  exports: [AuditLoggerService],
})
export class AuditModule {}
