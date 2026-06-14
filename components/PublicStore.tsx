import React, { useState, useEffect, useRef } from 'react';
import { gmzStoreService, GmzProduct, GmzStoreSettings, GmzBanner, getTenantId } from '../services/gmzStoreService';

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
interface CartItemDetail {
  name: string;
  number: string;
}

interface CartItem {
  id: string;
  product: GmzProduct;
  qty: number;
  size: string;
  personalizationType: 'none' | 'name' | 'name_number';
  details: CartItemDetail[];
}

interface ParsedSize {
  raw: string;
  category: string;
  label: string;
  height?: string;
  width?: string;
}

const parseSize = (size: string): ParsedSize => {
  try {
    const obj = JSON.parse(size);
    if (obj.label) return obj as ParsedSize;
  } catch (e) {}

  if (size.includes('|')) {
    const parts = size.split('|').map(s => s.trim());
    if (parts.length >= 3) {
      const [catAndLabel, height, width] = parts;
      const catParts = catAndLabel.split(' ');
      let label = catParts.pop() || size;
      let categoryRaw = catParts.join(' ').trim();
      
      let category = 'Geral';
      if (categoryRaw.toLowerCase().startsWith('masc')) category = 'Masculino';
      else if (categoryRaw.toLowerCase().startsWith('fem')) category = 'Feminino';
      else if (categoryRaw.toLowerCase().startsWith('inf')) category = 'Infantil';
      else if (categoryRaw.toLowerCase().startsWith('esp')) category = 'Especial';
      else if (categoryRaw) category = categoryRaw;

      // Handle cases like "Masc ESP1" where "ESP1" is the label
      return { raw: size, category, label, height, width };
    }
  }

  // Some raw sizes might have space like "Masc P" without pipes
  const spaceParts = size.split(' ');
  if (spaceParts.length > 1) {
      let label = spaceParts.pop() || size;
      let categoryRaw = spaceParts.join(' ').trim();
      let category = 'Geral';
      if (categoryRaw.toLowerCase().startsWith('masc')) category = 'Masculino';
      else if (categoryRaw.toLowerCase().startsWith('fem')) category = 'Feminino';
      else if (categoryRaw.toLowerCase().startsWith('inf')) category = 'Infantil';
      else if (categoryRaw) category = categoryRaw;
      
      return { raw: size, category, label };
  }

  return { raw: size, category: 'Geral', label: size };
};

// Fallback images in case DB doesn't have an image_url
const FALLBACK_IMGS: Record<string, string> = {
  "regata-lakers": "/assets/images/jersey_nba_purple_1779853332145.png",
  "regata-bulls": "/assets/images/jersey_nba_red_1779854006937.png",
  "manga-longa-azul": "/assets/images/jersey_manga_longa_1779853348937.png",
  "manga-longa-preta": "/assets/images/jersey_manga_longa_preto_1779854022944.png",
  "camiseta-roxa": "/assets/images/jersey_manga_curta_1779853362847.png",
  "camiseta-branca": "/assets/images/jersey_manga_curta_branco_1779854037116.png",
  "oversized-bear": "/assets/images/jersey_oversized_bear_1779853381876.png",
};

const CATEGORIES = [
  { id: "nba", label: "Regatas NBA", desc: "Estilo e liberdade para jogar ou para o dia a dia.", tag: "NBA", color: "from-purple-900 to-black", imgKey: "regata-lakers" },
  { id: "uv50", label: "Manga Longa", desc: "Proteção, conforto e performance para qualquer aventura.", tag: "UV+50", color: "from-blue-900 to-black", imgKey: "manga-longa-azul" },
  { id: "curta", label: "Camisetas", desc: "Conforto e estilo para te acompanhar em qualquer momento.", tag: "MANGA CURTA", color: "from-violet-900 to-black", imgKey: "camiseta-roxa" },
  { id: "dtf", label: "Oversized", desc: "Estilo urbano com estampas de alta qualidade e toque premium.", tag: "DTF", color: "from-pink-900 to-black", imgKey: "oversized-bear" },
];

/* ═══════════════════════════════════════════════════════════
   ICONS (inline SVG)
═══════════════════════════════════════════════════════════ */
const Icon = {
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>,
  Cart: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Heart: ({ filled }: { filled?: boolean }) => <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "#ef4444" : "none"} stroke={filled ? "#ef4444" : "currentColor"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
  Arrow: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>,
  ChevLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>,
  ChevRight: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>,
  Rotate: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>,
  Star: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  WA: () => <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" /></svg>,
  Menu: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  Play: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>,
};

const getProductImg = (p: GmzProduct | null) => {
  if (!p) return FALLBACK_IMGS["regata-lakers"];
  if (p.image_url) {
    const images = p.image_url.split('|||');
    return images[0] || p.image_url;
  }
  // Tenta mapear o id ou title se não tiver imagem salva
  const slug = p.id?.toLowerCase() || '';
  if (slug.includes('regata')) return FALLBACK_IMGS["regata-lakers"];
  if (slug.includes('longa')) return FALLBACK_IMGS["manga-longa-azul"];
  if (slug.includes('curta') || slug.includes('dry')) return FALLBACK_IMGS["camiseta-roxa"];
  if (slug.includes('oversize')) return FALLBACK_IMGS["oversized-bear"];
  return FALLBACK_IMGS["regata-lakers"];
};

