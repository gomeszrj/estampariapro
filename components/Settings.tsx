
import React, { useState, useEffect, useRef } from 'react';
import { Building2, Save, Upload, Globe, Phone, Mail, FileText, Landmark, Camera, CheckCircle2 } from 'lucide-react';

interface CompanyData {
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  bankInfo: string;
  logoUrl: string;
}

const Settings: React.FC = () => {
  const [company, setCompany] = useState<CompanyData>({
    name: '',
    cnpj: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    bankInfo: '',
    logoUrl: '',
  });

  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('company_data');
    if (stored) {
      setCompany(JSON.parse(stored));
    } else {
        // Default placeholders if none exist
        setCompany({
            name: 'Minha Estamparia Profissional',
            cnpj: '00.000.000/0001-00',
            address: 'Rua das Indústrias, 1000 - Setor Industrial',
            phone: '(11) 99999-9999',
            email: 'diretoria@estamparia.ai',
            website: 'www.estamparia.ai',
            bankInfo: 'PIX: 00.000.000/0001-00 (CNPJ)',
            logoUrl: '',
        });
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('company_data', JSON.stringify(company));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    window.dispatchEvent(new Event('companyDataUpdated'));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompany(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompany(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in slide-in-from-bottom-6 duration-700 pb-20">
      <header className="flex justify-between items-end border-b border-slate-800 pb-8">
        <div>
          <h2 className="text-4xl font-black text-slate-100 tracking-tighter uppercase mb-2">Identidade Corporativa</h2>
          <p className="text-slate-500 font-medium">Configure os dados oficiais que darão autoridade aos seus documentos e notas fiscais.</p>
        </div>
        <button
          onClick={handleSave}
          className={`px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center gap-3 shadow-2xl ${saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'}`}
        >
          {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saved ? 'Dados Atualizados' : 'Salvar Configurações'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-slate-800 flex flex-col items-center text-center shadow-xl">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 block">Logotipo Oficial</label>
            <div 
              onClick={triggerUpload}
              className="w-48 h-48 rounded-[2.5rem] bg-slate-950 border-2 border-dashed border-slate-800 flex items-center justify-center mb-6 overflow-hidden relative group cursor-pointer transition-all hover:border-indigo-500/50"
            >
              {company.logoUrl ? (
                <img src={company.logoUrl} alt="Logo Empresa" className="w-full h-full object-contain p-4 bg-white" />
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
                  value={company.bankInfo}
                  onChange={handleChange}
                  placeholder="Descreva aqui como o cliente deve realizar o pagamento..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-32 resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
