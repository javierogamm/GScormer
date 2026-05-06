const archiveSlides = [
  {
    step: 'Step 01',
    title: 'Clasificación archivística',
    description: 'Cuadro de clasificación conectado con los procedimientos para situar cada expediente en su serie documental.',
    icon: 'classification',
    className: 'archive-slide-left archive-slide-bottom',
  },
  {
    step: 'Step 02',
    title: 'Descripción ENI extendido',
    description: 'Metadatos completos para preparar la transferencia a archivo con trazabilidad y contexto administrativo.',
    icon: 'metadata',
    className: 'archive-slide-left archive-slide-top',
  },
  {
    step: 'Step 03',
    title: 'Control de accesos posterior al cierre',
    description: 'Gestión de consulta tras el cierre del expediente: ver archivo todos o acceso limitado según rol.',
    icon: 'access',
    className: 'archive-slide-right archive-slide-top',
  },
  {
    step: 'Step 04',
    title: 'Preservación validez',
    description: 'Resellado y evidencias para mantener la validez de firmas, sellos y documentos a largo plazo.',
    icon: 'preservation',
    className: 'archive-slide-right archive-slide-bottom',
  },
];

const Icon = ({ type }) => {
  if (type === 'classification') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M12 16h24v20H12z" />
        <path d="M17 16v-4h10l4 4" />
        <path d="M17 24h14M17 30h9" />
      </svg>
    );
  }

  if (type === 'metadata') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="10" />
        <path d="M24 14v10h8" />
        <path d="M15 36h18" />
      </svg>
    );
  }

  if (type === 'access') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M14 34h20" />
        <path d="M17 34V22h4v12M23 34V14h4v20M29 34V18h4v16" />
        <path d="M14 22l10-9 10 9" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M14 30c8-1 14-7 16-16 4 5 5 13 1 18-5 7-14 6-20 2" />
      <path d="M15 33c4-5 9-8 16-11" />
      <path d="M31 14l4-4M34 17l5-1" />
    </svg>
  );
};

export default function ArchivoMediosPresentation() {
  return (
    <section className="archive-presentation" aria-labelledby="archive-presentation-title">
      <div className="archive-presentation-header">
        <span className="archive-kicker">Medios · Archivo</span>
        <h3 id="archive-presentation-title">Herramientas del módulo de archivo</h3>
        <p>
          Presentación de capacidades para clasificar, describir, proteger y preservar los expedientes transferidos a archivo.
        </p>
      </div>

      <div className="archive-diagram" role="list" aria-label="Slides de herramientas del módulo de archivo">
        <div className="archive-core" aria-hidden="true">
          <div className="archive-core-icon">
            <svg viewBox="0 0 48 48">
              <path d="M15 18h18v18H15z" />
              <path d="M18 18v-6h9l3 6" />
              <path d="M20 25h8M20 30h6" />
            </svg>
          </div>
          <strong>Archivo</strong>
          <span>Transferencia · Custodia · Evidencias</span>
        </div>

        {archiveSlides.map((slide, index) => (
          <article key={slide.step} className={`archive-slide ${slide.className}`} role="listitem" style={{ '--slide-index': index }}>
            <div className="archive-slide-copy">
              <span>{slide.step}</span>
              <h4>{slide.title}</h4>
              <p>{slide.description}</p>
            </div>
            <div className="archive-node" aria-hidden="true">
              <Icon type={slide.icon} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
