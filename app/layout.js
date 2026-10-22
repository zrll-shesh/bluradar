import './globals.css';

export const metadata = {
  title: 'bluRadar | Menjadikan Komunitas sebagai Super-App blu',
  description: 'Prototype Dashboard bluRadar: AI-driven direct sales engine untuk mengubah rekening baru menjadi nasabah aktif bernilai. Tim Ingfo Intern, MarkUp Mini Case Competition 2026 x blu by BCA Digital.',
  openGraph: { title: 'bluRadar', description: 'Data dan AI untuk tim lapangan blu: ke mana turun, siapa didekati, bagaimana nasabah tetap aktif.', type: 'website', locale: 'id_ID' },
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'),
  icons: { icon: '/favicon.svg', apple: '/apple-icon.png' },
};
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#0c2230' };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
