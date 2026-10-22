'use client';
import { createContext, useContext } from 'react';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { SOURCES } from './lib/data';

export const ModeContext = createContext('ringkas');
export const useMode = () => useContext(ModeContext);

const READ_LABEL = { ringkas: 'Intinya', bisnis: 'Dampak bisnis', teknis: 'Cara kerja' };

export function Src({ k }) {
  const s = SOURCES[k];
  return <span className={`src ${k}`} title={s.note}><i />{s.label}</span>;
}

export function Read({ r }) {
  const mode = useMode();
  if (!r) return null;
  const text = r[mode] || r.ringkas;
  return <div className={`read ${mode}`}><b>{READ_LABEL[mode]}</b><span>{text}</span></div>;
}

export function Panel({ title, sub, src = [], actions, read, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      {(title || actions || src.length > 0) && (
        <div className="panel-head">
          <div>
            {title && <h3>{title}</h3>}
            {sub && <p className="sub">{sub}</p>}
          </div>
          <div className="panel-actions">
            {actions}
            {src.length > 0 && <div className="src-row">{src.map((k) => <Src key={k} k={k} />)}</div>}
          </div>
        </div>
      )}
      {children}
      {read && <Read r={read} />}
    </section>
  );
}

export function Stat({ label, value, note, src, tone = '', small = false }) {
  return (
    <div className={`stat ${tone}`}>
      <div className="stat-top"><span>{label}</span>{src && <Src k={src} />}</div>
      <strong className={small ? 'sm' : ''}>{value}</strong>
      {note && <span className="note">{note}</span>}
    </div>
  );
}

const CALLOUT_ICON = { info: Info, warn: AlertTriangle, risk: ShieldAlert, good: CheckCircle2 };
export function Callout({ tone = 'info', title, children }) {
  const Icon = CALLOUT_ICON[tone];
  return <div className={`callout ${tone}`}><Icon size={18} /><div>{title && <strong>{title}</strong>}{children}</div></div>;
}

export function Seg({ options, value, onChange, small = false, label }) {
  return (
    <div className={`seg ${small ? 'small' : ''}`} role="radiogroup" aria-label={label}>
      {options.map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  );
}

export function Slider({ label, value, min, max, step, onChange, format }) {
  return (
    <label className="slider-row">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <output>{format ? format(value) : value}</output>
    </label>
  );
}

export function Legend({ items }) {
  return <div className="legend">{items.map(([c, l]) => <span key={l}><i style={{ background: c }} />{l}</span>)}</div>;
}

export function TT({ active, payload, label, fmt, title }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="tt">
      <b>{title ? title(label, payload) : label}</b>
      {payload.filter((p) => p.value !== null && p.value !== undefined).map((p) => (
        <div key={p.dataKey || p.name} style={{ color: p.color || p.fill || '#0c2230' }}>{p.name}: {fmt ? fmt(p.value, p) : p.value}</div>
      ))}
    </div>
  );
}
