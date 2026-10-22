import kpi from '@/public/data/kpi_summary.json';
import finance from '@/public/data/finance.json';
import markov from '@/public/data/markov_ltv.json';
import uplift from '@/public/data/uplift_results.json';
import bandit from '@/public/data/bandit_runs.json';
import reviews from '@/public/data/review_insights.json';
import top20 from '@/public/data/top20_locations.json';
import kfactor from '@/public/data/kfactor_sim.json';
import personas from '@/public/data/personas.json';
import quests from '@/public/data/quests.json';
import roadmap from '@/public/data/roadmap.json';
import assumptions from '@/public/data/assumptions.json';
import manifest from '@/public/data/manifest.json';
import extra from '@/public/data/extra.json';

export const D = { kpi, finance, markov, uplift, bandit, reviews, top20, kfactor, personas, quests, roadmap, assumptions, manifest, extra };

export const SOURCES = {
  kasus: { label: 'Data Kasus', note: 'Casebook MarkUp x blu dan materi pengenalan blu (profil per 31 Mei 2026, lanskap per Agustus 2026).' },
  publik: { label: 'Data Publik', note: 'Data terbuka yang diambil di notebook: ulasan Google Play, OpenStreetMap, eksperimen Hillstrom.' },
  asumsi: { label: 'Asumsi', note: 'Angka perkiraan tim, tercatat di tabel asumsi dan diuji dengan Monte Carlo, tornado, atau perturbasi.' },
  simulasi: { label: 'Simulasi', note: 'Hasil simulasi terkalibrasi di notebook untuk membuktikan metode, bukan hasil lapangan.' },
};

export const COLORS = { blu: '#1FB8C3', bluInk: '#0A7480', ink: '#0C2230', navy: '#14325C', base: '#9AA5B1', orange: '#E07A1F', red: '#C93A3A', green: '#24855B', amber: '#B7791F', slate: '#56708F' };
export const STRAT_COLORS = { 'Acak': '#B8C2CC', 'Intuisi (skor statis)': '#E07A1F', 'Epsilon-greedy': '#56708F', 'Thompson Sampling kontekstual': '#1FB8C3', 'Oracle': '#14325C' };
