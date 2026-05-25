import React, { useState, useEffect, useRef } from 'react';
import { Building2, Save, Upload, Globe, Phone, Mail, FileText, Landmark, Camera, CheckCircle2, Users, UserPlus, Trash2, Shield, User, MessageSquare, Download, Lock, XCircle } from 'lucide-react';
import { teamService } from '../services/teamService';
import { settingsService, CompanySettings } from '../services/settingsService';
import { TeamMember, UserRole } from '../types';
import { notify } from './ui/toast';
import { ConfirmModal } from './ui/ConfirmModal';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'company' | 'team' | 'bot'>('company');
  const [company, setCompany] = useState<CompanySettings>({
    name: '',
    cnpj: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    bank_info: '',
    logo_url: '',
    evolution_api_url: '',
    evolution_api_key: '',
    evolution_instance_name: '',
    cloudbot_enabled: false,
  });

  // Team State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole | ''>('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [editPasswordValue, setEditPasswordValue] = useState('');

  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteMemberId, setConfirmDeleteMemberId] = useState<string | null>(null);

  // Splash Screen State
  const [splashEnabled, setSplashEnabled] = useState<boolean>(true);
  const [splashDuration, setSplashDuration] = useState<number>(1600);
  const [splashLogoUrl, setSplashLogoUrl] = useState<string>('');
  const [splashMessage, setSplashMessage] = useState<string>('Carregando estrutura digital...');

  useEffect(() => {
    loadSettings();
    loadTeam();
  }, []);

  const loadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const data = await settingsService.getSettings();
      setCompany(prev => ({ ...prev, ...data }));

      // Load splash screen preferences from localStorage
      const localEnabled = localStorage.getItem('splash_enabled');
      const localDuration = localStorage.getItem('splash_duration');
      const localLogoUrl = localStorage.getItem('splash_logo_url');
      const localMessage = localStorage.getItem('splash_message');

      setSplashEnabled(localEnabled !== null ? localEnabled === 'true' : true);
      setSplashDuration(localDuration ? parseInt(localDuration, 10) : 1600);
      setSplashLogoUrl(localLogoUrl || '');
      setSplashMessage(localMessage || 'Carregando estrutura digital...');
    } catch (error) {
      console.error("Error loading settings", error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const loadTeam = async () => {
    setIsLoadingTeam(true);
    try {
      const data = await teamService.getAll();
      setTeamMembers(data || []);
    } catch (error) {
      console.error("Error loading team", error);
    } finally {
      setIsLoadingTeam(false);
    }
  };

  const handleSaveMember = async () => {
    if (!newMemberName || !newMemberRole) return;
    try {
      await teamService.create({
        name: newMemberName,
        role: newMemberRole as UserRole,
        visible_password: newMemberPassword.trim() || undefined,
        active: true
      });
      setNewMemberName('');
      setNewMemberRole('');
      setNewMemberPassword('');
      loadTeam();
      notify.success('Membro da equipe cadastrado com sucesso!');
    } catch (e) {
      notify.error('Erro ao adicionar membro. Verifique a tabela team_members no Supabase.');
    }
  };

  const handleDeleteMember = (id: string) => {
    setConfirmDeleteMemberId(id);
  };

  const doDeleteMember = async (id: string) => {
    await teamService.delete(id);
    notify.success('Membro removido.');
    loadTeam();
  };

  const handleUpdatePassword = async (id: string) => {
    if (!editPasswordValue.trim()) return;
    try {
      await teamService.update(id, { visible_password: editPasswordValue.trim() });
      setEditingPasswordId(null);
      setEditPasswordValue('');
      loadTeam();
      notify.success('Senha atualizada com sucesso!');
    } catch(e) {
      notify.error('Erro ao alterar senha.');
    }
  };

  const handleSave = async () => {
    try {
      await settingsService.saveSettings(company);
      
      // Save Splash Screen settings in localStorage
      localStorage.setItem('splash_enabled', String(splashEnabled));
      localStorage.setItem('splash_duration', String(splashDuration));
      localStorage.setItem('splash_logo_url', splashLogoUrl);
      localStorage.setItem('splash_message', splashMessage);

      setSaved(true);
      window.dispatchEvent(new Event('settingsUpdated'));
      notify.success('Configurações salvas com sucesso!');
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings", error);
      notify.error('Erro ao salvar configurações.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompany(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoadingSettings(true);
      try {
        const publicUrl = await settingsService.uploadLogo(file);
        setCompany(prev => ({ ...prev, logo_url: publicUrl }));
        notify.success('Logotipo atualizado!');
      } catch (error) {
        console.error(error);
        notify.error('Erro ao fazer upload da imagem. Tente novamente.');
      } finally {
        setIsLoadingSettings(false);
      }
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-700 pb-20">

      {/* Header Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-[#1e293b] pb-6 gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">
            {activeTab === 'company' ? 'Identidade Corporativa' : activeTab === 'team' ? 'Gestão de Equipe' : 'Configurações de IA'}
          </h2>
          <p className="text-slate-400 font-medium">
            <span>
              {activeTab === 'company'
                ? 'Configure os dados oficiais que darão autoridade aos seus documentos.'
                : activeTab === 'team'
                  ? 'Gerencie os usuários e permissões de acesso ao sistema.'
                  : 'Configure a inteligência artificial do seu CloudBot.'}
            </span>
          </p>
        </div>

        <div className="flex bg-[#0b1221] p-1.5 rounded-2xl border border-[#1e293b]">
          <button
            onClick={() => setActiveTab('company')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'company' 
                ? 'bg-[#8B5CF6] text-white shadow-[0_4px_20px_rgba(255,255,255,0.12)]' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Dados da Empresa
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'team' 
                ? 'bg-[#8B5CF6] text-white shadow-[0_4px_20px_rgba(255,255,255,0.12)]' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Equipe & Acessos
          </button>
          <button
            onClick={() => setActiveTab('bot')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'bot' 
                ? 'bg-[#8B5CF6] text-white shadow-[0_4px_20px_rgba(255,255,255,0.12)]' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Bot & Inteligência
          </button>
        </div>
      </div>

      {activeTab === 'bot' ? (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          {/* Save Button for Bot */}
          <div className="flex justify-end mb-8">
            <button
              onClick={handleSave}
              disabled={isLoadingSettings}
              className={`px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center gap-3 shadow-2xl ${
                saved 
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                  : 'bg-[#8B5CF6] text-white hover:bg-slate-200 shadow-[0_4px_20px_rgba(255,255,255,0.15)]'
              }`}
            >
              <span>{saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}</span>
              {saved ? 'Dados Atualizados' : (isLoadingSettings ? 'Carregando...' : 'Salvar Configurações')}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-[#0b1221] border border-[#1e293b] rounded-xl p-10 shadow-2xl">
                <h3 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight mb-4">
                  <MessageSquare className="w-6 h-6 text-white" /> <span>CloudBot</span>
                </h3>
                <p className="text-slate-400 text-sm mb-8">
                  Ative o agente autônomo para responder clientes no WhatsApp 24/7.
                </p>

                <div className="bg-[#1C1C26]/60 p-6 rounded-2xl border border-[#1e293b] flex items-center justify-between">
                  <span className="font-black text-slate-300 uppercase tracking-widest text-xs">Status do Robô</span>
                  <button
                    onClick={() => setCompany(prev => ({ ...prev, cloudbot_enabled: !prev.cloudbot_enabled }))}
                    className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${company.cloudbot_enabled ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.25)]' : 'bg-white/10'}`}
                  >
                    <div className={`w-6 h-6 bg-[#1C1C26] rounded-full transition-transform duration-300 ${company.cloudbot_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-8">
              <div className="bg-[#0b1221] border border-[#1e293b] rounded-xl p-10 shadow-2xl space-y-6">
                <h3 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight mb-2">
                  <Globe className="w-6 h-6 text-white" /> <span>Conexão Evolution API</span>
                </h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">Configure a URL e Chave da API para conectar o WhatsApp.</p>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block ml-1">Instance Name</label>
                  <input
                    name="evolution_instance_name"
                    value={company.evolution_instance_name || ''}
                    onChange={handleChange}
                    placeholder="Ex: estamparia_bot"
                    className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-2xl px-5 py-4 text-white font-bold focus:border-white/20 focus:ring-2 focus:ring-white/10 outline-none transition-all placeholder:text-slate-700"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block ml-1">API URL</label>
                  <input
                    name="evolution_api_url"
                    value={company.evolution_api_url || ''}
                    onChange={handleChange}
                    placeholder="https://api.evolution..."
                    className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-2xl px-5 py-4 text-white font-bold focus:border-white/20 focus:ring-2 focus:ring-white/10 outline-none transition-all placeholder:text-slate-700"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block ml-1">API Key</label>
                  <input
                    name="evolution_api_key"
                    value={company.evolution_api_key || ''}
                    onChange={handleChange}
                    type="password"
                    placeholder="sk-..."
                    className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-2xl px-5 py-4 text-white font-bold focus:border-white/20 focus:ring-2 focus:ring-white/10 outline-none transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'company' ? (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          {/* Save Button for Company */}
          <div className="flex justify-end mb-8">
            <button
              onClick={handleSave}
              disabled={isLoadingSettings}
              className={`px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center gap-3 shadow-2xl ${
                saved 
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                  : 'bg-[#8B5CF6] text-white hover:bg-slate-200 shadow-[0_4px_20px_rgba(255,255,255,0.15)]'
              }`}
            >
              {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {saved ? 'Dados Atualizados' : (isLoadingSettings ? 'Carregando...' : 'Salvar Configurações')}
            </button>
          </div>

          {isLoadingSettings ? (
            <div className="text-center py-20 text-slate-500">Carregando dados da empresa...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-[#0b1221] border border-[#1e293b] rounded-xl p-10 flex flex-col items-center text-center shadow-2xl">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 block">Logotipo Oficial</label>
                  <div
                    onClick={triggerUpload}
                    className="w-48 h-48 rounded-2xl bg-[#1C1C26] border-2 border-dashed border-[#1e293b] flex items-center justify-center mb-6 overflow-hidden relative group cursor-pointer transition-all hover:border-white/20"
                  >
                    {company.logo_url ? (
                      <img src={company.logo_url} alt="Logo Empresa" className="w-full h-full object-contain p-4 bg-white" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-600">
                        <Camera className="w-10 h-10 mb-2" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Upload Logo</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-95 transition-opacity flex items-center justify-center duration-300">
                      <span className="text-slate-950 text-[10px] font-black uppercase tracking-[0.3em]">Alterar Logotipo</span>
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />

                  <h3 className="text-xl font-black text-white truncate w-full px-4 tracking-tight"><span>{company.name || 'Nome da Empresa'}</span></h3>
                  <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.3em] mt-2"><span>{company.cnpj || 'CNPJ Pendente'}</span></p>
                </div>

                {/* Important Guidelines Card */}
                <div className="bg-white/5 p-8 rounded-xl border border-[#1e293b] space-y-4">
                  <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-3">
                    <FileText className="w-5 h-5" /> <span>Diretrizes</span>
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    O logotipo enviado será redimensionado automaticamente para caber nos cabeçalhos da <b>Ordem de Serviço</b> e da <b>Nota Fiscal Eletrônica</b>. Recomendamos o uso de fundo transparente (PNG).
                  </p>
                </div>

                {/* Splash Screen White-Label Settings */}
                <div className="bg-[#0b1221] border border-[#1e293b] p-8 rounded-xl shadow-xl space-y-6">
                  <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-3">
                    <Globe className="w-5 h-5 text-white animate-pulse" /> <span>Splash Screen Premium</span>
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Personalize a tela de carregamento que aparece ao abrir o sistema.
                  </p>

                  <div className="border-t border-[#1e293b] pt-4 space-y-4">
                    {/* Toggle switch for enabled */}
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Ativar Apresentação</span>
                      <button
                        onClick={() => setSplashEnabled(!splashEnabled)}
                        className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 ${splashEnabled ? 'bg-white' : 'bg-white/10'}`}
                      >
                        <div className={`w-5 h-5 rounded-full transition-transform duration-300 ${splashEnabled ? 'translate-x-6 bg-[#1C1C26]' : 'translate-x-0 bg-slate-400'}`} />
                      </button>
                    </div>

                    {/* Numeric duration input */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] block ml-1">Duração (milissegundos)</label>
                      <input
                        type="number"
                        min="500"
                        max="10000"
                        value={splashDuration}
                        onChange={(e) => setSplashDuration(Math.max(500, parseInt(e.target.value, 10) || 1600))}
                        className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-xl px-4 py-3 text-white text-xs font-bold focus:border-white/20 focus:ring-1 focus:ring-white/10 outline-none transition-all placeholder:text-slate-700"
                      />
                    </div>

                    {/* Logo URL Override */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] block ml-1">URL do Logo Customizado</label>
                      <input
                        type="text"
                        value={splashLogoUrl}
                        onChange={(e) => setSplashLogoUrl(e.target.value)}
                        placeholder="Em branco usa logo oficial"
                        className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-xl px-4 py-3 text-white text-xs font-bold focus:border-white/20 focus:ring-1 focus:ring-white/10 outline-none transition-all placeholder:text-slate-700"
                      />
                    </div>

                    {/* Welcome message text */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] block ml-1">Mensagem de Boas-vindas</label>
                      <input
                        type="text"
                        value={splashMessage}
                        onChange={(e) => setSplashMessage(e.target.value)}
                        placeholder="Carregando estrutura digital..."
                        className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-xl px-4 py-3 text-white text-xs font-bold focus:border-white/20 focus:ring-1 focus:ring-white/10 outline-none transition-all placeholder:text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile App Download Card */}
                <div className="bg-[#0b1221] border border-[#1e293b] p-8 rounded-xl shadow-xl space-y-4">
                  <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-3">
                    <Download className="w-5 h-5 text-white" /> <span>Aplicativo Mobile</span>
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Baixe o aplicativo para Android e gerencie sua estamparia diretamente do celular.
                  </p>
                  <a
                    href="/estamparia-pro.apk"
                    download
                    className="mt-4 w-full flex items-center justify-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 bg-[#8B5CF6] text-white hover:bg-slate-200 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-white/5"
                  >
                    <Download className="w-5 h-5" /> Instalar APK
                  </a>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-8">
                <div className="bg-[#0b1221] border border-[#1e293b] rounded-xl p-10 shadow-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                    <div className="space-y-3 col-span-full md:col-span-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                        <Building2 className="w-4 h-4 text-white" /> <span>Razão Social</span>
                      </label>
                      <input
                        name="name"
                        value={company.name}
                        onChange={handleChange}
                        placeholder="Ex: Estamparia Alfa LTDA"
                        className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-2xl px-6 py-4 text-white font-bold focus:border-white/20 focus:ring-2 focus:ring-white/10 outline-none transition-all placeholder:text-slate-700"
                      />
                    </div>
                    <div className="space-y-3 col-span-full md:col-span-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                        <FileText className="w-4 h-4 text-white" /> <span>CNPJ Oficial</span>
                      </label>
                      <input
                        name="cnpj"
                        value={company.cnpj}
                        onChange={handleChange}
                        placeholder="00.000.000/0000-00"
                        className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-2xl px-6 py-4 text-white font-bold focus:border-white/20 focus:ring-2 focus:ring-white/10 outline-none transition-all placeholder:text-slate-700"
                      />
                    </div>
                    <div className="space-y-3 col-span-full md:col-span-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                        <Mail className="w-4 h-4 text-white" /> <span>Email de Contato</span>
                      </label>
                      <input
                        name="email"
                        value={company.email}
                        onChange={handleChange}
                        placeholder="comercial@empresa.com"
                        className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-2xl px-6 py-4 text-white font-bold focus:border-white/20 focus:ring-2 focus:ring-white/10 outline-none transition-all placeholder:text-slate-700"
                      />
                    </div>
                    <div className="space-y-3 col-span-full md:col-span-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                        <Phone className="w-4 h-4 text-white" /> <span>Telefone / WhatsApp</span>
                      </label>
                      <input
                        name="phone"
                        value={company.phone}
                        onChange={handleChange}
                        placeholder="(00) 00000-0000"
                        className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-2xl px-6 py-4 text-white font-bold focus:border-white/20 focus:ring-2 focus:ring-white/10 outline-none transition-all placeholder:text-slate-700"
                      />
                    </div>
                    <div className="space-y-3 col-span-full md:col-span-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                        <Globe className="w-4 h-4 text-white" /> <span>Site Oficial</span>
                      </label>
                      <input
                        name="website"
                        value={company.website || ''}
                        onChange={handleChange}
                        placeholder="https://www.suaempresa.com"
                        className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-2xl px-6 py-4 text-white font-bold focus:border-white/20 focus:ring-2 focus:ring-white/10 outline-none transition-all placeholder:text-slate-700"
                      />
                    </div>
                    <div className="col-span-full space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                        <Globe className="w-4 h-4 text-white" /> <span>Endereço da Sede</span>
                      </label>
                      <input
                        name="address"
                        value={company.address}
                        onChange={handleChange}
                        placeholder="Rua, Número, Bairro, Cidade - UF"
                        className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-2xl px-6 py-4 text-white font-bold focus:border-white/20 focus:ring-2 focus:ring-white/10 outline-none transition-all placeholder:text-slate-700"
                      />
                    </div>
                    <div className="col-span-full space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                        <Landmark className="w-4 h-4 text-white" /> <span>Informações Financeiras (PIX / Dados Bancários)</span>
                      </label>
                      <textarea
                        name="bank_info"
                        value={company.bank_info || ''}
                        onChange={handleChange}
                        placeholder="Descreva aqui como o cliente deve realizar o pagamento..."
                        className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-2xl px-6 py-4 text-white font-bold focus:border-white/20 focus:ring-2 focus:ring-white/10 outline-none transition-all h-32 resize-none placeholder:text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in zoom-in-95 duration-300 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Add New User */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-[#0b1221] border border-[#1e293b] rounded-xl p-10 shadow-2xl space-y-6">
              <h3 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight">
                <UserPlus className="w-6 h-6 text-white" /> <span>Novo Usuário</span>
              </h3>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block ml-1">Nome Completo</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-2xl px-5 py-4 text-white font-bold focus:border-white/20 focus:ring-2 focus:ring-white/10 outline-none transition-all placeholder:text-slate-700"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block ml-1">Função / Cargo</label>
                <div className="relative">
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
                    className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-2xl px-5 py-4 text-white font-bold focus:border-white/20 focus:ring-2 focus:ring-white/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="" className="bg-[#1C1C26]">Selecione o Cargo...</option>
                    {Object.values(UserRole).map(role => (
                      <option key={role} value={role} className="bg-[#1C1C26]">{role}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block ml-1 flex items-center justify-between">
                  <span>Senha de Acesso (Visível)</span>
                  <span className="text-slate-500 font-medium normal-case tracking-normal">Opcional</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={newMemberPassword}
                    onChange={(e) => setNewMemberPassword(e.target.value)}
                    placeholder="Ex: msenha123"
                    className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:border-white/20 focus:ring-2 focus:ring-white/10 outline-none transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveMember}
                disabled={!newMemberName || !newMemberRole}
                className="w-full py-4 bg-[#8B5CF6] text-white hover:bg-slate-200 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_4px_20px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> <span>Cadastrar Membro</span>
              </button>
            </div>

            {/* Total Autonomy Card */}
            <div className="bg-emerald-950/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] p-8 rounded-xl space-y-4">
              <h4 className="text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-400" /> <span>Autonomia Total</span>
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Como administrador, você tem total autonomia para gerenciar sua equipe. Você pode resetar senhas de funcionários sem precisar saber a senha antiga ou solicitar suporte.
              </p>
            </div>
          </div>

          {/* List Users */}
          <div className="lg:col-span-8">
            <div className="bg-[#0b1221] border border-[#1e293b] rounded-xl p-10 shadow-2xl min-h-[500px]">
              <h3 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight mb-8">
                <Users className="w-6 h-6 text-white" /> <span>Membros da Equipe</span>
              </h3>

              {isLoadingTeam ? (
                <div className="text-slate-500 text-center py-20">Carregando equipe...</div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center gap-4 opacity-50">
                  <Users className="w-16 h-16 text-slate-700" />
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Nenhum membro cadastrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-5 bg-[#1C1C26]/60 border border-[#1e293b] rounded-2xl hover:border-white/20 transition-all duration-300 group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white font-black text-lg border border-[#1e293b] uppercase">
                          {member.name.substring(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-200 text-sm uppercase tracking-wide flex items-center gap-3">
                            {member.name}
                            
                            {/* Password Viewer */}
                            {member.visible_password && editingPasswordId !== member.id && (
                              <button 
                                onClick={() => setVisiblePasswords(prev => ({...prev, [member.id]: !prev[member.id]}))}
                                className="text-[10px] font-bold text-slate-400 hover:text-white bg-[#1C1C26] border border-[#1e293b] px-2 py-0.5 rounded cursor-pointer transition-all duration-300 flex items-center gap-1"
                                title="Mostrar/Ocultar Senha de Login"
                              >
                                🔑 {visiblePasswords[member.id] ? member.visible_password : '••••••'}
                              </button>
                            )}

                          </h4>
                          <span className="text-white/60 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-lg border border-[#1e293b] mt-1 inline-block text-[9px] font-bold">
                            {member.role}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingPasswordId === member.id ? (
                           <div className="flex items-center gap-2 mr-2">
                             <input 
                               autoFocus
                               type="text" 
                               value={editPasswordValue}
                               onChange={e => setEditPasswordValue(e.target.value)}
                               placeholder="Nova Senha..."
                               className="bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-white w-32 focus:border-white/20 focus:ring-1 focus:ring-white/10 outline-none"
                             />
                             <button onClick={() => handleUpdatePassword(member.id)} className="text-emerald-400 hover:bg-emerald-500/20 p-2 rounded-lg transition-colors"><Save className="w-4 h-4" /></button>
                             <button onClick={() => setEditingPasswordId(null)} className="text-rose-400 hover:bg-rose-500/20 p-2 rounded-lg transition-colors"><XCircle className="w-4 h-4" /></button>
                           </div>
                        ) : (
                           <button
                             onClick={() => { setEditingPasswordId(member.id); setEditPasswordValue(''); }}
                             className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-all duration-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 border border-[#1e293b]"
                             title="Resetar senha deste funcionário imediatamente"
                           >
                             Resetar Senha
                           </button>
                        )}
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="text-slate-400 hover:text-rose-400 p-3 hover:bg-rose-500/10 rounded-xl transition-all"
                          title="Remover Usuário"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDeleteMemberId}
        title="Remover Membro"
        message="Tem certeza que deseja remover este membro da equipe?"
        variant="danger"
        confirmLabel="Remover"
        onConfirm={() => { if (confirmDeleteMemberId) doDeleteMember(confirmDeleteMemberId); setConfirmDeleteMemberId(null); }}
        onCancel={() => setConfirmDeleteMemberId(null)}
      />
    </div>
  );
};

export default Settings;
