# Guia de Deploy - Vercel

Este projeto está pronto para rodar na Vercel! Siga os passos abaixo:

## 1. Importar Projeto
1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard).
2. Clique em **Add New...** -> **Project**.
3. Selecione o repositório do GitHub: `gomeszrj/estampariapro`.
4. Clique em **Import**.

## 2. Configurações de Build (Automático)
A Vercel deve detectar automaticamente que é um projeto **Vite**.
- **Framework Preset**: Vite
- **Root Directory**: `.` (ou a pasta onde está o package.json)
- **Build Command**: `vite build` (ou `npm run build`)
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 3. Variáveis de Ambiente (Environment Variables)
Você **PRECISA** configurar as variáveis abaixo nas configurações do projeto na Vercel (Settings -> Environment Variables).

| Nome da Variável | Descrição |
|------------------|-----------|
| `VITE_SUPABASE_URL` | URL do seu projeto Supabase (igual ao .env.local) |
| `VITE_SUPABASE_ANON_KEY` | Chave Anon/Public do Supabase |
| `VITE_GEMINI_API_KEY` | Sua chave de API do Google Gemini |
| `VITE_OPENAI_API_KEY` | (Opcional) Chave da OpenAI para fallback |

> **Nota**: É crucial usar o prefixo `VITE_` para que essas variáveis fiquem visíveis para o navegador (Frontend).

## 4. Deploy
1. Clique em **Deploy**.
2. Aguarde o processo finalizar.
3. Se tudo der certo, você verá a tela de "Congratulations!" 🎉

## Troubleshooting
- Se der erro 404 ao atualizar a página, verifique se o arquivo `vercel.json` está na raiz do deploy (ele já foi criado com as regras de rewrite).
- Se der erro de conexão com Supabase, verifique se as variáveis `VITE_` foram copiadas corretamente sem espaços extras.
