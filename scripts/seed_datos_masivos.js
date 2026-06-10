/**
 * seed_datos_masivos.js
 *
 * Pobla la base de datos via HTTP (puerto 3000) respetando integridad referencial.
 * IDs capturados dinámicamente de las respuestas — no se asumen IDs fijos.
 * No envía imágenes (el usuario las sube manualmente).
 *
 * Ejecutar: node scripts/seed_datos_masivos.js
 */

import 'dotenv/config';

const BASE = 'http://localhost:3000';

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    console.error(`  ❌ ${method} ${path} → ${res.status}`, data?.error ?? data?.message ?? '');
    return null;
  }
  return data;
}

// ─── Catálogos de datos ────────────────────────────────────────────────────────

const CURSOS_DATOS = [
  { nombre: 'Diseño de Marca desde Cero',        descripcion: 'Construye identidades de marca completas con estrategia y diseño visual.',          categorias: ['Branding', 'Identidad Corporativa'],    precio: 79.99 },
  { nombre: 'Tipografía para Diseñadores',        descripcion: 'Domina el arte de elegir, combinar y usar fuentes en proyectos creativos.',          categorias: ['Tipografía', 'Diseño Gráfico'],          precio: 49.99 },
  { nombre: 'Ilustración Vectorial Avanzada',     descripcion: 'Técnicas profesionales de ilustración en Illustrator para proyectos editoriales.',   categorias: ['Ilustración', 'Vectores'],               precio: 69.99 },
  { nombre: 'Fotografía de Producto para Redes',  descripcion: 'Captura imágenes profesionales de productos con equipos básicos.',                   categorias: ['Fotografía', 'Redes Sociales'],          precio: 55.00 },
  { nombre: 'Motion Graphics Esencial',           descripcion: 'Crea animaciones impactantes con After Effects para publicidad digital.',             categorias: ['Motion Graphics', 'Animación'],          precio: 89.99 },
  { nombre: 'UX Design para Apps Móviles',        descripcion: 'Diseña experiencias de usuario intuitivas para aplicaciones móviles.',               categorias: ['UX Design', 'Mobile Design'],            precio: 95.00 },
  { nombre: 'Color en Diseño Editorial',          descripcion: 'Teoría y práctica del color aplicada a revistas, libros y publicaciones.',           categorias: ['Editorial', 'Color'],                    precio: 45.00 },
  { nombre: 'Diseño Web con Figma',               descripcion: 'Crea prototipos funcionales y diseños responsive de alta fidelidad.',                categorias: ['Web Design', 'Prototipado'],             precio: 75.00 },
  { nombre: 'Fotografía de Retrato Profesional',  descripcion: 'Domina iluminación, posado y edición para fotografías de retrato artístico.',        categorias: ['Fotografía', 'Retrato'],                 precio: 65.00 },
  { nombre: 'Animación 2D con Procreate',         descripcion: 'Crea animaciones fluidas y expresivas directamente en tu iPad.',                     categorias: ['Animación', 'Ilustración Digital'],      precio: 59.99 },
  { nombre: 'Diseño de Empaques Creativos',       descripcion: 'Diseña empaques que destacan en el punto de venta y comunican la esencia de marca.', categorias: ['Packaging', 'Branding'],                 precio: 85.00 },
  { nombre: 'Retoque Fotográfico Avanzado',       descripcion: 'Técnicas avanzadas de retoque en Photoshop para fotografía de moda y publicidad.',   categorias: ['Fotografía', 'Retoque'],                 precio: 72.00 },
  { nombre: 'Diseño de Infografías Impactantes',  descripcion: 'Comunica datos complejos de forma visual, clara y atractiva.',                       categorias: ['Infografías', 'Visualización de Datos'], precio: 40.00 },
  { nombre: 'Gestión de Proyectos Creativos',     descripcion: 'Planifica, presupuesta y gestiona proyectos de diseño de forma profesional.',        categorias: ['Gestión', 'Negocios Creativos'],         precio: 50.00 },
  { nombre: 'Social Media Design',                descripcion: 'Crea contenido visual coherente y atractivo para todas las redes sociales.',          categorias: ['Redes Sociales', 'Diseño Digital'],      precio: 55.00 },
  { nombre: 'Lettering y Caligrafía Digital',     descripcion: 'Aprende el arte del lettering manual y digital para branding y proyectos creativos.', categorias: ['Lettering', 'Tipografía'],              precio: 48.00 },
  { nombre: 'Modelado 3D para Diseñadores',       descripcion: 'Introducción al modelado 3D con Blender aplicado a diseño y branding.',              categorias: ['3D', 'Modelado'],                        precio: 99.99 },
];

