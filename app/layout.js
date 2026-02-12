import './globals.css';

export const metadata = {
  title: 'GScormer',
  description: 'Gestión de flujo de trabajo de SCORMs',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
