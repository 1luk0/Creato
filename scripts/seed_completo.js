/**
 * seed_completo.js  — Kreato · Universidad de Caldas
 *
 * Pobla TODAS las colecciones via HTTP (puerto 3000) con:
 *  - IDs en formato consistente (mismo prefijo que los datos semilla originales)
 *  - URLs locales para imágenes (servidas por /imagenes/ en el servidor)
 *  - Embeddings reales generados por los controllers (MiniLM + CLIP)
 *
 * ⚠️  REQUISITO: reiniciar el servidor antes de ejecutar este script para que
 *     los cambios en controllers y app.js surtan efecto.
 *
 * Ejecutar: node scripts/seed_completo.js
 */

import 'dotenv/config';
import { MongoClient } from 'mongodb';

const BASE  = 'http://localhost:3000';
const IMGS  = `${BASE}/imagenes`;
const MONGO = process.env.MONGODB_URI;

// ── helpers ──────────────────────────────────────────────────────────────────

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

async function directDB(fn) {
  const client = new MongoClient(MONGO);
  await client.connect();
  const db = client.db('agencia_diseno');
  try { return await fn(db); } finally { await client.close(); }
}

// URL de imagen local servida por express.static('/imagenes')
const img = (folder, file) => `${IMGS}/${folder}/${file}`;
const fotoPerf = n => img('perfil_creativo_foto_perfil', `${n}.jfif`);
// Logos empresa: 3 es .png, los demás .jfif
const LOGO_EXT = { 3: 'png' };
const fotoEmp  = n => img('perfil_empresa_logo', `${n}.${LOGO_EXT[n] ?? 'jfif'}`);
// Imágenes oferta_encargo: 15 y 18 son .jpg, los demás .jfif
const ENC_EXT  = { 15: 'jpg', 18: 'jpg' };
const imgEnc   = n => img('oferta_encargo', `${n}.${ENC_EXT[n] ?? 'jfif'}`);
const imgPub   = (sub, file) => img(`Publicaciones/${sub}`, file);

// ── catálogos ─────────────────────────────────────────────────────────────────

const USUARIOS_NUEVOS = [
  // 5 CREATIVO
  { _id: 'usr_006', nombre: 'Sofía Ramírez Calle',    tipo: 'CREATIVO', telefono: '3001001001', correo: 'sofia.ramirez@kreato.co',   perf: 'perf_006', intereses: ['Ilustración', 'Branding'],          foto: fotoPerf(1) },
  { _id: 'usr_007', nombre: 'Daniel Herrera Ossa',    tipo: 'CREATIVO', telefono: '3001001002', correo: 'daniel.herrera@kreato.co',  perf: 'perf_007', intereses: ['Motion Graphics', 'Tipografía'],    foto: fotoPerf(2) },
  { _id: 'usr_008', nombre: 'Mariana Zuluaga Ríos',   tipo: 'CREATIVO', telefono: '3001001003', correo: 'mariana.zuluaga@kreato.co', perf: 'perf_008', intereses: ['Fotografía', 'Editorial'],          foto: fotoPerf(3) },
  { _id: 'usr_009', nombre: 'Sebastián Montoya Gil',  tipo: 'CREATIVO', telefono: '3001001004', correo: 'sebastian.m@kreato.co',     perf: 'perf_009', intereses: ['UX Design', 'Prototipos'],          foto: fotoPerf(5) },
  { _id: 'usr_010', nombre: 'Valeria Castro Pérez',   tipo: 'CREATIVO', telefono: '3001001005', correo: 'valeria.castro@kreato.co',  perf: 'perf_010', intereses: ['Lettering', '3D'],                 foto: fotoPerf(6) },
  // 4 EMPRESA
  { _id: 'usr_011', nombre: 'Agencia Croma SAS',        tipo: 'EMPRESA', telefono: '6041002001', correo: 'hola@croma.co',             perf: 'perf_emp_002', nit: '900.123.456-7', sector: 'Agencia Creativa',       logo: fotoEmp(1) },
  { _id: 'usr_012', nombre: 'Pixel & Color Ltda',       tipo: 'EMPRESA', telefono: '6041002002', correo: 'contacto@pixelcolor.co',    perf: 'perf_emp_003', nit: '800.987.654-3', sector: 'Diseño Digital',         logo: fotoEmp(2) },
  { _id: 'usr_013', nombre: 'Studio Norte Digital SAS', tipo: 'EMPRESA', telefono: '6041002003', correo: 'info@studionorte.co',       perf: 'perf_emp_004', nit: '901.222.333-1', sector: 'Branding',              logo: fotoEmp(3) },
  { _id: 'usr_014', nombre: 'Forma Visual SAS',         tipo: 'EMPRESA', telefono: '6041002004', correo: 'design@formavs.co',         perf: 'perf_emp_005', nit: '900.777.888-9', sector: 'Identidad Corporativa', logo: fotoEmp(1) },
  // 5 CLIENTE
  { _id: 'usr_015', nombre: 'Andrés Ospina Vélez',    tipo: 'CLIENTE', telefono: '3109003001', correo: 'andres.ospina@gmail.com',  intereses: ['Branding'] },
  { _id: 'usr_016', nombre: 'Camila Reyes Mora',      tipo: 'CLIENTE', telefono: '3109003002', correo: 'camila.reyes@gmail.com',   intereses: ['Fotografía'] },
  { _id: 'usr_017', nombre: 'Juan Pablo Torres',      tipo: 'CLIENTE', telefono: '3109003003', correo: 'jp.torres@empresa.co',     intereses: ['Marketing Digital'] },
  { _id: 'usr_018', nombre: 'Isabella Gómez Arias',   tipo: 'CLIENTE', telefono: '3109003004', correo: 'isa.gomez@outlook.com',    intereses: ['UX Design'] },
  { _id: 'usr_019', nombre: 'Felipe Morales Rúa',     tipo: 'CLIENTE', telefono: '3109003005', correo: 'felipe.morales@creativo.co', intereses: ['Ilustración'] },
];

