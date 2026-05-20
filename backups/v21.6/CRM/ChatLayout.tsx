import React, { useState } from 'react';
import { ChatList } from './ChatList';
import { ChatWindow } from './ChatWindow';
import { ConnectionManager } from './ConnectionManager';
import { MessageSquare, Settings as SettingsIcon } from 'lucide-react';

interface Chat {
    id: string;
    client_id: string;
    whatsapp_id: string;
    unread_count: number;
    last_message: string;
    last_message_at: string;
    clients?: { name: string; avatar_url?: string };
}

export const ChatLayout: React.FC = () => {
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    return (
        <div className="flex h-[calc(100vh-2rem)] bg-[#0b1221] rounded-[2rem] overflow-hidden border border-slate-800 shadow-2xl animate-in fade-in duration-500">
            {/* Left Sidebar (List) */}
            <div className="w-80 flex flex-col border-r border-slate-800 bg-[#0f172a]">
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
                    <h2 className="text-slate-100 font-black uppercase tracking-widest text-xs flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-indigo-500" />
                        Atendimentos
                    </h2>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-lg transition-all ${showSettings ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                        title="Configurar Conexão"
                    >
                        <SettingsIcon className="w-4 h-4" />
                    </button>
                </div>

                {/* Content: Either Settings or ChatList */}
                {showSettings ? (
                    <div className="p-4">
                        <ConnectionManager />
                        <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                            <h4 className="text-amber-500 font-bold text-xs uppercase mb-2">Nota Importante</h4>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                                Para receber mensagens, você deve configurar o Webhook na Evolution API apontando para nossa API.
                                <br /><br />
                                URL do Webhook:<br />
                                <span className="font-mono bg-black/30 px-1 py-0.5 rounded text-slate-300 select-all">
                                    https://mdpsrbmfzaosuvhamvbs.supabase.co/functions/v1/webhook-evolution
                                </span>
                            </p>
                        </div>
                    </div>
                ) : (
                    <ChatList
                        onSelectChat={setSelectedChat}
                        selectedChatId={selectedChat?.id}
                    />
                )}
            </div>

            {/* Right Area (Window) */}
            <div className="flex-1 bg-[#0b1221] relative">
                {selectedChat ? (
                    <ChatWindow
                        chatId={selectedChat.id}
                        clientName={selectedChat.clients?.name || selectedChat.whatsapp_id}
                        whatsappId={selectedChat.whatsapp_id}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                        <MessageSquare className="w-24 h-24 mb-6 stroke-1" />
                        <p className="font-black uppercase tracking-[0.3em] text-xs">Selecione uma conversa para iniciar</p>
                    </div>
                )}
            </div>
        </div>
    );
};
