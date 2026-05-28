// services/evolutionApiService.ts
// Serviço de integração com a Evolution API (WhatsApp)

const EVOLUTION_BASE_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const API_KEY = process.env.EVOLUTION_API_KEY || 'estamparia-pro-api-key-local';
const DEFAULT_INSTANCE = process.env.EVOLUTION_INSTANCE || 'estamparia-teste';

interface SendTextMessagePayload {
  number: string;
  options?: {
    delay?: number;
    presence?: 'composing' | 'recording' | 'paused';
    linkPreview?: boolean;
  };
  textMessage: {
    text: string;
  };
}

interface EvolutionApiResponse<T = unknown> {
  key?: { id: string; remoteJid: string };
  message?: T;
  messageTimestamp?: number;
  status?: string;
  error?: string;
}

interface InstanceStatus {
  instance: {
    instanceName: string;
    state: 'open' | 'connecting' | 'close';
  };
}

// Helper para chamadas à Evolution API
async function evolutionFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${EVOLUTION_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Evolution API Error [${response.status}]: ${error}`);
  }

  return response.json() as Promise<T>;
}

// Formata número para o padrão WhatsApp
function formatPhoneNumber(phone: string): string {
  // Remove tudo que não for número
  const cleaned = phone.replace(/\D/g, '');

  // Adiciona código do Brasil se necessário
  if (cleaned.startsWith('55')) {
    return `${cleaned}@s.whatsapp.net`;
  }
  return `55${cleaned}@s.whatsapp.net`;
}

// ─── Gerenciamento de Instâncias ──────────────────────────────────────────────

/**
 * Cria uma nova instância do WhatsApp
 */
export async function createInstance(instanceName: string = DEFAULT_INSTANCE) {
  return evolutionFetch(`/instance/create`, {
    method: 'POST',
    body: JSON.stringify({
      instanceName,
      token: '',
      qrcode: true,
    }),
  });
}

/**
 * Verifica o status de conexão da instância
 */
export async function getInstanceStatus(
  instanceName: string = DEFAULT_INSTANCE
): Promise<InstanceStatus> {
  return evolutionFetch<InstanceStatus>(
    `/instance/connectionState/${instanceName}`
  );
}

/**
 * Busca o QR Code para conexão do WhatsApp
 */
export async function getQRCode(instanceName: string = DEFAULT_INSTANCE) {
  return evolutionFetch(`/instance/connect/${instanceName}`);
}

/**
 * Lista todas as instâncias ativas
 */
export async function listInstances() {
  return evolutionFetch(`/instance/fetchInstances`);
}

/**
 * Desconecta uma instância
 */
export async function disconnectInstance(
  instanceName: string = DEFAULT_INSTANCE
) {
  return evolutionFetch(`/instance/logout/${instanceName}`, {
    method: 'DELETE',
  });
}

// ─── Envio de Mensagens ───────────────────────────────────────────────────────

/**
 * Envia uma mensagem de texto via WhatsApp
 */
export async function sendTextMessage(
  phone: string,
  message: string,
  instanceName: string = DEFAULT_INSTANCE
): Promise<EvolutionApiResponse> {
  const payload: SendTextMessagePayload = {
    number: formatPhoneNumber(phone),
    options: {
      delay: 1200,
      presence: 'composing',
    },
    textMessage: {
      text: message,
    },
  };

  return evolutionFetch<EvolutionApiResponse>(
    `/message/sendText/${instanceName}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

/**
 * Envia confirmação de pedido via WhatsApp
 */
export async function sendOrderConfirmation(
  phone: string,
  orderData: {
    orderId: string;
    clientName: string;
    items: string;
    total: string;
    estimatedDate?: string;
  }
): Promise<EvolutionApiResponse> {
  const { orderId, clientName, items, total, estimatedDate } = orderData;

  const message =
    `🎨 *Estamparia Pro — Pedido Confirmado!*\n\n` +
    `Olá, *${clientName}*! Seu pedido foi recebido com sucesso.\n\n` +
    `📋 *Pedido:* #${orderId}\n` +
    `🛍️ *Itens:* ${items}\n` +
    `💰 *Total:* R$ ${total}\n` +
    (estimatedDate ? `📅 *Previsão de entrega:* ${estimatedDate}\n` : '') +
    `\nQualquer dúvida, estamos à disposição! ✅`;

  return sendTextMessage(phone, message);
}

/**
 * Envia notificação de pedido pronto para retirada
 */
export async function sendOrderReadyNotification(
  phone: string,
  clientName: string,
  orderId: string
): Promise<EvolutionApiResponse> {
  const message =
    `✅ *Estamparia Pro — Pedido Pronto!*\n\n` +
    `Olá, *${clientName}*! 🎉\n\n` +
    `Seu pedido *#${orderId}* está pronto para retirada!\n\n` +
    `📍 Venha buscar no nosso endereço.\n` +
    `⏰ Horário de atendimento: Seg-Sex 8h às 18h\n\n` +
    `Obrigado por escolher a Estamparia Pro! 🙏`;

  return sendTextMessage(phone, message);
}

/**
 * Envia orçamento via WhatsApp
 */
export async function sendQuoteMessage(
  phone: string,
  quoteData: {
    clientName: string;
    quoteId: string;
    description: string;
    value: string;
    validUntil: string;
  }
): Promise<EvolutionApiResponse> {
  const { clientName, quoteId, description, value, validUntil } = quoteData;

  const message =
    `📊 *Estamparia Pro — Orçamento #${quoteId}*\n\n` +
    `Olá, *${clientName}*!\n\n` +
    `Segue o orçamento solicitado:\n\n` +
    `📝 *Descrição:* ${description}\n` +
    `💰 *Valor:* R$ ${value}\n` +
    `⏳ *Válido até:* ${validUntil}\n\n` +
    `Para aprovar, responda *SIM* ou entre em contato conosco.\n` +
    `Qualquer dúvida, estamos à disposição! 😊`;

  return sendTextMessage(phone, message);
}
