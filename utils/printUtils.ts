
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
   // Fetch latest settings
   const company = await getCompanySettings();
   const printWindow = window.open('', '_blank', 'width=1000,height=1200');
   if (!printWindow) return;

   // Access Key Generation (Simulated for visuals)
   const code = order.orderNumber.toString().padStart(9, '0');
   const accessKey = `3523 02${company.cnpj?.replace(/\D/g, '').substring(0, 14) || '12345678000199'} 55 001 ${code} 100 000 000 0`;
   const barcodeHeight = 50;

   // Calculations
   const total = order.totalValue || 0;
   let paid = order.amountPaid || 0;
   if (!order.amountPaid && order.paymentStatus === PaymentStatus.FULL) paid = total;
   if (!order.amountPaid && order.paymentStatus === 'Sinal (50%)') paid = total / 2;

   const remaining = total - paid;
   const isPaidOff = remaining <= 0.1;

   const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>DANFE #${order.orderNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+128&family=Inter:wght@400;600;700;800&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; }
          body { font-family: 'Inter', sans-serif; font-size: 7pt; color: #000; padding: 0; background: #fff; line-height: 1.1; }
          
          .a4-page { width: 21cm; margin: 0 auto; padding: 5mm; }

          /* Utility Borders */
          .box { border: 1px solid #000; border-radius: 4px; padding: 2px 4px; position: relative; }
          .flex { display: flex; }
          .col { flex-direction: column; }
          .row { flex-direction: row; }
          .u-upp { text-transform: uppercase; }
          .u-bold { font-weight: 700; }
          .u-center { text-align: center; }
          .u-right { text-align: right; }
          
          .small-label { font-size: 5pt; font-weight: 700; text-transform: uppercase; color: #444; margin-bottom: 1px; display: block; }
          .value { font-size: 7.5pt; font-weight: 700; color: #000; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

          /* COMPONENT: HEADER / CANHOTO */
          .canhoto-strip { display: flex; align-items: stretch; border: 1px solid #000; border-radius: 5px; height: 26px; margin-bottom: 5px; }
          .canhoto-msg { flex: 1; font-size: 5.5pt; padding: 2px; border-right: 1px solid #000; display: flex; align-items: center; }
          .canhoto-nf { width: 120px; text-align: center; display: flex; flex-direction: column; justify-content: center; font-weight: 800; font-size: 8pt; }

          /* COMPONENT: DANFE HEADER */
          .danfe-grid { display: grid; grid-template-columns: 100px 1fr 100px; gap: 5px; border: 1px solid #000; border-radius: 5px; padding: 5px; margin-bottom: 5px; }
          .logo-area { display: flex; align-items: center; justify-content: center; border-right: 1px solid #eee; padding-right: 5px; }
          .emitter-data { padding: 0 5px; }
          .danfe-control { text-align: center; display: flex; flex-direction: column; align-items: center; }

          /* SECTIONS */
          .section-label { font-size: 6pt; font-weight: 800; text-transform: uppercase; margin: 4px 0 1px 0; border-bottom: 1px solid #000; padding-bottom: 1px; }

          table { width: 100%; border-collapse: collapse; margin-top: 2px; }
          th { border: 1px solid #999; font-size: 5.5pt; padding: 2px; text-align: left; background: #f0f0f0; }
          td { border: 1px solid #999; font-size: 6.5pt; padding: 3px; }

          /* Barcode Font */
          .barcode { font-family: 'Libre Barcode 128', cursive; font-size: 38pt; transform: scaleY(1.2); text-align: center; height: 50px; overflow: hidden; }

          @media print {
             @page { margin: 5mm; size: A4; }
             .a4-page { width: 100%; max-width: none; border: none; }
          }
        </style>
      </head>
      <body>
        <div class="a4-page">
           
           <!-- CANHOTO -->
           <div class="canhoto-strip">
              <div class="canhoto-msg">
                 RECEBEMOS DE ${company.name.toUpperCase()} OS PRODUTOS/SERVIÇOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO
              </div>
              <div class="canhoto-nf">
                 NF-e<br>
                 Nº ${order.orderNumber}
              </div>
           </div>
           
           <!-- DADOS DO EMITENTE E CONTROLE -->
           <div class="danfe-grid">
              <div class="logo-area">
                 ${company.logo_url ? `<img src="${company.logo_url}" style="max-width:100%; max-height:80px;">` : 'LOGO'}
              </div>
              <div class="emitter-data">
                 <div style="font-size:10pt; font-weight:800; margin-bottom:2px;">${company.name.toUpperCase()}</div>
                 <div style="font-size:7pt;">
                    ${company.address}<br>
                    CNPJ: ${company.cnpj || '00.000.000/0000-00'}<br>
                    IE: ISENTO | Fone: ${company.phone}
                 </div>
              </div>
              <div class="danfe-control">
                 <div style="font-size:14pt; font-weight:900; margin-bottom:5px;">DANFE</div>
                 <div style="font-size:6pt; border:1px solid #000; padding:2px; padding-left:14px; padding-right:14px; margin-bottom:5px;">
                    0 - ENTRADA<br>1 - SAÍDA <strong style="font-size:10pt; margin-left:4px;">1</strong>
                 </div>
                 <div style="font-size:7pt; font-weight:700;">Nº ${order.orderNumber}</div>
                 <div style="font-size:6pt;">SÉRIE 1</div>
              </div>
           </div>

           <!-- CHAVE DE ACESSO -->
           <div class="box" style="margin-bottom: 5px; background: #f9f9f9;">
              <span class="small-label">CHAVE DE ACESSO</span>
              <div class="barcode">${accessKey.replace(/\s/g, '')}</div>
              <div style="text-align:center; font-size:8pt; letter-spacing:1px; margin-top:-5px;">${accessKey}</div>
           </div>

           <div style="display:grid; grid-template-columns: 2fr 1fr; gap:5px; margin-bottom:5px;">
               <div class="box">
                  <span class="small-label">NATUREZA DA OPERAÇÃO</span>
                  <span class="value">VENDA DE PRODUÇÃO DO ESTABELECIMENTO</span>
               </div>
               <div class="box">
                  <span class="small-label">PROTOCOLO DE AUTORIZAÇÃO DE USO</span>
                  <span class="value">13523000${order.orderNumber}999 - ${new Date().toLocaleString()}</span>
               </div>
           </div>

           <!-- DESTINATÁRIO -->
           <div class="section-label">DESTINATÁRIO / REMETENTE</div>
           <div style="border:1px solid #000; border-radius:4px; margin-bottom:5px;">
              <table style="border:none; margin:0;">
                 <tr style="border-bottom:1px solid #ddd;">
                    <td style="border:none; width:60%;"><span class="small-label">NOME / RAZÃO SOCIAL</span><div class="value">${order.clientName.toUpperCase()}</div></td>
                    <td style="border:none;"><span class="small-label">CNPJ / CPF</span><div class="value">000.000.000-00</div></td>
                    <td style="border:none;"><span class="small-label">DATA DA EMISSÃO</span><div class="value">${new Date().toLocaleDateString()}</div></td>
                 </tr>
                 <tr>
                    <td style="border:none;"><span class="small-label">ENDEREÇO</span><div class="value">ENDEREÇO DO CLIENTE NÃO INFORMADO</div></td>
                    <td style="border:none;"><span class="small-label">BAIRRO / DISTRITO</span><div class="value">-</div></td>
                    <td style="border:none;"><span class="small-label">DATA DA SAÍDA</span><div class="value">${new Date(order.deliveryDate).toLocaleDateString()}</div></td>
                 </tr>
              </table>
           </div>

           <!-- CÁLCULO DO IMPOSTO -->
           <div class="section-label">CÁLCULO DO IMPOSTO</div>
           <div style="border:1px solid #000; border-radius:4px; margin-bottom:5px; background:#f5f5f5;">
               <table style="border:none; margin:0;">
                  <tr>
                     <td style="border:none;"><span class="small-label">BASE CÁLC. ICMS</span><div class="value">0,00</div></td>
                     <td style="border:none;"><span class="small-label">VALOR DO ICMS</span><div class="value">0,00</div></td>
                     <td style="border:none;"><span class="small-label">BASE CÁLC. ICMS ST</span><div class="value">0,00</div></td>
                     <td style="border:none;"><span class="small-label">VALOR DO ICMS ST</span><div class="value">0,00</div></td>
                     <td style="border:none;"><span class="small-label">V. TOTAL PRODUTOS</span><div class="value">R$ ${formatMoney(total).replace('R$', '')}</div></td>
                  </tr>
                  <tr style="border-top:1px solid #ccc;">
                     <td style="border:none;"><span class="small-label">VALOR DO FRETE</span><div class="value">0,00</div></td>
                     <td style="border:none;"><span class="small-label">VALOR DO SEGURO</span><div class="value">0,00</div></td>
                     <td style="border:none;"><span class="small-label">DESCONTO</span><div class="value">0,00</div></td>
                     <td style="border:none;"><span class="small-label">OUTRAS DESP.</span><div class="value">0,00</div></td>
                     <td style="border:none;"><span class="small-label">V. TOTAL NOTA</span><div class="value">R$ ${formatMoney(total).replace('R$', '')}</div></td>
                  </tr>
               </table>
           </div>

           <!-- TRANSPORTADOR -->
           <div class="section-label">TRANSPORTADOR / VOLUMES</div>
           <div class="box" style="margin-bottom:5px;">
               <div style="display:flex; justify-content:space-between;">
                   <div><span class="small-label">RAZÃO SOCIAL</span><span class="value">O MESMO</span></div>
                   <div><span class="small-label">FRETE POR CONTA</span><span class="value">9 - SEM FRETE</span></div>
                   <div><span class="small-label">CÓDIGO ANTT</span><span class="value">-</span></div>
                   <div><span class="small-label">PLACA DO VEÍCULO</span><span class="value">-</span></div>
                   <div><span class="small-label">UF</span><span class="value">RJ</span></div>
               </div>
           </div>

           <!-- DADOS DO PRODUTO -->
           <div class="section-label">DADOS DO PRODUTO / SERVIÇO</div>
           <table style="border:1px solid #000; margin-bottom:5px;">
              <thead>
                 <tr>
                    <th width="50">CÓDIGO</th>
                    <th>DESCRIÇÃO DO PRODUTO / SERVIÇO</th>
                    <th width="40">NCM</th>
                    <th width="30">CST</th>
                    <th width="30">CFOP</th>
                    <th width="30">UN</th>
                    <th width="40">QTD</th>
                    <th width="60">V.UNIT</th>
                    <th width="60">V.TOTAL</th>
                 </tr>
              </thead>
              <tbody>
                 ${order.items.map(item => `
                    <tr>
                       <td>${item.id.substring(0, 6)}</td>
                       <td>
                          <span class="u-bold">${item.productName.toUpperCase()}</span>
                          <div style="font-size:6pt;">${item.fabricName} - TAM: ${item.size}</div>
                       </td>
                       <td>610910</td>
                       <td>0102</td>
                       <td>5101</td>
                       <td>UN</td>
                       <td class="u-right">${item.quantity}</td>
                       <td class="u-right">${(item.unitPrice || 0).toFixed(2)}</td>
                       <td class="u-right">${((item.unitPrice || 0) * (item.quantity || 0)).toFixed(2)}</td>
                    </tr>
                 `).join('')}
              </tbody>
           </table>
           
           <!-- DADOS ADICIONAIS / CONTROLE FINANCEIRO -->
           <div class="section-label">DADOS ADICIONAIS / CONTROLE FINANCEIRO</div>
           <div style="display:grid; grid-template-columns: 2fr 1fr; gap:5px; height: 180px;">
              <div class="box">
                 <span class="small-label">INFORMAÇÕES COMPLEMENTARES</span>
                 <div class="value" style="font-weight:400; white-space:pre-wrap; margin-top:5px;">
PEDIDO INTERNO: #${order.orderNumber}
PREVISÃO DE ENTREGA: ${new Date(order.deliveryDate).toLocaleDateString()}

DADOS BANCÁRIOS PARA DEPÓSITO:
${company.bank_info || 'Consultar setor financeiro.'}
                 </div>
              </div>
              <div class="box" style="border: 2px solid #000; background: ${isPaidOff ? '#ecfdf5' : '#fff1f2'};">
                 <span class="small-label" style="text-align:center; font-size:7pt;">RESUMO DE PAGAMENTO</span>
                 <div style="margin-top:10px; display:flex; justify-content:space-between; border-bottom:1px dotted #ccc;">
                    <span>TOTAL NF:</span>
                    <strong>${formatMoney(total)}</strong>
                 </div>
                 <div style="margin-top:5px; display:flex; justify-content:space-between; color:#059669;">
                    <span>VALOR PAGO:</span>
                    <strong>${formatMoney(paid)}</strong>
                 </div>
                 <div style="margin-top:5px; display:flex; justify-content:space-between; font-size:11pt; font-weight:900; color:${remaining > 0 ? '#dc2626' : '#059669'};">
                    <span>A PAGAR:</span>
                    <strong>${formatMoney(remaining)}</strong>
                 </div>

                 ${remaining > 0 ? `
                 <div style="margin-top:20px; font-size:6pt; text-align:center; font-weight:800; color:#dc2626;">
                    * MERCADORIA SÓ SERÁ LIBERADA MEDIANTE QUITAÇÃO INTEGRAL
                 </div>
                 ` : `
                 <div style="margin-top:20px; font-size:7pt; text-align:center; font-weight:800; color:#059669; border:1px solid #059669; padding:2px;">
                    PEDIDO QUITADO
                 </div>
                 `}
              </div>
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

