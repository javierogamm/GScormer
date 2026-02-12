import ScormsTable from '../components/ScormsTable';

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero card">
        <p className="eyebrow">GScormer · v1.0.0</p>
        <h1>Gestor de flujo de trabajo de SCORMs</h1>
        <p>
          Aplicación base en Next.js preparada para Vercel y Supabase. Incluye vista de tabla
          editable sobre <strong>scorms_master</strong> con estilo moderno, lista para crecer con
          módulos dinámicos (planificadores, botones de acción y flujos avanzados).
        </p>
      </section>

      <ScormsTable />
    </main>
  );
}