const PERFILES_CREATIVOS_EXTRA = [
  // Para los usuarios CREATIVO nuevos
  { userId: 'usr_006', _id: 'perf_006', profesiones: ['Ilustradora', 'Diseñadora Gráfica'],    habilidades: ['Procreate', 'Illustrator', 'Photoshop'],   descripcion: 'Ilustradora con especialización en branding visual y diseño editorial para marcas emergentes colombianas.' },
  { userId: 'usr_007', _id: 'perf_007', profesiones: ['Motion Designer', 'Animador 2D'],      habilidades: ['After Effects', 'Cinema 4D', 'Premiere'],  descripcion: 'Creador de animaciones y motion graphics para publicidad digital y contenido de marca.' },
  { userId: 'usr_008', _id: 'perf_008', profesiones: ['Fotógrafa', 'Directora de Arte'],      habilidades: ['Lightroom', 'Capture One', 'Photoshop'],   descripcion: 'Fotógrafa editorial especializada en retratos de marca personal y fotografía de moda colombiana.' },
  { userId: 'usr_009', _id: 'perf_009', profesiones: ['Diseñador UX', 'Prototipador'],        habilidades: ['Figma', 'Sketch', 'Principle'],            descripcion: 'Diseñador UX/UI enfocado en apps móviles y experiencias digitales centradas en el usuario.' },
  { userId: 'usr_010', _id: 'perf_010', profesiones: ['Artista de Lettering', 'Modelador 3D'], habilidades: ['Procreate', 'Blender', 'Illustrator'],    descripcion: 'Artista creativa especializada en lettering manual, caligrafía digital y modelado 3D para branding.' },
];

const CURSOS_NUEVOS = [
  { nombre: 'Branding Visual: Identidad de Marca',   descripcion: 'Construye identidades de marca memorables con estrategia, color y tipografía.',   categorias: ['Branding'],               precio: 79.99 },
  { nombre: 'Tipografía Expresiva para Diseño',      descripcion: 'Domina la elección y combinación de fuentes para proyectos creativos impactantes.', categorias: ['Tipografía'],             precio: 49.99 },
  { nombre: 'Ilustración Vectorial Profesional',     descripcion: 'Técnicas avanzadas de ilustración en Illustrator para proyectos editoriales.',      categorias: ['Ilustración'],            precio: 69.99 },
  { nombre: 'Motion Graphics con After Effects',     descripcion: 'Crea animaciones impactantes para publicidad y contenido de marca digital.',         categorias: ['Motion Graphics'],        precio: 89.99 },
  { nombre: 'UX Design para Aplicaciones Móviles',  descripcion: 'Diseña experiencias de usuario intuitivas para apps iOS y Android.',                  categorias: ['UX Design'],              precio: 95.00 },
  { nombre: 'Fotografía de Retrato Profesional',    descripcion: 'Domina iluminación, composición y edición para fotografía artística.',               categorias: ['Fotografía'],             precio: 65.00 },
  { nombre: 'Diseño Web Responsive con Figma',      descripcion: 'Crea prototipos de alta fidelidad y diseños web adaptativos modernos.',              categorias: ['Web Design'],             precio: 75.00 },
  { nombre: 'Color Theory para Diseñadores',        descripcion: 'Teoría y práctica del color aplicada a proyectos de branding y comunicación.',        categorias: ['Color', 'Diseño'],        precio: 45.00 },
  { nombre: 'Fotografía de Producto para E-commerce', descripcion: 'Captura imágenes profesionales de productos con equipo accesible.',               categorias: ['Fotografía'],             precio: 55.00 },
  { nombre: 'Animación 2D con Procreate',          descripcion: 'Crea animaciones expresivas directamente en tu iPad con Procreate.',                  categorias: ['Animación', 'Ilustración'], precio: 59.99 },
  { nombre: 'Diseño de Empaques Creativos',        descripcion: 'Aprende a diseñar packaging que destaca en el punto de venta y comunica la marca.',   categorias: ['Packaging'],              precio: 85.00 },
  { nombre: 'Retoque Fotográfico Avanzado',        descripcion: 'Técnicas avanzadas en Photoshop para fotografía de moda y publicidad.',               categorias: ['Fotografía'],             precio: 72.00 },
  { nombre: 'Gestión de Proyectos Creativos',      descripcion: 'Planifica y gestiona proyectos de diseño con metodologías ágiles aplicadas.',         categorias: ['Gestión'],                precio: 50.00 },
  { nombre: 'Social Media Design Estratégico',     descripcion: 'Crea contenido visual coherente y con impacto para todas las plataformas sociales.',   categorias: ['Redes Sociales'],         precio: 55.00 },
  { nombre: 'Lettering y Caligrafía Digital',      descripcion: 'Arte del lettering manual y digital aplicado a branding y proyectos creativos.',       categorias: ['Lettering'],              precio: 48.00 },
  { nombre: 'Modelado 3D con Blender para Diseño', descripcion: 'Introducción al modelado 3D con Blender aplicado a diseño gráfico y branding.',      categorias: ['3D', 'Modelado'],         precio: 99.99 },
  { nombre: 'Dirección de Arte para Publicidad',   descripcion: 'Conceptualización y dirección visual de campañas publicitarias creativas.',            categorias: ['Dirección de Arte'],      precio: 110.00 },
];

