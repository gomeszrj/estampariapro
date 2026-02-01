
export const whatsappService = {
    getSettings: () => {
        const baseUrl = localStorage.getItem('evolution_api_url') || '';
        const apiKey = localStorage.getItem('evolution_api_key') || '';
        const instanceName = localStorage.getItem('evolution_instance_name') || 'GomeszSpeedPrint';
        return { baseUrl, apiKey, instanceName };
    },

    sendMessage: async (phone: string, text: string): Promise<boolean> => {
        const { baseUrl, apiKey, instanceName } = whatsappService.getSettings();

        // Clean Phone
        const cleanPhone = phone.replace(/\D/g, '');
        const chatId = `55${cleanPhone}@s.whatsapp.net`;

        if (!baseUrl || !apiKey) {
            console.warn("Evolution API not configured.");
            return false;
        }

        try {
            const url = `${baseUrl}/message/sendText/${instanceName}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKey
                },
                body: JSON.stringify({
                    number: chatId,
                    options: {
                        delay: 1200,
                        presence: "composing",
                        linkPreview: false
                    },
                    textMessage: {
                        text: text
                    }
                })
            });

            if (!response.ok) {
                console.error("Evolution API Error:", await response.text());
                return false;
            }

            const data = await response.json();
            console.log("WhatsApp Sent:", data);
            return true;

        } catch (error) {
            console.error("Evolution API Failed:", error);
            return false;
        }
    }
};
