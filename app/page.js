'use client';

import { useState } from 'react';
import ScormsTable from '../components/ScormsTable';
import ScormsCursosTable from '../components/ScormsCursosTable';

export default function HomePage() {
  const [activeView, setActiveView] = useState('scorms');

  return (
    <main className="page">
      <section className="card">
        <div className="card-header">
          <div>
            <h1>GScormer</h1>
            <p className="status">Selecciona la vista a gestionar.</p>
          </div>
          <div className="header-actions app-switcher">
            <button
              className={activeView === 'scorms' ? '' : 'secondary'}
              onClick={() => setActiveView('scorms')}
            >
              SCORMs
            </button>
            <button
              className={activeView === 'cursos' ? '' : 'secondary'}
              onClick={() => setActiveView('cursos')}
            >
              SCORMs Cursos
            </button>
          </div>
        </div>
      </section>

      {activeView === 'scorms' ? (
        <ScormsTable />
      ) : (
        <ScormsCursosTable onBackToScorms={() => setActiveView('scorms')} />
      )}
    </main>
  );
}
