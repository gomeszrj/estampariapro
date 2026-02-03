
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
        case OrderStatus.RECEIVED:
            return `Olá ${clientName}! 👋 Somos da Estamparia.
Recebemos seu pedido ${orderRef}. Vamos conferir os detalhes e te avisamos qualquer coisa! 😉`;
        case OrderStatus.FINALIZATION:
            return `Olá ${clientName}! 🎨
Seu pedido ${orderRef} entrou na fase de ARTE/APROVAÇÃO. Fique atento, logo mandaremos o layout para você confirmar!`;
        case OrderStatus.IN_PRODUCTION:
            return `Tudo certo, ${clientName}! 🚀
Arte aprovada e pedido ${orderRef} EM PRODUÇÃO! Agora é com a gente. Te avisamos quando ficar pronto. 🧵👕`;
        case OrderStatus.FINISHED:
            return `Oba, ${clientName}! ✨
Seu pedido ${orderRef} está PRONTO! 🎉
Pode vir buscar ou combinar a entrega. Ficou show!`;
        default:
            return `Olá ${clientName}! O status do pedido ${orderRef} mudou para: ${newStatus}`;
    }
};
