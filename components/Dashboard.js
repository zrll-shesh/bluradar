'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3, BookOpen, Coins, Compass, Gauge, Globe, Map, Menu, MessageSquareText, Route, Users, X, Zap } from 'lucide-react';
import { LangContext, startTranslation } from './lib/i18n';
import { ModeContext, Seg } from './ui';
import Overview from './views/Overview';
import Market from './views/Market';
import Voice from './views/Voice';
import Squad from './views/Squad';
import Anchor from './views/Anchor';
import Quest from './views/Quest';
import Finance from './views/Finance';
import Plan from './views/Plan';
import Evidence from './views/Evidence';

const Radar = dynamic(() => import('./views/Radar'), { ssr: false, loading: () => <div className="panel">Memuat peta Radar…</div> });

export const NAV = [
  { group: 'Gambaran', items: [['ringkasan', 'Ringkasan', Gauge, 'bluRadar dalam satu layar']] },
  { group: 'Masalah', items: [['pasar', 'Pasar & Nasabah', BarChart3, 'Siapa nasabah blu dan siapa pesaingnya'], ['suara', 'Suara Pengguna', MessageSquareText, 'Apa kata 8.726 ulasan Play Store']] },
  { group: 'Solusi', items: [['radar', 'Radar Lokasi', Map, 'Ke mana tim lapangan turun'], ['squad', 'Alokasi Squad', Compass, 'Bagaimana lokasi dipilih tiap minggu'], ['anchor', 'Bendahara-First', Users, 'Siapa didekati dan apa yang ditawarkan'], ['quest', 'Quest & Nudge', Zap, 'Bagaimana nasabah baru tetap aktif']] },
  { group: 'Bukti', items: [['finansial', 'Finansial', Coins, 'Biaya, nilai, dan ketangguhan angka'], ['rencana', 'Rencana & Tata Kelola', Route, 'Roadmap, KPI, risiko, cara membuktikan']] },
  { group: 'Arsip', items: [['bukti', 'Metodologi & Bukti', BookOpen, 'Asumsi, visual, tabel, unduhan']] },
];
const FLAT = NAV.flatMap((g) => g.items);
const MODES = [['ringkas', 'Ringkas'], ['bisnis', 'Bisnis'], ['teknis', 'Teknis']];
const LANGS = [['id', 'ID'], ['en', 'EN']];

function readHash() {
  if (typeof window === 'undefined') return 'ringkasan';
  const h = window.location.hash.replace(/^#\/?/, '');
  return FLAT.some((n) => n[0] === h) ? h : 'ringkasan';
}

export default function Dashboard() {
  const [page, setPage] = useState('ringkasan');
  const [mode, setModeState] = useState('ringkas');
  const [open, setOpen] = useState(false);
  const [lang, setLangState] = useState('id');
  const [pending, setPending] = useState(true);
  const rootRef = useRef(null);

  useEffect(() => {
    const apply = () => setPage(readHash());
    apply();
    window.addEventListener('hashchange', apply);
    try {
      const m = window.localStorage.getItem('bluradar-mode');
      if (MODES.some((x) => x[0] === m)) setModeState(m);
      const l = window.localStorage.getItem('bluradar-lang');
      if (l === 'en' || l === 'id') setLangState(l);
      if (l !== 'en') setPending(false);
    } catch (e) { setPending(false); }
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    if (lang !== 'en' || !rootRef.current) return undefined;
    const stop = startTranslation(rootRef.current);
    setPending(false);
    return stop;
  }, [lang]);

  const setLang = (l) => {
    setLangState(l);
    try { window.localStorage.setItem('bluradar-lang', l); } catch (e) {}
  };

  const setMode = (m) => {
    setModeState(m);
    try { window.localStorage.setItem('bluradar-mode', m); } catch (e) {}
  };

  const go = useCallback((id) => {
    window.location.hash = `/${id}`;
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const current = FLAT.find((n) => n[0] === page);
  const props = { go };

  return (
    <LangContext.Provider value={lang}>
    <ModeContext.Provider value={mode}>
      <div className={pending ? 'app tr-pending' : 'app'} ref={rootRef}>
        <a className="skip" href="#main">Lewati ke konten</a>
        <aside className={open ? 'sidebar open' : 'sidebar'} aria-label="Navigasi">
          <div className="brand">
            <img src="/brand/logo-white.svg" alt="bluRadar" className="brand-logo" />
            <div className="brand-sub">Komunitas sebagai super-app blu</div>
          </div>
          {NAV.map((g) => (
            <div className="nav-group" key={g.group}>
              <div className="nav-group-title">{g.group}</div>
              {g.items.map(([id, label, Icon]) => (
                <button key={id} className={page === id ? 'nav active' : 'nav'} onClick={() => go(id)} aria-current={page === id ? 'page' : undefined}>
                  <Icon size={17} /><span>{label}</span>
                </button>
              ))}
            </div>
          ))}
          <div className="side-foot">
            <b>Tim Ingfo Intern</b><br />Nazril Ravi Pratama, Daffa Ahmad Pangreksa<br />MarkUp Mini Case Competition 2026 x blu by BCA Digital
          </div>
        </aside>
        <div className="main">
          <header className="topbar">
            <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Tutup menu' : 'Buka menu'}>{open ? <X size={20} /> : <Menu size={20} />}</button>
            <img src="/brand/logo-mark.svg" alt="" className="top-mark" />
            <div style={{ minWidth: 0 }}>
              <h1>{current[1]}</h1>
              <div className="crumb">{current[3]}</div>
            </div>
            <div className="top-actions">
              <div className="lang-switch" data-no-tr>
                <Globe size={15} aria-hidden="true" />
                <Seg options={LANGS} value={lang} onChange={setLang} small label={lang === 'en' ? 'Language' : 'Bahasa'} />
              </div>
              <span className="mode-label">Penjelasan untuk</span>
              <Seg options={MODES} value={mode} onChange={setMode} label="Mode penjelasan" />
            </div>
          </header>
          <main className="content" id="main">
            {page === 'ringkasan' && <Overview {...props} />}
            {page === 'pasar' && <Market {...props} />}
            {page === 'suara' && <Voice {...props} />}
            {page === 'radar' && <Radar {...props} />}
            {page === 'squad' && <Squad {...props} />}
            {page === 'anchor' && <Anchor {...props} />}
            {page === 'quest' && <Quest {...props} />}
            {page === 'finansial' && <Finance {...props} />}
            {page === 'rencana' && <Plan {...props} />}
            {page === 'bukti' && <Evidence {...props} />}
          </main>
          <footer className="foot">
            <span>Prototype Dashboard bluRadar. Model dijalankan di notebook analisis; dashboard menampilkan hasil dan simulasinya.</span>
            <span>Setiap angka diberi label asal data: Data Kasus, Data Publik, Asumsi, atau Simulasi.</span>
          </footer>
        </div>
      </div>
    </ModeContext.Provider>
    </LangContext.Provider>
  );
}
