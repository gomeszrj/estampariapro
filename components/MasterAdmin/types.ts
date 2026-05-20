export type PermissionKey =
  | 'can_view_dashboard' | 'can_view_orders' | 'can_view_kanban' | 'can_view_art_queue'
  | 'can_view_products' | 'can_view_catalog' | 'can_view_clients' | 'can_view_crm'
  | 'can_view_inventory' | 'can_view_finance' | 'can_view_settings' | 'can_view_store'
  | 'can_create_orders' | 'can_delete_orders' | 'can_export_reports';

export type Permissions = Record<PermissionKey, boolean>;

export const ALL_PERMISSIONS_OFF: Permissions = {
  can_view_dashboard: false,
  can_view_orders: false,
  can_view_kanban: false,
  can_view_art_queue: false,
  can_view_products: false,
  can_view_catalog: false,
  can_view_clients: false,
  can_view_crm: false,
  can_view_inventory: false,
  can_view_finance: false,
  can_view_settings: false,
  can_view_store: false,
  can_create_orders: false,
  can_delete_orders: false,
  can_export_reports: false,
};

export const MODULE_LIST: { key: PermissionKey; label: string; desc: string }[] = [
  { key: 'can_view_dashboard',  label: 'Agenda / Dashboard',    desc: 'KPIs e visão geral de produção' },
  { key: 'can_view_orders',     label: 'Pedidos',               desc: 'Lista de pedidos e detalhes' },
  { key: 'can_create_orders',   label: '└ Criar Pedidos',       desc: 'Permissão para cadastrar novos pedidos' },
  { key: 'can_delete_orders',   label: '└ Excluir Pedidos',     desc: 'Permissão para deletar pedidos' },
  { key: 'can_view_kanban',     label: 'Kanban / Fluxo',        desc: 'Acompanhamento do fluxo de produção' },
  { key: 'can_view_art_queue',  label: 'Fila de Arte',          desc: 'Painel de artes e aprovações' },
  { key: 'can_view_products',   label: 'Produtos',              desc: 'Catálogo, preços e cadastro de produtos' },
  { key: 'can_view_catalog',    label: 'Solicitações',          desc: 'Pedidos recebidos do catálogo público' },
  { key: 'can_view_clients',    label: 'Clientes',              desc: 'Cadastro, histórico 360° e inadimplência' },
  { key: 'can_view_crm',        label: 'Chats / CRM',           desc: 'Atendimento via WhatsApp integrado' },
  { key: 'can_view_inventory',  label: 'Estoque',               desc: 'Controle de insumos e matéria-prima' },
  { key: 'can_view_finance',    label: 'Financeiro',            desc: 'DRE, contas a pagar e receber' },
  { key: 'can_export_reports',  label: '└ Exportar Relatórios', desc: 'Exportar PDFs e planilhas financeiras' },
  { key: 'can_view_store',      label: 'Loja / Vitrine',        desc: 'Gerenciar loja e pedidos online' },
  { key: 'can_view_settings',   label: 'Ajustes',               desc: 'Configurações da empresa' },
];
