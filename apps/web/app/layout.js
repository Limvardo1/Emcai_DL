import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'ResumeAI — Analisis CV & Rekomendasi Karier',
  description:
    'Platform analisis CV berbasis TF-IDF + MLP: skor CV, deteksi kekurangan, dan rekomendasi karier.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
