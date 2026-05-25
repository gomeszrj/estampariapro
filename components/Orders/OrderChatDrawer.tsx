import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { Order, OrderMessage } from '../../types';
import { orderService } from '../../services/orderService';
import { supabase } from '../../services/supabase';
import { notify } from '../ui/toast';

interface OrderChatDrawerProps {
  chatOrder: Order;
  onClose: () => void;
}

const OrderChatDrawer: React.FC<OrderChatDrawerProps> = ({ chatOrder, onClose }) => {
  const [chatMessages, setChatMessages] = useState<OrderMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const msgs = await orderService.getMessages(chatOrder.id);
        if (isMounted) {
          setChatMessages(msgs);
        }
      } catch (e) {
        console.error(e);
        notify.error('Erro ao carregar histórico de mensagens.');
      }
    };

    fetchMessages();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`store_chat_${chatOrder.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_messages', filter: `order_id=eq.${chatOrder.id}` },
        (payload) => {
          const newMsg = payload.new as OrderMessage;
          setChatMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [chatOrder.id]);

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setIsSendingChat(true);
    try {
      const msg = await orderService.sendMessage(chatOrder.id, 'store', chatInput);
      setChatMessages(prev => [...prev, msg]);
      setChatInput('');
    } catch (e) {
      console.error(e);
      notify.error('Erro ao enviar mensagem.');
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0b1221]/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] rounded-3xl w-full max-w-lg shadow-2xl border border-[#1e293b] flex flex-col h-[70vh] max-h-[800px] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-[#1e293b] bg-[#1e293b]/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-100">{chatOrder.clientName}</h3>
              <p className="text-[10px] font-bold text-white uppercase tracking-widest">Pedido #{chatOrder.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#1C1C26]/20">
          {chatMessages.map(msg => {
            const isStore = msg.sender === 'store';
            return (
              <div key={msg.id} className={`flex ${isStore ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    isStore
                      ? 'bg-white/10 text-white rounded-tr-sm'
                      : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
                  }`}
                >
                  <p className="text-sm font-medium">{msg.message}</p>
                  <p className="text-[9px] font-bold mt-2 text-right opacity-70">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          {chatMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 gap-4">
              <MessageSquare className="w-12 h-12" />
              <p className="text-sm font-bold text-center">
                Nenhuma mensagem ainda.
                <br />
                Inicie o atendimento com foco neste pedido.
              </p>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="p-4 bg-[#1e293b]/50 border-t border-[#1e293b] shrink-0">
          <form onSubmit={sendChatMessage} className="relative">
            <input
              type="text"
              className="w-full bg-[#0f172a] border border-slate-700/50 rounded-xl py-3.5 pl-4 pr-12 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-700/50 text-sm font-medium transition-all"
              placeholder="Mensagem..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isSendingChat}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white hover:bg-white/90 disabled:opacity-50 text-slate-950 rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-white/5"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderChatDrawer;
