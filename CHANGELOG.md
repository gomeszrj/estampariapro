## [v26.3.0] — 2026-08-02
### ✨ Loja Pública e Personalização de Componentes
- **[NEW] Customização de Tema da Loja:** Integração total das cores primárias, secundárias e raio de borda, incluindo suporte ao painel administrativo (`StoreManager`) salvando as preferências em formato JSONB (`theme_config`).
- **[NEW] Padronização Inteligente de Imagens:** As imagens do catálogo passam a utilizar a proporção `4/5` e `object-fit: contain`, garantindo um grid uniforme e acabando com a diferença de tamanho de caixas de produtos independentemente das dimensões da foto carregada.
- **[NEW] Rotação 3D de Produtos (360°):** Refatorado o comportamento dos cartões da loja (`ProductCard`). Ao passar o cursor do mouse num produto, ele realiza automaticamente um giro suave 360 graus utilizando as fotos frente/costas/laterais, com transições em cálculo vetorial de crossfade dinâmico para uma transição lisa e natural, dando aspecto muito mais profissional (evitando stutters/cortes).
- **[NEW] Interação E-mail Fallback:** Se um arquivo enviado na finalização da loja pública for grande demais para a nuvem da loja, a UI de `CartCheckout` exibirá agora automaticamente a opção "Enviar Arte por E-Mail". Clicando nela, ele utilizará automaticamente a tag `mailto:` vinculada ao e-mail da empresa e abrirá a janela de e-mail do cliente, preenchendo o número do pedido no assunto e já informando de qual cliente se trata.
- **[FIX] Dados Institucionais Reais da Empresa:** O sistema de checkout da loja e o validador de contato de confirmação no painel (Via Whatsapp) não utilizará mais texto genérico ("Estamparia Pro"). Agora busca, reconhece e exibe o Nome da Empresa (Razão/Fantasia), CNPJ e e-mail parametrizado na página "Ajustes / Dados da Empresa" do administrador.

## [v26.2.0] — 2026-08-02
### 🎨 Identidade Visual Profissional: Stamp Mark
- **[NEW] `EstampariaProLogo.tsx`:** Novo componente SVG vetorial inline — logo C3 "Stamp Mark" com anel orbital ciano, letra E geométrica e 4 pontos de registro nos eixos (referência à serigrafia). Props: `size` e `animated`. Zero dependência de arquivo externo.
- **Splash Screen redesenhada:** Logo animado (96px) com anel orbital girando e glow pulsante ciano. Barra de progresso neon ciano. Tipografia Barlow Condensed bold. Animação de entrada suave.
- **Favicon SVG inline:** Favicon atualizado para o logo C3 — sem arquivo externo, funciona em todos os browsers modernos. Título da aba: `EstampariaPro · Sistema de Gestão`.
- **Login — Coluna Esquerda reformulada:** Logo grande (100px) animado, título ESTAMPARIA/PRO em Barlow Condensed 58px, textura sutil de trama de tecido no fundo, linha divisória ciano lateral, grid 2×2 de feature cards com animação escalonada.
- **Login — Card do Formulário redesenhado:** Substituído degradê roxo/azul genérico por card escuro com borda ciano sutil e 4 crosshairs nos cantos. Mini logo (36px) visível no mobile. Toggle "Tema" (placeholder inativo) removido.
- **Sidebar atualizada:** Logo "EP" texto com blur indigo substituído pelo logo C3 animado (44px) com tipografia Barlow Condensed.

## [v26.0.0] - 2026-07-31  
### MAJOR UPDATE - Estabilizacao Total  
- feat: Implementado menu Avancado de Filtros de Pedidos (Filtro por status de pagamento e periodo de criacao).  
- feat: Remocao de abas inativas do modal de produtos.  
- fix: Substituicao de alertas nativos na Loja Publica por Toasts elegantes.  
- fix: Corrigido UX de erros no StoreControl.  
  
# CHANGELOG — EstampariaPro

Registro de todas as alterações relevantes e marcos de versão do ERP Multi-Tenant SaaS EstampariaPro.

---

## [v25.9.0] — 2026-07-31
### ✅ Correções Críticas de Persistência
- **Grade de Produto salva corretamente:** O mapper do banco de dados (`mapProductToDB`) foi reescrito do zero como mapper explícito, eliminando conflito de colunas que impedia os tamanhos selecionados (P, M, G, etc.) de serem salvos.
- **Custo de Fornecedor salva corretamente:** O mecanismo de `upsert` com constraint incompleta (sem `tenant_id`) foi substituído por lógica explícita de `SELECT → UPDATE ou INSERT`, compatível com as políticas de RLS do Supabase.
- **Botão Salvar Produto corrigido:** O botão "Salvar Alterações" estava posicionado fora da tag `<form>`. Corrigido com `id="product-edit-form"` no form e atributo `form=` no botão, usando HTML5 nativo.
- **Auto-Healing seguro:** O mecanismo de polyfill JSON (`__extensions`) foi corrigido para não mais sobrescrever as chaves reais de grades de tamanho ao salvar extensões.

### 🆕 Nova Funcionalidade — Fornecedor no Card do Pedido
- Cada card de pedido agora exibe visualmente o fornecedor vinculado aos itens.
- **1 fornecedor:** exibe o nome completo (badge azul/índigo).
- **Múltiplos fornecedores:** exibe a contagem (badge roxo).
- **Fallback:** se apenas o fornecedor padrão do pedido estiver configurado, ele também é exibido.

### 🐛 Correções Gerais
- **Cor do lucro:** A cor do campo de lucro no card agora reflete o valor real (`profit >= 0`), não mais o status de pagamento.
- **`total_cost` persistido:** Custo total do pedido agora é gravado e lido corretamente do banco de dados (nova coluna + mapeamento bidirecional).
- **Cálculo de receita na edição:** A tela de Itens do Pedido agora respeita o preço original de cada item ao calcular o subtotal, em vez de usar o preço do catálogo como substituto.
- **Log de erros de fornecedor:** Erros ao salvar custos de fornecedores agora aparecem no console para facilitar diagnóstico.

### 🗄️ Migração SQL
- **`20260731000000_add_order_total_cost.sql`:** Nova migração que adiciona a coluna `total_cost NUMERIC(12,2)` na tabela `orders`.

---

## [v25.8.0] — 2026-06-21
### Adicionado & Melhorado
- **Adicionais de Personalização em Produtos (Add-ons)**: Inclusão da opção de configurar serviços extras como "Nome" e "Número" com valores adicionais (ativação/desativação) diretamente no cadastro de Produtos.
- **Cobrança Dinâmica na Venda**: Integrada a opção de cobrar Add-ons durante a criação do Pedido/Ordem de Serviço, atualizando dinamicamente o valor final do pedido (Revenue e Subtotal).
- **Acompanhamento no Kanban**: Agora a ficha de produção no Painel Kanban exibe ativamente as tags de adicionais de personalização (Ex: "Nome", "Número") escolhidas pelo cliente, facilitando a vida do setor de arte para identificar essas variações na peça de forma imediata.
- **Múltiplas Categorias para Produtos**: Concluída a integração completa de múltiplas categorias nos produtos, atualizando não apenas a UI, mas ajustando a engine de filtragem principal do catálogo para encontrar o produto independente de qual das suas categorias seja pesquisada.

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
