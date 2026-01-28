
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, CreditCard, PieChart } from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface FinanceProps {
  orders: Order[];
}

const FinanceStat = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-[#0f172a] p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
        {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(trend)}%
      </div>
    </div>
    <div>
      <h3 className="text-slate-500 text-[11px] font-black uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-2xl font-black text-slate-100">{value}</p>
    </div>
  </div>
);

const Finance: React.FC<FinanceProps> = ({ orders }) => {
  const totalRevenue = orders.reduce((acc, curr) => acc + curr.totalValue, 0);
  const ticketMedio = orders.length > 0 ? totalRevenue / orders.length : 0;
  const pendingRevenue = orders.filter(o => o.status !== OrderStatus.FINISHED).reduce((acc, curr) => acc + curr.totalValue, 0);

  const data = [
    { name: 'Jan', value: totalRevenue * 0.7 },
    { name: 'Fev', value: totalRevenue * 0.8 },
    { name: 'Mar', value: totalRevenue },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-100 tracking-tight">Financeiro</h2>
        <p className="text-slate-500">Gestão de faturamento, custos e análise de performance.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FinanceStat title="Faturamento Bruto" value={`R$ ${totalRevenue.toLocaleString('pt-BR')}`} icon={DollarSign} color="bg-indigo-600" trend={14.2} />
        <FinanceStat title="Ticket Médio" value={`R$ ${ticketMedio.toLocaleString('pt-BR')}`} icon={TrendingUp} color="bg-emerald-600" trend={3.1} />
        <FinanceStat title="Contas a Receber" value={`R$ ${pendingRevenue.toLocaleString('pt-BR')}`} icon={CreditCard} color="bg-amber-600" trend={-5.4} />
        <FinanceStat title="Margem Bruta" value="42%" icon={PieChart} color="bg-purple-600" trend={1.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold mb-8 text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-400" />
            Histórico Recente
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                  itemStyle={{ color: '#6366f1', fontWeight: 900 }}
                />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold mb-8 text-slate-100 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-400" />
            Distribuição de Volume
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(30, 41, 59, 0.4)' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
