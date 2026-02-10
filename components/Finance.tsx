import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  PieChart,
  Wallet,
  Percent,
  Plus,
  Calendar,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  X
} from 'lucide-react';
import { Order, OrderStatus, Product, Transaction } from '../types';
import { financeService } from '../services/financeService';

interface FinanceProps {
  orders: Order[];
  products: Product[];
}

const FinanceStat = ({ title, value, icon: Icon, color, trend, subtext }: any) => (
  <div className="bg-[#0f172a] p-6 rounded-3xl border border-slate-800 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition-colors shadow-lg shadow-black/20">
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 ${color.replace('bg-', 'text-')} group-hover:scale-110 transition-transform`} />
    <div className="flex justify-between items-start mb-4 relative">
      <div className={`p-3 rounded-xl ${color} shadow-lg shadow-black/20`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
          {trend !== 0 && (trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="relative">
      <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-2xl font-black text-slate-100 tracking-tight">{value}</p>
      {subtext && <p className="text-[10px] text-slate-500 font-bold mt-1">{subtext}</p>}
    </div>
  </div>
);

const Finance: React.FC<FinanceProps> = ({ orders, products }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

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
    } catch (error) {
      console.error("Failed to save transaction", error);
      alert("Erro ao salvar transação");
    } finally {
      setSaving(false);
    }
  };

  // --- CALCULATIONS ---

  // 1. Revenue (From Orders)
  // In v15.3, we still rely on Orders for Revenue until we implement "Accounts Receivable" fully.
  const revenueOrders = orders.filter(o => o.status !== 'BUDGET'); // Exclude budgets
  const totalRevenue = revenueOrders.reduce((acc, curr) => acc + curr.totalValue, 0);

  // 2. Production Costs (COGS) - Estimate based on current product cost
  const productionCosts = revenueOrders.reduce((acc, order) => {
    return acc + order.items.reduce((itemAcc, item) => {
      const product = products.find(p => p.id === item.productId);
      // Fallback: If product not found (deleted) or no cost, use 0.
      // Ideally we should snapshot this in the OrderItem at purchase time.
      const unitCost = product?.costPrice || 0;
      return itemAcc + (unitCost * item.quantity);
    }, 0);
  }, 0);

  // 3. Operating Expenses (From Transactions)
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const operatingExpenses = expenseTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  // 4. Total Outflow & Net Profit
  const totalOutflow = operatingExpenses + productionCosts;
  const netProfit = totalRevenue - totalOutflow;
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // 5. Chart Data (Merge Orders & Transactions by Month)
  const monthlyData: Record<string, { revenue: number, expense: number, cost: number, profit: number }> = {};

  // Process Revenue & Production Costs
  revenueOrders.forEach(o => {
    if (!o.createdAt) return;
    const key = o.createdAt.slice(0, 7); // YYYY-MM
    if (!monthlyData[key]) monthlyData[key] = { revenue: 0, expense: 0, cost: 0, profit: 0 };

    monthlyData[key].revenue += o.totalValue;

    // Add Configured Cost for this order
    const orderCost = o.items.reduce((acc, item) => {
      const p = products.find(prod => prod.id === item.productId);
      return acc + ((p?.costPrice || 0) * item.quantity);
    }, 0);
    monthlyData[key].cost += orderCost;
  });

  // Process Operating Expenses
  expenseTransactions.forEach(t => {
    const key = t.date.slice(0, 7);
    if (!monthlyData[key]) monthlyData[key] = { revenue: 0, expense: 0, cost: 0, profit: 0 };
    monthlyData[key].expense += t.amount;
  });

  // Calculate Profit per month
  Object.keys(monthlyData).forEach(key => {
    const data = monthlyData[key];
    data.profit = data.revenue - (data.expense + data.cost);
  });

  const chartData = Object.keys(monthlyData).sort().map(key => {
    const [year, month] = key.split('-');
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return {
      name: `${months[parseInt(month) - 1]}/${year.slice(2)}`,
      ...monthlyData[key]
    };
  });

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 relative">

      {/* NEW TRANSACTION MODAL */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white uppercase flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-500" />
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
                  className={`flex-1 py-3 rounded-xl font-black uppercase text-xs border border-slate-800 transition-all ${newTransaction.type === 'income' ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg' : 'bg-slate-950 text-slate-500 hover:bg-slate-800'}`}
                >
                  Receita
                </button>
                <button
                  onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                  className={`flex-1 py-3 rounded-xl font-black uppercase text-xs border border-slate-800 transition-all ${newTransaction.type === 'expense' ? 'bg-rose-600 text-white border-rose-500 shadow-lg' : 'bg-slate-950 text-slate-500 hover:bg-slate-800'}`}
                >
                  Despesa
                </button>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Valor (R$)</label>
                <input
                  type="number"
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xl"
                  placeholder="0.00"
                  value={newTransaction.amount || ''}
                  onChange={e => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Descrição</label>
                <input
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  placeholder="Ex: Pagamento Aluguel"
                  value={newTransaction.description || ''}
                  onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Categoria</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
                    value={newTransaction.date}
                    onChange={e => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  />
                </div>
              </div>

              <button
                onClick={handleSaveTransaction}
                disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-indigo-900/20 active:scale-95 transition-all mt-4 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-emerald-500" />
            Dashboard Financeiro
          </h2>
          <p className="text-slate-500 mt-1">Visão completa do fluxo de caixa e resultados.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-900/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Lançamento
        </button>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FinanceStat
          title="Receita Total"
          value={`R$ ${totalRevenue.toLocaleString('pt-BR')}`}
          icon={DollarSign}
          color="bg-indigo-600"
          subtext="Baseado em Pedidos"
        />
        <FinanceStat
          title="Despesas Operacionais"
          value={`R$ ${operatingExpenses.toLocaleString('pt-BR')}`}
          icon={CreditCard}
          color="bg-rose-600"
          subtext={`${expenseTransactions.length} lançamentos`}
        />
        <FinanceStat
          title="Custo de Produção"
          value={`R$ ${productionCosts.toLocaleString('pt-BR')}`}
          icon={TrendingUp} // Or another suitable icon
          color="bg-amber-600"
          subtext="Estimado (Baseado em Pedidos)"
        />
        <FinanceStat
          title="Lucro Líquido Real"
          value={`R$ ${netProfit.toLocaleString('pt-BR')}`}
          icon={Wallet}
          color={netProfit >= 0 ? "bg-emerald-600" : "bg-rose-600"}
          subtext={`Margem: ${margin.toFixed(1)}%`}
        />
      </div>

      {/* CHARTS & LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CHART */}
        <div className="lg:col-span-2 bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-bold mb-8 text-slate-100 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-400" />
            Fluxo de Caixa (Receita x Despesa + Custo)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="cost" name="Custo Prod." fill="#d97706" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="expense" name="Desp. Operacional" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RECENT TRANSACTIONS LIST */}
        <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-sm flex flex-col h-[500px]">
          <h3 className="text-lg font-bold mb-6 text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Últimos Lançamentos
          </h3>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {transactions.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <p className="text-sm font-bold text-slate-500">Nenhuma movimentação registrada.</p>
              </div>
            ) : (
              transactions.map((t) => (
                <div key={t.id} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-center group hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {t.type === 'income' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-200 text-sm truncate max-w-[120px]">{t.description}</p>
                      <p className="text-[10px] font-black uppercase text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR')} • {t.category}</p>
                    </div>
                  </div>
                  <span className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.type === 'expense' ? '-' : '+'} R$ {t.amount.toLocaleString('pt-BR')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Finance;
