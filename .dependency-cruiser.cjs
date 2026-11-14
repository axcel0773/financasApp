/** Regras da Clean Architecture: dependências só apontam para dentro (app/infra/ui → core). */
module.exports = {
  forbidden: [
    { name: 'core-puro', severity: 'error', comment: 'core não importa framework, UI ou infraestrutura.',
      from: { path: '^src/core' }, to: { path: '^src/(app|infra|ui|features|composition)|node_modules/(react|next|@supabase|zod)' } },
    { name: 'ui-sem-infra', severity: 'error', from: { path: '^src/ui' }, to: { path: '^src/(infra|composition|features|app)' } },
    { name: 'infra-sem-ui', severity: 'error', from: { path: '^src/infra' }, to: { path: '^src/(app|ui|features)' } },
    { name: 'sem-circular', severity: 'error', from: {}, to: { circular: true } },
  ],
  options: { tsConfig: { fileName: 'tsconfig.json' }, doNotFollow: { path: 'node_modules' }, exclude: { path: '\\.test\\.ts$' } },
};
