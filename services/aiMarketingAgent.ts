import { aiService } from './aiService';
import { Product } from '../types';

class AIMarketingAgent {
    /**
     * Gera uma Copy persuasiva para envio no WhatsApp
     */
    async generateWhatsAppSalesCopy(product: Product, customerContext?: string): Promise<string> {
        const prompt = `
Atue como o melhor Vendedor e Copywriter de Moda e Estamparia do Brasil.
Seu objetivo é escrever uma mensagem de WhatsApp persuasiva para vender o seguinte produto:

PRODUTO: ${product.name}
PREÇO: R$ ${product.price.toFixed(2)}
DESCRIÇÃO: ${product.description || 'Produto de alta qualidade, ideal para o dia a dia.'}
CATEGORIA: ${product.category}

CONTEXTO DO CLIENTE (se houver): ${customerContext || 'Cliente procurando novidades ou com interesse no catálogo.'}

REGRAS DA COPY:
1. Deve ser natural, amigável e usar emojis moderadamente.
2. Não deve parecer um robô. Use quebras de linha.
3. Deve incluir um Call to Action (CTA) claro no final (ex: perguntando o tamanho ou se quer reservar).
4. Aplique gatilhos mentais de escassez ou urgência de forma sutil.
5. Retorne APENAS o texto da mensagem, pronto para ser copiado e colado no WhatsApp.
`;
        
        try {
            return await aiService.generateChatResponse(prompt, '');
        } catch (error) {
            console.error('Error generating WhatsApp copy:', error);
            throw new Error('Falha ao gerar copy para o WhatsApp.');
        }
    }

    /**
     * Gera uma Copy de alta conversão para Instagram / Facebook
     */
    async generateSocialMediaAdCopy(product: Product, platform: 'instagram' | 'facebook', trendsContext?: string): Promise<string> {
        const prompt = `
Atue como um Especialista em Tráfego Pago e Copywriter focado no ${platform === 'instagram' ? 'Instagram' : 'Facebook'}.
Seu objetivo é escrever a legenda perfeita para um post promocional do seguinte produto:

PRODUTO: ${product.name}
PREÇO: R$ ${product.price.toFixed(2)}
DESCRIÇÃO DO PRODUTO: ${product.description || 'Produto de alta qualidade e durabilidade.'}

TENDÊNCIAS ATUAIS (se houver): ${trendsContext || 'Nenhuma tendência específica informada.'}

REGRAS DA COPY (${platform.toUpperCase()}):
1. Comece com uma Hook (gancho) muito forte que prenda a atenção na primeira linha.
2. Destaque os benefícios (não apenas características).
3. Use emojis adequados para moda/estamparia.
4. Adicione um CTA forte mandando clicar no link da bio ou mandar Direct.
5. Inclua até 5 hashtags estratégicas no final.
6. Retorne APENAS o texto da legenda.
`;
        try {
            return await aiService.generateChatResponse(prompt, '');
        } catch (error) {
            console.error('Error generating Social Media copy:', error);
            throw new Error('Falha ao gerar legenda para redes sociais.');
        }
    }
}

export const aiMarketingAgent = new AIMarketingAgent();
