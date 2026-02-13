import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService {
  private readonly client: Client;

  constructor(private readonly configService: ConfigService) {
    const node =
      this.configService.get<string>('ELASTICSEARCH_NODE') ??
      'http://localhost:9200';

    this.client = new Client({ node });
  }

  getClient() {
    return this.client;
  }
}