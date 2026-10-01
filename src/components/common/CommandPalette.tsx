import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Camera,
  AlertOctagon,
  TrendingUp,
  ArrowRightLeft,
  Share2,
  Sliders,
  BellRing,
  FileText,
  Building2,
  Pill,
  X,
} from 'lucide-react';
import { COPY } from '../../constants/copy';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  category: 'Pages' | 'Facilities' | 'Drugs' | 'Transfers';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  path?: string;
  action?: () => void;
}

const COMMAND_ITEMS: CommandItem[] = [
  // Pages
  { id: 'page-map', category: 'Pages', title: COPY.nav.districtMap, subtitle: 'View all health centres and stock status on map', icon: MapPin, path: '/map' },
  { id: 'page-capture', category: 'Pages', title: COPY.nav.phcCapture, subtitle: 'Record medicine stock by photo or voice', icon: Camera, path: '/capture' },
  { id: 'page-risk', category: 'Pages', title: COPY.nav.riskQueue, subtitle: 'Health centres running low on medicine', icon: AlertOctagon, path: '/risk' },
  { id: 'page-forecast', category: 'Pages', title: COPY.nav.forecast, subtitle: 'Predicted medicine demand and usage trends', icon: TrendingUp, path: '/forecast' },
  { id: 'page-transfers', category: 'Pages', title: COPY.nav.transfers, subtitle: 'Move surplus stock to centres in need', icon: ArrowRightLeft, path: '/transfers' },
  { id: 'page-federation', category: 'Pages', title: COPY.nav.federationConsole, subtitle: 'Shared learning across districts and states', icon: Share2, path: '/federation' },
  { id: 'page-scenario', category: 'Pages', title: COPY.nav.scenarioSimulator, subtitle: 'Simulate outbreaks and test emergency supply plans', icon: Sliders, path: '/scenario' },
  { id: 'page-alerts', category: 'Pages', title: COPY.nav.alerts, subtitle: 'Urgent stock warnings and messages', icon: BellRing, path: '/alerts' },
  { id: 'page-audit', category: 'Pages', title: COPY.nav.auditTrail, subtitle: 'History of all stock updates and transfers', icon: FileText, path: '/audit' },
  
  // Facilities
  { id: 'fac-014', category: 'Facilities', title: 'TN-PHC-014 (PHC Sample-014)', subtitle: 'Block-A · Population: 24,500', icon: Building2, path: '/map?facility_id=TN-PHC-014' },
  { id: 'fac-021', category: 'Facilities', title: 'TN-PHC-021 (PHC Sample-021)', subtitle: 'Block-B · Population: 18,200', icon: Building2, path: '/map?facility_id=TN-PHC-021' },
  { id: 'fac-042', category: 'Facilities', title: 'TN-PHC-042 (PHC Sample-042)', subtitle: 'Block-B · Population: 31,000', icon: Building2, path: '/map?facility_id=TN-PHC-042' },
  { id: 'fac-003', category: 'Facilities', title: 'TN-CHC-003 (CHC Sample-003)', subtitle: 'Block-A · Population: 62,000', icon: Building2, path: '/map?facility_id=TN-CHC-003' },

  // Drugs
  { id: 'drug-ors', category: 'Drugs', title: 'ORS (Oral Rehydration Salts)', subtitle: 'Essential Medicine · Unit: sachets', icon: Pill, path: '/forecast?drug_code=ORS' },
  { id: 'drug-para', category: 'Drugs', title: 'PARA500 (Paracetamol 500mg)', subtitle: 'Essential Medicine · Unit: tablets', icon: Pill, path: '/forecast?drug_code=PARA500' },
  { id: 'drug-amox', category: 'Drugs', title: 'AMOX500 (Amoxicillin 500mg)', subtitle: 'Antibiotic · Unit: capsules', icon: Pill, path: '/forecast?drug_code=AMOX500' },

  // Transfers
  { id: 'tr-101', category: 'Transfers', title: 'Transfer Suggestion #TR-101', subtitle: 'TN-CHC-003 → TN-PHC-014 (ORS 400 sachets)', icon: ArrowRightLeft, path: '/transfers' },
  { id: 'tr-102', category: 'Transfers', title: 'Transfer Suggestion #TR-102', subtitle: 'TN-CHC-003 → TN-PHC-021 (PARA500 800 tabs)', icon: ArrowRightLeft, path: '/transfers' },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredItems = COMMAND_ITEMS.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelectItem(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelectItem = (item: CommandItem) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.action) {
      item.action();
    }
    onClose();
  };

  if (!isOpen) return null;

  // Group items by category
  const categories: Array<'Pages' | 'Facilities' | 'Drugs' | 'Transfers'> = [
    'Pages',
    'Facilities',
    'Drugs',
    'Transfers',
  ];

  let currentIndexTracker = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-theme-text/40 backdrop-blur-xs font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-theme-surface border border-theme-border rounded-xl shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette Search"
      >
        {/* Search Input Box */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-theme-border bg-theme-surface">
          <Search className="w-5 h-5 text-theme-muted shrink-0" strokeWidth={1.8} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, health centres, medicines, or transfers (Press Esc to close)..."
            className="w-full bg-transparent text-[14px] text-theme-text placeholder-theme-muted focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-theme-muted hover:text-theme-text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-theme-bg border border-theme-border text-theme-muted shrink-0">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-4">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-theme-muted text-[13px]">
              No results found for "{query}". Try searching for "Map", "ORS", or "PHC".
            </div>
          ) : (
            categories.map((cat) => {
              const catItems = filteredItems.filter((i) => i.category === cat);
              if (catItems.length === 0) return null;

              return (
                <div key={cat} className="space-y-1">
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-theme-muted">
                    {cat}
                  </div>
                  {catItems.map((item) => {
                    const itemIdx = currentIndexTracker;
                    currentIndexTracker += 1;
                    const isSelected = itemIdx === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        onMouseEnter={() => setSelectedIndex(itemIdx)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-[13px] ${
                          isSelected
                            ? 'bg-theme-primary-tint text-theme-primary font-semibold'
                            : 'text-theme-text hover:bg-theme-border/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                          <div>
                            <span className="block font-medium leading-none">{item.title}</span>
                            {item.subtitle && (
                              <span className="text-[11px] text-theme-muted font-normal mt-0.5 block">
                                {item.subtitle}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-[11px] font-mono text-theme-primary">↵ Select</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-theme-border bg-theme-bg flex items-center justify-between text-[11px] font-mono text-theme-muted">
          <span>Navigation: ↑ ↓ Navigate | ↵ Select | ESC Close</span>
          <span>Command Palette</span>
        </div>
      </div>
    </div>
  );
};
