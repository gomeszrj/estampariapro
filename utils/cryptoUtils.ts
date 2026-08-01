/**
 * Utilitários de Criptografia Inviolável
 * Usa Web Crypto API nativa do navegador para performance máxima e segurança.
 */

export const cryptoUtils = {
    /**
     * Gera um hash criptográfico seguro irreversível (SHA-256).
     * Ideal para proteger senhas de texto puro antes de enviar para a rede.
     */
    async hashSHA256(message: string): Promise<string> {
        const msgUint8 = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }
};
