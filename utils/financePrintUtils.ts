import { Transaction } from '../types';

export const printFinanceReport = (
  transactions: Transaction[],
  month: number,
  year: number,
  storeSettings?: any
) => {
  const storeName = storeSettings?.store_name || 'Estamparia Pro';
  const logoUrl = storeSettings?.logo_url || '';
  const currentDate = new Date().toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const period = `${month.toString().padStart(2, '0')}/${year}`;

  const income = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const profit = income - expense;
  const margin = income > 0 ? ((profit / income) * 100).toFixed(1) : '0.0';

  const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório Financeiro - ${period}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
        
        :root {
          --primary: #0f172a;
          --secondary: #475569;
          --accent: #4f46e5;
          --success: #10b981;
          --danger: #ef4444;
          --bg-light: #f8fafc;
          --border: #e2e8f0;
        }

        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }

        body {
          font-family: 'Inter', sans-serif;
          margin: 0; padding: 0;
          color: var(--primary);
          background: #fff;
          font-size: 11px;
        }

        .container {
          max-width: 210mm;
          margin: 0 auto;
        }

        /* HEADER */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid var(--primary);
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        
        .header-logo {
          max-width: 140px;
          max-height: 60px;
          object-fit: contain;
        }

        .header-info h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.03em;
        }
        .header-info p {
          margin: 4px 0 0 0;
          color: var(--secondary);
          font-size: 10px;
          font-weight: 600;
        }

        .badge {
          background: var(--primary);
          color: #fff;
          padding: 8px 16px;
          border-radius: 6px;
          text-align: right;
        }
        .badge .title { font-size: 9px; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.1em; }
        .badge .val { font-size: 16px; font-weight: 800; margin-top: 2px; }

        /* EXECUTIVE SUMMARY */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        .summary-card {
          background: var(--bg-light);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
        }
        .summary-card .label {
          font-size: 9px;
          font-weight: 800;
          color: var(--secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .summary-card .value {
          font-size: 18px;
          font-weight: 900;
          margin-top: 6px;
          letter-spacing: -0.02em;
        }
        .text-success { color: var(--success) !important; }
        .text-danger { color: var(--danger) !important; }

        /* TRANSACTIONS TABLE */
        .section-title {
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
          margin-bottom: 15px;
          color: var(--primary);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background: var(--primary);
          color: #fff;
          font-weight: 600;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 8px 10px;
          text-align: left;
        }
        td {
          padding: 8px 10px;
          border-bottom: 1px solid var(--border);
          font-size: 10px;
          color: var(--secondary);
        }
        tr:nth-child(even) td {
          background: var(--bg-light);
        }
        tr:last-child td { border-bottom: none; }
        .td-right { text-align: right; }
        .td-center { text-align: center; }

        .type-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .type-income { background: rgba(16, 185, 129, 0.15); color: #059669; }
        .type-expense { background: rgba(239, 68, 68, 0.15); color: #dc2626; }

        /* FOOTER */
        .footer {
          margin-top: 40px;
          padding-top: 15px;
          border-top: 1px solid var(--border);
          text-align: center;
          font-size: 9px;
          color: var(--secondary);
        }

        /* BTN PRINT (no-print) */
        .btn-print {
          position: fixed;
          bottom: 30px;
          right: 30px;
          background: var(--accent);
          color: #fff;
          border: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);
        }
      </style>
    </head>
    <body>
      <button class="btn-print no-print" onclick="window.print()">IMPRIMIR RELATÓRIO</button>
      
      <div class="container">
        <!-- HEADER -->
        <div class="header">
          <div style="display: flex; gap: 20px; align-items: center;">
            ${logoUrl ? '<img src="' + logoUrl + '" class="header-logo" />' : ''}
            <div class="header-info">
              <h1>${storeName}</h1>
              <p>Relatório Gerencial Financeiro</p>
            </div>
          </div>
          <div class="badge">
            <div class="title">Período Referência</div>
            <div class="val">${period}</div>
          </div>
        </div>

        <!-- EXECUTIVE SUMMARY -->
        <div class="summary-grid">
          <div class="summary-card">
            <div class="label">Total Entradas (Receitas)</div>
            <div class="value text-success">${formatCurrency(income)}</div>
          </div>
          <div class="summary-card">
            <div class="label">Total Saídas (Custos)</div>
            <div class="value text-danger">${formatCurrency(expense)}</div>
          </div>
          <div class="summary-card">
            <div class="label">Resultado Líquido</div>
            <div class="value ${profit >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(profit)}</div>
          </div>
          <div class="summary-card">
            <div class="label">Margem de Lucro</div>
            <div class="value">${margin}%</div>
          </div>
        </div>

        <!-- TRANSACTIONS -->
        <div class="section-title">Lançamentos do Período (${transactions.length} registros)</div>
        <table>
          <thead>
            <tr>
              <th width="12%">Data</th>
              <th width="12%">Tipo</th>
              <th width="15%">Categoria</th>
              <th width="41%">Descrição</th>
              <th width="20%" class="td-right">Valor (R$)</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map(t => {
              const dt = new Date(t.date).toLocaleDateString('pt-BR');
              const typeClass = t.type === 'income' ? 'type-income' : 'type-expense';
              const typeLabel = t.type === 'income' ? 'RECEITA' : 'DESPESA';
              
              // Categoria amigável
              const catMap: Record<string, string> = {
                'sale': 'Vendas/Pedidos',
                'material': 'Insumos/Matéria Prima',
                'salary': 'Salários/Comissões',
                'rent': 'Aluguel/Infra',
                'utility': 'Água/Luz/Internet',
                'other': 'Outros Diversos'
              };
              const catStr = catMap[t.category] || t.category;

              return `
                <tr>
                  <td>${dt}</td>
                  <td><span class="type-badge ${typeClass}">${typeLabel}</span></td>
                  <td><strong>${catStr}</strong></td>
                  <td>${t.description}</td>
                  <td class="td-right"><strong>${t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- FOOTER -->
        <div class="footer">
          Documento gerado automaticamente pelo sistema <strong>Estamparia Pro</strong> em ${currentDate}.<br>
          Valores baseados no registro de movimentações do módulo financeiro (Mês ${period}).
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