const CARGOS_LABORAL = [
  { cargo: 'Diseñador Gráfico Senior', descripcion: 'Buscamos diseñador gráfico con experiencia en branding y comunicación visual para agencia de diseño en Bogotá.' },
  { cargo: 'Motion Designer',         descripcion: 'Se requiere motion designer con portafolio sólido en animación para redes sociales y publicidad digital.' },
  { cargo: 'UX/UI Designer',          descripcion: 'Oportunidad para diseñador UX/UI con experiencia en diseño de aplicaciones móviles y plataformas web.' },
  { cargo: 'Fotógrafo Editorial',     descripcion: 'Fotógrafo con experiencia en moda, gastronomía y lifestyle para campañas de marcas locales.' },
  { cargo: 'Ilustrador Digital',      descripcion: 'Ilustrador creativo para proyectos de branding, publicaciones y diseño editorial con estilo propio.' },
  { cargo: 'Director de Arte',        descripcion: 'Director de arte creativo para liderar proyectos de comunicación visual en agencia boutique.' },
  { cargo: 'Diseñador Web',           descripcion: 'Diseñador web especializado en landing pages, UI responsivo y experiencias digitales de alto impacto.' },
  { cargo: 'Brand Designer',          descripcion: 'Brand designer para construir y evolucionar identidades de marca para startups tecnológicas colombianas.' },
  { cargo: 'Retocador Fotográfico',   descripcion: 'Especialista en retoque y postproducción de imágenes para e-commerce, moda y publicidad impresa.' },
  { cargo: 'Content Creator Visual',  descripcion: 'Creador de contenido visual para redes sociales, con habilidad para fotografía, video y diseño gráfico.' },
  { cargo: 'Tipógrafo Creativo',      descripcion: 'Tipógrafo y lettering artist para proyectos de branding, publicaciones especiales y señalética.' },
  { cargo: 'Diseñador Editorial',     descripcion: 'Diseñador editorial para libros, revistas y materiales impresos de alto nivel de producción.' },
  { cargo: 'Animador 3D',             descripcion: 'Animador 3D para producción de contenidos publicitarios, visualizaciones arquitectónicas y branded content.' },
  { cargo: 'Social Media Designer',   descripcion: 'Diseñador especializado en contenido para redes sociales: Instagram, TikTok, LinkedIn y Pinterest.' },
  { cargo: 'Concept Artist',          descripcion: 'Concept artist para proyectos audiovisuales, videojuegos y experiencias de entretenimiento interactivo.' },
  { cargo: 'Packaging Designer',      descripcion: 'Diseñador de empaques para marcas de consumo masivo, alimentos y cosmética natural colombiana.' },
  { cargo: 'UI Designer Freelance',   descripcion: 'UI designer para trabajar en proyectos de apps y plataformas digitales de forma remota y flexible.' },
  { cargo: 'Fotógrafo de Producto',   descripcion: 'Fotógrafo especializado en productos para catálogos digitales e impresos de marcas locales.' },
  { cargo: 'Diseñador Jr. Branding',  descripcion: 'Diseñador junior con pasión por el branding para crecer en agencia creativa mediana de Medellín.' },
];

const TEMATICAS_ASESORIA = [
  ['Branding y Diseño de Marca', 'Identidad Visual', 'Naming y Logo Design'],
  ['Tipografía Creativa', 'Diseño Editorial', 'Sistemas de Maquetación'],
  ['Ilustración Digital', 'Concept Art', 'Character Design'],
  ['Fotografía Editorial', 'Edición en Lightroom', 'Composición y Luz'],
  ['Motion Graphics', 'Video Editing', 'Animación para Redes Sociales'],
  ['UX Research', 'Prototipado en Figma', 'Arquitectura de Información'],
  ['Color Theory', 'Paletas para Marca', 'Psicología del Color Aplicada'],
  ['Web Design', 'Landing Pages', 'Diseño Responsive Moderno'],
  ['Fotografía de Retrato', 'Iluminación Creativa', 'Dirección de Sesión'],
  ['Packaging Design', 'Materiales y Producción', 'Diseño para E-commerce'],
  ['Lettering Manual', 'Caligrafía Digital', 'Rotulación para Branding'],
  ['Modelado 3D', 'Blender para Diseñadores', 'Visualización de Producto'],
  ['Dirección de Arte', 'Conceptualización Visual', 'Briefing Creativo'],
  ['Social Media Visual', 'Estrategia de Contenido', 'Grids de Instagram'],
  ['Portafolio y Marca Personal', 'Pitching Creativo', 'Tarifas y Presupuesto'],
];

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const CLIENTES = ['usr_002', 'usr_005', 'usr_015', 'usr_016', 'usr_017', 'usr_018', 'usr_019'];

// ── FASE 0: Limpieza directa en MongoDB ───────────────────────────────────────

