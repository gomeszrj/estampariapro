# Rastreador de Erros (Bug Tracker) — EstampariaPro

Planilha de controle para bugs identificados e status de resolução durante a fase de QA e homologação da versão `v21.8`.

---

| ID | Data | Severidade | Módulo | Descrição do Erro | Status | Solução Aplicada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-001** | 19/05 | 🔴 Crítica | Segurança | `visible_password` em texto puro vazando em listagens públicas de inquilinos. | **Resolvido** | Remoção completa do campo do backend, tipagens TS e forms (criptografia exclusiva pelo hash Supabase Auth). |
| **BUG-002** | 19/05 | 🟠 Média | Master Admin | Modais pesados do SaaS causavam travamento e lags de re-renderização na listagem. | **Resolvido** | Desmembramento do arquivo `MasterAdmin.tsx` em 5 subcomponentes focados na pasta `components/MasterAdmin/`. |
| **BUG-003** | 20/05 | 🟡 Baixa | Performance | Requisições redundantes de banco ao trocar de tela dentro da estamparia. | **Resolvido** | Configuração do cache central do `@tanstack/react-query` gerenciando o ciclo de vida e invalidando a cada 5 min. |
| **BUG-004** | 20/05 | 🟡 Baixa | Estoque | Falta de aviso visual de quando insumos cruciais estão no fim (abaixo do nível de segurança). | **Resolvido** | Badge com piscar dinâmico implementado na barra superior do cabeçalho global avisando o total de itens em nível crítico. |
| **BUG-005** | 20/05 | 🟠 Média | WhatsApp | Tentativa de envio de mensagens falhava caso o número do cliente contivesse caracteres especiais. | **Resolvido** | Expressão regular `replace(/\D/g, '')` aplicada em todos os fluxos de trigger para higienizar o DDI e telefone do cliente. |
