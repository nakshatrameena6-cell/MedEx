import React, { useState } from 'react';
import { ArrowUpRight, RefreshCw, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { KpiCard } from '../components/common/KpiCard';
import { SectionCard } from '../components/common/SectionCard';
import { Select } from '../components/common/Select';
import { Tabs } from '../components/common/Tabs';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { Card3D } from '../components/3d/Card3D';

const SWATCHES = [
  { name: 'Canvas', token: '--color-bg' }, { name: 'Surface', token: '--color-surface' },
  { name: 'Ice blue', token: '--color-primary' }, { name: 'Coral', token: '--color-critical' },
  { name: 'Sea glass', token: '--color-healthy-text' }, { name: 'Amber', token: '--color-warning-text' },
];

export const StyleGuideView: React.FC = () => {
  const [tab, setTab] = useState('overview');
  const [scope, setScope] = useState('district');
  return (
    <div className="space-y-6">
      <PageHeader title="The MedEx design language" subtitle="Quiet confidence. Clear signals. A shared system for connected care." actionSlot={<ThemeToggle />} />
      <SectionCard title="01 / Color" subtitle="A cool foundation with purposeful, accessible status accents.">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {SWATCHES.map((swatch) => <div key={swatch.token}>
            <div className="h-24 rounded-xl border border-theme-border mb-3" style={{ background: `var(${swatch.token})` }} />
            <p className="text-xs font-medium">{swatch.name}</p><p className="font-mono text-[9px] text-theme-muted mt-1">{swatch.token}</p>
          </div>)}
        </div>
      </SectionCard>
      <SectionCard title="02 / Typography" subtitle="Distinctive headlines, readable details, precise data.">
        <div className="grid md:grid-cols-3 gap-6">
          <div><p className="eyebrow mb-4">Space Grotesk / Display</p><p className="font-display text-4xl tracking-tight">Care, connected.</p></div>
          <div><p className="eyebrow mb-4">DM Sans / Interface</p><p className="text-base leading-relaxed">The right supplies. In the right place. At the right time.</p></div>
          <div><p className="eyebrow mb-4">IBM Plex Mono / Data</p><p className="font-mono text-2xl tracking-tight">TN-D01 / 071</p></div>
        </div>
      </SectionCard>
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="03 / Controls">
          <div className="flex flex-wrap gap-3 mb-6"><Button icon={ArrowUpRight}>Primary action</Button><Button variant="secondary" icon={RefreshCw}>Secondary action</Button><Button variant="ghost">Quiet action</Button></div>
          <Select label="Working scope" value={scope} onChange={setScope} options={[{ value: 'district', label: 'District overview' }, { value: 'state', label: 'State overview' }]} />
          <div className="mt-5"><Tabs activeTab={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'activity', label: 'Activity' }, { id: 'history', label: 'History' }]} /></div>
        </SectionCard>
        <SectionCard title="04 / Status & motion">
          <div className="flex gap-3 mb-6"><StatusBadge status="RED" /><StatusBadge status="AMBER" /><StatusBadge status="GREEN" /></div>
          <Card3D><div className="p-5"><ShieldCheck size={22} className="text-theme-primary mb-3" /><p className="text-sm font-medium">Considered motion</p><p className="text-xs text-theme-muted mt-2 leading-relaxed">Gentle depth on pointer movement, soft page entrances, and restrained transitions. Reduced-motion preferences are respected throughout the workspace.</p></div></Card3D>
        </SectionCard>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        <KpiCard title="Example resilience" value={82} unit="/ 100" subtext="Illustrative metric" icon={ShieldCheck} />
        <KpiCard title="Example lead time" value={6.4} unit="days" subtext="Illustrative metric" />
        <KpiCard title="Example priority count" value={3} status="RED" subtext="Illustrative metric" />
      </div>
    </div>
  );
};
