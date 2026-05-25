import { settingsService } from './settingsService';

export const whatsappService = {
    getSettings: async () => {
        try {
            const settings = await settingsService.getSettings();
            return {
                baseUrl: settings.evolution_api_url || '',
                apiKey: settings.evolution_api_key || '',
                instanceName: settings.evolution_instance_name || 'GomeszSpeedPrint'
            };
        } catch (error) {
            console.error("Error fetching whatsapp settings:", error);
            return { baseUrl: '', apiKey: '', instanceName: 'GomeszSpeedPrint' };
        }
    },

    getConnectionState: async (): Promise<{ state: string; statusReason?: number }> => {
        const { baseUrl, apiKey, instanceName } = await whatsappService.getSettings();
        if (!baseUrl || !apiKey) return { state: 'unconfigured' };

        try {
            const response = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
                headers: { 'apikey': apiKey }
            });
            if (!response.ok) return { state: 'error' };
            const data = await response.json();
            return { state: data.instance?.state || 'closed', statusReason: data.instance?.statusReason };
        } catch (e) {
            return { state: 'error' };
        }
    },

    getQrCode: async (): Promise<string | null> => {
        const { baseUrl, apiKey, instanceName } = await whatsappService.getSettings();
        if (!baseUrl || !apiKey) return null;

        try {
            const response = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
                headers: { 'apikey': apiKey }
            });
            if (!response.ok) return null;
            const data = await response.json();
            return data.base64 || null; // API returns { base64: "..." }
        } catch (e) {
            return null;
        }
    },

    connectPairingCode: async (phoneNumber: string): Promise<string | null> => {
        const { baseUrl, apiKey, instanceName } = await whatsappService.getSettings();
        if (!baseUrl || !apiKey) return null;

        const cleanPhone = phoneNumber.replace(/\D/g, '');
        try {
            // Evolution API uses /instance/connect/:instance with number in query/body for pairing
            const response = await fetch(`${baseUrl}/instance/connect/${instanceName}?number=${cleanPhone}`, {
                headers: { 'apikey': apiKey }
            });
            if (!response.ok) return null;
            const data = await response.json();
            return data.pairingCode || null;
        } catch (e) {
            return null;
        }
    },

    logout: async (): Promise<boolean> => {
        const { baseUrl, apiKey, instanceName } = await whatsappService.getSettings();
        if (!baseUrl || !apiKey) return false;

        try {
            const response = await fetch(`${baseUrl}/instance/logout/${instanceName}`, {
                method: 'DELETE',
                headers: { 'apikey': apiKey }
            });
            return response.ok;
        } catch (e) {
            return false;
        }
    },

    sendMessage: async (phone: string, text: string): Promise<boolean> => {
        const { baseUrl, apiKey, instanceName } = await whatsappService.getSettings();
        const cleanPhone = phone.replace(/\D/g, '');
        const chatId = `55${cleanPhone}@s.whatsapp.net`;

        if (!baseUrl || !apiKey) return false;

        try {
            const response = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
                body: JSON.stringify({
                    number: chatId,
                    options: { delay: 1200, presence: "composing" },
                    textMessage: { text: text }
                })
            });
            return response.ok;
        } catch (e) {
            return false;
        }
    },

    sendMedia: async (phone: string, fileBase64: string, mimeType: string, fileName: string, caption?: string): Promise<boolean> => {
        const { baseUrl, apiKey, instanceName } = await whatsappService.getSettings();
        const cleanPhone = phone.replace(/\D/g, '');
        const chatId = `55${cleanPhone}@s.whatsapp.net`;

        if (!baseUrl || !apiKey) return false;

        try {
            // Remove data:image/png;base64, prefix if present
            const cleanBase64 = fileBase64.replace(/^data:.*,/, '');
            
            const response = await fetch(`${baseUrl}/message/sendMedia/${instanceName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
                body: JSON.stringify({
                    number: chatId,
                    options: { delay: 1200, presence: "composing" },
                    mediaMessage: {
                        mediatype: mimeType.startsWith('image/') ? 'image' : 'document',
                        caption: caption || '',
                        media: cleanBase64,
                        fileName: fileName
                    }
                })
            });
            return response.ok;
        } catch (e) {
            return false;
        }
    }
};
