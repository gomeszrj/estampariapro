
import { Order, OrderStatus } from '../types';

export const getWhatsAppLink = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    // Assume BR country code if missing
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${fullPhone}?text=${encodedMessage}`;
};

export const getStatusUpdateMessage = (order: Order, newStatus: OrderStatus): string => {
    const clientName = order.clientName.split(' ')[0];
    const orderRef = `#${order.orderNumber}`;

    switch (newStatus) {
        case OrderStatus.FINALIZATION:
            return `Olá ${clientName}! Seu pedido ${orderRef} entrou na etapa de FINALIZAÇÃO 🎨. Estamos dando os toques finais!`;
        case OrderStatus.IN_PRODUCTION:
            return `Olá ${clientName}! Ótima notícia: Seu pedido ${orderRef} entrou em PRODUÇÃO 🧵. Em breve estará pronto!`;
        case OrderStatus.FINISHED:
            return `Olá ${clientName}! Seu pedido ${orderRef} está PRONTO e CONCLUÍDO ✅. Pode vir buscar ou combinar a entrega!`;
        default:
            return `Olá ${clientName}! O status do pedido ${orderRef} mudou para: ${newStatus}`;
    }
};