/* ═══════════════════════════════════════════════════════════
   360° VIEWER COMPONENT
═══════════════════════════════════════════════════════════ */
const Viewer360: React.FC<{ product: GmzProduct | null; color: string }> = ({ product, color }) => {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const lastX = useRef(0);
  const animRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!autoRotate) return;
    const spin = () => {
      setRotation(r => (r + 0.3) % 360);
      animRef.current = requestAnimationFrame(spin);
    };
    animRef.current = requestAnimationFrame(spin);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [autoRotate]);

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true); setAutoRotate(false);
    lastX.current = e.clientX;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - lastX.current;
    setRotation(r => (r + delta * 0.5) % 360);
    lastX.current = e.clientX;
  };
  const onMouseUp = () => setIsDragging(false);
  const onTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true); setAutoRotate(false);
    lastX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientX - lastX.current;
    setRotation(r => (r + delta * 0.5) % 360);
    lastX.current = e.touches[0].clientX;
  };

  // Smoother depth and rotation effect (easing out the extremes to avoid looking squashed and robotic)
  // Instead of a simple cos which looks flat, we use a slightly dampened curve
  const angleRad = (rotation * Math.PI) / 180;
  const rawScaleX = Math.cos(angleRad);
  const scaleX = Math.abs(rawScaleX) * 0.7 + 0.3; 
  const isBack = Math.abs(rotation % 360) > 90 && Math.abs(rotation % 360) < 270;

  const images = product?.image_url ? product.image_url.split('|||') : [];
  const front = images[0] || getProductImg(product);
  const back = images[1] || product?.image_url_back || '';
  const right = images[2] || '';
  const left = images[3] || '';

  const hasAllAngles = front && back && right && left;
  const hasBackImage = !!back;

  let currentImage = front;
  let currentScaleX = scaleX;

  if (hasAllAngles) {
    const angle = Math.abs(rotation % 360);
    if (angle >= 45 && angle < 135) currentImage = right;
    else if (angle >= 135 && angle < 225) currentImage = back;
    else if (angle >= 225 && angle < 315) currentImage = left;
    else currentImage = front;
    currentScaleX = 1; // Don't squash if we have all 4 images
  } else if (hasBackImage) {
    if (isBack) currentImage = back;
    currentScaleX = isBack ? -scaleX : scaleX;
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-6 items-center w-full">
      {/* Static Thumbnail Gallery (Vertical on Desktop, Horizontal on Mobile) */}
      {hasAllAngles && (
        <div className="flex flex-row md:flex-col gap-3 justify-center">
          {[
            { img: front, angle: 0, label: 'Frente' },
            { img: right, angle: 90, label: 'Lat. Dir' },
            { img: back, angle: 180, label: 'Costas' },
            { img: left, angle: 270, label: 'Lat. Esq' }
          ].map((item, idx) => {
            const isActive = Math.abs(rotation % 360) >= (item.angle - 45) && Math.abs(rotation % 360) < (item.angle + 45) || (item.angle === 0 && Math.abs(rotation % 360) >= 315);
            return (
              <div 
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setAutoRotate(false);
                  setRotation(item.angle);
                }}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-xl cursor-pointer transition-all duration-300 border backdrop-blur-sm overflow-hidden flex items-center justify-center ${
                  isActive ? 'bg-purple-600/20 border-purple-500 scale-110 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-[#0b0e17] border-white/10 hover:bg-white/5'
                }`}
              >
                <img src={item.img} alt={item.label} className="w-full h-full object-contain p-1.5 drop-shadow-md" draggable={false} />
              </div>
            );
          })}
        </div>
      )}

      {/* Main 360 Viewer Area */}
      <div
        className="relative flex-1 w-full"
        style={{ userSelect: 'none', cursor: isDragging ? 'grabbing' : 'grab', padding: '10px 0' }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={() => setIsDragging(false)}
      >
        <div style={{ position: 'absolute', inset: '-20px', borderRadius: '50%', background: `radial-gradient(circle, ${color}20, transparent 70%)`, filter: 'blur(30px)', pointerEvents: 'none' }} />

        <div style={{ width: '100%', height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={currentImage}
            alt="Jersey 360"
            style={{
              maxHeight: '100%', maxWidth: '100%', display: 'block', margin: '0 auto', objectFit: 'contain',
              transform: `scaleX(${currentScaleX})`,
              transition: isDragging || hasAllAngles || autoRotate ? 'none' : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
              filter: `drop-shadow(0 20px 30px rgba(0,0,0,0.6)) drop-shadow(0 0 20px ${color}40)`,
            }}
            draggable={false}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 24 }}>
          <button
            onClick={() => { setAutoRotate(r => !r); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: autoRotate ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(124,58,237,0.4)', borderRadius: 8,
              color: autoRotate ? '#a78bfa' : '#64748b', padding: '6px 16px',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em',
              transition: 'all 0.2s'
            }}
          >
            <Icon.Rotate /> {autoRotate ? 'GIRANDO 360º' : 'ARRASTAR'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   PRODUCT CARD COMPONENT
═══════════════════════════════════════════════════════════ */
const ProductCard: React.FC<{
  p: GmzProduct;
  favorites: Set<string>;
  onFav: (id: string) => void;
  onView: (p: GmzProduct) => void;
  onAdd: (p: GmzProduct) => void;
}> = ({ p, favorites, onFav, onView, onAdd }) => (
  <div className="bg-[#0b0e17] rounded-2xl overflow-hidden border border-purple-500/10 transition-transform duration-300 hover:-translate-y-2 relative group flex flex-col" style={{ WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}>
    {p.badge && (
      <span style={{ position: 'absolute', top: 12, left: 12, zIndex: 2, background: 'rgba(124,58,237,0.9)', color: 'white', fontSize: 9, fontWeight: 800, padding: '4px 8px', borderRadius: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {p.badge}
      </span>
    )}
    <button className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/40 hover:scale-110 ${favorites.has(p.id) ? 'text-red-500' : 'text-white'}`} onClick={(e) => { e.stopPropagation(); onFav(p.id); }}>
      <Icon.Heart filled={favorites.has(p.id)} />
    </button>

    <div
      style={{ background: `linear-gradient(135deg, rgba(13,15,23,1), ${p.color_hex || '#7c3aed'}10)`, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '4/3', width: '100%', overflow: 'hidden' }}
      onClick={() => onView(p)}
    >
      <div style={{ width: '80%', height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={getProductImg(p)} alt={p.title} className="product-img drop-shadow-2xl" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', transition: 'transform 0.5s ease' }} draggable={false} />
      </div>
    </div>

    <div style={{ padding: '16px 16px 20px' }}>
      <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: p.color_hex || '#a78bfa', background: `${p.color_hex || '#7c3aed'}15`, padding: '3px 8px', borderRadius: 5, display: 'inline-block', marginBottom: 8 }}>
        {p.category || 'GERAL'}
      </span>
      <h3 style={{ fontSize: 13, fontWeight: 800, color: 'white', lineHeight: 1.3, marginBottom: 4, cursor: 'pointer' }} onClick={() => onView(p)}>{p.title}</h3>
      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>{p.subtitle}</p>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>R$ {Number(p.price).toFixed(2).replace('.', ',')}</span>
      </div>

      <button
        onClick={() => onAdd(p)}
        style={{ marginTop: 14, width: '100%', padding: '10px', background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.2))', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, color: '#a78bfa', fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(79,70,229,0.5))'; e.currentTarget.style.color = 'white'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.2))'; e.currentTarget.style.color = '#a78bfa'; }}
      >
        Solicitar Orçamento
      </button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   HERO SLIDER
═══════════════════════════════════════════════════════════ */
const HeroSlider: React.FC<{ banners: GmzBanner[], onCTA: () => void }> = ({ banners, onCTA }) => {
  // Fallback banners Se não houver nenhum configurado
  const defaultBanners: GmzBanner[] = [
    { id: '1', title: 'REGATAS', subtitle: 'NBA', description: 'Estilo e liberdade para jogar\nou para o dia a dia.', cta_text: 'VER MODELOS', bg_color: '#04050a', accent_color: '#7c3aed', active: true, sort_order: 1 },
    { id: '2', title: 'MANGA CURTA', subtitle: 'DIA A DIA', description: 'Conforto e estilo para te\nacompanhar em qualquer momento.', cta_text: 'VER MODELOS', bg_color: '#04050a', accent_color: '#9333ea', active: true, sort_order: 2 },
  ];

  const slides = banners.length > 0 ? banners : defaultBanners;
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = (idx: number) => {
    if (animating || idx === current) return;
    setCurrent(idx); setAnimating(true);
    setTimeout(() => setAnimating(false), 600);
  };
  const next = () => goTo((current + 1) % slides.length);
  const prevSlide = () => goTo((current - 1 + slides.length) % slides.length);

  useEffect(() => {
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [current, slides.length]);

  if (!slides || slides.length === 0) return null;

  const s = slides[current];
  const color = s.accent_color || '#7c3aed';
  const glow = color + '66'; // adiciona opacidade hex

  const parseImage = (url?: string) => {
    if (!url) return { src: FALLBACK_IMGS["regata-lakers"], x: 0, y: 0, scale: 1 };
    const parts = url.split('|||');
    return {
      src: parts[0] || FALLBACK_IMGS["regata-lakers"],
      x: Number(parts[1]) || 0,
      y: Number(parts[2]) || 0,
      scale: Number(parts[3]) || 1
    };
  };
  const imgData = parseImage(s.image_url);

  return (
    <section className="relative overflow-hidden min-h-[520px] flex items-center" style={{ background: s.bg_color || '#04050a' }}>
      <div className="absolute top-1/2 right-[-20%] md:right-[10%] -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full pointer-events-none transition-all duration-700 blur-[50px] md:blur-[80px]" style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(rgba(124,58,237,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 py-12 md:px-10 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center">
        <div style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateX(-20px)' : 'translateX(0)', transition: 'all 0.5s ease' }} className="text-center md:text-left order-2 md:order-1">
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: color, background: `${color}20`, border: `1px solid ${color}30`, padding: '6px 14px', borderRadius: 8, display: 'inline-block', marginBottom: 20 }}>
            DESTAQUE
          </span>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(52px, 8vw, 90px)', fontWeight: 900, color: 'white', lineHeight: 0.9, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '-0.01em' }}>
            {s.title}
          </h2>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(52px, 8vw, 90px)', fontWeight: 900, lineHeight: 0.9, textTransform: 'uppercase', marginBottom: 24, letterSpacing: '-0.01em', background: `linear-gradient(to right, ${color}, #818cf8)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {s.subtitle || ''}
          </h3>
          <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.7, marginBottom: 32, whiteSpace: 'pre-line' }}>{s.description || ''}</p>

          <div className="flex gap-3 flex-wrap justify-center md:justify-start">
            <button className="px-6 py-3 md:px-8 md:py-4 rounded-xl text-white font-black text-xs md:text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105" onClick={onCTA} style={{ background: `linear-gradient(135deg, ${color}, #4f46e5)`, boxShadow: `0 4px 25px ${glow}` }}>
              {s.cta_text || 'Ver Coleção'} <Icon.Arrow />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center relative order-1 md:order-2">
          <div style={{ position: 'absolute', width: '90%', height: '90%', borderRadius: '50%', border: '2px solid rgba(124,58,237,0.15)', boxShadow: `0 0 80px ${glow}, inset 0 0 80px ${glow}`, transition: 'all 0.8s ease', pointerEvents: 'none' }} />

          <img
            src={imgData.src}
            alt={s.title}
            className="animate-float"
            style={{ 
              maxHeight: 380, objectFit: 'contain', position: 'relative', zIndex: 1, 
              filter: `drop-shadow(0 30px 40px rgba(0,0,0,0.7)) drop-shadow(0 0 30px ${glow})`, 
              opacity: animating ? 0 : 1, 
              transform: `translate(${imgData.x}px, ${imgData.y}px) scale(${animating ? 0.9 : imgData.scale})`, 
              transition: 'all 0.5s ease' 
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
            <button onClick={prevSlide} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.ChevLeft />
            </button>
            <div style={{ display: 'flex', gap: 6 }}>
              {slides.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} style={{ width: i === current ? 24 : 8, height: 8, borderRadius: 4, background: i === current ? color : 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease' }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>
              0{current + 1} / 0{slides.length}
            </span>
            <button onClick={next} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.ChevRight />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN STORE APP
═══════════════════════════════════════════════════════════ */

const CartCheckout: React.FC<{ cart: CartItem[], totalPrice: number, storeName: string, whatsapp: string, onClear: () => void }> = ({ cart, totalPrice, storeName, whatsapp, onClear }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [hasArtwork, setHasArtwork] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name || !phone) {
      alert("Preencha nome e telefone!");
      return;
    }
    
    setSubmitting(true);
    let artworkUrl = '';
    let uploadFailed = false;

    try {
      if (hasArtwork && file) {
        try {
          artworkUrl = await gmzStoreService.uploadArtwork(file);
        } catch (uploadErr) {
          console.error("Erro no upload da arte:", uploadErr);
          uploadFailed = true;
        }
      }
      
      const orderData = {
        customer_name: name,
        customer_phone: phone,
        notes: address ? "Endereço: " + address : "",
        status: 'novo',
        source: 'loja_publica',
        total_price: totalPrice,
        items: cart.map(c => ({
          product_id: c.product.id,
          title: c.product.title,
          qty: c.qty,
          size: c.size,
          personalizationType: c.personalizationType,
          details: c.details,
          price: c.product.price
        })),
        custom_names: artworkUrl ? artworkUrl : null,
        has_artwork: hasArtwork,
        artwork_url: artworkUrl ? artworkUrl : null
      };

      // Create Order in DB
      await gmzStoreService.submitPublicOrder(orderData);

      // Build WhatsApp Message
      let msg = `Olá! Quero fazer um pedido na ${storeName}:\n`;
      msg += `*Cliente:* ${name}\n*Telefone:* ${phone}\n`;
      if (address) msg += `*Endereço:* ${address}\n`;
      msg += `\n*Itens:*\n`;
      
      cart.forEach(c => {
        const ps = parseSize(c.size);
        const sizeLabel = ps.category !== 'Geral' ? `${ps.category} ${ps.label}` : ps.label;
        msg += `• ${c.product.title} (${c.qty}x, Tam ${sizeLabel}) - R${(Number(c.product.price) * c.qty).toFixed(2)}\n`;
        if (c.personalizationType !== 'none') {
          c.details.forEach((d, i) => {
             msg += `  - Item ${i+1}: ${d.name ? d.name : 'Sem nome'} ${c.personalizationType === 'name_number' ? '(Nº ' + d.number + ')' : ''}\n`;
          });
        }
      });
      
      msg += `\n*Total Estimado:* R${totalPrice.toFixed(2)}\n`;
      if (hasArtwork) {
        msg += `\n*Arte em anexo:* ${artworkUrl}\n`;
      }
      
      if (uploadFailed) {
        msg += `\n*Atenção:* Tentei enviar o arquivo da arte, mas o tamanho excedeu o limite. Estou enviando a arte diretamente aqui pelo WhatsApp!\n`;
        alert("O seu arquivo era muito grande ou houve um erro no upload da arte. Seu pedido foi gerado com sucesso, mas por favor, envie o arquivo da sua arte aqui pelo WhatsApp logo em seguida!");
      }

      window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
      onClear();
      
    } catch(err) {
      console.error(err);
      alert("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5 border-t border-purple-500/15 bg-[#0d0f17]/90">
      <div className="mb-4">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Seu Nome</label>
        <input className="input-field mt-1" value={name} onChange={e=>setName(e.target.value)} placeholder="João Silva" />
      </div>
      <div className="mb-4">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Telefone/WhatsApp</label>
        <input className="input-field mt-1" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(11) 99999-9999" />
      </div>
      <div className="mb-4">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Endereço (opcional)</label>
        <input className="input-field mt-1" value={address} onChange={e=>setAddress(e.target.value)} placeholder="Rua, Número, Bairro" />
      </div>
      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm text-slate-300 font-bold">
          <input type="checkbox" checked={hasArtwork} onChange={e => setHasArtwork(e.target.checked)} className="rounded text-indigo-500 bg-black/30 border-white/10" />
          Já possui a arte?
        </label>
        {hasArtwork && (
          <div className="mt-2">
            <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-500/20 file:text-indigo-400 hover:file:bg-indigo-500/30 w-full" />
            <p className="text-[10px] text-slate-500 mt-2 font-medium">
              * Tamanho máximo: 50MB. Para arquivos maiores, envie o link pelo WhatsApp.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between mb-4 mt-6">
        <span className="text-sm text-slate-400">Total estimado:</span>
        <span className="text-xl font-black text-white">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
      </div>           
      <button
        onClick={handleSubmit}
        disabled={submitting || cart.length === 0 || !name || !phone}
        className="w-full px-6 py-5 rounded-2xl text-white font-black text-[15px] uppercase tracking-wide flex items-center justify-center gap-3 bg-[#25d366] hover:bg-[#1ebd5a] disabled:opacity-50 transition-all shadow-[0_0_25px_rgba(37,211,102,0.4)]"
      >
        <span className="text-2xl">💬</span>
        {submitting ? 'PROCESSANDO PEDIDO...' : 'CONFIRMAR PEDIDO VIA WHATSAPP'}
      </button>
    </div>
  );
};

export const PublicStore: React.FC<{ tenantId?: string }> = ({ tenantId }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeModal, setActiveModal] = useState<GmzProduct | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('TODOS');
  
  const [quantity, setQuantity] = useState(1);
  const [persType, setPersType] = useState<'none'|'name'|'name_number'>('none');
  const [persDetails, setPersDetails] = useState<CartItemDetail[]>([{ name: '', number: '' }]);
  const [selectedSize, setSelectedSize] = useState('M');
  const productsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeModal) {
      setQuantity(1);
      setPersType('none');
      setPersDetails([{ name: '', number: '' }]);
      setSelectedSize(activeModal.sizes && activeModal.sizes.length > 0 ? parseSize(activeModal.sizes[0]).raw : 'M');
    }
  }, [activeModal]);

  // Dynamic Data
  const [products, setProducts] = useState<GmzProduct[]>([]);
  const [banners, setBanners] = useState<GmzBanner[]>([]);
  const [settings, setSettings] = useState<GmzStoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedTenantId = tenantId || await getTenantId();
        const [p, b, s] = await Promise.all([
          gmzStoreService.getPublicProducts(resolvedTenantId || undefined),
          gmzStoreService.getPublicBanners(resolvedTenantId || undefined),
          gmzStoreService.getPublicSettings(resolvedTenantId || undefined),
        ]);
        setProducts(p);
        setBanners(b);
        setSettings(s);
      } catch (err) {
        console.error('Error loading store data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [tenantId]);

  // Inject custom CSS classes for the store to avoid conflicts
  const storeName = settings?.store_name || 'GMZ Performance';
  const whatsapp = settings?.whatsapp || '5511999999999';
  const primaryColor = settings?.primary_color || '#7c3aed';

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .gmz-store {
        --bg-900: #040507;
        --bg-800: #07090d;
        --bg-700: #0d0f17;
        font-family: 'Inter', sans-serif;
        background: var(--bg-900);
        color: #e2e8f0;
      }
      .gmz-store .btn-primary {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 14px 28px; background: linear-gradient(135deg, ${primaryColor}, ${settings?.accent_color || '#4f46e5'});
        color: white; font-weight: 700; font-size: 12px;
        text-transform: uppercase; letter-spacing: 0.1em;
        border-radius: 12px; border: none; cursor: pointer;
        box-shadow: 0 4px 25px ${primaryColor}59;
        transition: all 0.2s ease; text-decoration: none;
      }
      .gmz-store .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 35px ${primaryColor}80; filter: brightness(1.1); }
      .gmz-store .section-title { font-size: clamp(22px, 3vw, 30px); font-weight: 800; color: white; letter-spacing: -0.02em; }
      .gmz-store .section-title span { color: ${primaryColor}; }
      .gmz-store .product-card {
        background: rgba(13,15,23,0.8); border: 1px solid rgba(139,92,246,0.1);
        border-radius: 20px; overflow: hidden; transition: all 0.3s ease;
      }
      .gmz-store .product-card:hover { border-color: rgba(139,92,246,0.4); transform: translateY(-8px); box-shadow: 0 25px 50px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.15); }
      .gmz-store .product-card:hover .product-img { transform: scale(1.05) translateY(-5px); filter: drop-shadow(0 20px 20px rgba(139,92,246,0.3)); }
      .gmz-store .product-img { transition: all 0.4s ease; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.5)); }
      .gmz-store .cart-drawer {
        position: fixed; top: 0; right: 0; bottom: 0; width: 420px; max-width: 100vw;
        background: var(--bg-700); border-left: 1px solid rgba(139,92,246,0.15);
        z-index: 200; transform: translateX(100%); transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
        display: flex; flex-direction: column;
      }
      .gmz-store .cart-drawer.open { transform: translateX(0); }
      .gmz-store .cart-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 199;
        opacity: 0; pointer-events: none; transition: opacity 0.35s ease;
      }
      .gmz-store .cart-overlay.open { opacity: 1; pointer-events: all; }
      .gmz-store .modal-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); z-index: 300;
        display: flex; align-items: center; justify-content: center; padding: 20px;
        opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
      }
      .gmz-store .modal-overlay.open { opacity: 1; pointer-events: all; }
      .gmz-store .modal-box {
        background: var(--bg-700); border: 1px solid rgba(139,92,246,0.15); border-radius: 28px;
        max-width: 560px; width: 100%; max-height: 90vh; overflow-y: auto;
        transform: scale(0.95) translateY(20px); transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
      }
      .gmz-store .modal-overlay.open .modal-box { transform: scale(1) translateY(0); }
      .gmz-store .input-field {
        width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px; padding: 12px 16px; color: white; font-size: 14px; outline: none; transition: border-color 0.2s;
      }
      .gmz-store .input-field:focus { border-color: rgba(124,58,237,0.6); }
      @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
      @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      .animate-float { animation: float 4s ease-in-out infinite; }
      .animate-ticker { animation: ticker 25s linear infinite; }
      .ticker-item { display: flex; align-items: center; gap: 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #475569; flex-shrink: 0; }
      .ticker-dot { width: 6px; height: 6px; border-radius: 50%; background: #7c3aed; }
      .toast { position: fixed; top: 24px; left: 50%; transform: translateX(-50%) translateY(-80px); background: rgba(15,10,30,0.95); border: 1px solid rgba(139,92,246,0.4); color: #c4b5fd; padding: 12px 24px; border-radius: 12px; font-size: 13px; font-weight: 500; box-shadow: 0 10px 40px rgba(139,92,246,0.3); backdrop-filter: blur(12px); z-index: 9999; transition: transform 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.4s ease; opacity: 0; }
      .toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  if (loading) {
    return <div style={{ height: '100vh', background: '#040507', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>Carregando loja...</div>;
  }

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const toggleFav = (id: string) => {
    setFavorites(prev => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); showToast('Removido dos favoritos'); }
      else { n.add(id); showToast('❤️ Adicionado aos favoritos!'); }
      return n;
    });
  };

  const addToCart = (p: GmzProduct) => {
    let finalPrice = Number(p.price);
    if (persType === 'name') finalPrice += settings?.personalization_name_price ? Number(settings.personalization_name_price) : 0;
    if (persType === 'name_number') finalPrice += settings?.personalization_name_number_price ? Number(settings.personalization_name_number_price) : 0;

    setCart(prev => [...prev, {
      id: `${p.id}-${Date.now()}`,
      product: { ...p, price: finalPrice },
      qty: quantity,
      size: selectedSize,
      personalizationType: persType,
      details: persType === 'none' ? [] : persDetails.slice(0, quantity)
    }]);
    showToast(`✓ ${p.title} adicionado!`);
    setCartOpen(true);
    setActiveModal(null);
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + Number(i.product.price) * i.qty, 0);

  const activeCats = ['TODOS', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const filteredProducts = filterCat === 'TODOS' ? products : products.filter(p => p.category === filterCat);

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="gmz-store" style={{ minHeight: '100vh', background: '#040507', color: '#e2e8f0', fontFamily: "'Inter', sans-serif" }}>
      <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 bg-white text-[#040507] px-6 py-3 rounded-full font-bold text-sm shadow-xl z-[2000] transition-all duration-300 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>{toast}</div>

      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] transition-opacity duration-300 ${cartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setCartOpen(false)} />

      <div className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-[#040507] border-l border-purple-500/15 z-[1000] flex flex-col transition-transform duration-500 ease-out ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="px-6 py-5 border-b border-purple-500/15 flex justify-between items-center bg-[#0d0f17]/80">
          <div className="flex items-center gap-2">
            <Icon.Cart />
            <span className="font-black text-sm uppercase tracking-widest">Orçamento ({totalItems})</span>
          </div>
          <button onClick={() => setCartOpen(false)} className="bg-transparent border-none text-slate-500 hover:text-white cursor-pointer p-2 rounded-lg transition-colors">
            <Icon.X />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {cart.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 16, color: '#475569' }}>
              <Icon.Cart />
              <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Carrinho Vazio</p>
              <p style={{ fontSize: 12, textAlign: 'center', color: '#334155' }}>Adicione produtos para começar seu orçamento</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.1)', borderRadius: 16, padding: '14px' }}>
                  <img src={getProductImg(item.product)} alt={item.product.title} style={{ width: 60, height: 60, objectFit: 'contain', background: 'rgba(0,0,0,0.3)', borderRadius: 10 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: 'white', lineHeight: 1.3 }}>{item.product.title}</p>
                      <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}>
                        <Icon.Trash />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(124,58,237,0.15)', color: '#a78bfa', padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase' }}>{item.product.category}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(255,255,255,0.05)', color: '#64748b', padding: '2px 7px', borderRadius: 5 }}>
                        {(() => {
                          const ps = parseSize(item.size);
                          return ps.category !== 'Geral' ? `Tam. ${ps.category} ${ps.label}` : `Tam. ${ps.label}`;
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
      <span className="text-sm font-black text-white">R$ {(Number(item.product.price) * item.qty).toFixed(2).replace('.', ',')}</span>
      <span className="text-[10px] text-slate-500 font-bold uppercase">{item.qty} UNIDADES</span>
    </div>
    {item.personalizationType !== 'none' && item.details.length > 0 && (
      <div className="mt-2 bg-black/30 rounded p-2 text-[10px] text-slate-400 max-h-20 overflow-y-auto">
        {item.details.map((d, i) => (
          <div key={i}>
            • {d.name || 'Sem nome'} {item.personalizationType === 'name_number' ? `(Nº ${d.number})` : ''}
          </div>
        ))}
      </div>
    )}
  </div>
                  </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && <CartCheckout cart={cart} totalPrice={totalPrice} storeName={storeName} whatsapp={whatsapp} onClear={() => { setCart([]); setCartOpen(false); }} />}
      </div>

      {/* Modal backdrop — only rendered when activeModal exists, avoiding blue-flash */}
      {activeModal && (
        <div
          className="fixed inset-0 z-[1100] flex flex-col items-end lg:items-center justify-end lg:justify-center p-0 lg:p-4"
          style={{ background: 'rgba(0,0,0,0.85)', WebkitTapHighlightColor: 'transparent' }}
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-[#0b0e17] w-full max-w-[1000px] max-h-[92dvh] lg:max-h-[90vh] overflow-y-auto shadow-2xl relative rounded-t-[32px] lg:rounded-[28px] pb-8 lg:pb-0"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-1 lg:hidden">
              <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-3 right-3 z-20 bg-white/5 hover:bg-white/10 text-slate-400 p-2 rounded-xl transition-colors"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Icon.X />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 relative mt-2 lg:mt-0">
              <div className="p-4 lg:p-8 rounded-t-[32px] lg:rounded-l-[28px] lg:rounded-tr-none flex flex-col items-center justify-center min-h-[280px]" style={{ background: `linear-gradient(135deg, #07090d, ${activeModal.color_hex || '#7c3aed'}15)` }}>
                <div className="text-center mb-2">
                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Arraste para girar • Visualização 360°</span>
                </div>
                <Viewer360 product={activeModal} color={activeModal.color_hex || '#7c3aed'} />
              </div>

              <div style={{ padding: '30px 30px 30px 20px' }}>
                <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: activeModal.color_hex || '#a78bfa', background: `${activeModal.color_hex || '#7c3aed'}20`, padding: '4px 10px', borderRadius: 6, display: 'inline-block', marginBottom: 12 }}>
                  {activeModal.category || 'PRODUTO'}
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: 'white', marginBottom: 8, lineHeight: 1.2 }}>{activeModal.title}</h2>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>{activeModal.description}</p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                  {(activeModal.features || []).map(f => (
                    <span key={f} style={{ fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {f}
                    </span>
                  ))}
                </div>

                <div style={{ marginBottom: 16 }}>
                  {(() => {
                    const rawSizes = activeModal.sizes && activeModal.sizes.length > 0 ? activeModal.sizes : ['PP', 'P', 'M', 'G', 'GG'];
                    const parsedSizes = rawSizes.map(parseSize);
                    
                    // Deduplicate: If there are detailed sizes (Masculino/Feminino), hide the 'Geral' duplicates
                    const hasDetailed = parsedSizes.some(ps => ps.category !== 'Geral');
                    let finalSizes = parsedSizes;
                    if (hasDetailed) {
                      finalSizes = parsedSizes.filter(ps => {
                        if (ps.category !== 'Geral') return true;
                        // For 'Geral', keep it only if no detailed category has this same label
                        const isDuplicated = parsedSizes.some(other => other.category !== 'Geral' && other.label === ps.label);
                        return !isDuplicated;
                      });
                    }

                    // Also remove exact duplicates
                    const uniqueSizes = Array.from(new Map(finalSizes.map(item => [item.raw, item])).values());

                    const grouped: Record<string, ParsedSize[]> = {};
                    uniqueSizes.forEach(ps => {
                      const catName = ps.category === 'Geral' ? 'Tamanhos' : ps.category;
                      if (!grouped[catName]) grouped[catName] = [];
                      grouped[catName].push(ps);
                    });
                    
                    const activeParsed = uniqueSizes.find(ps => ps.raw === selectedSize);

                    return (
                      <div className="flex flex-col gap-5">
                        {Object.entries(grouped).map(([cat, sizes]) => (
                          <div key={cat} className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              {cat}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {sizes.map(ps => {
                                const isSelected = selectedSize === ps.raw;
                                return (
                                  <button 
                                    key={ps.raw} 
                                    onClick={() => setSelectedSize(ps.raw)} 
                                    className={`min-w-[44px] px-3 h-10 rounded-xl font-bold text-xs transition-all duration-200 border flex items-center justify-center ${
                                      isSelected 
                                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.2)] scale-105' 
                                        : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-600'
                                    }`}
                                  >
                                    {ps.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}

                        {/* Tabela de Medidas Expandida */}
                        {activeParsed && activeParsed.height && activeParsed.width && (
                          <div className="mt-1 p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-center gap-3 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                              <Icon.Rotate />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-0.5">
                                Guia de Medidas • {activeParsed.label}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-slate-300">
                                <span>Altura: <strong className="text-white">{activeParsed.height}cm</strong></span>
                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                <span>Largura: <strong className="text-white">{activeParsed.width}cm</strong></span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="mb-5 bg-white/5 border border-white/10 rounded-xl p-4">
    <div className="flex justify-between items-center mb-4">
      <span className="text-sm font-bold text-slate-300">Quantidade</span>
      <div className="flex items-center gap-3 bg-black/40 rounded-lg p-1 border border-white/10">
        <button className="w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-white" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
        <span className="w-6 text-center text-sm font-bold">{quantity}</span>
        <button className="w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-white" onClick={() => {
          setQuantity(q => q + 1);
          setPersDetails(prev => [...prev, { name: '', number: '' }]);
        }}>+</button>
      </div>
    </div>

    <div className="mb-4">
      <span className="text-sm font-bold text-slate-300 mb-2 block">Personalização</span>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
          <input type="radio" checked={persType === 'none'} onChange={() => setPersType('none')} /> Sem Personalização (Liso)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
          <input type="radio" checked={persType === 'name'} onChange={() => setPersType('name')} /> 
          Somente Nome {(settings?.personalization_name_price || 0) > 0 && <span className="text-emerald-400 font-bold">(+ R$ {Number(settings?.personalization_name_price).toFixed(2).replace('.', ',')})</span>}
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
          <input type="radio" checked={persType === 'name_number'} onChange={() => setPersType('name_number')} /> 
          Nome e Número {(settings?.personalization_name_number_price || 0) > 0 && <span className="text-emerald-400 font-bold">(+ R$ {Number(settings?.personalization_name_number_price).toFixed(2).replace('.', ',')})</span>}
        </label>
      </div>
    </div>

    {persType !== 'none' && (
      <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
        {Array.from({ length: quantity }).map((_, idx) => (
          <div key={idx} className="bg-black/30 p-3 rounded-lg border border-white/5 flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Nome {idx + 1}</label>
              <input className="input-field mt-1" value={persDetails[idx]?.name || ''} onChange={e => {
                const newD = [...persDetails];
                if (!newD[idx]) newD[idx] = { name: '', number: '' };
                newD[idx].name = e.target.value;
                setPersDetails(newD);
              }} />
            </div>
            {persType === 'name_number' && (
              <div className="w-20">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Número {idx + 1}</label>
                <input className="input-field mt-1 text-center" value={persDetails[idx]?.number || ''} onChange={e => {
                  const newD = [...persDetails];
                  if (!newD[idx]) newD[idx] = { name: '', number: '' };
                  newD[idx].number = e.target.value;
                  setPersDetails(newD);
                }} />
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>

  <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: 'white' }}>
                    R$ {(() => {
                      let price = Number(activeModal.price);
                      if (persType === 'name') price += settings?.personalization_name_price ? Number(settings.personalization_name_price) : 0;
                      if (persType === 'name_number') price += settings?.personalization_name_number_price ? Number(settings.personalization_name_number_price) : 0;
                      return price.toFixed(2).replace('.', ',');
                    })()}
                  </span>
                </div>

                <button className="px-6 py-4 rounded-xl text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 w-full bg-indigo-600 hover:bg-indigo-500 mt-4" onClick={() => addToCart(activeModal)}>
                  Adicionar ao Orçamento <Icon.Arrow />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-[100] h-[72px] flex items-center justify-between px-4 md:px-10 bg-[#07090d]/90 backdrop-blur-xl border-b border-purple-500/10">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-lg md:text-xl" style={{ background: `linear-gradient(135deg, ${primaryColor}, #4f46e5)`, boxShadow: `0 0 20px ${primaryColor}66` }}>
            ⚡
          </div>
          <div className="flex flex-col">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={storeName} style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
            ) : (
              <>
                <div className="text-sm md:text-base font-black tracking-tighter leading-none" style={{ color: 'white' }}>{storeName.split(' ')[0]}</div>
                <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: primaryColor }}>{storeName.split(' ').slice(1).join(' ')}</div>
              </>
            )}
          </div>
        </div>

        <nav className="hidden md:flex gap-1">
          {[
            { label: 'Início', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
            { label: 'Todos os produtos', action: scrollToProducts },
            { label: 'Contato', action: () => window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}`, '_blank') },
          ].map((item, i) => (
            <button key={i} onClick={item.action} style={{ padding: '8px 14px', background: 'none', border: 'none', color: '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', borderRadius: 8, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'none'; }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setCartOpen(true)}
            style={{ position: 'relative', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, padding: '8px 10px', color: '#a78bfa', cursor: 'pointer', display: 'flex' }}
          >
            <Icon.Cart />
            {totalItems > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, background: '#7c3aed', borderRadius: '50%', fontSize: 10, fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #040507' }}>
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      <HeroSlider banners={banners} onCTA={scrollToProducts} />

      <div className="ticker-wrap py-3 bg-[#07090d]/60 overflow-hidden border-y border-purple-500/10">
        <div className="ticker-tape animate-ticker flex gap-8 md:gap-14 whitespace-nowrap">
          {[...Array(3)].flatMap(() => [
            '⚡ SUBLIMAÇÃO PREMIUM', '🏆 +10K CLIENTES', '🚀 ENTREGA RÁPIDA', '✨ PERSONALIZAÇÃO TOTAL', '🛡️ QUALIDADE GARANTIDA', '📦 PARA TODO O BRASIL', '⚡ TECNOLOGIA UV+50', '🎨 CORES VIBRANTES',
          ]).map((item, i) => (
            <span key={i} className="ticker-item text-xs md:text-sm">
              <span className="ticker-dot" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <section ref={productsRef} id="produtos" className="px-4 py-12 md:px-10 md:py-20 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <h2 className="section-title text-center md:text-left">Produtos <span>em destaque</span></h2>
          <div className="flex gap-2 flex-wrap justify-center">
            {activeCats.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                style={{ padding: '7px 14px', borderRadius: 10, border: `1px solid ${filterCat === cat ? '#7c3aed' : 'rgba(255,255,255,0.08)'}`, background: filterCat === cat ? 'rgba(124,58,237,0.2)' : 'transparent', color: filterCat === cat ? '#a78bfa' : '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.2s' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Nenhum produto cadastrado na loja ainda.</div>
        ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {filteredProducts.map(p => (
                <ProductCard key={p.id} p={p} favorites={favorites} onFav={toggleFav} onView={setActiveModal} onAdd={addToCart} />
            ))}
            </div>
        )}
      </section>

      <section className="bg-[#07090d]/60 border-y border-purple-500/10 px-4 py-10 md:px-10 md:py-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { icon: '⚡', title: 'Tecnologia Premium', desc: 'Estampas com cores vivas e alta durabilidade' },
            { icon: '🧵', title: 'Tecidos Selecionados', desc: 'Conforto, leveza e máximo desempenho' },
            { icon: '✂️', title: 'Acabamento Premium', desc: 'Costuras reforçadas e caimento perfeito' },
            { icon: '🔒', title: 'Compra Segura', desc: 'Seus dados protegidos do início ao fim' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'rgba(13,15,23,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
                {f.icon}
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{f.title}</p>
                <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-[#07090d]/80 pt-10 pb-6 px-4 md:px-10">
        <div className="max-w-[1400px] mx-auto text-center">
          <p style={{ textAlign: 'center', fontSize: 12, color: '#334155' }}>
            © 2024 {storeName}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicStore;
