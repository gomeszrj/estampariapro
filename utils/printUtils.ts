
import { Order, OrderType, PaymentStatus } from '../types';
import { settingsService } from '../services/settingsService';

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    'RECEIVED': 'AGUARDANDO',
    'FINALIZATION': 'EM FINALIZAÇÃO',
    'IN_PRODUCTION': 'EM PRODUÇÃO',
    'FINISHED': 'CONCLUÍDO'
  };
  return statusMap[status] || status;
};

const getPaymentStatusLabel = (status: string | undefined) => {
  if (!status) return 'PENDENTE';
  if (status === 'Integral (100%)') return 'QUITADO (100%)';
  if (status === 'Sinal (50%)') return 'PARCIAL (SINAL)';
  return status;
};

// Helper: Format Currency
const formatMoney = (val: number) => {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

async function getCompanySettings() {
  try {
    const settings = await settingsService.getSettings();
    // Return with fallbacks if empty (though service usually handles defaults, safer here)
    return {
      name: settings.name || 'Minha Estamparia',
      cnpj: settings.cnpj || '',
      address: settings.address || '',
      phone: settings.phone || '',
      email: settings.email || '',
      logo_url: settings.logo_url || '',
      bank_info: settings.bank_info || ''
    };
  } catch (e) {
    console.warn("Could not fetch company settings.", e);
    return {
      name: 'Minha Estamparia',
      cnpj: '',
      address: '',
      phone: '',
      email: '',
      logo_url: '',
      bank_info: ''
    };
  }
}

export async function printServiceOrder(order: Order) {
  const company = await getCompanySettings();
  const printWindow = window.open('', '_blank', 'width=1100,height=1200');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>OS #${order.orderNumber} - PRODUCÃO</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;700;900&display=swap');
          
          :root { --primary: #000; --secondary: #4b5563; --border: #e5e7eb; }
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; }
          
          body { 
            font-family: 'Inter', sans-serif; 
            padding: 0;
            color: #1a1a1a; 
            background: #fff; 
            line-height: 1.3; 
            font-size: 9pt; 
          }

          .doc-wrapper { width: 100%; max-width: 21cm; margin: 0 auto; padding: 1cm; min-height: 29.7cm; position: relative; }

          /* Header */
          header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; border-bottom: 3px solid #000; padding-bottom: 15px; }
          .logo-area { display: flex; align-items: center; gap: 15px; }
          .logo-img { max-width: 4cm; max-height: 2cm; object-fit: contain; }
          .company-info h1 { font-size: 16pt; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; margin-bottom: 4px; }
          .company-info p { font-size: 8pt; color: #666; }
          
          .os-badge { text-align: right; }
          .os-label { font-size: 8pt; font-weight: 800; text-transform: uppercase; color: #666; letter-spacing: 2px; }
          .os-number { font-size: 32pt; font-weight: 900; color: #000; letter-spacing: -2px; line-height: 1; }
          .os-date { font-size: 9pt; font-weight: 600; color: #666; margin-top: 5px; }

          /* Sections */
          .section { margin-bottom: 25px; }
          .section-title { 
            font-size: 9pt; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; 
            border-bottom: 1px solid #000; padding-bottom: 6px; margin-bottom: 12px; color: #000; 
            display: flex; justify-content: space-between; align-items: flex-end;
          }
          
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }

          .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; background: #f9fafb; position: relative; }
          .box-label { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; color: #9ca3af; display: block; margin-bottom: 4px; }
          .box-value { font-size: 10pt; font-weight: 700; color: #111827; }
          .box-value.large { font-size: 12pt; }

          /* Table */
          table { width: 100%; border-collapse: collapse; margin-top: 5px; }
          th { background: #000; color: #fff; text-align: left; padding: 8px 10px; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; }
          td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 9pt; vertical-align: middle; }
          
          .prod-meta { display: flex; gap: 8px; margin-top: 4px; font-family: 'JetBrains Mono', monospace; font-size: 8pt; }
          .tag { background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 7.5pt; }

          /* Traveler Checkboxes */
          .traveler-strip { 
             display: flex; gap: 0; border: 2px solid #000; border-radius: 12px; overflow: hidden; margin: 20px 0; 
             background: #fff; box-shadow: 4px 4px 0px rgba(0,0,0,0.1);
          }
          .traveler-step { 
             flex: 1; border-right: 1px dashed #000; padding: 15px; text-align: center; position: relative; 
          }
          .traveler-step:last-child { border-right: none; }
          .traveler-check { 
             width: 25px; height: 25px; border: 2px solid #000; border-radius: 6px; margin: 0 auto 8px auto; 
          }
          .traveler-label { font-size: 7.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
          .traveler-sig { height: 15px; border-bottom: 1px solid #ccc; margin-top: 10px; }

          /* Footer */
          .footer-box { border-top: 1px dotted #ccc; margin-top: auto; padding-top: 10px; text-align: center; font-size: 8pt; color: #999; }
          
          @media print {
            body { padding: 0; }
            @page { margin: 0; size: A4; }
            .doc-wrapper { width: 100%; max-width: none; border: none; min-height: 100vh; padding: 1.5cm; }
          }
        </style>
      </head>
      <body>
        <div class="doc-wrapper">
          <header>
            <div class="logo-area">
               ${company.logo_url ? `<img src="${company.logo_url}" class="logo-img">` : '<div style="font-weight:900; font-size:24pt;">LOGO</div>'}
               <div class="company-info">
                 <h1>${company.name}</h1>
                 <p>CONTROLE DE PRODUÇÃO INTERNO</p>
               </div>
            </div>
            <div class="os-badge">
               <div class="os-label">Ordem Serviço</div>
               <div class="os-number">#${order.orderNumber}</div>
               <div class="os-date">${new Date(order.createdAt).toLocaleDateString()}</div>
            </div>
          </header>

          <div class="grid-2 section">
             <div class="box">
                <span class="box-label">Cliente</span>
                <div class="box-value large">${order.clientName}</div>
             </div>
             <div class="box">
                <span class="box-label">Prazo de Entrega</span>
                <div class="box-value large">${new Date(order.deliveryDate).toLocaleDateString()}</div>
             </div>
          </div>

          <!-- Production Traveler Strip -->
          <div class="section">
             <div class="section-title">Fluxo de Produção (Checklist)</div>
             <div class="traveler-strip">
                <div class="traveler-step">
                   <div class="traveler-check"></div>
                   <div class="traveler-label">Corte</div>
                </div>
                <div class="traveler-step">
                   <div class="traveler-check"></div>
                   <div class="traveler-label">Estampa</div>
                </div>
                <div class="traveler-step">
                   <div class="traveler-check"></div>
                   <div class="traveler-label">Costura</div>
                </div>
                <div class="traveler-step">
                   <div class="traveler-check"></div>
                   <div class="traveler-label">Acabto.</div>
                </div>
                <div class="traveler-step">
                   <div class="traveler-check"></div>
                   <div class="traveler-label">Conferência</div>
                </div>
             </div>
          </div>

          <div class="section">
            <div class="section-title">
                Itens do Pedido
                <span style="font-size:8pt; font-weight:400; text-transform:none; color:#666;">Total de Peças: ${order.items.reduce((acc, i) => acc + (i.quantity || 0), 0)}</span>
            </div>
            <table>
              <thead>
                <tr>
                   <th width="40" style="text-align:center;">QTD</th>
                   <th>Produto / Detalhes</th>
                   <th>Tamanho</th>
                   <th>Tecido</th>
                </tr>
              </thead>
              <tbody>
                 ${order.items.map(item => `
                    <tr>
                       <td style="text-align:center; font-weight:900; font-size:12pt; background:#f9fafb;">${item.quantity}</td>
                       <td>
                          <div style="font-weight:700;">${item.productName}</div>
                          ${item.gradeLabel ? `<div style="font-size:7pt; color:#666;">MODELO: ${item.gradeLabel}</div>` : ''}
                       </td>
                       <td><span class="tag">${item.size}</span></td>
                       <td>${item.fabricName || '-'}</td>
                    </tr>
                 `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section" style="margin-top:30px;">
             <div class="section-title">Observações Técnicas / Personalização</div>
             <div style="border: 2px dashed #ccc; padding: 20px; border-radius: 8px; min-height: 4cm; background:#fdfdfd; font-family: 'Inter', sans-serif; white-space: pre-wrap;">
                ${order.internalNotes || 'Sem observações adicionais.'}
             </div>
          </div>

          <div class="footer-box">
             Documento gerado em ${new Date().toLocaleString('pt-BR')} • Uso Interno • Estamparia Pro
          </div>
        </div>
        <script>
           window.onload = () => { setTimeout(() => { window.print(); }, 500); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export async function printInvoice(order: Order) {
  const company = await getCompanySettings();
  const printWindow = window.open('', '_blank', 'width=1000,height=1200');
  if (!printWindow) return;

  // Calculations
  const total = order.totalValue || 0;
  // If amountPaid is undefined, check paymentStatus
  // If FULL, paid = total. If HALF, use amountPaid or 50%.
  let paid = order.amountPaid || 0;

  // Fallback Logic for legacy data
  if (!order.amountPaid) {
    if (order.paymentStatus === PaymentStatus.FULL) paid = total;
    if (order.paymentStatus === 'Sinal (50%)') paid = total / 2;
  }

  const remaining = total - paid;
  const isPaidOff = remaining <= 0.1; // Float tolerance

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Recibo #${order.orderNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; }
          body { font-family: 'Inter', sans-serif; font-size: 9pt; padding: 0; background: #fff; color: #1f2937; }
          
          .a4-page { 
             width: 21cm; min-height: 29.7cm; margin: 0 auto; padding: 1.5cm; 
             position: relative; 
          }

          /* Header */
          .header { text-align: center; margin-bottom: 40px; }
          .brand { font-size: 20pt; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; margin-bottom: 5px; }
          .brand-sub { font-size: 8pt; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; }
          
          .divider { height: 4px; background: #000; margin: 20px auto; width: 50px; border-radius: 2px; }
          
          /* Details Box */
          .receipt-box { border: 2px solid #000; border-radius: 20px; padding: 30px; margin-bottom: 30px; position: relative; }
          .receipt-title { 
             position: absolute; top: -12px; left: 30px; background: #fff; padding: 0 10px; 
             font-weight: 900; font-size: 10pt; text-transform: uppercase; letter-spacing: 1px;
          }
          
          .row { display: flex; justify-content: space-between; margin-bottom: 12px; }
          .label { font-size: 8pt; color: #6b7280; font-weight: 600; text-transform: uppercase; }
          .value { font-size: 10pt; font-weight: 700; color: #000; }
          
          /* Financial Highlight */
          .finance-highlight { 
             background: #f3f4f6; border-radius: 12px; padding: 20px; margin-top: 20px; 
             display: flex; justify-content: space-between; align-items: center;
          }
          .fin-block { text-align: right; }
          .fin-label { font-size: 7pt; font-weight: 700; text-transform: uppercase; color: #6b7280; }
          .fin-val { font-size: 14pt; font-weight: 900; color: #000; }
          .fin-val.green { color: #059669; }
          .fin-val.red { color: #dc2626; }

          /* Table */
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; font-size: 7pt; uppercase; color: #9ca3af; border-bottom: 1px solid #e5e7eb; padding: 8px 0; }
          td { padding: 12px 0; border-bottom: 1px dashed #e5e7eb; font-size: 9pt; }
          td.right { text-align: right; }
          
          /* Warning Footer */
          .legal-footer { 
             text-align: center; font-size: 7pt; color: #9ca3af; margin-top: 50px; line-height: 1.5;
             border-top: 1px solid #e5e7eb; padding-top: 20px;
          }

          @media print {
            .a4-page { width: 100%; max-width: none; margin: 0; padding: 1cm; min-height: 100vh; }
          }
        </style>
      </head>
      <body>
        <div class="a4-page">
           <div class="header">
              <div class="brand">${company.name}</div>
              <div class="brand-sub">Comprovante de Pedido & Pagamento</div>
              <div class="divider"></div>
           </div>

           <div class="receipt-box">
              <div class="receipt-title">Detalhes do Pedido #${order.orderNumber}</div>
              
              <div class="row">
                 <div>
                    <span class="label">Cliente</span><br>
                    <span class="value">${order.clientName}</span>
                 </div>
                 <div style="text-align:right;">
                    <span class="label">Data Emissão</span><br>
                    <span class="value">${new Date().toLocaleDateString()}</span>
                 </div>
              </div>

              <div class="row" style="margin-top:15px;">
                 <div>
                    <span class="label">Previsão Entrega</span><br>
                    <span class="value">${new Date(order.deliveryDate).toLocaleDateString()}</span>
                 </div>
                 <div style="text-align:right;">
                    <span class="label">Status Atual</span><br>
                    <span class="value">${getStatusLabel(order.status)}</span>
                 </div>
              </div>
           </div>

           <!-- Financial Breakdown -->
           <div class="receipt-box" style="border-color: ${isPaidOff ? '#059669' : '#000'}">
              <div class="receipt-title" style="color: ${isPaidOff ? '#059669' : '#000'}">Resumo Financeiro</div>
              
              <div class="finance-highlight">
                 <div class="fin-block" style="text-align:left;">
                    <div class="fin-label">Valor Total</div>
                    <div class="fin-val">${formatMoney(total)}</div>
                 </div>
                 
                 <div class="fin-block">
                    <div class="fin-label">Valor Pago</div>
                    <div class="fin-val green">${formatMoney(paid)}</div>
                 </div>

                 <div class="fin-block">
                    <div class="fin-label">Saldo Restante</div>
                    <div class="fin-val ${remaining > 0 ? 'red' : 'green'}">
                       ${formatMoney(remaining)}
                    </div>
                 </div>
              </div>
              
              ${!isPaidOff ? `
              <div style="margin-top:15px; font-size:8pt; background:#fee2e2; color:#b91c1c; padding:8px; border-radius:6px; font-weight:700; text-align:center;">
                 Pendência Financeira: O pedido só será liberado mediante quitação do saldo.
              </div>
              ` : ''}
              
              <div style="margin-top:15px; font-size:8pt; padding:8px; background:#f3f4f6; border-radius:6px;">
                  <strong>Forma Pgto Declarada:</strong> ${getPaymentStatusLabel(order.paymentStatus)}
              </div>
           </div>

           <div style="margin-top:30px;">
              <h3 style="font-size:9pt; font-weight:900; text-transform:uppercase; margin-bottom:10px;">Itens do Pedido</h3>
              <table>
                 <thead>
                    <tr>
                       <th>Descrição</th>
                       <th width="50" style="text-align:center;">Qtd</th>
                       <th width="80" style="text-align:right;">Unitário</th>
                       <th width="80" style="text-align:right;">Subtotal</th>
                    </tr>
                 </thead>
                 <tbody>
                    ${order.items.map(item => `
                       <tr>
                          <td>
                             <div style="font-weight:700;">${item.productName}</div>
                             <div style="font-size:7.5pt; color:#6b7280;">${item.fabricName} • ${item.size}</div>
                          </td>
                          <td style="text-align:center;">${item.quantity}</td>
                          <td class="right">${formatMoney(item.unitPrice || 0)}</td>
                          <td class="right" style="font-weight:700;">${formatMoney((item.unitPrice || 0) * (item.quantity || 0))}</td>
                       </tr>
                    `).join('')}
                 </tbody>
                 <tfoot>
                    <tr>
                       <td colspan="3" class="right" style="padding-top:20px; font-weight:900; font-size:11pt;">TOTAL GERAL</td>
                       <td class="right" style="padding-top:20px; font-weight:900; font-size:11pt;">${formatMoney(total)}</td>
                    </tr>
                 </tfoot>
              </table>
           </div>

           <div class="legal-footer">
              Este documento não possui valor fiscal (Danfe).<br>
              Emitido por ${company.name} - CNPJ: ${company.cnpj || 'Não informado'}<br>
              Endereço: ${company.address || '-'}<br>
              ${company.email} | ${company.phone}
           </div>

        </div>
        <script>
           window.onload = () => { setTimeout(() => { window.print(); }, 500); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