const GHOST_USERS = [
  { userId: 'US_7',  profesiones: ['Ilustradora', 'Diseñadora de Personajes'],  habilidades: ['Procreate', 'Illustrator', 'Clip Studio'],  descripcion: 'Ilustradora con especialización en concept art y diseño de personajes para proyectos editoriales colombianos.' },
  { userId: 'US_8',  profesiones: ['Motion Designer', 'Animador 2D'],           habilidades: ['After Effects', 'Premiere', 'Cinema 4D'],  descripcion: 'Motion designer enfocado en animaciones para marcas y publicidad digital en el mercado latinoamericano.' },
  { userId: 'US_9',  profesiones: ['Fotógrafa', 'Retocadora Digital'],          habilidades: ['Lightroom', 'Photoshop', 'Capture One'],   descripcion: 'Fotógrafa profesional especializada en retratos de marca personal y fotografía editorial para moda.' },
  { userId: 'US_10', profesiones: ['Diseñador UI/UX', 'Prototipador'],          habilidades: ['Figma', 'Sketch', 'InVision'],             descripcion: 'Diseñador UI/UX con foco en productos digitales y aplicaciones móviles para startups tecnológicas colombianas.' },
];

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const TEMATICAS = [
  ['Branding y Diseño de Marca', 'Identidad Visual', 'Logo Design'],
  ['Tipografía Creativa', 'Diseño Editorial', 'Maquetación'],
  ['Ilustración Digital', 'Concept Art', 'Diseño de Personajes'],
  ['Fotografía de Producto', 'Edición en Lightroom', 'Composición Visual'],
  ['Motion Graphics', 'Video Editing', 'Animación para Redes'],
  ['UX Research', 'Prototipado en Figma', 'Diseño de Flujos'],
  ['Color Theory', 'Paletas para Marca', 'Psicología del Color'],
  ['Web Design', 'Landing Pages', 'Diseño Responsive'],
  ['Fotografía de Retrato', 'Iluminación Natural', 'Postproducción'],
  ['Packaging Design', 'Impresión y Materiales', 'Diseño para E-commerce'],
];

const CREATIVOS = ['usr_001', 'usr_003', 'usr_004', 'US_6', 'US_7', 'US_8', 'US_9', 'US_10'];
const CLIENTES  = ['usr_002', 'usr_005', 'US_11', 'US_12', 'US_13', 'US_14'];

// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('━'.repeat(60));
  console.log('🚀 SEED MASIVO — Kreato Agencia de Diseño');
  console.log('━'.repeat(60));

  // ── FASE 1: PerfilCreativo para ghost users (CREATIVO sin perfil) ─────────
  console.log('\n📌 FASE 1: Completar PerfilCreativo para CREATIVO sin perfil');
  const perfilesExistentes = await api('GET', '/api/creativos');
  const conPerfil = new Set(perfilesExistentes.map(p => p.user_id));

  for (const g of GHOST_USERS) {
    if (conPerfil.has(g.userId)) {
      console.log(`  ⏭️  ${g.userId} ya tiene perfil`);
      continue;
    }
    const p = await api('POST', '/api/creativos', {
      user_id: g.userId,
      descripcion: g.descripcion,
      profesiones: g.profesiones,
      habilidades: g.habilidades,
      experiencia: 'Más de 3 años de experiencia en agencias de diseño creativo en Colombia',
    });
    if (p) console.log(`  ✅ Perfil creado: ${p._id} → ${g.userId}`);
  }

  const todosPerfiles = await api('GET', '/api/creativos');
  const perfilIds = todosPerfiles.map(p => p._id);
  console.log(`  Total perfiles creativos: ${perfilIds.length} → [${perfilIds.join(', ')}]`);

  // ── FASE 2: Cursos ────────────────────────────────────────────────────────
  console.log('\n📌 FASE 2: Cursos (objetivo ≥ 20)');
  const cursosActuales = await api('GET', '/api/cursos');
  const faltanCursos = Math.max(0, 20 - cursosActuales.length);
  console.log(`  Actuales: ${cursosActuales.length} — a crear: ${faltanCursos}`);

  for (let i = 0; i < faltanCursos; i++) {
    const tema = CURSOS_DATOS[i % CURSOS_DATOS.length];
    const creador = CREATIVOS[i % CREATIVOS.length];
    const c = await api('POST', '/api/cursos', {
      ...tema,
      creadores: [creador],
      capitulos: [
        { orden: 1, titulo: 'Introducción y conceptos clave',     video_url: `https://cdn.kreato/videos/seed_${i}_cap1.mp4` },
        { orden: 2, titulo: 'Técnicas y herramientas esenciales', video_url: `https://cdn.kreato/videos/seed_${i}_cap2.mp4` },
        { orden: 3, titulo: 'Proyecto final integrador',          video_url: `https://cdn.kreato/videos/seed_${i}_cap3.mp4` },
      ],
    });
    if (c) console.log(`  ✅ ${c._id} — "${c.nombre}" (creador: ${creador})`);
  }

  // ── FASE 3: OfertaAsesoria ────────────────────────────────────────────────
  console.log('\n📌 FASE 3: OfertaAsesoria (objetivo ≥ 20)');
  const ofertasActuales = await api('GET', '/api/oferta-asesoria');
  const faltanOfertas = Math.max(0, 20 - ofertasActuales.length);
  console.log(`  Actuales: ${ofertasActuales.length} — a crear: ${faltanOfertas}`);

  for (let i = 0; i < faltanOfertas; i++) {
    const perf = perfilIds[i % perfilIds.length];
    const oa = await api('POST', '/api/oferta-asesoria', {
      perfil_creativo_id: perf,
      tematicas: TEMATICAS[i % TEMATICAS.length],
      tarifas: [
        { duracion_minutos: 30, precio: 30 + i * 2 },
        { duracion_minutos: 60, precio: 55 + i * 3 },
      ],
      disponibilidad: [
        { dia: DIAS[i % 5],       horas: ['09:00', '10:00', '11:00'] },
        { dia: DIAS[(i + 2) % 5], horas: ['14:00', '15:00', '16:00'] },
      ],
    });
    if (oa) console.log(`  ✅ ${oa._id} (perfil: ${perf})`);
  }

  // ── FASE 4: Solicitudes con estado 'aprobada' ─────────────────────────────
  console.log('\n📌 FASE 4: Solicitudes aprobadas (objetivo ≥ 20)');
  const solicitudesActuales = await api('GET', '/api/solicitudes');
  const faltanSolicitudes = Math.max(0, 20 - solicitudesActuales.length);
  console.log(`  Actuales: ${solicitudesActuales.length} — a crear: ${faltanSolicitudes}`);

  const todasOfertas = await api('GET', '/api/oferta-asesoria');
  const todasOfertasIds = todasOfertas.map(o => o._id);

  for (let i = 0; i < faltanSolicitudes; i++) {
    const cliente = CLIENTES[i % CLIENTES.length];
    // +1 para no reusar of_ase_102 que ya tiene sol_001 vinculada
    const ofertaId = todasOfertasIds[(i + 1) % todasOfertasIds.length];
    const horaBase = 9 + (i % 8);
    const s = await api('POST', '/api/solicitudes', {
      usuario_id: cliente,
      oferta_asesoria_id: ofertaId,
      descripcion: `Asesoría #${i + 2} — orientación profesional en diseño creativo y portafolio.`,
      estado: 'aprobada',
      fecha: new Date(2026, 5, 10 + (i % 20)).toISOString(),
      hora_inicio: `${String(horaBase).padStart(2, '0')}:00`,
      hora_fin:    `${String(horaBase + 1).padStart(2, '0')}:00`,
    });
    if (s) console.log(`  ✅ ${s._id} (cliente: ${cliente})`);
  }

  // ── FASE 5: Pagos tipo ASESORIA ───────────────────────────────────────────
  // Obtiene solicitudes aprobadas sin asesoría asignada todavía.
  // Dependencia circular: source_id apunta a 'ase_444' (seed original) para
  // superar la validación referencial de pagos que exige una asesoría existente.
  console.log('\n📌 FASE 5: Pagos tipo ASESORIA (uno por solicitud sin asesoría)');
  const [todasSolicitudes, todasAsesorias] = await Promise.all([
    api('GET', '/api/solicitudes'),
    api('GET', '/api/asesorias'),
  ]);
  const solicitudesConAsesoria = new Set(todasAsesorias.map(a => a.solicitud_id));
  const sinAsesoria = todasSolicitudes.filter(
    s => s.estado === 'aprobada' && !solicitudesConAsesoria.has(s._id)
  );
  console.log(`  Solicitudes aprobadas sin asesoría: ${sinAsesoria.length}`);

  const pagosIds = [];
  for (let i = 0; i < sinAsesoria.length; i++) {
    const cliente = CLIENTES[i % CLIENTES.length];
    const horaBase = 10 + (i % 8);
    const p = await api('POST', '/api/pagos', {
      tipo: 'ASESORIA',
      source_id: 'ase_444',
      user_id: cliente,
      monto: 55 + i * 3,
      estado: 'pagado',
      fecha: new Date(2026, 5, 5 + (i % 25)).toISOString(),
      hora: `${String(horaBase).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
    });
    if (p) {
      pagosIds.push(p._id);
      console.log(`  ✅ ${p._id} ($${p.monto})`);
    }
  }

  // ── FASE 6: Asesorías ─────────────────────────────────────────────────────
  console.log('\n📌 FASE 6: Asesorías (objetivo ≥ 20)');
  const nAse = Math.min(sinAsesoria.length, pagosIds.length);
  console.log(`  A crear: ${nAse}`);

  for (let i = 0; i < nAse; i++) {
    const num = String(i + 1).padStart(3, '0');
    const a = await api('POST', '/api/asesorias', {
      pago_id: pagosIds[i],
      solicitud_id: sinAsesoria[i]._id,
      link_reunion:    `https://meet.kreato.com/sesion-${num}`,
      video_grabacion: `https://storage.kreato/grabaciones/sesion_${num}.mp4`,
    });
    if (a) console.log(`  ✅ ${a._id} (pago: ${pagosIds[i]}, sol: ${sinAsesoria[i]._id})`);
  }

  // ── Resumen final ─────────────────────────────────────────────────────────
  console.log('\n' + '━'.repeat(60));
  console.log('📊 RESUMEN FINAL');
  console.log('━'.repeat(60));
  const [us, cu, ol, ase] = await Promise.all([
    api('GET', '/api/usuarios'),
    api('GET', '/api/cursos'),
    api('GET', '/api/oferta-laboral'),
    api('GET', '/api/asesorias'),
  ]);
  const ok = (n, label) =>
    `${n >= 20 ? '✅' : '⚠️ '} ${label}: ${n}${n >= 20 ? '' : ` (faltan ${20 - n})`}`;
  console.log(ok(us.length,  'Usuarios'));
  console.log(ok(cu.length,  'Cursos'));
  console.log(ok(ol.length,  'OfertaLaboral'));
  console.log(ok(ase.length, 'Asesorías'));
}

main().catch(console.error);
