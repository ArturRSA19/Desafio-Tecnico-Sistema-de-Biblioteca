# Resumo das mudanças

- Criamos a rota incremental `GET /locacoes/sync?updatedAfter=...` no backend para exportar locações em formato desnormalizado.
- O retorno da rota ficou “achatado” com campos prontos para analytics: `idLocacao`, `dataLocacao`, `dataDevolucao`, `status`, `idLivro`, `livroTitulo`, `idUsuario`, `usuarioNome` etc.
- Ajustamos o filtro incremental para cenário legado (quando `updatedAt` está nulo), usando também `dataReserva` e `dataDevolucao`.
- Adicionamos `createdAt` e `updatedAt` no model `Reserva` (Prisma + MongoDB) para suportar sincronização incremental de forma mais confiável.
- Criamos script de backfill para preencher timestamps antigos de reservas.
- Criamos o mapping do índice `rentals` no Elasticsearch com campos de agregação como `keyword` e datas como `date`.
- Criamos o pipeline `logstash-rentals.conf` com heartbeat + janela incremental + upsert por `idLocacao`.
- Corrigimos o Logstash para usar pipelines separados (`books` e `rentals`) com `pipelines.yml`, evitando conflito entre arquivos `.conf`.
- Subimos/atualizamos a stack Elastic via Docker, validamos endpoint, validamos ingestão e executamos carga inicial completa no índice `rentals`.
- Resultado final validado: índice `rentals` populado e pronto para dashboard no Kibana.

## Explicação rápida (modo estagiário)

Eu organizei a parte de locações para o Elastic conseguir montar os gráficos sem sofrer com dados aninhados. Também corrigi o incremental porque tinha reserva antiga sem `updatedAt`, então agora ele não perde esses casos. Depois separei os pipelines no Logstash, subi tudo no Docker, rodei carga inicial e confirmei no `_count` e `_search` que os dados entraram no índice `rentals`. Tá pronto pra usar no Kibana.
