import { settingsService } from './settingsService';

export interface EvolutionStatus {
    state: 'open' | 'close' | 'connecting' | 'qrcode';
    status: string;
    qrcode?: string;
}

export const evolutionService = {
    async getConfig() {
        const settings = await settingsService.getSettings();
        return {
            url: settings.evolution_api_url || '',
            key: settings.evolution_api_key || '',
            instance: settings.evolution_instance_name || 'EstampariaPro'
        };
    },

    async checkStatus(): Promise<EvolutionStatus> {
        const { url, key, instance } = await this.getConfig();
        if (!url || !key) return { state: 'close', status: 'API Não Configurada' };

        try {
            const response = await fetch(`${url}/instance/connectionState/${instance}`, {
                headers: { 'apikey': key }
            });

            if (!response.ok) throw new Error('Failed to fetch status');

            const data = await response.json();
            // Evolution API format might vary, assuming standard
            // usually returns { instance: { state: 'open' } }
            const state = data?.instance?.state || 'close';
            return { state, status: state };
        } catch (e) {
            console.error("Evolution API Status Error:", e);
            return { state: 'close', status: 'Erro de Conexão' };
        }
    },

    async connect(): Promise<{ qrcode?: string, state: string }> {
        const { url, key, instance } = await this.getConfig();
        try {
            // Try to fetch QR Code
            const response = await fetch(`${url}/instance/connect/${instance}`, {
                headers: { 'apikey': key }
            });
            const data = await response.json();

            // Evolution API usually returns base64 in `base64`
            if (data?.base64) {
                return { qrcode: data.base64, state: 'qrcode' };
            }
            return { state: 'connecting' };
        } catch (e) {
            return { state: 'close' };
        }
    },

    async logout() {
        const { url, key, instance } = await this.getConfig();
        await fetch(`${url}/instance/logout/${instance}`, {
            method: 'DELETE',
            headers: { 'apikey': key }
        });
    },

    async sendMessage(phone: string, text: string) {
        const { url, key, instance } = await this.getConfig();
        // Clean phone
        const number = phone.replace(/\D/g, '');

        const payload = {
            number: number,
            options: {
                delay: 1200,
                presence: 'composing',
            },
            textMessage: {
                text: text
            }
        };

        const response = await fetch(`${url}/message/sendText/${instance}`, {
            method: 'POST',
            headers: {
                'apikey': key,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Failed to send');
        return await response.json();
    }
};
