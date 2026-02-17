import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { LocacoesService } from './locacoes.service';

@Controller('locacoes')
export class LocacoesController {
  constructor(private readonly locacoesService: LocacoesService) {}

  /**
   * GET /locacoes/sync?updatedAfter=YYYY-MM-DDTHH:mm:ss.sssZ
   * Retorna locações desnormalizadas para carga incremental no Elasticsearch
   */
  @Get('sync')
  async sync(@Query('updatedAfter') updatedAfter?: string) {
    if (!updatedAfter) {
      return this.locacoesService.findForSync();
    }

    const updatedAfterDate = new Date(updatedAfter);

    if (Number.isNaN(updatedAfterDate.getTime())) {
      throw new BadRequestException(
        'Parâmetro updatedAfter deve estar no formato ISO 8601 válido',
      );
    }

    return this.locacoesService.findForSync(updatedAfterDate);
  }
}
