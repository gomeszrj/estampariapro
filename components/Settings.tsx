import React, { useState, useEffect, useRef } from 'react';
import { Building2, Save, Upload, Globe, Phone, Mail, FileText, Landmark, Camera, CheckCircle2, Users, UserPlus, Trash2, Shield, User, MessageSquare } from 'lucide-react';
import { teamService } from '../services/teamService';
import { settingsService, CompanySettings } from '../services/settingsService';
import { TeamMember, UserRole } from '../types';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'company' | 'team' | 'bot'>('company');
  const [company, setCompany] = useState<CompanySettings>({
    name: '',
    cnpj: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    bank_info: '', // Note: component uses bankInfo in some places, unifying on bank_info where possible or keeping strict
    logo_url: '',
    evolution_api_url: '',
    evolution_api_key: '',
    evolution_instance_name: '',
  });

  // Team State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole | ''>('');
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
    loadTeam();
  }, []);

  const loadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const data = await settingsService.getSettings();
      // Ensure we merge with default keys if they are missing
      setCompany(prev => ({ ...prev, ...data }));
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
        active: true
      });
      setNewMemberName('');
      setNewMemberRole('');
      loadTeam();
    } catch (e) {
      alert("Erro ao adicionar membro (Verifique se a tabela team_members existe no Supabase)");
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (confirm("Remover este membro da equipe?")) {
      await teamService.delete(id);
      loadTeam();
    }
  };

  const handleSave = async () => {
    try {
      await settingsService.saveSettings(company);
      setSaved(true);
      window.dispatchEvent(new Event('settingsUpdated'));
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings", error);
      alert("Erro ao salvar configurações.");
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
      } catch (error) {
        console.error(error);
        alert("Erro ao fazer upload da imagem. Tente novamente.");
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
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-800 pb-6 gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-100 tracking-tighter uppercase mb-2">
            {activeTab === 'company' ? 'Identidade Corporativa' : 'Gestão de Equipe'}
          </h2>
          <p className="text-slate-500 font-medium">
            {activeTab === 'company'
              ? 'Configure os dados oficiais que darão autoridade aos seus documentos.'
              : activeTab === 'team'
                ? 'Gerencie os usuários e permissões de acesso ao sistema.'
                : 'Configure a inteligência artificial do seu CloudBot.'}
          </p>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('company')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'company' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Dados da Empresa
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'team' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Equipe & Acessos
          </button>
          <button
            onClick={() => setActiveTab('bot')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'bot' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
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
              className={`px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center gap-3 shadow-2xl ${saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'}`}
            >
              <span>{saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}</span>
              {saved ? 'Dados Atualizados' : (isLoadingSettings ? 'Carregando...' : 'Salvar Configurações')}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-slate-800 shadow-xl">
                <h3 className="text-xl font-black text-slate-100 flex items-center gap-2 uppercase tracking-tight mb-4">
                  <MessageSquare className="w-6 h-6 text-indigo-500" /> CloudBot
                </h3>
                <p className="text-slate-400 text-sm mb-8">
                  Ative o agente autônomo para responder clientes no WhatsApp 24/7.
                </p>

                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <span className="font-black text-slate-300 uppercase tracking-widest text-xs">Status do Robô</span>
                  <button
                    onClick={() => setCompany(prev => ({ ...prev, cloudbot_enabled: !prev.cloudbot_enabled }))}
                    className={`w-14 h-8 rounded-full p-1 transition-colors ${company.cloudbot_enabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full transition-transform ${company.cloudbot_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-8">
              <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-slate-800 shadow-xl space-y-6">
                <h3 className="text-xl font-black text-slate-100 flex items-center gap-2 uppercase tracking-tight mb-2">
                  <Globe className="w-6 h-6 text-indigo-500" /> Conexão Evolution API
                </h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">Configure a URL e Chave da API para conectar o WhatsApp.</p>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] block ml-1">Instance Name</label>
                  <input
                    name="evolution_instance_name"
                    value={company.evolution_instance_name || ''}
                    onChange={handleChange}
                    placeholder="Ex: estamparia_bot"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] block ml-1">API URL</label>
                  <input
                    name="evolution_api_url"
                    value={company.evolution_api_url || ''}
                    onChange={handleChange}
                    placeholder="https://api.evolution..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] block ml-1">API Key</label>
                  <input
                    name="evolution_api_key"
                    value={company.evolution_api_key || ''}
                    onChange={handleChange}
                    type="password"
                    placeholder="sk-..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
              className={`px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center gap-3 shadow-2xl ${saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'}`}
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
                <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-slate-800 flex flex-col items-center text-center shadow-xl">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 block">Logotipo Oficial</label>
                  <div
                    onClick={triggerUpload}
                    className="w-48 h-48 rounded-[2.5rem] bg-slate-950 border-2 border-dashed border-slate-800 flex items-center justify-center mb-6 overflow-hidden relative group cursor-pointer transition-all hover:border-indigo-500/50"
                  >
                    {company.logo_url ? (
                      <img src={company.logo_url} alt="Logo Empresa" className="w-full h-full object-contain p-4 bg-white" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-600">
                        <Camera className="w-10 h-10 mb-2" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Upload Logo</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-indigo-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Alterar Logotipo</span>
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />

                  <h3 className="text-xl font-black text-slate-100 truncate w-full px-4 tracking-tight">{company.name || 'Nome da Empresa'}</h3>
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mt-2">{company.cnpj || 'CNPJ Pendente'}</p>
                </div>

                <div className="bg-indigo-500/5 p-8 rounded-[2.5rem] border border-indigo-500/10 space-y-4">
                  <h4 className="text-indigo-400 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                    <FileText className="w-5 h-5" /> Importante
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    O logotipo enviado será redimensionado automaticamente para caber nos cabeçalhos da <b>Ordem de Serviço</b> e da <b>Nota Fiscal Eletrônica</b>. Recomendamos o uso de fundo transparente (PNG).
                  </p>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-8">
                <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-slate-800 shadow-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                    <div className="space-y-3 col-span-full md:col-span-1">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                        <Building2 className="w-4 h-4 text-indigo-500" /> Razão Social
                      </label>
                      <input
                        name="name"
                        value={company.name}
                        onChange={handleChange}
                        placeholder="Ex: Estamparia Alfa LTDA"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-800"
                      />
                    </div>
                    <div className="space-y-3 col-span-full md:col-span-1">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                        <FileText className="w-4 h-4 text-indigo-500" /> CNPJ Oficial
                      </label>
                      <input
                        name="cnpj"
                        value={company.cnpj}
                        onChange={handleChange}
                        placeholder="00.000.000/0000-00"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-800"
                      />
                    </div>
                    <div className="space-y-3 col-span-full md:col-span-1">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                        <Mail className="w-4 h-4 text-indigo-500" /> Email de Contato
                      </label>
                      <input
                        name="email"
                        value={company.email}
                        onChange={handleChange}
                        placeholder="comercial@empresa.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-3 col-span-full md:col-span-1">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                        <Phone className="w-4 h-4 text-indigo-500" /> Telefone / WhatsApp
                      </label>
                      <input
                        name="phone"
                        value={company.phone}
                        onChange={handleChange}
                        placeholder="(00) 00000-0000"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="col-span-full space-y-3">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                        <Globe className="w-4 h-4 text-indigo-500" /> Endereço da Sede
                      </label>
                      <input
                        name="address"
                        value={company.address}
                        onChange={handleChange}
                        placeholder="Rua, Número, Bairro, Cidade - UF"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="col-span-full space-y-3">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                        <Landmark className="w-4 h-4 text-indigo-500" /> Informações Financeiras (PIX / Dados Bancários)
                      </label>
                      <textarea
                        name="bankInfo"
                        // Handle potential property name mismatch safely
                        value={company.bankInfo || company.bank_info || ''}
                        onChange={handleChange}
                        placeholder="Descreva aqui como o cliente deve realizar o pagamento..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-32 resize-none"
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
            <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-slate-800 shadow-xl space-y-6">
              <h3 className="text-xl font-black text-slate-100 flex items-center gap-2 uppercase tracking-tight">
                <UserPlus className="w-6 h-6 text-indigo-500" /> Novo Usuário
              </h3>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] block ml-1">Nome Completo</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] block ml-1">Função / Cargo</label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Selecione o Cargo...</option>
                  {Object.values(UserRole).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSaveMember}
                disabled={!newMemberName || !newMemberRole}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Cadastrar Membro
              </button>
            </div>

            <div className="bg-emerald-500/5 p-8 rounded-[2.5rem] border border-emerald-500/10 space-y-4">
              <h4 className="text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                <Shield className="w-5 h-5" /> Segurança
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Os usuários cadastrados terão acesso às funções do sistema conforme seus cargos. O gerente tem acesso total.
              </p>
            </div>
          </div>

          {/* List Users */}
          <div className="lg:col-span-8">
            <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-slate-800 shadow-xl min-h-[500px]">
              <h3 className="text-xl font-black text-slate-100 flex items-center gap-2 uppercase tracking-tight mb-8">
                <Users className="w-6 h-6 text-indigo-500" /> Membros da Equipe
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
                    <div key={member.id} className="flex items-center justify-between p-5 bg-slate-950 border border-slate-800 rounded-2xl hover:border-indigo-500/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400 font-black text-lg border border-slate-800 uppercase">
                          {member.name.substring(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-200 text-sm uppercase tracking-wide">{member.name}</h4>
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/10">
                            {member.role}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="text-slate-600 hover:text-rose-500 p-3 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Remover Usuário"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
