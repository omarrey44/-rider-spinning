'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type AvatarClass = 'avatar-rosario' | 'avatar-lucia' | 'avatar-elmer';

interface InstructorRow {
  id: string;
  full_name: string;
  bio: string | null;
  avatar_class: AvatarClass;
  display_order: number;
}

// Lookup local de estilos. Para agregar un instructor con look distinto
// hay que añadir entrada aquí + nuevo valor permitido en el CHECK de la BD.
const STYLE_MAP: Record<AvatarClass, { gradient: string; shiftLabel: string }> = {
  'avatar-rosario': {
    gradient: 'linear-gradient(135deg,#1A1A1A,#E10600)',
    shiftLabel: 'Turno mañana · Lunes a Viernes',
  },
  'avatar-lucia': {
    gradient: 'linear-gradient(135deg,#E10600,#FFB800)',
    shiftLabel: 'Turno tarde · Lunes a Viernes',
  },
  'avatar-elmer': {
    gradient: 'linear-gradient(135deg,#0A0A0A,#1dd4e8)',
    shiftLabel: 'Sábados · Sesiones especiales',
  },
};

// Fallback si Supabase no responde (env vars faltantes en local, red caída, etc.)
const FALLBACK: InstructorRow[] = [
  { id: '1', full_name: 'Rosario González Muñoz', bio: '"El mejor regalo que te puedes dar es empezar el día moviéndote."', avatar_class: 'avatar-rosario', display_order: 1 },
  { id: '2', full_name: 'Lucía Frescas González', bio: '"Después del trabajo, tu cuerpo merece soltar el día."',            avatar_class: 'avatar-lucia',   display_order: 2 },
  { id: '3', full_name: 'Elmer Alsides',          bio: '"El fin de semana es para ti. Sube a la bici y disfruta."',         avatar_class: 'avatar-elmer',   display_order: 3 },
];

export default function Instructors() {
  const [instructors, setInstructors] = useState<InstructorRow[]>(FALLBACK);
  const [expandedBios, setExpandedBios] = useState<Set<string>>(new Set());

  const toggleBio = (id: string) => {
    const newExpanded = new Set(expandedBios);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedBios(newExpanded);
  };

  const truncateBio = (bio: string, id: string): string => {
    const maxLength = 100;
    if (bio.length > maxLength && !expandedBios.has(id)) {
      return bio.substring(0, maxLength) + '...';
    }
    return bio;
  };

  useEffect(() => {
    let cancelled = false;
    async function fetchInstructors() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('instructors')
          .select('id, full_name, bio, avatar_class, display_order')
          .eq('active', true)
          .order('display_order', { ascending: true });

        if (cancelled) return;
        if (!error && data && data.length > 0) {
          setInstructors(data as InstructorRow[]);
        }
        // Si error o array vacío, conservamos FALLBACK ya cargado.
      } catch {
        // env vars faltantes → fallback silencioso
      }
    }
    fetchInstructors();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="instructors" id="instructores">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Quién te empuja</span>
          <h2>Instructores que <span className="text-red">cambian tu día</span></h2>
        </div>

        <div className="instructor-grid instructor-grid-3">
          {instructors.map((ins) => {
            const style = STYLE_MAP[ins.avatar_class] ?? STYLE_MAP['avatar-rosario'];
            return (
              <article key={ins.id} className="instructor-card">
                <div className="instructor-photo" style={{ background: style.gradient }}></div>
                <h3>{ins.full_name}</h3>
                <span>{style.shiftLabel}</span>
                {ins.bio && (
                  <div className="bio-wrapper">
                    <p>{truncateBio(ins.bio, ins.id)}</p>
                    {ins.bio.length > 100 && (
                      <button
                        className="bio-toggle-btn"
                        onClick={() => toggleBio(ins.id)}
                        aria-expanded={expandedBios.has(ins.id)}
                      >
                        {expandedBios.has(ins.id) ? 'Menos' : 'Más'}
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
