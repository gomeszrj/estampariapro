import React, { useState, useEffect, useCallback } from 'react';
import { Shield, RefreshCw, ChevronLeft, ChevronRight, Filter, Search, Clock, User, Database, FileText, AlertTriangle, CheckCircle2, Package, Settings, Trash2, Edit3, Plus } from 'lucide-react';
import { auditService, AuditLog } from '../../services/auditService';

const PAGE_SIZE = 25;

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'STATUS_CHANGE': <RefreshCw className="w-3.5 h-3.5" />,
  'CREATE': <Plus className="w-3.5 h-3.5" />,
  'UPDATE': <Edit3 className="w-3.5 h-3.5" />,
  'DELETE': <Trash2 className="w-3.5 h-3.5" />,
  'SETTINGS_SAVE': <Settings className="w-3.5 h-3.5" />,
  'LOGIN': <User className="w-3.5 h-3.5" />,
};

const ACTION_COLORS: Record<string, string> = {
  'STATUS_CHANGE': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'CREATE': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'UPDATE': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'DELETE': 'bg-red-500/15 text-red-400 border-red-500/20',
  'SETTINGS_SAVE': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  'LOGIN': 'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

const TABLE_LABELS: Record<string, string> = {
  'orders': 'Pedidos',
  'products': 'Produtos',
  'clients': 'Clientes',
  'inventory': 'Estoque',
  'settings': 'Configurações',
  'team': 'Equipe',
  'profiles': 'Usuários',
};

const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora mesmo';
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays === 1) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await auditService.getPaginated(page, PAGE_SIZE);
      setLogs(result.logs || []);
      setTotalCount(result.totalCount || 0);
    } catch (err) {
      console.error('Error loading audit logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filtered = logs.filter(log => {
    const matchSearch = !search ||
      (log.userEmail || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.targetTable || '').toLowerCase().includes(search.toLowerCase());
    const matchAction = !filterAction || log.action === filterAction;
    return matchSearch && matchAction;
  });

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Logs de Auditoria</h3>
          </div>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest ml-10">
            {totalCount} registros encontrados
          </p>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0b1221] border border-[#1e293b] text-slate-400 hover:text-white hover:border-white/10 transition-all text-[11px] font-black uppercase tracking-widest"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por usuário, ação ou módulo..."
            className="w-full bg-[#0b1221] border border-[#1e293b] rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 outline-none placeholder:text-slate-600"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="bg-[#0b1221] border border-[#1e293b] rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:border-amber-500/40 outline-none appearance-none cursor-pointer"
          >
            <option value="">Todas as ações</option>
            {uniqueActions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Log List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
              <p className="text-slate-500 text-sm font-bold">Carregando registros...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#0b1221] border border-[#1e293b] flex items-center justify-center">
              <Database className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-slate-500 text-sm font-bold">Nenhum log encontrado</p>
            <p className="text-slate-600 text-xs text-center max-w-xs">
              Os registros de auditoria aparecerão aqui conforme as ações forem realizadas no sistema.
            </p>
          </div>
        ) : (
          filtered.map(log => {
            const actionKey = (log.action || '').split(':')[0].toUpperCase();
            const colorClass = ACTION_COLORS[actionKey] || 'bg-slate-500/15 text-slate-400 border-slate-500/20';
            const icon = ACTION_ICONS[actionKey] || <FileText className="w-3.5 h-3.5" />;
            const isExpanded = expandedId === log.id;

            return (
              <div
                key={log.id}
                className={`bg-[#0b1221] border rounded-xl transition-all duration-200 cursor-pointer ${isExpanded ? 'border-amber-500/20' : 'border-[#1e293b] hover:border-[#334155]'}`}
                onClick={() => setExpandedId(isExpanded ? null : log.id)}
              >
                <div className="flex items-start gap-3 p-4">
                  {/* Action Badge */}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider shrink-0 ${colorClass}`}>
                    {icon}
                    {actionKey}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-white text-sm font-bold truncate">{log.action}</span>
                      {log.targetTable && (
                        <span className="text-[11px] text-slate-500 font-bold">
                          em {TABLE_LABELS[log.targetTable] || log.targetTable}
                          {log.targetId && ` #${log.targetId.substring(0, 8)}`}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.userEmail || 'Sistema'}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(log.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronRight className={`w-4 h-4 text-slate-600 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                {/* Expanded Details */}
                {isExpanded && log.details && (
                  <div className="border-t border-[#1e293b] px-4 pb-4 pt-3">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Detalhes</p>
                    <pre className="text-[11px] text-slate-300 bg-[#05080E] rounded-lg p-3 overflow-x-auto font-mono leading-relaxed">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-500 font-bold">
            Página {page} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-[#0b1221] border border-[#1e293b] text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${p === page ? 'bg-amber-600 text-white' : 'bg-[#0b1221] border border-[#1e293b] text-slate-400 hover:text-white'}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-[#0b1221] border border-[#1e293b] text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
