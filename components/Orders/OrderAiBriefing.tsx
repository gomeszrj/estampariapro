import React, { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { parseOrderText, ParsedOrderItem } from '../../services/aiService';
import { Product } from '../../types';
import { notify } from '../ui/toast';

interface OrderAiBriefingProps {
  products: Product[];
  onItemsParsed: (aggregatedItems: ParsedOrderItem[], formattedOutput: string) => void;
}

const OrderAiBriefing: React.FC<OrderAiBriefingProps> = ({ products, onItemsParsed }) => {
  const [aiText, setAiText] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const handleAiParse = async () => {
    if (!aiText.trim()) return;
    setIsAiProcessing(true);
    try {
      const safeProducts = Array.isArray(products) ? products : [];
      const items = await parseOrderText(aiText, safeProducts.map(p => ({ id: p.id, name: p.name })));

      if (!items || items.length === 0) {
        notify.warning('A IA não conseguiu identificar itens no texto. Tente reformular.');
        return;
      }

      // 1. Sort Sizes Ascending (Kids -> Adult -> Special)
      const getSizeWeight = (size: string) => {
        const s = size.toUpperCase().trim();
        if (!isNaN(parseInt(s))) return parseInt(s);
        const weights: Record<string, number> = {
          'PP': 100, 'P': 101, 'M': 102, 'G': 103, 'GG': 104,
          'XG': 105, 'XXG': 106, 'G1': 107, 'G2': 108, 'G3': 109,
          'ESP': 200, 'ESP1': 201, 'ESP2': 202
        };
        return weights[s] || 999;
      };

      // Grouping: Layout -> Product (Group) -> Grade (SubGroup) -> Size
      const groups: Record<number, Record<string, Record<string, Record<string, { quantity: number, names: string[], fabric: string }>>>> = {};

      items.forEach(item => {
        const layout = item.layoutNumber || 9999;
        const product = (item.product || 'Produto Personalizado').toUpperCase();
        const size = (item.size || 'UN').toUpperCase();

        let grade = (item.grade || 'MASCULINO').toUpperCase();
        if (grade.includes('FEM')) grade = 'FEMININO';
        else if (grade.includes('INF') || grade.includes('UX')) grade = 'INFANTIL';
        else if (grade.includes('UNI') || size === 'UN') grade = 'UNIDADE';
        else grade = 'MASCULINO';
        
        const fabric = item.fabric || '';

        if (!groups[layout]) groups[layout] = {};
        if (!groups[layout][product]) groups[layout][product] = {};
        if (!groups[layout][product][grade]) groups[layout][product][grade] = {};
        if (!groups[layout][product][grade][size]) {
          groups[layout][product][grade][size] = { quantity: 0, names: [], fabric };
        }

        groups[layout][product][grade][size].quantity += item.quantity || 0;
        if (item.names) groups[layout][product][grade][size].names.push(...item.names);
        if (fabric && !groups[layout][product][grade][size].fabric) {
          groups[layout][product][grade][size].fabric = fabric;
        }
      });

      let formattedOutput = 'LISTA DE CONFERENCIA\n\n';

      // Iterate Layouts
      Object.keys(groups).sort((a, b) => parseInt(a) - parseInt(b)).forEach(layoutKey => {
        const layoutNum = parseInt(layoutKey);
        const productsMap = groups[layoutNum];

        Object.keys(productsMap).sort().forEach(product => {
          const layoutLabel = layoutNum === 9999 ? '' : ` ${layoutNum}`;
          formattedOutput += `LAYOUT${layoutLabel} - ${product}\n\n`;

          const gradesMap = productsMap[product];
          const gradeOrder = ['MASCULINO', 'FEMININO', 'INFANTIL', 'UNISSEX', 'UNIDADE'];
          const sortedGrades = Object.keys(gradesMap).sort((a, b) => {
            return gradeOrder.indexOf(a) - gradeOrder.indexOf(b);
          });

          sortedGrades.forEach(grade => {
            formattedOutput += `--- ${grade} ---\n`;
            
            const sizes = gradesMap[grade];
            Object.keys(sizes).sort((a, b) => getSizeWeight(a) - getSizeWeight(b)).forEach(size => {
              const data = sizes[size];
              const formatAgeSize = (s: string) => {
                if (!isNaN(parseInt(s)) && !(s || '').toLowerCase().includes('ano')) return `${s} ANOS`;
                return s;
              };
              const displaySizeHeader = formatAgeSize(size);

              formattedOutput += `TAMANHO - ${displaySizeHeader}\n`;

              data.names.forEach(name => {
                const displayName = name.toUpperCase().trim();
                formattedOutput += `1 - ${displayName} - ${displaySizeHeader}\n`;
              });

              const missing = Math.max(0, data.quantity - data.names.length);
              for (let i = 0; i < missing; i++) {
                formattedOutput += `1 - [SEM NOME] - ${displaySizeHeader}\n`;
              }
              formattedOutput += `\n`;
            });
          });
        });
      });

      const aggregatedItems: ParsedOrderItem[] = [];
      Object.keys(groups).sort((a, b) => parseInt(a) - parseInt(b)).forEach(layoutKey => {
        const layoutNum = parseInt(layoutKey);
        const productsMap = groups[layoutNum];

        Object.keys(productsMap).sort().forEach(product => {
          const gradesMap = productsMap[product];
          const gradeOrder = ['MASCULINO', 'FEMININO', 'INFANTIL', 'UNISSEX', 'UNIDADE'];
          const sortedGrades = Object.keys(gradesMap).sort((a, b) => {
            return gradeOrder.indexOf(a) - gradeOrder.indexOf(b);
          });

          sortedGrades.forEach(grade => {
            const sizes = gradesMap[grade];
            Object.keys(sizes).sort((a, b) => getSizeWeight(a) - getSizeWeight(b)).forEach(size => {
              const data = sizes[size];
              const formattedGrade = grade.charAt(0).toUpperCase() + grade.slice(1).toLowerCase();
              aggregatedItems.push({
                product: product,
                grade: formattedGrade as any,
                size: size,
                quantity: data.quantity,
                fabric: data.fabric || ''
              });
            });
          });
        });
      });

      onItemsParsed(aggregatedItems, formattedOutput);
      notify.success('Texto processado com sucesso!');
      setAiText(''); // Clear input after successful parse
    } catch (e: any) {
      console.error(e);
      let msg = e?.message || "Erro desconhecido";
      if (typeof msg === 'string' && (msg.startsWith('{') || msg.includes('429'))) {
        if (msg.includes('429') || msg.includes('quota')) {
          msg = "Limite de uso da IA excedido (Cota Grátis). Aguarde alguns segundos e tente novamente.";
        }
      }

      if (msg.includes("API key")) {
        notify.error('Erro de Chave API: Verifique sua chave Gemini nos Ajustes.');
      } else {
        notify.error(`Erro ao processar com IA: ${msg}`);
      }
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white/5 p-6 rounded-2xl border border-[#1e293b] h-full flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <h4 className="font-black text-white uppercase tracking-wider text-xs">Extrator de Pedidos</h4>
        </div>
        <p className="text-[10px] text-white/40 font-medium mb-4 leading-relaxed">
          Cole o texto do WhatsApp aqui para a IA identificar itens, tamanhos e quantidades automaticamente.
        </p>
        <textarea
          className="w-full h-48 p-4 bg-[#0b1221] border border-[#1e293b] rounded-2xl focus:ring-1 focus:ring-slate-700/50 outline-none transition-all placeholder:text-slate-700 text-xs text-white font-medium mb-4 resize-none"
          placeholder="Ex: 'Quero 10 camisetas P e 5 M...'"
          value={aiText}
          onChange={(e) => setAiText(e.target.value)}
        />
        <button
          onClick={handleAiParse}
          disabled={isAiProcessing || !aiText.trim()}
          className="w-full py-4 bg-[#8B5CF6] text-white rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-white/90 transition-all uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-white/5"
        >
          <span>{isAiProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}</span>
          Processar Texto
        </button>
      </div>
    </div>
  );
};

export default OrderAiBriefing;
