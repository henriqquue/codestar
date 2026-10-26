import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CodeStar — Programação Rítmica',
  description: 'Aprenda programação criando ritmos musicais com DSL e Web Audio API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
