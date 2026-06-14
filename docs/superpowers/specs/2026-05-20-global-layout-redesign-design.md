# Especificação de Design: Upgrade Visual Monocromo Glassmorphic (B&W) com Splash Screen

## 1. Visão Geral e Objetivos
O objetivo deste upgrade visual é estender os padrões estéticos premium, modernos e baseados em vidro (glassmorphic) desenvolvidos na central de CRM para a moldura global da aplicação (Sidebar, Header e fundo) e a experiência de entrada (Login e Splash Screen). O design adota uma paleta de cores monocromática rigorosa (preto e branco), reservando cores vibrantes e glowing exclusivamente para graus de urgência de notificações, avisos e status estáveis, no estilo de SaaS líderes de mercado (como Vercel, Linear e as versões mais recentes do HubSpot).

---

## 2. Padrões de Design e Identidade Visual (Monocromo Premium)
* **Fundo do Aplicativo:** Preto profundo e absoluto (`bg-[#040406]`) que proporciona contraste máximo e oculta divisões de tela.
* **Componente Sidebar (Menu Lateral):** Vidro translúcido escuro de alta opacidade (`bg-[#080A0F]/95 backdrop-blur-xl border-r border-white/5`).
* **Itens de Navegação:**
  * **Item Ativo:** Destaque em Branco Puro (`bg-white text-slate-950 font-black shadow-[0_4px_20px_rgba(255,255,255,0.1)]`) para impacto visual instantâneo.
  * **Item Inativo:** Slate grey discreto (`text-[#5A6578]`) para minimizar a fadiga visual.
  * **Item Hover:** Transição suave para cinza-claro/branco e fundo translúcido (`hover:bg-white/5 hover:text-white`).
* **Componente Header (Topo):** Vidro fumê semi-transparente (`bg-[#080A0F]/65 backdrop-blur-md border-b border-white/5 h-20`).

---

## 3. Semáforo Visual de Urgências e Alertas
As cores de atenção são restritas a indicadores específicos e cruciais para direcionar o foco imediato do usuário:
* 🔴 **Urgência Alta (Crítico — Estoque Baixo / Atrasos):** Badge em vermelho-crimson brilhante com efeito de pulso (`bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]`).
* 🟡 **Urgência Média (Avisos / Fila de Tarefas):** Indicador em âmbar/laranja quente (`bg-amber-500/10 text-amber-400 border border-amber-500/20`).
* 🟢 **Status Normal / Estável (Evolution API Conectada):** Indicador em verde neon esmeralda (`bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`) com um ponto luminoso piscando, simbolizando segurança e estabilidade ativa.

---

## 4. White-Label Splash Screen e Login
A entrada do sistema é atualizada com uma apresentação premium (Splash Screen) e um formulário de login no mesmo padrão:
* **Splash Screen:**
  * Tela inteira preta absoluto (`bg-[#040406]`).
  * Logo centralizada na proporção áurea (12% a 15% da dimensão menor da tela, ex: `w-28 h-28`).
  * Linha fina monocromática de carregamento abaixo da logo (largura de `160px`, altura de `1.5px`, preenchendo-se suavemente em `1.2s`).
  * Efeitos suaves de opacidade e desfoque (`blur-md`) na transição de saída para revelar a tela de login.
* **Ajustes White-Label (Painel de Configurações):**
  * `splash_enabled`: boolean (padrão: `true`) — ativa/desativa a apresentação.
  * `splash_duration`: number (padrão: `1600` ms) — duração total em milissegundos.
  * `splash_logo_url`: string (padrão: Logo do tenant/sistema) — URL para customizar o logo da tela de carregamento.
  * `splash_message`: string (padrão: "Carregando o sistema...") — texto de carregamento exibido na tela.
* **Card de Login:**
  * Formato assimétrico combinado com o CRM (`rounded-[2.5rem_0.75rem_2.5rem_0.75rem]`).
  * Fundo translúcido `bg-[#080A0F]/65 border border-white/5 backdrop-blur-2xl p-8`.
  * Inputs pretos elegantes com borda fina monocromática e foco branco puro.
  * Botão de ação em Branco Sólido com Texto Preto Extra-Bold.

---

## 5. Plano de Verificação Técnica
* **TypeScript Check:** Executar `npx tsc --noEmit` para garantir conformidade em nível de compilador.
* **Ajuste de Responsividade:** Garantir que o Splash Screen seja adaptável tanto em dispositivos móveis (proporção áurea vertical) quanto em telas desktop (w-28 h-28).
* **State Sync:** Verificar que as configurações salvas em local storage ou banco de dados reflitam instantaneamente na apresentação da Splash Screen ao recarregar.
