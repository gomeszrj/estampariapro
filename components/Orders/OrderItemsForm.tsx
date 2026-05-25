import React from 'react';
import { ShoppingCart, Plus, Trash2 } from 'lucide-react';
import { Product } from '../../types';
import { ParsedOrderItem } from '../../services/aiService';
import { GRADES } from '../../constants';

interface OrderItemsFormProps {
  parsedItems: ParsedOrderItem[];
  products: Product[];
  productsByName: Map<string, Product>;
  updateItem: (index: number, field: keyof ParsedOrderItem, value: any) => void;
  removeItem: (index: number) => void;
  addNewManualItem: () => void;
  discountValue: number | string;
  setDiscountValue: (value: number | string) => void;
  isSaving: boolean;
  handleCloseModal: () => void;
  handleFinalize: () => void;
}

const OrderItemsForm: React.FC<OrderItemsFormProps> = ({
  parsedItems,
  products,
  productsByName,
  updateItem,
  removeItem,
  addNewManualItem,
  discountValue,
  setDiscountValue,
  isSaving,
  handleCloseModal,
  handleFinalize
}) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-black text-slate-100 flex items-center gap-3 text-lg tracking-tighter uppercase">
          <ShoppingCart className="w-5 h-5 text-white" />
          Itens do Pedido ({parsedItems.length})
        </h4>
        <button
          onClick={addNewManualItem}
          className="text-[9px] font-black uppercase text-white bg-white/10 px-5 py-2.5 rounded-xl hover:bg-white/20 transition-all border border-[#1e293b] tracking-widest flex items-center gap-2"
        >
          <Plus className="w-3 h-3" /> Adicionar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {parsedItems.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-800 border-2 border-dashed border-[#1e293b] rounded-2xl">
            <ShoppingCart className="w-16 h-16 mb-4 opacity-10" />
            <p className="font-black uppercase tracking-[0.3em] text-[10px] opacity-40">Nenhum item adicionado</p>
          </div>
        ) : (
          parsedItems.map((item, idx) => {
            const selectedProduct = productsByName.get((item.product || '').toLowerCase());
            
            let allowedGradesObj: Record<string, string[]> | undefined;
            if (selectedProduct?.allowedGrades) {
              if (Array.isArray(selectedProduct.allowedGrades)) {
                allowedGradesObj = {};
                selectedProduct.allowedGrades.forEach((g: string) => {
                  const cfg = GRADES.find(gconfig => gconfig.label === g);
                  if (cfg && allowedGradesObj) allowedGradesObj[g] = cfg.sizes;
                });
              } else {
                allowedGradesObj = selectedProduct.allowedGrades as Record<string, string[]>;
              }
            }
            
            const allowedGradeLabels = allowedGradesObj ? Object.keys(allowedGradesObj) : GRADES.map((g: any) => g.label);
            let allowedGradesList = GRADES.filter((g: any) => allowedGradeLabels.includes(g.label));
            
            if (allowedGradesList.length === 0) {
              allowedGradesList = [{ label: 'Unidade', sizes: ['UN'] }];
            }

            let currentGradeLabel = item.grade || 'Masculino';
            if (!allowedGradesList.find((g: any) => g.label === currentGradeLabel)) {
              currentGradeLabel = allowedGradesList[0].label;
            }

            const specificAllowedSizes = allowedGradesObj ? allowedGradesObj[currentGradeLabel] : null;
            const currentGradeConfig = GRADES.find((g: any) => g.label === currentGradeLabel) || allowedGradesList[0];
            const availableSizes = specificAllowedSizes || currentGradeConfig.sizes;

            return (
              <div key={idx} className="bg-[#0f172a] p-5 rounded-[1.5rem] border border-[#1e293b] shadow-sm relative group hover:border-slate-700 transition-colors">
                <div className="absolute top-4 right-4 z-10">
                  <button onClick={() => removeItem(idx)} className="text-slate-600 hover:text-rose-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-4 space-y-1">
                    <label className="text-[8px] font-black text-slate-600 uppercase tracking-wider ml-1">Produto</label>
                    <input
                      list={`prod-list-${idx}`}
                      className="w-full bg-[#0b1221] border border-[#1e293b] rounded-xl px-3 py-3 text-xs font-bold text-white uppercase focus:border-slate-600 outline-none"
                      value={item.product}
                      onChange={(e) => updateItem(idx, 'product', e.target.value)}
                      placeholder="Busque..."
                    />
                    <datalist id={`prod-list-${idx}`}>
                      {(products || []).map(p => <option key={p.id} value={p.name} />)}
                    </datalist>
                  </div>
                  <div className="md:col-span-8 flex gap-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-[8px] font-black text-slate-600 uppercase tracking-wider ml-1">Grade</label>
                      <select
                        className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-xl px-3 py-3 text-xs font-bold text-slate-300 outline-none uppercase"
                        value={currentGradeLabel}
                        onChange={e => updateItem(idx, 'grade', e.target.value)}
                      >
                        {allowedGradesList.map((g: any) => <option key={g.label} value={g.label}>{g.label}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[8px] font-black text-slate-600 uppercase tracking-wider ml-1">Tamanho</label>
                      <select
                        className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-xl px-3 py-3 text-xs font-bold text-slate-300 outline-none"
                        value={availableSizes.includes(item.size || '') ? item.size : availableSizes[0]}
                        onChange={e => updateItem(idx, 'size', e.target.value)}
                      >
                        {availableSizes.map((s: any) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="w-24 space-y-1">
                      <label className="text-[8px] font-black text-slate-600 uppercase tracking-wider ml-1 text-center block">Qtd</label>
                      <input
                        type="number"
                        className="w-full bg-[#0b1221] border border-[#1e293b] rounded-xl px-2 py-3 text-xs font-black text-white text-center outline-none"
                        value={item.quantity === 0 ? '' : item.quantity}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          updateItem(idx, 'quantity', isNaN(val) ? 0 : val);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-8 pt-8 border-t border-[#1e293b] flex items-center justify-between sticky bottom-0 bg-[#0f172a] pb-2">
        <div className="flex gap-8">
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Custo Estimado</p>
            <p className="text-xl font-bold text-slate-400">
              R$ {(parsedItems.reduce((acc, curr) => {
                const prod = productsByName.get((curr.product || '').trim().toLowerCase());
                return acc + (curr.quantity || 0) * (prod?.costPrice || 0);
              }, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Lucro Previsto</p>
            <p className="text-xl font-bold text-emerald-500">
              R$ {(parsedItems.reduce((acc, curr) => {
                const prod = productsByName.get((curr.product || '').trim().toLowerCase());
                const revenue = (curr.quantity || 0) * (prod ? prod.basePrice : 35);
                const cost = (curr.quantity || 0) * (prod?.costPrice || 0);
                return acc + (revenue - cost);
              }, 0) - (typeof discountValue === 'number' ? discountValue : (parseFloat(discountValue.toString()) || 0))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Total com Desconto</p>
            <p className="text-3xl font-black text-slate-100">
              R$ {Math.max(0, parsedItems.reduce((acc, curr) => {
                const prod = productsByName.get((curr.product || '').trim().toLowerCase());
                return acc + (curr.quantity || 0) * (prod ? prod.basePrice : 35);
              }, 0) - (typeof discountValue === 'number' ? discountValue : (parseFloat(discountValue.toString()) || 0))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleCloseModal}
            className="px-6 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleFinalize}
            disabled={isSaving}
            className="px-10 py-4 bg-[#8B5CF6] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-white/90 disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Finalizar Pedido'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderItemsForm;
