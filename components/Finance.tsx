
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
  // 1. Calculate Aggregates
  const totalRevenue = orders.reduce((acc, curr) => acc + curr.totalValue, 0);
  const ticketMedio = orders.length > 0 ? totalRevenue / orders.length : 0;
  const pendingRevenue = orders.filter(o => o.status !== OrderStatus.FINISHED).reduce((acc, curr) => acc + curr.totalValue, 0);

  // 2. Group by Month (YYYY-MM)
  const monthlyGroups: Record<string, number> = {};

  orders.forEach(order => {
    // Check if valid date
    if (!order.createdAt) return;
    const date = new Date(order.createdAt);
    if (isNaN(date.getTime())) return;

    // Key: YYYY-MM
    const key = date.toISOString().slice(0, 7);
    monthlyGroups[key] = (monthlyGroups[key] || 0) + order.totalValue;
  });

  // 3. Convert to Array and Sort
  // Get last 6 months dynamic keys to ensure we show even empty months or just actual data?
  // Let's simplified: Show actual data sorted chronologically
  const sortedKeys = Object.keys(monthlyGroups).sort();

  // Prepare data for Chart
  // Format: { name: 'Jan', value: 1234 }
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const data = sortedKeys.map(key => {
    const [year, month] = key.split('-');
    const mIndex = parseInt(month, 10) - 1;
    return {
      name: monthNames[mIndex], // or `${monthNames[mIndex]}/${year.slice(2)}` for clarity
      fullName: `${monthNames[mIndex]}/${year}`,
      value: monthlyGroups[key]
    };
  });

  // If no data, show empty placeholder or keep empty
  if (data.length === 0) {
    const today = new Date();
    data.push({ name: monthNames[today.getMonth()], fullName: 'Atual', value: 0 });
  }

  // 4. Calculate Trends (Current Month vs Previous Month)
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentMonthValue = monthlyGroups[currentMonthKey] || 0;

  // Find previous month key
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const lastMonthKey = d.toISOString().slice(0, 7);
  const lastMonthValue = monthlyGroups[lastMonthKey] || 0;

  let trendPercentage = 0;
  if (lastMonthValue > 0) {
    trendPercentage = ((currentMonthValue - lastMonthValue) / lastMonthValue) * 100;
  } else if (currentMonthValue > 0) {
    trendPercentage = 100; // 100% growth if prev was 0
  }

  // Ensure 1 decimal
  const formattedTrend = Number(trendPercentage.toFixed(1));

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-100 tracking-tight">Financeiro</h2>
        <p className="text-slate-500">Gestão de faturamento, custos e análise de performance.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FinanceStat title="Faturamento Bruto" value={`R$ ${totalRevenue.toLocaleString('pt-BR')}`} icon={DollarSign} color="bg-indigo-600" trend={formattedTrend} />
        <FinanceStat title="Ticket Médio" value={`R$ ${ticketMedio.toLocaleString('pt-BR')}`} icon={TrendingUp} color="bg-emerald-600" trend={0.0} />
        <FinanceStat title="Contas a Receber" value={`R$ ${pendingRevenue.toLocaleString('pt-BR')}`} icon={CreditCard} color="bg-amber-600" trend={0.0} />
        <FinanceStat title="Margem Bruta (Est.)" value="42%" icon={PieChart} color="bg-purple-600" trend={0.0} />
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
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Faturamento']}
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
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Volume']}
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
