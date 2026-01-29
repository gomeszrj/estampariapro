
import { Order, OrderType } from '../types';

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

const getCompany = (): CompanyData => JSON.parse(localStorage.getItem('company_data') || '{}');

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    'RECEIVED': 'AGUARDANDO',
    'FINALIZATION': 'EM FINALIZAÇÃO',
    'IN_PRODUCTION': 'EM PRODUÇÃO',
    'FINISHED': 'CONCLUÍDO'
  };
  return statusMap[status] || status;
};

export function printServiceOrder(order: Order) {
  const company = getCompany();
  const printWindow = window.open('', '_blank', 'width=1000,height=1200');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>ORDEM DE SERVIÇO #${order.orderNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; }
          
          body { 
            font-family: 'Inter', sans-serif; 
            padding: 1.2cm; 
            color: #1a1a1a; 
            background: #fff; 
            line-height: 1.3; 
            font-size: 9pt; 
          }

          .doc-wrapper { width: 100%; max-width: 19cm; margin: 0 auto; }

          /* Header Styling */
          header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2pt solid #1a1a1a; padding-bottom: 20px; }
          .logo-area { display: flex; align-items: center; gap: 15px; }
          .logo-img { max-width: 3.5cm; max-height: 1.8cm; object-fit: contain; }
          .company-info { max-width: 10cm; }
          .company-info h1 { font-size: 14pt; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px; margin-bottom: 4px; color: #000; }
          .company-info p { font-size: 7.5pt; color: #4b5563; line-height: 1.4; }
          
          .os-badge { text-align: right; }
          .os-label { font-size: 7pt; font-weight: 800; text-transform: uppercase; color: #6b7280; letter-spacing: 1px; }
          .os-number { font-size: 24pt; font-weight: 800; color: #000; line-height: 1; margin-top: 2px; }

          /* Layout Sections */
          .section { margin-bottom: 25px; }
          .section-title { font-size: 8pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 12px; color: #374151; }
          
          .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
          .info-item { background: #f9fafb; padding: 10px 12px; border-radius: 8px; border: 1px solid #f3f4f6; }
          .info-label { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; color: #9ca3af; margin-bottom: 3px; display: block; }
          .info-value { font-size: 9.5pt; font-weight: 700; color: #111827; }

          /* Item Table */
          .table-container { margin-top: 10px; border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #1a1a1a; color: #fff; text-align: left; padding: 10px 12px; font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 9pt; vertical-align: middle; }
          tr:last-child td { border-bottom: none; }
          
          .product-name { font-weight: 700; color: #000; display: block; }
          .fabric-badge { font-size: 7.5pt; color: #6b7280; margin-top: 2px; }
          .size-badge { background: #000; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 8pt; margin-right: 5px; }
          .qty-col { text-align: center; font-weight: 800; font-size: 11pt; color: #1a1a1a; }

          /* Notes Area */
          .notes-box { background: #fff; border: 1.5px solid #1a1a1a; border-radius: 12px; padding: 15px; min-height: 4cm; font-size: 10pt; line-height: 1.5; color: #111827; position: relative; }
          .notes-box::after { content: 'DETALHAMENTO TÉCNICO'; position: absolute; bottom: 10px; right: 15px; font-size: 6pt; font-weight: 800; color: #e5e7eb; }

          /* Footer Signature */
          .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-top: 50px; }
          .sig-block { text-align: center; }
          .sig-line { border-top: 1px solid #000; margin-bottom: 6px; }
          .sig-label { font-size: 7pt; font-weight: 700; text-transform: uppercase; color: #4b5563; }

          .footer-metadata { margin-top: 40px; text-align: center; font-size: 7pt; color: #9ca3af; border-top: 1px dashed #e5e7eb; padding-top: 15px; }

          @media print {
            body { padding: 0; }
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>
        <div class="doc-wrapper">
          <header>
            <div class="logo-area">
              ${company.logoUrl ? `<img src="${company.logoUrl}" class="logo-img">` : '<div style="font-weight:900; background:#000; color:#fff; padding:15px; border-radius:10px;">BRAND</div>'}
              <div class="company-info">
                <h1>${company.name || 'Estamparia Premium'}</h1>
                <p>
                  CNPJ: ${company.cnpj || '00.000.000/0000-00'}<br>
                  ${company.address || 'Localização Industrial - Matriz'}<br>
                  CONTATO: ${company.phone || '-'} | ${company.email || ''}
                </p>
              </div>
            </div>
            <div class="os-badge">
              <div class="os-label">Ordem de Serviço</div>
              <div class="os-number">#${order.orderNumber}</div>
            </div>
          </header>

          <div class="section">
            <div class="section-title">Informações do Cliente</div>
            <div class="info-grid">
              <div class="info-item" style="grid-column: span 2;">
                <span class="info-label">Razão Social / Identificação</span>
                <span class="info-value">${order.clientName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Status Industrial</span>
                <span class="info-value" style="color: #6366f1;">${getStatusLabel(order.status)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Data de Lançamento</span>
                <span class="info-value">${new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Entrega Programada</span>
                <span class="info-value" style="font-size: 11pt; color: #000;">${new Date(order.deliveryDate).toLocaleDateString('pt-BR')}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Modalidade</span>
                <span class="info-value">${order.orderType === OrderType.SALE ? 'VENDA EFETIVADA' : 'ORÇAMENTO COMERCIAL'}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Listagem de Itens e Materiais</div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th width="30">#</th>
                    <th>Descrição do Produto / Especificações</th>
                    <th width="140">Material / Tecido</th>
                    <th width="60" style="text-align:center;">Qtd</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map((item, idx) => `
                    <tr>
                      <td style="color:#9ca3af; text-align:center;">${(idx + 1).toString().padStart(2, '0')}</td>
                      <td>
                        <span class="product-name">${item.productName}</span>
                        <div style="margin-top:4px;">
                          <span class="size-badge">${item.size}</span>
                          <span style="font-size:7.5pt; color:#6b7280; font-weight:600; text-transform:uppercase;">${item.gradeLabel}</span>
                        </div>
                      </td>
                      <td>
                        <span style="font-weight:700; color:#1f2937;">${item.fabricName}</span>
                      </td>
                      <td class="qty-col">${item.quantity}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Grade de Personalização (Nomes, Números e Notas)</div>
            <div class="notes-box">
              ${order.internalNotes || 'Nenhuma instrução adicional de personalização para este pedido.'}
            </div>
          </div>

          <div class="signatures">
            <div class="sig-block">
              <div class="sig-line"></div>
              <div class="sig-label">Conferência Industrial</div>
            </div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <div class="sig-label">Responsável Produção</div>
            </div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <div class="sig-label">Aceite do Cliente</div>
            </div>
          </div>

          <div class="footer-metadata">
            Este documento é de uso interno e confidencial da ${company.name || 'Estamparia'}.<br>
            Emitido em ${new Date().toLocaleString('pt-BR')} via Estamparia.AI
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

export function printInvoice(order: Order) {
  const company = getCompany();
  const printWindow = window.open('', '_blank', 'width=1000,height=1200');
  if (!printWindow) return;

  const accessKey = "3523 03" + (company.cnpj?.replace(/\D/g, '') || '00000000000000') + " 55 001 00000" + order.orderNumber + " 100 2345 6789";

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>DANFE #${order.orderNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; font-size: 7.5pt; color: #000; padding: 1cm; background: #fff; line-height: 1.2; }
          
          .border-box { border: 1px solid #000; margin-bottom: -1px; }
          .cell { padding: 4px 6px; border-right: 1px solid #000; vertical-align: top; }
          .cell:last-child { border-right: none; }
          
          .label { font-size: 5.5pt; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; display: block; }
          .value { font-size: 8pt; font-weight: 800; display: block; }
          
          .danfe-header { display: flex; border: 1.5px solid #000; margin-bottom: 5px; }
          .logo-box { width: 3.5cm; border-right: 1.5px solid #000; padding: 8px; display: flex; align-items: center; justify-content: center; }
          .logo-img { max-width: 100%; max-height: 1.5cm; object-fit: contain; }
          .emitter-box { flex: 2; border-right: 1.5px solid #000; padding: 8px; }
          .emitter-name { font-size: 9pt; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; }
          .danfe-label-box { width: 2.5cm; border-right: 1.5px solid #000; padding: 8px; text-align: center; }
          .key-box { flex: 2; padding: 8px; }

          .section-title { background: #f3f4f6; border: 1px solid #000; padding: 3px 8px; font-weight: 800; font-size: 6.5pt; text-transform: uppercase; margin-top: 6px; }
          
          table { width: 100%; border-collapse: collapse; border: 1px solid #000; margin-top: 0; }
          th { background: #f3f4f6; border: 1px solid #000; padding: 4px; font-size: 6pt; font-weight: 800; text-align: left; text-transform: uppercase; }
          td { border: 1px solid #000; padding: 5px; font-size: 7.5pt; }

          .warning { border: 1.5px dashed #000; background: #fffbeb; color: #92400e; padding: 15px; text-align: center; font-weight: 800; font-size: 9pt; margin-top: 25px; border-radius: 8px; }

          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <!-- CABEÇALHO DANFE SIMULADO -->
        <div class="danfe-header">
          <div class="logo-box">
             ${company.logoUrl ? `<img src="${company.logoUrl}" class="logo-img">` : '<div style="font-weight:900;">BRAND</div>'}
          </div>
          <div class="emitter-box">
             <div class="label">Emitente</div>
             <div class="emitter-name">${company.name || 'Empresa de Estamparia'}</div>
             <div style="font-size: 7pt; line-height: 1.4;">
                ${company.address || 'Endereço não informado'}<br>
                CNPJ: ${company.cnpj || '00.000.000/0000-00'} | IE: ISENTO
             </div>
          </div>
          <div class="danfe-label-box">
             <div style="font-weight:900; font-size:10pt;">DANFE</div>
             <div style="font-size:5pt; margin-bottom: 5px;">Doc. Auxiliar da Nota Fiscal Eletrônica</div>
             <div style="border: 1px solid #000; font-weight: 900; font-size: 11pt; padding: 2px;">1</div>
             <div style="font-size:6.5pt; font-weight:800; margin-top: 5px;">Nº ${order.orderNumber}<br>SÉRIE 001</div>
          </div>
          <div class="key-box">
             <div class="label">Chave de Acesso</div>
             <div class="value" style="font-family: monospace; font-size: 7pt; letter-spacing: 0.5px;">${accessKey}</div>
             <div class="label" style="margin-top: 8px;">Protocolo de Autorização</div>
             <div class="value">13523000${order.orderNumber}999 - ${new Date().toLocaleString('pt-BR')}</div>
          </div>
        </div>

        <div class="border-box" style="display: flex;">
          <div class="cell" style="flex: 2;"><span class="label">Natureza da Operação</span><span class="value">Venda de Produção Industrial</span></div>
          <div class="cell" style="flex: 1;"><span class="label">Inscrição Estadual</span><span class="value">ISENTO</span></div>
        </div>

        <div class="section-title">Destinatário / Remetente</div>
        <div class="border-box" style="display: flex;">
          <div class="cell" style="flex: 2;"><span class="label">Nome / Razão Social</span><span class="value">${order.clientName}</span></div>
          <div class="cell" style="flex: 1;"><span class="label">Data de Emissão</span><span class="value">${new Date().toLocaleDateString('pt-BR')}</span></div>
        </div>

        <div class="section-title">Cálculo do Imposto</div>
        <div class="border-box" style="display: flex;">
          <div class="cell" style="flex: 1;"><span class="label">Base Cálc. ICMS</span><span class="value">0,00</span></div>
          <div class="cell" style="flex: 1;"><span class="label">Valor ICMS</span><span class="value">0,00</span></div>
          <div class="cell" style="flex: 1;"><span class="label">Vlr Total Prod.</span><span class="value">R$ ${order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
          <div class="cell" style="flex: 1;"><span class="label">Vlr Total Nota</span><span class="value">R$ ${order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
        </div>

        <div class="section-title">Itens da Nota Fiscal Eletrônica</div>
        <table>
          <thead>
            <tr>
              <th width="40">Cód</th>
              <th>Descrição do Produto / Material</th>
              <th width="50">NCM</th>
              <th width="30">Un</th>
              <th width="40" style="text-align:right;">Qtd</th>
              <th width="60" style="text-align:right;">Unitário</th>
              <th width="70" style="text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td style="color:#666;">P${item.id.slice(0, 2)}</td>
                <td style="font-weight:700;">${item.productName} - ${item.fabricName} (${item.size})</td>
                <td>61091000</td>
                <td>UN</td>
                <td style="text-align:right;">${item.quantity}</td>
                <td style="text-align:right;">${(item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td style="text-align:right; font-weight:800;">${(item.quantity * item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="section-title">Informações Adicionais</div>
        <div class="border-box" style="min-height: 2.5cm; padding: 10px;">
          <div class="label">Dados Complementares</div>
          <div style="font-size: 7pt; color: #4b5563; margin-top: 5px;">
            Pedido: #${order.orderNumber} | Entrega: ${new Date(order.deliveryDate).toLocaleDateString('pt-BR')}<br>
            Empresa Optante pelo Simples Nacional - Não gera crédito fiscal de IPI.<br><br>
            <strong>PAGAMENTO:</strong> ${company.bankInfo || 'Consultar financeiro.'}<br>
            <strong>OBSERVAÇÕES:</strong> ${order.internalNotes || 'Nenhuma.'}
          </div>
        </div>

        <div class="warning">
           ESTE DOCUMENTO É UMA SIMULAÇÃO PARA CONFERÊNCIA INDUSTRIAL DE ALTO PADRÃO.<br>
           NÃO POSSUI VALOR JURÍDICO-FISCAL.
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
