# CHANGELOG — EstampariaPro

Registro de todas as alterações relevantes e marcos de versão do ERP Multi-Tenant SaaS EstampariaPro.

---

## [v25.7.0] — 2026-06-21
### Adicionado & Melhorado
- **Módulo Financeiro Real**: Opção de exclusão manual de lançamentos financeiros para limpeza de valores e testes irreais (ícone de lixeira no grid de contas a pagar e receber).
- **Variações de Produtos Dinâmicas**: Tela de produtos agora permite seleção em caixa de todas as categorias base ('Tecido', 'Gola', etc) e aprende os materiais inseridos, exibindo-os nas variações dos próximos produtos sem vazamentos entre tenants.
- **Lista Global de Tecidos**: Inserida a matriz de tecidos base padrão na plataforma (DRI FIT, HELANCA LIGHT, NBA, ENERGY, MICROFIBRA).

### Corrigido
- **Correção de Totalizador de Estoque**: Painel principal de produtos corrigido para não somar o estoque do Almoxarifado/Insumos com o estoque de Produtos finais.

---

## [v25.6.0] — 2026-06-17
### Adicionado & Melhorado
- **Upload Real para Imagens de Layout**: Remoção completa da conversão destrutiva de imagens para Strings Base64 no \`Orders.tsx\`. Agora os anexos visuais são comprimidos via \`canvas.toBlob\` no navegador e enviados nativamente para o Supabase Storage, gerando links minúsculos e desafogando totalmente a rede e o banco de dados.
- **Sincronização Assíncrona e Silenciosa**: O gatilho global \`refreshData\` do \`App.tsx\` foi reprogramado para injetar atualizações sem engatilhar os _spinners_ do componente \`setLoading(true)\`, eliminando os congelamentos contínuos de tela na criação ou atualização de pedidos.
- **Reatividade Nível 0-Lag no Kanban**: A aplicação de memoização gráfica avançada (\`React.memo\`, \`useMemo\` e \`useCallback\`) bloqueou o loop de re-renderização massivo (O(N)) do Kanban durante interações de texto na barra de busca, anulando o Input Lag ao gerenciar centenas de cards.

---

## [v25.5.0] — 2026-06-14
### Adicionado & Melhorado
- **Módulo Financeiro Real**: O painel "Financeiro" foi totalmente reformulado, abandonando métricas estáticas e "previsões" ilusórias em prol de dados consolidados em tempo real baseados nas entradas/saídas do banco.
- **Filtro de Período Dinâmico**: Adicionados seletores visuais de Mês e Ano no cabeçalho do financeiro. Todos os KPIs (Faturamento, Receita, Custos, Lucro) e tabelas recalculam imediatamente para refletir apenas o mês selecionado.
- **Fluxo de Caixa Preciso**: Nova tabela de Balanço Gerencial que consolida *Faturamento Bruto*, *Receitas Realizadas* (pagamentos efetivos), *Custo de Produção/Fornecedor* (valor somado dos insumos de cada item no mês), *Despesas Operacionais* manuais e o *Lucro Líquido Real*.
- **Correção de Comunicação de Caixa**: Resolvido bug crítico onde recebimentos de pagamentos disparados pela tela "Pedidos" usavam a chave `transaction_date` incorretamente e falhavam ao espelhar como receita no caixa financeiro (agora padronizado para `date`).

---

## [v25.4.0] — 2026-06-13
### Adicionado & Melhorado
- **Múltiplos Fornecedores por Pedido**: Suporte para associar fornecedores diferentes a itens individuais dentro do mesmo pedido, com custos de unidade e fornecedor salvos de forma estática no momento do pedido (`supplier_id` e `unit_cost` no item).
- **Isolamento de Tenants (Fornecedores)**: Refatoração completa nos serviços de Fornecedores (`supplierService.ts`) e Produtos (`productService.ts`) para blindagem total de vazamentos de dados entre lojas usando a cláusula `.eq('tenant_id', tenantId)`.
- **Custo de Produção Interna vs Fornecedor**: O catálogo agora exibe o Custo Interno de forma independente dos custos via fornecedores, gerando margens de lucro dinâmicas na interface de produtos.
- **Mega CRM (Oculto)**: Funcionalidades do painel Evolution CRM desativadas visualmente para os tenants até posterior liberação da versão estável.

---

## [v21.8] — 2026-05-20
### Adicionado
- **TanStack React Query Cache:** Configuração global do `QueryClient` e `QueryClientProvider` no `App.tsx` para otimização de performance e caching de dados na árvore de componentes.
- **Paginação Range Supabase:** Método `getPaginated` adicionado no `orderService.ts` utilizando a paginação nativa `.range(from, to)` com Supabase para lidar com listagens massivas de pedidos de forma eficiente.
- **Alertas de Estoque Baixo em Tempo Real:** Alerta premium flutuante na barra superior (`App.tsx`) integrado diretamente com o estoque (`inventoryService.ts`), piscando em tempo real quando insumos estão abaixo do limite mínimo (`minLevel`), e permitindo navegação instantânea.
- **WhatsApp Status Change Triggers:** Envio automatizado de mensagens de notificação via WhatsApp ao cliente sempre que o status do pedido é alterado (Recebido, Em Produção, Arte, Pronto), usando a Evolution API no `orderService.ts`.
- **Serviço de Logs de Auditoria (auditService.ts):** Nova API e estrutura de dados de auditoria para monitorar ações críticas como exclusão de inquilinos, redefinição de senhas e alterações financeiras.
- **Mapeamento SQL de Auditoria:** Arquivo de migração `20260520000000_create_audit_logs.sql` para definir a tabela `audit_logs` no Supabase com suporte a isolamento RLS multi-tenant.

---

## [v21.7] — 2026-05-19
### Adicionado
- **Modularização do MasterAdmin Monolith:** Divisão do painel monolítico administrativo de 67KB (~1140 linhas) em subcomponentes altamente isolados e focados na pasta `components/MasterAdmin/`:
  - `SaaSOverview.tsx`: Listagem de assinantes, cartões com cores de integridade do Mercado Pago, KPIs e ações.
  - `SaaSCreateForm.tsx`: Formulário de criação, trial, dados de contato e painel de permissões RLS.
  - `SaaSPlansList.tsx`: Exibição visual e controle de planos SaaS ativos.
  - `SaaSEditModal.tsx`: Edição individual de parâmetros de assinatura, e RLS granular de módulos.
  - `SaaSPlanModal.tsx`: Modal para gerenciar planos SaaS globais.
- **Isolamento de Estado:** Redução drástica das re-renderizações indesejadas no grid de assinantes durante digitações em formulários ou modais.
- **Fluxo de Senhas Administrativas:** Nova ferramenta de redefinição de senhas com modal simplificado e isolado.

---

## [v21.6] — 2026-05-19
### Adicionado
- **Design de Qualidade Premium (HubSpot CRM Estilo):** Redesenho da interface do CRM em 3 colunas em `CRMFullScreen.tsx`.
- **Painel de Notas Internas e Tarefas:** Módulo de notas internas persistidas via localStorage e Stepper visual de progresso dos pedidos ativos.
- **Timelines e Templates:** Timeline estilosa com feed de atividades e painel de respostas rápidas (templates) acima do input do chat.
- **Temperatura de Leads:** Efeito dinâmico glow (Frio/Morno/Quente) baseado nas tags do Supabase.