async function limpiezaDB() {
  console.log('\n🗑️  FASE 0: Limpieza de registros con formato incorrecto');

  await directDB(async db => {
    // Usuarios con formato US_N
    const delUsr = await db.collection('usuarios').deleteMany({ _id: /^US_\d+$/ });
    console.log(`  usuarios US_N eliminados: ${delUsr.deletedCount}`);

    // Perfiles creativo con UUID o prefijo PC_N
    const delPerf = await db.collection('perfil_creativo').deleteMany({
      $or: [
        { _id: /^PC_\d+$/ },
        // UUIDs (formato 8-4-4-4-12 hex)
        { _id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
        // perf_005 era de US_6 (que se elimina)
        { _id: 'perf_005' }
      ]
    });
    console.log(`  perfil_creativo incorrectos eliminados: ${delPerf.deletedCount}`);

    // Perfiles empresa con formato PE_N
    const delEmp = await db.collection('perfil_empresa').deleteMany({ _id: /^PE_\d+$/ });
    console.log(`  perfil_empresa PE_N eliminados: ${delEmp.deletedCount}`);

    // Cursos con creadores que contienen US_N IDs
    const delCur = await db.collection('cursos').deleteMany({
      creadores: { $elemMatch: { $regex: /^US_\d+$/ } }
    });
    console.log(`  cursos con creadores US_N eliminados: ${delCur.deletedCount}`);

    // Oferta laboral con formato OL_N
    const delOL = await db.collection('oferta_laboral').deleteMany({ _id: /^OL_\d+$/ });
    console.log(`  oferta_laboral OL_N eliminadas: ${delOL.deletedCount}`);

    // OfertaAsesoria con formato oas_N (creadas en sesión anterior con refs incorrectas)
    const delOA = await db.collection('oferta_asesoria').deleteMany({ _id: /^oas_\d+$/ });
    console.log(`  oferta_asesoria oas_N eliminadas: ${delOA.deletedCount}`);

    // Solicitudes sin zero-padding: sol_1..sol_30
    const delSol2 = await db.collection('solicitudes').deleteMany({
      _id: { $in: Array.from({length: 30}, (_,i) => `sol_${i+1}`) }
    });
    console.log(`  solicitudes sol_N eliminadas: ${delSol2.deletedCount}`);

    // Pagos del seed anterior (pago_20+)
    const delPag = await db.collection('pagos').deleteMany({
      _id: { $in: Array.from({length: 30}, (_,i) => `pago_${i+20}`) }
    });
    console.log(`  pagos pago_20+ eliminados: ${delPag.deletedCount}`);

    // Asesorías del seed anterior (ase_1..ase_19)
    const delAse = await db.collection('asesoria').deleteMany({
      _id: { $in: Array.from({length: 25}, (_,i) => `ase_${i+1}`) }
    });
    console.log(`  asesorías ase_1..25 eliminadas: ${delAse.deletedCount}`);

    // Resetear contadores afectados
    await db.collection('contador').updateMany(
      { _id: { $in: ['usuarios', 'perfil_creativo', 'perfil_empresa', 'oferta_laboral', 'oferta_asesoria', 'solicitudes', 'pagos', 'asesoria'] } },
      { $set: { secuencia: 0 } }
    );
    console.log('  contadores reseteados a 0');
  });
}

// ── FASE 1: Usuarios ──────────────────────────────────────────────────────────

async function crearUsuarios() {
  console.log('\n👥 FASE 1: Usuarios (14 nuevos → total 20)');

  for (const u of USUARIOS_NUEVOS) {
    const existe = await api('GET', `/api/usuarios/${u._id}`);
    if (existe) { console.log(`  ⏭️  ${u._id} ya existe`); continue; }

    const body = {
      _id: u._id,
      nombre: u.nombre,
      correo: u.correo,
      password: 'Kreato2026*',
      tipo_usuario: u.tipo,
      intereses: u.intereses ?? [],
      ...(u.tipo === 'CREATIVO' && {
        _id_perfil: u.perf,
        descripcion: `Profesional creativo colombiano — ${u.nombre}`,
      }),
      ...(u.tipo === 'EMPRESA' && {
        _id_perfil: u.perf,
        nit: u.nit,
        sector: u.sector,
        descripcion: `Empresa de diseño creativo — ${u.nombre}`,
      }),
    };

    const r = await api('POST', '/api/usuarios', body);
    if (r) console.log(`  ✅ ${r._id} | ${u.tipo} | ${u.nombre}`);
  }
}

// ── FASE 1b: Completar perfiles creativos (foto + descripción real) ───────────

async function completarPerfilesCreativos() {
  console.log('\n🎨 FASE 1b: Completar PerfilCreativo (foto_perfil + habilidades)');

  const datosPerfil = (p) => ({
    profesiones: p.profesiones,
    habilidades: p.habilidades,
    descripcion: p.descripcion,
    experiencia: 'Más de 3 años trabajando en diseño creativo en Colombia',
    foto_perfil: USUARIOS_NUEVOS.find(u => u._id === p.userId)?.foto ?? null,
  });

  for (const p of PERFILES_CREATIVOS_EXTRA) {
    // Busca perfil por ID exacto (creado en Fase 1 con _id_perfil)
    const porId = await directDB(async db => db.collection('perfil_creativo').findOne({ _id: p._id }));
    if (porId) {
      // Actualiza siempre (el perfil fue creado con datos mínimos en Fase 1)
      const upd = await api('PUT', `/api/creativos/${p._id}`, datosPerfil(p));
      if (upd) console.log(`  ✅ ${p._id} actualizado (foto + habilidades)`);
      continue;
    }

    // Servidor viejo: perfil creado con UUID, busca por userId
    const porUser = await directDB(async db =>
      db.collection('perfil_creativo').findOne({ user_id: p.userId })
    );
    if (porUser) {
      const upd = await api('PUT', `/api/creativos/${porUser._id}`, datosPerfil(p));
      if (upd) console.log(`  ✅ ${porUser._id} (${p.userId}) actualizado`);
      continue;
    }

    // No existe: crear con ID deseado
    const r = await api('POST', '/api/creativos', { _id: p._id, user_id: p.userId, ...datosPerfil(p) });
    if (r) console.log(`  ✅ ${r._id} creado → ${p.userId}`);
  }
}

// ── FASE 1c: Logos de PerfilEmpresa ──────────────────────────────────────────

async function actualizarLogosEmpresa() {
  console.log('\n🏢 FASE 1c: Logos para PerfilEmpresa');

  const empresas = USUARIOS_NUEVOS.filter(u => u.tipo === 'EMPRESA');
  const logos = [fotoEmp(1), fotoEmp(2), fotoEmp(3), fotoEmp(1)]; // 4 empresas

  for (let i = 0; i < empresas.length; i++) {
    const u    = empresas[i];
    const logo = logos[i];
    const perfil = await directDB(async db =>
      db.collection('perfil_empresa').findOne({ user_id: u._id })
    );
    if (!perfil) { console.log(`  ⚠️  Sin perfil empresa para ${u._id}`); continue; }

    const upd = await api('PUT', `/api/perfil-empresa/${perfil._id}`, { logo });
    if (upd) console.log(`  ✅ ${perfil._id} logo → ${logo}`);
  }
}

// ── FASE 2: Transcripciones ───────────────────────────────────────────────────

async function crearTranscripciones() {
  console.log('\n📝 FASE 2: Transcripciones');

  const transcripciones = [
    {
      _id: 'trans_001', source_id: 'ase_444',
      texto_completo: 'En esta sesión revisamos los fundamentos del branding: el logo no es la marca, es el punto de partida. Una identidad sólida nace de valores claros y un público bien definido.',
      lineas: [
        { minuto: '00:00', texto: 'Bienvenida y presentación de la sesión de branding visual.' },
        { minuto: '02:30', texto: 'El logo no es la marca completa. Es la punta del iceberg de una identidad.' },
        { minuto: '05:00', texto: 'Los tres pilares de una identidad de marca: valores, voz y visual.' },
        { minuto: '08:20', texto: 'Ejercicio práctico: definir los atributos de tu marca en tres palabras.' },
        { minuto: '12:00', texto: 'Revisión del portafolio y retroalimentación sobre uso del color.' },
      ]
    },
    {
      _id: 'trans_002', source_id: 'cur_101',
      texto_completo: 'Módulo sobre teoría del color en diseño digital. La luz ambiente, las sombras proyectadas y el balance de temperatura cromática son claves para lograr realismo en ilustraciones digitales.',
      lineas: [
        { minuto: '00:00', texto: 'Introducción a la teoría del color en entornos digitales.' },
        { minuto: '03:15', texto: 'Temperatura de color: cálidos versus fríos en composición.' },
        { minuto: '06:00', texto: 'La rueda de color y sus aplicaciones prácticas en Procreate.' },
        { minuto: '10:45', texto: 'Ejercicio: crear una paleta monocromática con variaciones de luminosidad.' },
      ]
    },
    {
      _id: 'trans_003', source_id: 'cur_101',
      texto_completo: 'Segunda sesión del módulo de luz y sombra. Exploramos técnicas de iluminación dramática para dar volumen y profundidad a personajes digitales.',
      lineas: [
        { minuto: '00:00', texto: 'Repaso de la sesión anterior sobre temperatura de color.' },
        { minuto: '04:00', texto: 'Luz ambiente versus luz puntual: diferencias y usos.' },
        { minuto: '07:30', texto: 'Técnica de capas para sombras suaves en Procreate.' },
        { minuto: '11:00', texto: 'Ejercicio de iluminación dramática con referencia fotográfica.' },
        { minuto: '15:20', texto: 'Errores comunes en iluminación digital y cómo evitarlos.' },
      ]
    },
    {
      _id: 'trans_004', source_id: 'ase_444',
      texto_completo: 'Sesión de revisión de portafolio. Analizamos la coherencia visual entre piezas, la presentación para clientes y la estrategia de difusión en redes sociales profesionales.',
      lineas: [
        { minuto: '00:00', texto: 'Revisión inicial del portafolio en Behance.' },
        { minuto: '03:00', texto: 'La importancia del contexto y descripción de cada proyecto.' },
        { minuto: '06:30', texto: 'Consejos para mejorar la presentación visual de tus piezas.' },
        { minuto: '10:00', texto: 'Estrategia de publicación en LinkedIn para diseñadores.' },
      ]
    },
    {
      _id: 'trans_005', source_id: 'cur_101',
      texto_completo: 'Clase sobre tipografía en diseño editorial. Selección de fuentes, jerarquía tipográfica y ritmo visual en composiciones de revista y publicidad impresa.',
      lineas: [
        { minuto: '00:00', texto: 'Fundamentos de tipografía: anatomía de la letra.' },
        { minuto: '03:30', texto: 'Jerarquía tipográfica: titular, subtítulo, cuerpo y notas al pie.' },
        { minuto: '07:00', texto: 'Combinación de familias tipográficas: serif con sans-serif.' },
        { minuto: '11:30', texto: 'Ejercicio de composición editorial con la regla áurea.' },
        { minuto: '16:00', texto: 'Errores frecuentes en tipografía y cómo corregirlos.' },
      ]
    },
  ];

  for (const t of transcripciones) {
    const existe = await api('GET', `/api/transcripciones/${t._id}`).catch(() => null);
    if (existe) { console.log(`  ⏭️  ${t._id} ya existe`); continue; }
    const r = await api('POST', '/api/transcripciones', t);
    if (r) console.log(`  ✅ ${r._id} (source: ${t.source_id})`);
  }
}

// ── FASE 3: Cursos ────────────────────────────────────────────────────────────

async function crearCursos() {
  console.log('\n📚 FASE 3: Cursos (objetivo ≥ 20)');

  const cursosActuales = await api('GET', '/api/cursos');
  const faltanCursos = Math.max(0, 20 - cursosActuales.length);
  console.log(`  Actuales: ${cursosActuales.length} — a crear: ${faltanCursos}`);

  // Creativos con IDs de usuarios (que el controller valida contra usuarios collection)
  const CREATIVOS_USR = ['usr_001', 'usr_003', 'usr_004', 'usr_006', 'usr_007', 'usr_008', 'usr_009', 'usr_010'];

  for (let i = 0; i < faltanCursos; i++) {
    const tema    = CURSOS_NUEVOS[i % CURSOS_NUEVOS.length];
    const creador = CREATIVOS_USR[i % CREATIVOS_USR.length];
    const id      = `cur_${String(104 + i).padStart(3, '0')}`;

    const c = await api('POST', '/api/cursos', {
      _id: id,
      ...tema,
      creadores: [creador],
      capitulos: [
        { orden: 1, titulo: 'Introducción y bases conceptuales',   video_url: `${BASE}/videos/${id}_cap1.mp4` },
        { orden: 2, titulo: 'Técnicas y herramientas profesionales', video_url: `${BASE}/videos/${id}_cap2.mp4` },
        { orden: 3, titulo: 'Proyecto integrador y presentación',  video_url: `${BASE}/videos/${id}_cap3.mp4` },
      ],
    });
    if (c) console.log(`  ✅ ${c._id} — "${c.nombre}" (creador: ${creador})`);
  }
}

// ── FASE 4: OfertaLaboral ─────────────────────────────────────────────────────

async function crearOfertaLaboral() {
  console.log('\n💼 FASE 4: OfertaLaboral (objetivo ≥ 20)');

  const actuales = await api('GET', '/api/oferta-laboral');
  const faltan   = Math.max(0, 20 - actuales.length);
  console.log(`  Actuales: ${actuales.length} — a crear: ${faltan}`);

  // Perfiles empresa disponibles (incluyendo los del seed original)
  const empresas = await api('GET', '/api/perfil-empresa');
  const empIds   = empresas.map(e => e._id);
  if (empIds.length === 0) { console.log('  ⚠️  Sin perfiles empresa — saltando fase'); return; }

  for (let i = 0; i < faltan; i++) {
    const cargo  = CARGOS_LABORAL[i % CARGOS_LABORAL.length];
    const empId  = empIds[i % empIds.length];
    const id     = `lab_${String(i + 1).padStart(3, '0')}`;

    const o = await api('POST', '/api/oferta-laboral', {
      _id: id,
      perfil_empresa_id: empId,
      cargo: cargo.cargo,
      descripcion: cargo.descripcion,
      presupuesto: 2000000 + i * 200000,
    });
    if (o) console.log(`  ✅ ${o._id} — "${o.cargo}" (empresa: ${empId})`);
  }
}

// ── FASE 5: OfertaEncargo (con imágenes locales + embeddings) ─────────────────

async function crearOfertaEncargo() {
  console.log('\n🖼️  FASE 5: OfertaEncargo con imágenes locales (embeddings CLIP)');
  console.log('     ⏳ Esta fase puede tardar varios minutos por los embeddings de imagen...');

  const actuales = await api('GET', '/api/oferta-encargo');
  const faltan   = Math.max(0, 20 - actuales.length);
  console.log(`  Actuales: ${actuales.length} — a crear: ${faltan}`);

  const CLIENTES_EMPRESA = ['usr_002', 'usr_005', 'usr_015', 'usr_016', 'usr_017'];

  const encargos = [
    { descripcion: 'Necesito diseño completo de identidad de marca para mi café artesanal en Medellín. Incluye logo, paleta de colores y tipografía para uso en redes y materiales físicos.', imgs: [1, 2], rango: { min: 800000, max: 1500000 } },
    { descripcion: 'Busco ilustrador para crear serie de 8 ilustraciones estilo flat design para campaña de marketing digital de marca de ropa sostenible.', imgs: [3, 4], rango: { min: 600000, max: 1200000 } },
    { descripcion: 'Proyecto de fotografía editorial para catálogo de muebles artesanales. Necesito 15 fotografías de producto con edición profesional incluida.', imgs: [5, 6], rango: { min: 1200000, max: 2000000 } },
    { descripcion: 'Motion graphics para presentación corporativa. Animación de 2 minutos con la historia y valores de nuestra empresa tecnológica.', imgs: [7, 8], rango: { min: 1500000, max: 3000000 } },
    { descripcion: 'Diseño UX/UI para aplicación móvil de reservas de servicios de belleza. Prototipo en Figma con mínimo 15 pantallas funcionales.', imgs: [9, 10], rango: { min: 2000000, max: 4000000 } },
    { descripcion: 'Rediseño visual de redes sociales para restaurante gourmet. Kit completo de plantillas para Instagram, Stories y Reels.', imgs: [11, 12], rango: { min: 500000, max: 900000 } },
    { descripcion: 'Diseño de empaque sostenible para línea de snacks saludables. 3 variantes de packaging con enfoque en materiales biodegradables.', imgs: [13, 14], rango: { min: 1000000, max: 2500000 } },
    { descripcion: 'Creación de lettering personalizado para marca de joyería artesanal. Logo tipográfico con variantes para diferentes aplicaciones.', imgs: [15, 16], rango: { min: 400000, max: 800000 } },
    { descripcion: 'Infografías para presentación de datos de impacto social de ONG ambiental. Mínimo 5 infografías de alta calidad.', imgs: [17, 18], rango: { min: 700000, max: 1400000 } },
    { descripcion: 'Diseño de personajes para videojuego indie colombiano de plataformas. 6 personajes completos con animaciones básicas.', imgs: [19, 20], rango: { min: 3000000, max: 6000000 } },
    { descripcion: 'Portada y diseño interior para libro de cuentos infantiles ilustrado. 32 páginas con ilustraciones a color y diseño editorial.', imgs: [21, 22], rango: { min: 2500000, max: 5000000 } },
    { descripcion: 'Branding completo para consultora de recursos humanos. Manual de marca, papelería y plantillas digitales.', imgs: [23, 24], rango: { min: 1800000, max: 3500000 } },
    { descripcion: 'Fotografía de evento corporativo: lanzamiento de producto tecnológico. 6 horas de cobertura fotográfica con edición de 80 fotos.', imgs: [25, 26], rango: { min: 900000, max: 1800000 } },
    { descripcion: 'Diseño de señalética y wayfinding para espacio coworking. Sistema de señales para 3 pisos con identidad visual coherente.', imgs: [27, 28], rango: { min: 2000000, max: 4000000 } },
    { descripcion: 'Animación explicativa para startup fintech. Video de 90 segundos explicando el servicio de forma clara y atractiva.', imgs: [29, 30], rango: { min: 1500000, max: 3000000 } },
    { descripcion: 'Ilustraciones para material educativo digital de plataforma de aprendizaje. 20 ilustraciones en estilo vectorial consistente.', imgs: [31, 32], rango: { min: 1200000, max: 2400000 } },
    { descripcion: 'Diseño de newsletter y plantillas de email marketing para tienda de moda. 5 templates responsive con guía de uso.', imgs: [33, 34], rango: { min: 600000, max: 1200000 } },
    { descripcion: 'Rebranding de logo y actualización de identidad visual para empresa de 20 años en el sector educativo.', imgs: [35, 36], rango: { min: 1500000, max: 3000000 } },
  ];

  let imgEnc2 = 1;
  for (let i = 0; i < faltan; i++) {
    const enc     = encargos[i % encargos.length];
    const userId  = CLIENTES_EMPRESA[i % CLIENTES_EMPRESA.length];
    const imagenes = enc.imgs.map(n => imgEnc(n));

    const o = await api('POST', '/api/oferta-encargo', {
      usuario_id:    userId,
      descripcion:   enc.descripcion,
      imagenes,
      rango_pago:    enc.rango,
      tipo:          'publica',
      estado:        'abierta',
    });
    if (o) console.log(`  ✅ ${o._id} (${imagenes.length} imágenes, ${o.vectores_imagenes?.length ?? 0} vectors)`);
  }
}

// ── FASE 6: Publicaciones (con CLIP embeddings) ───────────────────────────────

async function crearPublicaciones() {
  console.log('\n📸 FASE 6: Publicaciones con imágenes locales (CLIP embeddings)');
  console.log('     ⏳ Esta fase puede tardar varios minutos por los embeddings de imagen...');

  // publicacionesRoutes no tiene GET /, se cuenta directo en MongoDB
  const total = await directDB(async db => db.collection('publicaciones').countDocuments());
  const faltan = Math.max(0, 20 - total);
  console.log(`  Actuales: ${total} — a crear: ${faltan}`);

  // Publicaciones distribuidas por perfil creativo
  const PUBS = [
    // perf_001 (isabelbv) — usr_001
    { creativo: 'perf_001', sub: 'perf_001', file: '1.jpg',   desc: 'Ilustración digital de paisaje urbano nocturno de Bogotá, con paleta de azules y luces neón.', cats: ['Ilustración', 'Urbano'],        esPortafolio: true  },
    { creativo: 'perf_001', sub: 'perf_001', file: '2.jfif',  desc: 'Serie de iconos vectoriales para app de movilidad urbana. Estilo flat con colores primarios.', cats: ['Iconografía', 'UI'],          esPortafolio: true  },
    { creativo: 'perf_001', sub: 'perf_001', file: '3.jfif',  desc: 'Portada editorial para revista cultural con composición tipográfica y collage digital.',       cats: ['Editorial', 'Tipografía'],     esPortafolio: false },
    { creativo: 'perf_001', sub: 'perf_001', file: '4.jpg',   desc: 'Branding completo para cafetería de autor: logo, paleta y sistema de identidad visual.',       cats: ['Branding', 'Identidad'],       esPortafolio: true  },
    // perf_003 (valentina) — usr_003
    { creativo: 'perf_003', sub: 'perf_003', file: '11.jfif', desc: 'Retrato fotográfico de moda editorial para marca de ropa local en Medellín.',                 cats: ['Fotografía', 'Moda'],          esPortafolio: true  },
    { creativo: 'perf_003', sub: 'perf_003', file: '12.jfif', desc: 'Still life de joyería artesanal con fondo de seda y luz natural. Catálogo 2026.',             cats: ['Fotografía', 'Producto'],      esPortafolio: true  },
    { creativo: 'perf_003', sub: 'perf_003', file: '13.jfif', desc: 'Sesión de retrato de marca personal para emprendedora del sector gastronómico.',               cats: ['Fotografía', 'Retrato'],       esPortafolio: false },
    { creativo: 'perf_003', sub: 'perf_003', file: '14.jfif', desc: 'Composición de alimentos para restaurante de cocina fusión. Platos de autor.',                 cats: ['Fotografía', 'Gastronomía'],   esPortafolio: true  },
    // perf_004 (andres) — usr_004
    { creativo: 'perf_004', sub: 'perf_004', file: '18.jfif', desc: 'Motion graphics para redes sociales: animación de logo con partículas y transiciones suaves.', cats: ['Animación', 'Motion'],        esPortafolio: true  },
    { creativo: 'perf_004', sub: 'perf_004', file: '19.jfif', desc: 'Video intro para canal de YouTube de música colombiana. Animación 15 segundos.',               cats: ['Motion Graphics', 'Video'],    esPortafolio: false },
    { creativo: 'perf_004', sub: 'perf_004', file: '20.jfif', desc: 'Reel de animación para campaña digital de bebidas. Concepto visual de frescura y energía.',   cats: ['Animación', 'Publicidad'],     esPortafolio: true  },
    // Nuevos creativos — post_sociales
    { creativo: 'perf_006', sub: 'post_sociales', file: '25.jfif', desc: 'Ilustración de personaje femenino para campaña de empoderamiento en redes sociales.',     cats: ['Ilustración', 'Social'],      esPortafolio: true  },
    { creativo: 'perf_006', sub: 'post_sociales', file: '26.jfif', desc: 'Serie de stickers ilustrados para la app de mensajería de una marca de moda juvenil.',     cats: ['Ilustración', 'Stickers'],    esPortafolio: false },
    { creativo: 'perf_007', sub: 'post_sociales', file: '27.jfif', desc: 'Animación de loader para app fintech: icon animado en 3 segundos con micro-interacciones.', cats: ['Animación', 'UI'],           esPortafolio: true  },
    { creativo: 'perf_007', sub: 'post_sociales', file: '28.jfif', desc: 'Transición cinematográfica para apertura de video corporativo. Estilo clean y moderno.',   cats: ['Motion Graphics'],            esPortafolio: false },
    { creativo: 'perf_008', sub: 'post_sociales', file: '29.jfif', desc: 'Retrato ambiental de chef para perfil gastronómico. Luz natural y composición cercana.',   cats: ['Fotografía', 'Retrato'],      esPortafolio: true  },
    { creativo: 'perf_009', sub: 'post_sociales', file: '30.jfif', desc: 'Prototipo de pantalla de onboarding para app de fitness. UX centrado en motivación.',     cats: ['UX Design', 'Mobile'],        esPortafolio: true  },
    { creativo: 'perf_010', sub: 'post_sociales', file: '31.jfif', desc: 'Lettering caligráfico para invitación de boda con estilo rústico y minimalista.',          cats: ['Lettering', 'Caligrafía'],   esPortafolio: true  },
    { creativo: 'perf_010', sub: 'post_sociales', file: '32.jfif', desc: 'Render 3D de producto: botella de agua con branding para marca de hidratación premium.',  cats: ['3D', 'Producto'],             esPortafolio: false },
  ];

  let idCounter = total + 1;
  for (let i = 0; i < faltan; i++) {
    const p = PUBS[i % PUBS.length];
    const imagenUrl = imgPub(p.sub, p.file);
    const id = `pub_${String(500 + idCounter).padStart(3, '0')}`;
    idCounter++;

    const r = await api('POST', '/api/publicaciones', {
      _id:           id,
      creativo_id:   p.creativo,
      imagen_url:    imagenUrl,
      descripcion:   p.desc,
      categorias:    p.cats,
      es_portafolio: p.esPortafolio,
    });
    if (r) console.log(`  ✅ ${r._id} (${p.creativo}) — ${imagenUrl}`);
  }
}

// ── FASE 7: OfertaAsesoria ────────────────────────────────────────────────────

async function crearOfertaAsesoria() {
  console.log('\n🎓 FASE 7: OfertaAsesoria (objetivo ≥ 20)');

  const actuales = await api('GET', '/api/oferta-asesoria');
  const faltan   = Math.max(0, 20 - actuales.length);
  console.log(`  Actuales: ${actuales.length} — a crear: ${faltan}`);

  const perfiles = await api('GET', '/api/creativos');
  const perfIds  = perfiles.map(p => p._id);

  for (let i = 0; i < faltan; i++) {
    const id      = `oas_${String(i + 1).padStart(3, '0')}`;
    const perfId  = perfIds[i % perfIds.length];
    const temas   = TEMATICAS_ASESORIA[i % TEMATICAS_ASESORIA.length];
    const dia1    = DIAS[i % 5];
    const dia2    = DIAS[(i + 2) % 5];

    const oa = await api('POST', '/api/oferta-asesoria', {
      _id: id,
      perfil_creativo_id: perfId,
      tematicas: temas,
      tarifas: [
        { duracion_minutos: 30, precio: 80000 + i * 5000 },
        { duracion_minutos: 60, precio: 150000 + i * 8000 },
      ],
      disponibilidad: [
        { dia: dia1, horas: ['09:00', '10:00', '11:00'] },
        { dia: dia2, horas: ['14:00', '15:00', '16:00'] },
      ],
    });
    if (oa) console.log(`  ✅ ${oa._id} (perfil: ${perfId})`);
  }
}

// ── FASE 8: Solicitudes ───────────────────────────────────────────────────────

async function crearSolicitudes() {
  console.log('\n📋 FASE 8: Solicitudes aprobadas (objetivo ≥ 20)');

  const actuales = await api('GET', '/api/solicitudes');
  const faltan   = Math.max(0, 20 - actuales.length);
  console.log(`  Actuales: ${actuales.length} — a crear: ${faltan}`);

  const todasOfertas = await api('GET', '/api/oferta-asesoria');
  const ofertaIds    = todasOfertas.map(o => o._id).filter(id => id !== 'of_ase_102'); // evitar reusar la del seed

  for (let i = 0; i < faltan; i++) {
    const id       = `sol_${String(i + 2).padStart(3, '0')}`;
    const cliente  = CLIENTES[i % CLIENTES.length];
    const ofertaId = ofertaIds[i % ofertaIds.length];
    const hora     = 9 + (i % 8);

    const s = await api('POST', '/api/solicitudes', {
      _id:               id,
      usuario_id:        cliente,
      oferta_asesoria_id: ofertaId,
      descripcion:       `Solicitud de asesoría #${i + 2} — busco guía profesional en diseño creativo y desarrollo de portafolio para el mercado colombiano.`,
      estado:            'aprobada',
      fecha:             new Date(2026, 5, 10 + (i % 20)).toISOString(),
      hora_inicio:       `${String(hora).padStart(2, '0')}:00`,
      hora_fin:          `${String(hora + 1).padStart(2, '0')}:00`,
    });
    if (s) console.log(`  ✅ ${s._id} (cliente: ${cliente})`);
  }
}

// ── FASE 9: Pagos + Asesorías (dependencia circular) ─────────────────────────

async function crearPagosYAsesorias() {
  console.log('\n💳 FASE 9: Pagos + Asesorías (objetivo ≥ 20)');

  const [todasSol, todasAse] = await Promise.all([
    api('GET', '/api/solicitudes'),
    api('GET', '/api/asesorias'),
  ]);

  const conAsesoria   = new Set(todasAse.map(a => a.solicitud_id));
  const sinAsesoria   = todasSol.filter(s => s.estado === 'aprobada' && !conAsesoria.has(s._id));
  const pagosActuales = await api('GET', '/api/pagos');
  console.log(`  Solicitudes sin asesoría: ${sinAsesoria.length} | Asesorías: ${todasAse.length}`);

  const pagosNuevos = [];
  let pagoIdx = pagosActuales.length + 1;

  for (let i = 0; i < sinAsesoria.length; i++) {
    const id      = `pago_${String(pagoIdx++).padStart(3, '0')}`;
    const cliente = CLIENTES[i % CLIENTES.length];
    const hora    = 10 + (i % 8);

    const p = await api('POST', '/api/pagos', {
      _id:       id,
      tipo:      'ASESORIA',
      source_id: 'ase_444',
      user_id:   cliente,
      monto:     150000 + i * 20000,
      estado:    'pagado',
      fecha:     new Date(2026, 5, 5 + (i % 25)).toISOString(),
      hora:      `${String(hora).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
    });
    if (p) pagosNuevos.push(p._id);
  }

  console.log(`  Pagos creados: ${pagosNuevos.length}`);

  let aseIdx = todasAse.length;
  for (let i = 0; i < Math.min(sinAsesoria.length, pagosNuevos.length); i++) {
    aseIdx++;
    const id  = `ase_${String(aseIdx).padStart(3, '0')}`;
    const num = String(i + 1).padStart(3, '0');

    const a = await api('POST', '/api/asesorias', {
      _id:             id,
      pago_id:         pagosNuevos[i],
      solicitud_id:    sinAsesoria[i]._id,
      link_reunion:    `https://meet.kreato.com/sesion-${num}`,
      video_grabacion: `${BASE}/grabaciones/sesion_${num}.mp4`,
    });
    if (a) console.log(`  ✅ ${a._id} (pago: ${pagosNuevos[i]}, sol: ${sinAsesoria[i]._id})`);
  }
}

// ── RESUMEN FINAL ─────────────────────────────────────────────────────────────

async function resumenFinal() {
  console.log('\n' + '━'.repeat(60));
  console.log('📊 RESUMEN FINAL');
  console.log('━'.repeat(60));

  await directDB(async db => {
    const colecciones = [
      'usuarios', 'perfil_creativo', 'perfil_empresa',
      'cursos', 'oferta_laboral', 'oferta_encargo',
      'publicaciones', 'oferta_asesoria', 'solicitudes',
      'pagos', 'asesoria', 'transcripciones',
      'encargo', 'comentarios',
      'vector_perfil_creativo', 'vector_cursos',
      'vector_oferta_laboral', 'vector_transcripciones',
    ];
    for (const col of colecciones) {
      const n    = await db.collection(col).countDocuments();
      const mark = n >= 20 ? '✅' : (n > 0 ? '🔶' : '⬜');
      console.log(`  ${mark} ${col.padEnd(28)} ${n}`);
    }
  });
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('━'.repeat(60));
  console.log('🚀 SEED COMPLETO — Kreato Agencia de Diseño');
  console.log('━'.repeat(60));
  console.log('⚠️  Asegúrate de haber reiniciado el servidor antes de continuar.');

  await limpiezaDB();
  await crearUsuarios();
  await completarPerfilesCreativos();
  await actualizarLogosEmpresa();
  await crearTranscripciones();
  await crearCursos();
  await crearOfertaLaboral();
  await crearOfertaEncargo();
  await crearPublicaciones();
  await crearOfertaAsesoria();
  await crearSolicitudes();
  await crearPagosYAsesorias();
  await resumenFinal();
}

main().catch(console.error);
