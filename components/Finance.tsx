import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Wallet,
  Percent,
  Plus,
  Calendar,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  X,
  ChevronRight,
  ArrowDown,
  ArrowUp,
  MoreVertical,
  Download,
  Printer,
  Trash2
} from 'lucide-react';
import { Order, OrderStatus, OrderType, Product, Transaction } from '../types';
import { financeService } from '../services/financeService';
import { notify } from './ui/toast';

interface FinanceProps {
  orders: Order[];
  products: Product[];
}

const FinanceStat = ({ title, value, icon: Icon, iconBg, iconColor, trendValue, trendIsPositive }: any) => (
  <div className="bg-[#151B2B] p-5 rounded-2xl border border-[#1e293b] flex flex-col justify-between shadow-lg">
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2.5 rounded-xl ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
    <div className="mt-2">
      <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-2xl font-black text-white tracking-tight">{value}</p>
      {trendValue !== undefined && (
        <p className={`text-[10px] font-bold mt-1 ${trendIsPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trendIsPositive ? '+' : '-'}{trendValue}% <span className="text-slate-500 font-medium">vs mês anterior</span>
        </p>
      )}
    </div>
  </div>
);

const Finance: React.FC<FinanceProps> = ({ orders, products }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAllIncome, setShowAllIncome] = useState(false);
  const [showAllExpense, setShowAllExpense] = useState(false);

  // Month/Year Filter State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // New Transaction Form State
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: 'expense',
    category: 'other',
    date: new Date().toISOString().split('T')[0]
  });
  const [saving, setSaving] = useState(false);

  const loadTransactions = async () => {
    try {
      const data = await financeService.getAll();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este lançamento? O valor será removido do saldo do seu caixa.")) {
      try {
        await financeService.delete(id);
        notify.success("Lançamento removido com sucesso.");
        loadTransactions();
      } catch (error) {
        console.error(error);
        notify.error("Falha ao remover lançamento.");
      }
    }
  };

  const handleSaveTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description) return;
    setSaving(true);
    try {
      const created = await financeService.create({
        type: newTransaction.type as 'income' | 'expense',
        category: newTransaction.category as any,
        amount: Number(newTransaction.amount),
        description: newTransaction.description,
        date: new Date(newTransaction.date!).toISOString()
      });
      setTransactions(prev => [created, ...prev]);
      setIsAdding(false);
      setNewTransaction({ type: 'expense', category: 'other', date: new Date().toISOString().split('T')[0] });
      notify.success('Transação registrada!');
    } catch (error) {
      console.error("Failed to save transaction", error);
      notify.error('Erro ao salvar transação.');
    } finally {
      setSaving(false);
    }
  };

  // --- CALCULATIONS ---

  // 0. Filter Data for Selected Month
  const isCurrentMonth = (dateString: string | undefined) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
  };

  // Helper: verifica se uma data pertence ao mês anterior ao selecionado
  const isPreviousMonth = (dateString: string | undefined) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth === 0) { prevMonth = 12; prevYear--; }
    return date.getMonth() + 1 === prevMonth && date.getFullYear() === prevYear;
  };

  const revenueOrders = orders.filter(o => o.orderType !== OrderType.BUDGET);
  const currentMonthTransactions = transactions.filter(t => isCurrentMonth(t.date));
  const currentMonthOrders = revenueOrders.filter(o => isCurrentMonth(o.createdAt));
  const prevMonthTransactions = transactions.filter(t => isPreviousMonth(t.date));
  const prevMonthOrders = revenueOrders.filter(o => isPreviousMonth(o.createdAt));

  // 1. Revenue (Realizada no mês)
  const incomeTransactions = currentMonthTransactions.filter(t => t.type === 'income');
  const totalRevenue = incomeTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const prevRevenue = prevMonthTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);

  // 2. Production Costs (Custos dos pedidos do mês)
  const productMap = React.useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => map.set(p.id, p));
    return map;
  }, [products]);

  const productionCosts = currentMonthOrders.reduce((acc, order) => {
    return acc + order.items.reduce((itemAcc, item) => {
      // Use frozen unitCost from order if available, else fallback to current product cost
      let cost = item.unitCost;
      if (cost === undefined || cost === null) {
        const product = productMap.get(item.productId);
        cost = product?.costPrice || 0;
      }
      return itemAcc + (cost * item.quantity);
    }, 0);
  }, 0);
  const prevProductionCosts = prevMonthOrders.reduce((acc, order) => {
    return acc + order.items.reduce((itemAcc, item) => {
      let cost = item.unitCost;
      if (cost === undefined || cost === null) {
        const product = productMap.get(item.productId);
        cost = product?.costPrice || 0;
      }
      return itemAcc + (cost * item.quantity);
    }, 0);
  }, 0);

  // 3. Operating Expenses (Despesas do mês)
  const expenseTransactions = currentMonthTransactions.filter(t => t.type === 'expense');
  const operatingExpenses = expenseTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const prevOperatingExpenses = prevMonthTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

  // 4. Total Outflow & Net Profit (Mensal)
  const totalOutflow = operatingExpenses + productionCosts;
  const netProfit = totalRevenue - totalOutflow;
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Faturamento Bruto (Pedidos realizados no mês)
  const totalFaturamento = currentMonthOrders.reduce((acc, order) => acc + (order.totalValue || 0), 0);
  const prevFaturamento = prevMonthOrders.reduce((acc, order) => acc + (order.totalValue || 0), 0);

  // FIX LOGIC-203: Calcular percentuais de tendência reais comparando mês atual vs mês anterior
  const calcTrend = (current: number, previous: number): { value: number; isPositive: boolean } | undefined => {
    if (previous === 0) return undefined; // Não exibir tendência se não há dado anterior
    const pct = ((current - previous) / previous) * 100;
    return { value: Math.abs(Math.round(pct * 10) / 10), isPositive: pct >= 0 };
  };

  const trendFaturamento = calcTrend(totalFaturamento, prevFaturamento);
  const trendRevenue = calcTrend(totalRevenue, prevRevenue);
  const trendExpense = calcTrend(totalOutflow, prevOperatingExpenses + prevProductionCosts);
  const prevNetProfit = prevRevenue - (prevOperatingExpenses + prevProductionCosts);
  const trendProfit = calcTrend(netProfit, prevNetProfit);

  // 5. Chart Data (Últimos 6 meses, ignorando o filtro atual)

  const monthlyData: Record<string, { revenue: number, expense: number, cost: number, profit: number }> = {};

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const cutoffDate = sixMonthsAgo.toISOString();

  transactions.filter(t => t.date >= cutoffDate).forEach(t => {
    const key = t.date.slice(0, 7);
    if (!monthlyData[key]) monthlyData[key] = { revenue: 0, expense: 0, cost: 0, profit: 0 };
    if (t.type === 'income') {
      monthlyData[key].revenue += t.amount;
    } else {
      monthlyData[key].expense += t.amount;
    }
  });

  revenueOrders.filter(o => o.createdAt && o.createdAt >= cutoffDate).forEach(o => {
    if (!o.createdAt) return;
    const key = o.createdAt.slice(0, 7);
    if (!monthlyData[key]) monthlyData[key] = { revenue: 0, expense: 0, cost: 0, profit: 0 };
    const orderCost = o.items.reduce((acc, item) => {
      let cost = item.unitCost;
      if (cost === undefined || cost === null) {
        const p = productMap.get(item.productId);
        cost = p?.costPrice || 0;
      }
      return acc + (cost * item.quantity);
    }, 0);
    monthlyData[key].cost += orderCost;
  });

  Object.keys(monthlyData).forEach(key => {
    const data = monthlyData[key];
    data.profit = data.revenue - (data.expense + data.cost);
  });

  const chartData = Object.keys(monthlyData).sort().map(key => {
    const [year, month] = key.split('-');
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return {
      name: `${months[parseInt(month) - 1]}/${year.slice(2)}`,
      Receitas: monthlyData[key].revenue,
      Despesas: monthlyData[key].expense + monthlyData[key].cost,
      'Lucro líquido': monthlyData[key].profit
    };
  });

  // Helpers for Mockup Visuals
  const getInitials = (text: string) => {
    if (!text) return '??';
    const words = text.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const getRandomColor = (id: string) => {
    const colors = ['bg-indigo-600', 'bg-blue-600', 'bg-emerald-600', 'bg-orange-500', 'bg-purple-600', 'bg-pink-600', 'bg-cyan-600'];
    const index = id.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  const formatMoney = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 relative pb-20">

      {/* NEW TRANSACTION MODAL */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-[#151B2B] border border-[#1e293b] rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white uppercase flex items-center gap-2">
                <Plus className="w-5 h-5 text-white" />
                Nova Movimentação
              </h3>
              <button onClick={() => setIsAdding(false)} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                  className={`flex-1 py-3 rounded-xl font-black uppercase text-xs border transition-all ${newTransaction.type === 'income' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#0f172a] text-slate-500 border-[#1e293b] hover:bg-slate-800'}`}
                >
                  Receita
                </button>
                <button
                  onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                  className={`flex-1 py-3 rounded-xl font-black uppercase text-xs border transition-all ${newTransaction.type === 'expense' ? 'bg-rose-600/20 text-rose-400 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'bg-[#0f172a] text-slate-500 border-[#1e293b] hover:bg-slate-800'}`}
                >
                  Despesa
                </button>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Valor (R$)</label>
                <input
                  type="number"
                  autoFocus
                  className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 text-white focus:border-slate-600 focus:ring-1 focus:ring-slate-700/50 outline-none font-bold text-xl"
                  placeholder="0.00"
                  value={newTransaction.amount || ''}
                  onChange={e => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Descrição</label>
                <input
                  className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 text-white focus:border-slate-600 focus:ring-1 focus:ring-slate-700/50 outline-none font-bold"
                  placeholder="Ex: Pagamento Aluguel"
                  value={newTransaction.description || ''}
                  onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Categoria</label>
                  <select
                    className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 text-slate-300 focus:border-slate-600 focus:ring-1 focus:ring-slate-700/50 outline-none font-bold text-sm"
                    value={newTransaction.category}
                    onChange={e => setNewTransaction({ ...newTransaction, category: e.target.value as any })}
                  >
                    <option value="sale">Venda</option>
                    <option value="material">Material</option>
                    <option value="rent">Aluguel</option>
                    <option value="utility">Contas (Luz/Água)</option>
                    <option value="salary">Salário</option>
                    <option value="other">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Data</label>
                  <input
                    type="date"
                    className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 text-slate-300 focus:border-slate-600 focus:ring-1 focus:ring-slate-700/50 outline-none font-bold text-sm"
                    value={newTransaction.date}
                    onChange={e => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  />
                </div>
              </div>

              <button
                onClick={handleSaveTransaction}
                disabled={saving}
                className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-indigo-900/20 active:scale-95 transition-all mt-4 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Financeiro
          </h2>
          <p className="text-slate-400 text-xs font-medium mt-1">Acompanhe o desempenho financeiro da sua estamparia.</p>
        </div>
        <div className="flex gap-4 print:hidden">
           <div className="bg-[#151B2B] text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg border border-[#1e293b] flex items-center gap-2 transition-all">
             <Calendar className="w-4 h-4" />
             <select 
               className="bg-transparent text-white outline-none font-black uppercase text-[10px] tracking-widest cursor-pointer"
               value={selectedMonth}
               onChange={(e) => setSelectedMonth(Number(e.target.value))}
             >
               {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map((m, i) => (
                 <option key={i} value={i + 1} className="bg-slate-900">{m}</option>
               ))}
             </select>
             <span className="text-slate-600">/</span>
             <select 
               className="bg-transparent text-white outline-none font-black uppercase text-[10px] tracking-widest cursor-pointer"
               value={selectedYear}
               onChange={(e) => setSelectedYear(Number(e.target.value))}
             >
               {[2025, 2026, 2027, 2028].map((y) => (
                 <option key={y} value={y} className="bg-slate-900">{y}</option>
               ))}
             </select>
           </div>
           <button
             onClick={() => window.print()}
             className="bg-[#0f172a] hover:bg-slate-800 text-slate-300 border border-[#1e293b] px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2"
           >
             <Printer className="w-4 h-4" />
             Imprimir
           </button>
           <button
             onClick={() => setIsAdding(true)}
             className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2"
           >
             <Plus className="w-4 h-4" />
             Nova Movimentação
           </button>
        </div>
      </header>

      {/* 5 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <FinanceStat
          title="Faturamento (Mês)"
          value={`R$ ${formatMoney(totalFaturamento)}`}
          icon={DollarSign}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-400"
          trendValue={trendFaturamento?.value}
          trendIsPositive={trendFaturamento?.isPositive ?? true}
        />
        <FinanceStat
          title="Receitas (Mês)"
          value={`R$ ${formatMoney(totalRevenue)}`}
          icon={ArrowDown}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-400"
          trendValue={trendRevenue?.value}
          trendIsPositive={trendRevenue?.isPositive ?? true}
        />
        <FinanceStat
          title="Despesas (Mês)"
          value={`R$ ${formatMoney(totalOutflow)}`}
          icon={ArrowUp}
          iconBg="bg-rose-500/10"
          iconColor="text-rose-400"
          trendValue={trendExpense?.value}
          trendIsPositive={!(trendExpense?.isPositive ?? false)}
        />
        <FinanceStat
          title="Lucro Líquido (Mês)"
          value={`R$ ${formatMoney(netProfit)}`}
          icon={TrendingUp}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-400"
          trendValue={trendProfit?.value}
          trendIsPositive={trendProfit?.isPositive ?? true}
        />
        <FinanceStat
          title="Margem de Lucro"
          value={`${margin.toFixed(1)}%`}
          icon={Wallet}
          iconBg="bg-orange-500/10"
          iconColor="text-orange-400"
        />
      </div>

      {/* MIDDLE SECTION: Chart & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART */}
        <div className="lg:col-span-6 bg-[#151B2B] p-6 rounded-2xl border border-[#1e293b] shadow-lg flex flex-col min-h-[380px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-white tracking-widest uppercase">Resumo financeiro</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-[#0b1221] px-3 py-1.5 rounded-lg border border-[#1e293b] cursor-pointer hover:text-white transition-colors">
              Últimos 6 meses <ChevronRight className="w-3 h-3 rotate-90" />
            </div>
          </div>
          
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b80" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} tickFormatter={(val) => `R$ ${val/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', fontSize: '12px' }}
                  itemStyle={{ fontWeight: 800 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Despesas" stroke="#f43f5e" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Lucro líquido" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CONTAS A RECEBER */}
        <div className={`lg:col-span-3 bg-[#151B2B] p-6 rounded-2xl border border-[#1e293b] shadow-lg flex flex-col ${showAllIncome ? 'h-auto min-h-[380px]' : 'h-[380px]'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-white tracking-widest uppercase">Contas a receber</h3>
            <span onClick={() => setShowAllIncome(!showAllIncome)} className="text-[10px] text-[#6366F1] font-bold cursor-pointer hover:underline uppercase">{showAllIncome ? 'Ocultar' : 'Ver todas'}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {incomeTransactions.length === 0 ? (
              <div className="text-center py-10 opacity-50 text-xs text-slate-500 font-bold">Nenhuma conta.</div>
            ) : (
              (showAllIncome ? incomeTransactions : incomeTransactions.slice(0, 5)).map(t => (
                <div key={t.id} className="flex items-center gap-3 group">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-black text-white ${getRandomColor(t.id)}`}>
                    {getInitials(t.description)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">{t.description}</p>
                    <p className="text-[9px] text-slate-500 font-medium">Pedido #{t.id.substring(0,4).toUpperCase()}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div className="flex flex-col">
                       <span className="text-[9px] text-slate-500 mb-0.5">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                       <span className="text-xs font-bold text-emerald-400 whitespace-nowrap">R$ {formatMoney(t.amount)}</span>
                    </div>
                    <button onClick={() => handleDeleteTransaction(t.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-rose-500/20 rounded" title="Excluir lançamento">
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-[#1e293b] flex justify-between items-center">
             <span className="text-xs text-slate-400 font-medium">Total a receber</span>
             <span className="text-sm font-black text-emerald-400">R$ {formatMoney(totalRevenue)}</span>
          </div>
        </div>

        {/* CONTAS A PAGAR */}
        <div className={`lg:col-span-3 bg-[#151B2B] p-6 rounded-2xl border border-[#1e293b] shadow-lg flex flex-col ${showAllExpense ? 'h-auto min-h-[380px]' : 'h-[380px]'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-white tracking-widest uppercase">Contas a pagar</h3>
            <span onClick={() => setShowAllExpense(!showAllExpense)} className="text-[10px] text-[#6366F1] font-bold cursor-pointer hover:underline uppercase">{showAllExpense ? 'Ocultar' : 'Ver todas'}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {expenseTransactions.length === 0 ? (
              <div className="text-center py-10 opacity-50 text-xs text-slate-500 font-bold">Nenhuma conta.</div>
            ) : (
              (showAllExpense ? expenseTransactions : expenseTransactions.slice(0, 5)).map(t => (
                <div key={t.id} className="flex items-center gap-3 group">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-black text-white ${getRandomColor(t.id + 'p')}`}>
                    {getInitials(t.description)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">{t.description}</p>
                    <p className="text-[9px] text-slate-500 font-medium">{t.category}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div className="flex flex-col">
                       <span className="text-[9px] text-slate-500 mb-0.5">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                       <span className="text-xs font-bold text-rose-400 whitespace-nowrap">R$ {formatMoney(t.amount)}</span>
                    </div>
                    <button onClick={() => handleDeleteTransaction(t.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-rose-500/20 rounded" title="Excluir lançamento">
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-[#1e293b] flex justify-between items-center">
             <span className="text-xs text-slate-400 font-medium">Total a pagar</span>
             <span className="text-sm font-black text-rose-400">R$ {formatMoney(operatingExpenses)}</span>
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION: Fluxo de Caixa Table */}
      <div className="bg-[#151B2B] rounded-2xl border border-[#1e293b] p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-white tracking-widest uppercase">Fluxo de caixa</h3>

        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1e293b] text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                <th className="pb-4 px-4 font-bold w-1/2">Indicador / Categoria</th>
                <th className="pb-4 px-4 font-bold text-right">Valor Consolidado</th>
                <th className="pb-4 px-4 font-bold text-right">% Relativa</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium">
              <tr className="border-b border-[#1e293b]/50 hover:bg-[#0b1221] transition-colors">
                <td className="py-4 px-4 text-slate-300 font-bold">1. Faturamento Bruto <span className="text-[9px] text-slate-500 ml-2 font-normal">(Soma de todos os pedidos)</span></td>
                <td className="py-4 px-4 text-slate-200 text-right font-black text-sm">R$ {formatMoney(totalFaturamento)}</td>
                <td className="py-4 px-4 text-slate-500 text-right">-</td>
              </tr>
              <tr className="border-b border-[#1e293b]/50 hover:bg-[#0b1221] transition-colors">
                <td className="py-4 px-4 text-emerald-400 font-bold">2. Receitas Realizadas <span className="text-[9px] text-slate-500 ml-2 font-normal">(Dinheiro em caixa)</span></td>
                <td className="py-4 px-4 text-emerald-400 text-right font-black text-sm">R$ {formatMoney(totalRevenue)}</td>
                <td className="py-4 px-4 text-emerald-500/50 text-right">{totalFaturamento > 0 ? ((totalRevenue / totalFaturamento) * 100).toFixed(1) : 0}% <span className="text-[9px]">do Fat.</span></td>
              </tr>
              <tr className="border-b border-[#1e293b]/50 hover:bg-[#0b1221] transition-colors">
                <td className="py-4 px-4 text-orange-400 font-bold">3. Custo de Produção/Fornecedor <span className="text-[9px] text-slate-500 ml-2 font-normal">(Insumos/Terceirização)</span></td>
                <td className="py-4 px-4 text-orange-400 text-right font-black text-sm">- R$ {formatMoney(productionCosts)}</td>
                <td className="py-4 px-4 text-orange-500/50 text-right">{totalRevenue > 0 ? ((productionCosts / totalRevenue) * 100).toFixed(1) : 0}% <span className="text-[9px]">da Rec.</span></td>
              </tr>
              <tr className="border-b border-[#1e293b]/50 hover:bg-[#0b1221] transition-colors">
                <td className="py-4 px-4 text-rose-400 font-bold">4. Despesas Operacionais <span className="text-[9px] text-slate-500 ml-2 font-normal">(Aluguel, luz, salários, avulsos)</span></td>
                <td className="py-4 px-4 text-rose-400 text-right font-black text-sm">- R$ {formatMoney(operatingExpenses)}</td>
                <td className="py-4 px-4 text-rose-500/50 text-right">{totalRevenue > 0 ? ((operatingExpenses / totalRevenue) * 100).toFixed(1) : 0}% <span className="text-[9px]">da Rec.</span></td>
              </tr>
              <tr className="bg-[#1e1b4b]/20 hover:bg-[#1e1b4b]/40 transition-colors">
                <td className="py-5 px-4 text-[#818cf8] font-black uppercase tracking-widest text-sm">5. Lucro Líquido Real</td>
                <td className={`py-5 px-4 text-right font-black text-lg ${netProfit >= 0 ? 'text-[#818cf8]' : 'text-rose-500'}`}>R$ {formatMoney(netProfit)}</td>
                <td className={`py-5 px-4 text-right font-black ${netProfit >= 0 ? 'text-[#818cf8]' : 'text-rose-500'}`}>{totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}% <span className="text-[9px] font-medium">Margem</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED PRINT REPORT */}
      <div className="hidden print:block mt-8 break-before-page bg-white p-8">
        <h3 className="text-xl font-black text-black uppercase mb-4 border-b-2 border-slate-800 pb-2">
          Relatório Descriminado - {selectedMonth.toString().padStart(2, '0')}/{selectedYear}
        </h3>
        
        <h4 className="text-sm font-bold text-black uppercase mt-6 mb-2">1. Receitas / Entradas</h4>
        <table className="w-full text-left text-[11px] mb-6 border-collapse">
           <thead>
             <tr className="border-b-2 border-slate-400">
               <th className="pb-2 pt-2 px-1">Data</th>
               <th className="pb-2 pt-2 px-1">Descrição</th>
               <th className="text-right pb-2 pt-2 px-1">Valor</th>
             </tr>
           </thead>
           <tbody>
             {incomeTransactions.map(t => (
               <tr key={t.id} className="border-b border-slate-200">
                 <td className="py-2 px-1 text-black">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                 <td className="py-2 px-1 text-black">{t.description}</td>
                 <td className="text-right font-bold py-2 px-1 text-black">R$ {formatMoney(t.amount)}</td>
               </tr>
             ))}
           </tbody>
        </table>

        <h4 className="text-sm font-bold text-black uppercase mt-6 mb-2">2. Despesas Operacionais</h4>
        <table className="w-full text-left text-[11px] mb-6 border-collapse">
           <thead>
             <tr className="border-b-2 border-slate-400">
               <th className="pb-2 pt-2 px-1">Data</th>
               <th className="pb-2 pt-2 px-1">Descrição</th>
               <th className="pb-2 pt-2 px-1">Categoria</th>
               <th className="text-right pb-2 pt-2 px-1">Valor</th>
             </tr>
           </thead>
           <tbody>
             {expenseTransactions.map(t => (
               <tr key={t.id} className="border-b border-slate-200">
                 <td className="py-2 px-1 text-black">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                 <td className="py-2 px-1 text-black">{t.description}</td>
                 <td className="py-2 px-1 uppercase text-black">{t.category}</td>
                 <td className="text-right font-bold py-2 px-1 text-black">R$ {formatMoney(t.amount)}</td>
               </tr>
             ))}
           </tbody>
        </table>

        <h4 className="text-sm font-bold text-black uppercase mt-6 mb-2">3. Pedidos do Mês (Faturamento e Custo)</h4>
        <table className="w-full text-left text-[11px] mb-6 border-collapse">
           <thead>
             <tr className="border-b-2 border-slate-400">
               <th className="pb-2 pt-2 px-1">Pedido</th>
               <th className="pb-2 pt-2 px-1">Cliente</th>
               <th className="text-right pb-2 pt-2 px-1">Faturamento</th>
               <th className="text-right pb-2 pt-2 px-1">Custo Insumos</th>
             </tr>
           </thead>
           <tbody>
             {currentMonthOrders.map(o => {
               const cost = o.items.reduce((acc, item) => {
                 let c = item.unitCost;
                 if (c === undefined || c === null) {
                   const p = products.find(prod => prod.id === item.productId);
                   c = p?.costPrice || 0;
                 }
                 return acc + (c * item.quantity);
               }, 0);
               return (
                 <tr key={o.id} className="border-b border-slate-200">
                   <td className="py-2 px-1 text-black">#{o.orderNumber}</td>
                   <td className="py-2 px-1 text-black">{o.clientName}</td>
                   <td className="text-right font-bold py-2 px-1 text-black">R$ {formatMoney(o.totalValue || 0)}</td>
                   <td className="text-right font-bold py-2 px-1 text-black">R$ {formatMoney(cost)}</td>
                 </tr>
               )
             })}
           </tbody>
        </table>
      </div>

    </div>
  );
};

export default Finance;
