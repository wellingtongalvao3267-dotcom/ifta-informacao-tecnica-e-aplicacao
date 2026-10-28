import React from 'react';
import { FileText, Cpu, ExternalLink, QrCode } from 'lucide-react';
import { ComponentItem } from '../types';

interface ComponentCardProps {
  component: ComponentItem;
  onSelect: (component: ComponentItem) => void;
  onOpenQr: (component: ComponentItem) => void;
}

export const ComponentCard: React.FC<ComponentCardProps> = ({
  component,
  onSelect,
  onOpenQr
}) => {
  return (
    <div 
      onClick={() => onSelect(component)}
      className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/5 flex flex-col justify-between"
    >
      <div>
        {/* Top Image Container */}
        <div className="relative aspect-[4/3] w-full bg-slate-950 overflow-hidden border-b border-slate-800/80">
          {component.imageUrl ? (
            <img
              src={component.imageUrl}
              alt={component.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                // Graceful fallback if image fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-slate-950 text-slate-600">
              <Cpu className="w-12 h-12 mb-2 text-slate-700" />
              <span className="text-xs font-mono text-slate-500">Desenho Técnico Cadastrado</span>
            </div>
          )}

          {/* Quiet Tag Kicker overlay */}
          <div className="absolute top-2.5 left-2.5 px-2 py-1 bg-slate-950/90 backdrop-blur-sm border border-slate-800 rounded text-[11px] font-mono text-amber-300">
            {component.tagCode}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenQr(component);
            }}
            title="Ver QR Code da Peça"
            className="absolute top-2.5 right-2.5 p-1.5 bg-slate-950/90 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded border border-slate-800 transition"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-4">
          {/* Metadata line without pills (Rule 1A Zero-Pill) */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
            <span className="font-medium text-slate-300">{component.category}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{component.manufacturer}</span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors line-clamp-2 mb-2 leading-snug">
            {component.name}
          </h3>

          {/* Short Application description */}
          <p className="text-xs text-slate-400 line-clamp-2 mb-3">
            {component.application || component.description}
          </p>

          {/* Key Specs Preview (Tabular numbers) */}
          {component.specs && component.specs.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
              {component.specs.slice(0, 2).map((spec, i) => (
                <div key={i} className="truncate">
                  <span className="text-slate-500 block text-[10px] uppercase">{spec.label}</span>
                  <span className="text-slate-200 tabular-nums font-medium">{spec.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400 group-hover:text-amber-400 transition-colors">
        <span className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          <span>Ficha Técnica, Esquemas & Manual</span>
        </span>
        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
      </div>
    </div>
  );
};
