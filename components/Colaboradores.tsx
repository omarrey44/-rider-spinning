import Image from 'next/image';

interface Partner {
  image: string;
  name: string;
  role: string;
  description: string;
  services: string[];
  phone: string;
  whatsappMsg: string;
  colClass: string;
  badge?: string;
  discountPct?: string;
}

const partners: Partner[] = [
  {
    image: '/nutriologa.png',
    name: 'Lic. Kristel Del Moral',
    role: 'Nutricionista',
    description:
      'Planes personalizados de nutrición, manejo de peso, composición corporal y rendimiento deportivo. Evaluaciones antropométricas y dietas terapéuticas.',
    services: ['Nutrición deportiva', 'Manejo de peso', 'Composición corporal', 'Dietas terapéuticas'],
    phone: '6145951782',
    whatsappMsg: 'Hola Kristel, soy miembro de Rideon y me interesa agendar una consulta.',
    colClass: 'col-nutri',
  },
  {
    image: '/aparatologia.png',
    name: 'Edith Magic Studio',
    role: 'Cosmetóloga · Aparatología',
    description:
      'Tratamientos estéticos no invasivos para reafirmación de cuello, papada y rostro completo. Tecnología de aparatología de última generación.',
    services: ['Reafirmación facial', 'Papada y cuello', 'Tratamientos no invasivos', 'Aparatología estética'],
    phone: '6144875588',
    whatsappMsg: 'Hola, soy miembro de Rideon y me interesa conocer sus tratamientos.',
    colClass: 'col-cosme',
  },
  {
    image: '/logoRadiologia.jpg',
    name: 'Alta Radiología',
    role: 'Análisis Clínicos · Radiología',
    description:
      'Laboratorio de análisis clínicos y estudios de imagen. Resultados confiables con entrega rápida para apoyar tu salud y rendimiento deportivo.',
    services: ['Análisis clínicos', 'Estudios de imagen', 'Radiología', 'Resultados en línea'],
    phone: '6145147500',
    whatsappMsg: 'Hola, soy miembro de Rideon y me interesa agendar un análisis clínico.',
    colClass: 'col-radio',
  },
  {
    image: '/logoPsiquiatra.jpg',
    name: 'Dr. Luis Alberto Rodarte',
    role: 'Psiquiatra · Tratamiento de Adicciones',
    description:
      'Atención psiquiátrica especializada en tratamiento de adicciones de todo tipo. Acompañamiento profesional, confidencial y sin juicios para recuperar tu bienestar.',
    services: ['Tratamiento de adicciones', 'Salud mental', 'Consulta psiquiátrica', 'Seguimiento personalizado'],
    phone: '6141338381',
    whatsappMsg: 'Hola Dr. Rodarte, soy miembro de Rideon y me interesa agendar una consulta.',
    colClass: 'col-psi',
  },
  {
    image: '/ocid.jpg',
    name: 'OCID Servicios Médicos',
    role: 'Control de Peso · Obesidad · Síndrome Metabólico',
    description:
      'Clínica especializada en control de peso, obesidad y síndrome metabólico con más de 18 años de experiencia. Planes nutricionales, sueroterapia, terapias de reemplazo hormonal y suplementación alimenticia.',
    services: ['Control de peso', 'Planes nutricionales', 'Sueroterapia', 'Terapia hormonal'],
    phone: '6146047955',
    whatsappMsg: 'Hola, soy miembro de Rideon y me interesa agendar una consulta en OCID.',
    colClass: 'col-ocid',
    badge: 'Primera consulta gratis',
  },
  {
    image: '/fisiotrain.jpg',
    name: 'FisioTrain Cuu',
    role: 'Fisioterapia · Rehabilitación Deportiva',
    description:
      'Centro de fisioterapia y prevención de lesiones con entrenamiento funcional y medicina física. 2 sucursales en Chihuahua, más de 2,000 clientes atendidos. Atienden atletas olímpicos, equipos profesionales y deportistas de todos los niveles.',
    services: ['Fisioterapia', 'Prevención de lesiones', 'Rehabilitación deportiva', 'Entrenamiento funcional'],
    phone: 'PENDIENTE',
    whatsappMsg: 'Hola, soy miembro de Rideon y me interesa agendar una cita en FisioTrain.',
    colClass: 'col-fisio',
    discountPct: '15%',
  },
];

export default function Colaboradores() {
  return (
    <section className="colaboradores" id="colaboradores">
      <div className="container">
        <div className="section-head" style={{ textAlign: 'center' }}>
          <span className="eyebrow">Bienestar integral</span>
          <h2 style={{ textAlign: 'center' }}>
            <span style={{ display: 'block' }}>Nuestros</span>
            <span className="text-red" style={{ display: 'block' }}>Colaboradores</span>
          </h2>
          <p className="section-sub" style={{ textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' }}>Como miembro de Rideon obtienes <strong>10% de descuento</strong> en servicios con estos especialistas. Muestra tu confirmación de reserva al momento de tu cita.</p>
        </div>

        <div className="colab-grid">
          {partners.map((p) => (
            <article key={p.name} className={`colab-card ${p.colClass}`}>
              <div className="colab-img-wrap">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  className="colab-img"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="colab-img-overlay" />
                <div className="colab-discount-badge">
                  {p.badge ? (
                    <span className="discount-pct" style={{ fontSize: '13px' }}>{p.badge}</span>
                  ) : (
                    <>
                      <span className="discount-pct">{p.discountPct || '10%'}</span>
                      <span className="discount-label">descuento RideOn</span>
                    </>
                  )}
                </div>
              </div>

              <div className="colab-body">
                <div className="colab-meta">
                  <h3 className="colab-name">{p.name}</h3>
                  <span className="colab-role">{p.role}</span>
                </div>

                <p className="colab-desc">{p.description}</p>

                <ul className="colab-services">
                  {p.services.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>

                <a
                  href={p.phone !== 'PENDIENTE' ? `https://wa.me/52${p.phone}?text=${encodeURIComponent(p.whatsappMsg)}` : '#'}
                  target={p.phone !== 'PENDIENTE' ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.854L.06 23.5l5.796-1.448A11.938 11.938 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.814 9.814 0 0 1-5.006-1.369l-.36-.214-3.71.927.99-3.618-.235-.373A9.786 9.786 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                  </svg>
                  Agendar cita vía WhatsApp
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
