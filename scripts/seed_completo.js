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
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Datos desde archivos JSON del dataset
const CURSOS_JSON = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'cursos.json'), 'utf8'));
const TRANS_JSON  = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'transcripciones.json'), 'utf8'));

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

// ── catálogos extras (nivel 5) ────────────────────────────────────────────────

const USUARIOS_EXTRA = [
  // 8 CREATIVO (usr_031..usr_038) → perfil_creativo 13→20
  { _id: 'usr_031', nombre: 'Valentina Torres Acosta',    tipo: 'CREATIVO', telefono: '3001002001', correo: 'valentina.torres@kreato.co',  perf: 'perf_015', intereses: ['Moda', 'Textil'],            foto: fotoPerf(1) },
  { _id: 'usr_032', nombre: 'Ricardo Prado Mejía',        tipo: 'CREATIVO', telefono: '3001002002', correo: 'ricardo.prado@kreato.co',     perf: 'perf_016', intereses: ['Video', 'Cine'],             foto: fotoPerf(2) },
  { _id: 'usr_033', nombre: 'Ana María Soto Cruz',        tipo: 'CREATIVO', telefono: '3001002003', correo: 'anamaria.soto@kreato.co',    perf: 'perf_017', intereses: ['Ilustración', 'Concept Art'], foto: fotoPerf(3) },
  { _id: 'usr_034', nombre: 'Julián Castro Rivera',       tipo: 'CREATIVO', telefono: '3001002004', correo: 'julian.castro@kreato.co',    perf: 'perf_018', intereses: ['Diseño Industrial', '3D'],    foto: fotoPerf(5) },
  { _id: 'usr_035', nombre: 'Camila Vega Parra',          tipo: 'CREATIVO', telefono: '3001002005', correo: 'camila.vega@kreato.co',      perf: 'perf_019', intereses: ['Fotografía', 'Naturaleza'],   foto: fotoPerf(6) },
  { _id: 'usr_036', nombre: 'Hernán López Duque',         tipo: 'CREATIVO', telefono: '3001002006', correo: 'hernan.lopez@kreato.co',     perf: 'perf_020', intereses: ['Tipografía', 'Editorial'],    foto: fotoPerf(7) },
  { _id: 'usr_037', nombre: 'María Fernanda Ruiz Gómez',  tipo: 'CREATIVO', telefono: '3001002007', correo: 'mafe.ruiz@kreato.co',        perf: 'perf_021', intereses: ['Web Design', 'Frontend'],     foto: fotoPerf(8) },
  { _id: 'usr_038', nombre: 'Alejandro Mora Castillo',    tipo: 'CREATIVO', telefono: '3001002008', correo: 'alejandro.mora@kreato.co',   perf: 'perf_022', intereses: ['Arte Digital', 'Ilustración'],foto: fotoPerf(9) },
  // 12 EMPRESA (usr_039..usr_050) → perfil_empresa 9→20
  { _id: 'usr_039', nombre: 'Diseños Quito SAS',          tipo: 'EMPRESA', telefono: '6041003001', correo: 'hola@disenosquito.co',       perf: 'perf_emp_009', nit: '900.111.222-1', sector: 'Diseño Gráfico',        logo: fotoEmp(1) },
  { _id: 'usr_040', nombre: 'Imagina Estudio SAS',        tipo: 'EMPRESA', telefono: '6041003002', correo: 'info@imaginaestudio.co',     perf: 'perf_emp_010', nit: '901.333.444-5', sector: 'Agencia Creativa',      logo: fotoEmp(2) },
  { _id: 'usr_041', nombre: 'Colors & Type SAS',          tipo: 'EMPRESA', telefono: '6041003003', correo: 'hola@colorstype.co',         perf: 'perf_emp_011', nit: '900.555.666-7', sector: 'Branding',              logo: fotoEmp(3) },
  { _id: 'usr_042', nombre: 'Creativa Norte SAS',         tipo: 'EMPRESA', telefono: '6041003004', correo: 'contacto@creativanorte.co',  perf: 'perf_emp_012', nit: '800.777.888-3', sector: 'Identidad Visual',      logo: fotoEmp(1) },
  { _id: 'usr_043', nombre: 'Nexo Visual SAS',            tipo: 'EMPRESA', telefono: '6041003005', correo: 'info@nexovisual.co',         perf: 'perf_emp_013', nit: '901.999.000-9', sector: 'Motion y Video',        logo: fotoEmp(2) },
  { _id: 'usr_044', nombre: 'Marca Viva SAS',             tipo: 'EMPRESA', telefono: '6041003006', correo: 'hola@marcaviva.co',          perf: 'perf_emp_014', nit: '900.123.987-4', sector: 'Branding Estratégico',  logo: fotoEmp(3) },
  { _id: 'usr_045', nombre: 'Estudio Forma SAS',          tipo: 'EMPRESA', telefono: '6041003007', correo: 'contacto@estudioforma.co',   perf: 'perf_emp_015', nit: '800.456.321-6', sector: 'Diseño Editorial',      logo: fotoEmp(1) },
  { _id: 'usr_046', nombre: 'Loop Digital SAS',           tipo: 'EMPRESA', telefono: '6041003008', correo: 'info@loopdigital.co',        perf: 'perf_emp_016', nit: '901.654.321-2', sector: 'Animación Digital',     logo: fotoEmp(2) },
  { _id: 'usr_047', nombre: 'Canvas Studio SAS',          tipo: 'EMPRESA', telefono: '6041003009', correo: 'hola@canvasstudio.co',       perf: 'perf_emp_017', nit: '900.234.567-8', sector: 'Arte y Cultura',        logo: fotoEmp(3) },
  { _id: 'usr_048', nombre: 'Pixel Studio Colombia',      tipo: 'EMPRESA', telefono: '6041003010', correo: 'contacto@pixelstudio.co',    perf: 'perf_emp_018', nit: '800.876.543-1', sector: 'UX/UI Design',          logo: fotoEmp(1) },
  { _id: 'usr_049', nombre: 'Artes Visuales Andinas SAS', tipo: 'EMPRESA', telefono: '6041003011', correo: 'info@artesandinas.co',       perf: 'perf_emp_019', nit: '901.111.999-5', sector: 'Fotografía y Video',    logo: fotoEmp(2) },
  { _id: 'usr_050', nombre: 'Grafik Lab SAS',             tipo: 'EMPRESA', telefono: '6041003012', correo: 'hola@grafiklab.co',          perf: 'perf_emp_020', nit: '900.888.777-3', sector: 'Diseño Gráfico',        logo: fotoEmp(3) },
];

const PERFILES_CREATIVOS_EXTRA2 = [
  { userId: 'usr_031', _id: 'perf_015', profesiones: ['Diseñadora de Moda', 'Estilista'],        habilidades: ['Illustrator', 'Photoshop', 'Clo3D'],              descripcion: 'Diseñadora de moda especializada en indumentaria sostenible y fotografía de lookbook para marcas emergentes colombianas.' },
  { userId: 'usr_032', _id: 'perf_016', profesiones: ['Videógrafo', 'Cineasta'],                  habilidades: ['Premiere Pro', 'DaVinci Resolve', 'After Effects'], descripcion: 'Videógrafo documental y de marca con experiencia en narrativas visuales para campañas digitales y festivales de cine.' },
  { userId: 'usr_033', _id: 'perf_017', profesiones: ['Ilustradora', 'Concept Artist'],           habilidades: ['Procreate', 'Photoshop', 'Clip Studio Paint'],     descripcion: 'Artista conceptual e ilustradora con enfoque en worldbuilding, character design y libros álbum para el mercado editorial latinoamericano.' },
  { userId: 'usr_034', _id: 'perf_018', profesiones: ['Diseñador Industrial', 'Modelador 3D'],    habilidades: ['SolidWorks', 'Blender', 'Rhinoceros'],             descripcion: 'Diseñador industrial y modelador 3D orientado al prototipado de productos, packaging funcional y mobiliario contemporáneo.' },
  { userId: 'usr_035', _id: 'perf_019', profesiones: ['Fotógrafa', 'Retocadora Digital'],         habilidades: ['Lightroom', 'Photoshop', 'Capture One'],           descripcion: 'Fotógrafa especializada en naturaleza, paisajes colombianos y fotografía de viaje para revistas de turismo y marcas outdoor.' },
  { userId: 'usr_036', _id: 'perf_020', profesiones: ['Tipógrafo', 'Diseñador Editorial'],        habilidades: ['InDesign', 'Glyphs', 'Illustrator'],               descripcion: 'Diseñador editorial y tipógrafo con proyectos de diseño de fuentes, publicaciones de lujo y sistemas de señalética corporativa.' },
  { userId: 'usr_037', _id: 'perf_021', profesiones: ['Diseñadora Web', 'Frontend Designer'],     habilidades: ['Figma', 'Webflow', 'CSS/HTML'],                    descripcion: 'Diseñadora web y frontend con dominio en sistemas de diseño, responsive UI y landing pages de alta conversión para startups.' },
  { userId: 'usr_038', _id: 'perf_022', profesiones: ['Artista Digital', 'Ilustrador'],           habilidades: ['Procreate', 'Photoshop', 'Blender'],               descripcion: 'Artista digital especializado en ilustración generativa, arte de colecciones y experiencias visuales interactivas para plataformas digitales.' },
];

// ── catálogos ─────────────────────────────────────────────────────────────────

const USUARIOS_NUEVOS = [
  // 9 CREATIVO (usr_006..usr_014)
  { _id: 'usr_006', nombre: 'Sofía Ramírez Calle',      tipo: 'CREATIVO', telefono: '3001001001', correo: 'sofia.ramirez@kreato.co',    perf: 'perf_006', intereses: ['Ilustración', 'Branding'],          foto: fotoPerf(1)  },
  { _id: 'usr_007', nombre: 'Daniel Herrera Ossa',      tipo: 'CREATIVO', telefono: '3001001002', correo: 'daniel.herrera@kreato.co',   perf: 'perf_007', intereses: ['Motion Graphics', 'Tipografía'],    foto: fotoPerf(2)  },
  { _id: 'usr_008', nombre: 'Mariana Zuluaga Ríos',     tipo: 'CREATIVO', telefono: '3001001003', correo: 'mariana.zuluaga@kreato.co',  perf: 'perf_008', intereses: ['Fotografía', 'Editorial'],          foto: fotoPerf(3)  },
  { _id: 'usr_009', nombre: 'Sebastián Montoya Gil',    tipo: 'CREATIVO', telefono: '3001001004', correo: 'sebastian.m@kreato.co',      perf: 'perf_009', intereses: ['UX Design', 'Prototipos'],          foto: fotoPerf(5)  },
  { _id: 'usr_010', nombre: 'Valeria Castro Pérez',     tipo: 'CREATIVO', telefono: '3001001005', correo: 'valeria.castro@kreato.co',   perf: 'perf_010', intereses: ['Lettering', '3D'],                  foto: fotoPerf(6)  },
  { _id: 'usr_011', nombre: 'Carlos Mejía Ramos',       tipo: 'CREATIVO', telefono: '3001001006', correo: 'carlos.mejia@kreato.co',     perf: 'perf_011', intereses: ['Modelado 3D', 'Animación'],         foto: fotoPerf(7)  },
  { _id: 'usr_012', nombre: 'Luciana Vargas Pinto',     tipo: 'CREATIVO', telefono: '3001001007', correo: 'luciana.vargas@kreato.co',   perf: 'perf_012', intereses: ['Dirección de Arte', 'Editorial'],   foto: fotoPerf(8)  },
  { _id: 'usr_013', nombre: 'Mateo Jiménez Cano',       tipo: 'CREATIVO', telefono: '3001001008', correo: 'mateo.jimenez@kreato.co',    perf: 'perf_013', intereses: ['Fotografía', 'Video'],              foto: fotoPerf(9)  },
  { _id: 'usr_014', nombre: 'Natalia Pérez Giraldo',    tipo: 'CREATIVO', telefono: '3001001009', correo: 'natalia.perez@kreato.co',    perf: 'perf_014', intereses: ['UX Design', 'Branding'],            foto: fotoPerf(10) },
  // 7 EMPRESA (usr_015..usr_021)
  { _id: 'usr_015', nombre: 'Agencia Croma SAS',         tipo: 'EMPRESA', telefono: '6041002001', correo: 'hola@croma.co',              perf: 'perf_emp_002', nit: '900.123.456-7', sector: 'Agencia Creativa',       logo: fotoEmp(1) },
  { _id: 'usr_016', nombre: 'Pixel & Color Ltda',         tipo: 'EMPRESA', telefono: '6041002002', correo: 'contacto@pixelcolor.co',     perf: 'perf_emp_003', nit: '800.987.654-3', sector: 'Diseño Digital',         logo: fotoEmp(2) },
  { _id: 'usr_017', nombre: 'Studio Norte Digital SAS',   tipo: 'EMPRESA', telefono: '6041002003', correo: 'info@studionorte.co',        perf: 'perf_emp_004', nit: '901.222.333-1', sector: 'Branding',              logo: fotoEmp(3) },
  { _id: 'usr_018', nombre: 'Forma Visual SAS',           tipo: 'EMPRESA', telefono: '6041002004', correo: 'design@formavs.co',          perf: 'perf_emp_005', nit: '900.777.888-9', sector: 'Identidad Corporativa', logo: fotoEmp(1) },
  { _id: 'usr_019', nombre: 'Creativa Lab SAS',           tipo: 'EMPRESA', telefono: '6041002005', correo: 'hola@creativalab.co',        perf: 'perf_emp_006', nit: '901.444.555-2', sector: 'Diseño Gráfico',        logo: fotoEmp(2) },
  { _id: 'usr_020', nombre: 'Visual Flow Estudio',        tipo: 'EMPRESA', telefono: '6041002006', correo: 'info@visualflow.co',         perf: 'perf_emp_007', nit: '900.666.777-4', sector: 'Motion y Video',        logo: fotoEmp(3) },
  { _id: 'usr_021', nombre: 'Brandeo Colombia SAS',       tipo: 'EMPRESA', telefono: '6041002007', correo: 'contacto@brandeo.co',        perf: 'perf_emp_008', nit: '800.321.654-6', sector: 'Branding Estratégico',  logo: fotoEmp(1) },
  // 9 CLIENTE (usr_022..usr_030)
  { _id: 'usr_022', nombre: 'Andrés Ospina Vélez',      tipo: 'CLIENTE', telefono: '3109003001', correo: 'andres.ospina@gmail.com',   intereses: ['Branding'] },
  { _id: 'usr_023', nombre: 'Camila Reyes Mora',        tipo: 'CLIENTE', telefono: '3109003002', correo: 'camila.reyes@gmail.com',    intereses: ['Fotografía'] },
  { _id: 'usr_024', nombre: 'Juan Pablo Torres',        tipo: 'CLIENTE', telefono: '3109003003', correo: 'jp.torres@empresa.co',      intereses: ['Marketing Digital'] },
  { _id: 'usr_025', nombre: 'Isabella Gómez Arias',     tipo: 'CLIENTE', telefono: '3109003004', correo: 'isa.gomez@outlook.com',     intereses: ['UX Design'] },
  { _id: 'usr_026', nombre: 'Felipe Morales Rúa',       tipo: 'CLIENTE', telefono: '3109003005', correo: 'felipe.morales@kreato.co',  intereses: ['Ilustración'] },
  { _id: 'usr_027', nombre: 'Gabriela Torres Ruiz',     tipo: 'CLIENTE', telefono: '3109003006', correo: 'gabriela.torres@gmail.com', intereses: ['Fotografía', 'Editorial'] },
  { _id: 'usr_028', nombre: 'Simón Castro Mora',        tipo: 'CLIENTE', telefono: '3109003007', correo: 'simon.castro@gmail.com',    intereses: ['Animación', 'Video'] },
  { _id: 'usr_029', nombre: 'Paula Ríos Uribe',         tipo: 'CLIENTE', telefono: '3109003008', correo: 'paula.rios@empresa.co',     intereses: ['Branding', 'Packaging'] },
  { _id: 'usr_030', nombre: 'Esteban López Arango',     tipo: 'CLIENTE', telefono: '3109003009', correo: 'esteban.lopez@gmail.com',   intereses: ['Motion Graphics', '3D'] },
];

const PERFILES_CREATIVOS_EXTRA = [
  { userId: 'usr_006', _id: 'perf_006', profesiones: ['Ilustradora', 'Diseñadora Gráfica'],     habilidades: ['Procreate', 'Illustrator', 'Photoshop'],        descripcion: 'Ilustradora con especialización en branding visual y diseño editorial para marcas emergentes colombianas.' },
  { userId: 'usr_007', _id: 'perf_007', profesiones: ['Motion Designer', 'Animador 2D'],        habilidades: ['After Effects', 'Cinema 4D', 'Premiere'],       descripcion: 'Creador de animaciones y motion graphics para publicidad digital y contenido de marca.' },
  { userId: 'usr_008', _id: 'perf_008', profesiones: ['Fotógrafa', 'Directora de Arte'],        habilidades: ['Lightroom', 'Capture One', 'Photoshop'],        descripcion: 'Fotógrafa editorial especializada en retratos de marca personal y fotografía de moda colombiana.' },
  { userId: 'usr_009', _id: 'perf_009', profesiones: ['Diseñador UX', 'Prototipador'],          habilidades: ['Figma', 'Sketch', 'Principle'],                 descripcion: 'Diseñador UX/UI enfocado en apps móviles y experiencias digitales centradas en el usuario.' },
  { userId: 'usr_010', _id: 'perf_010', profesiones: ['Artista de Lettering', 'Modelador 3D'],  habilidades: ['Procreate', 'Blender', 'Illustrator'],          descripcion: 'Artista creativa especializada en lettering manual, caligrafía digital y modelado 3D para branding.' },
  { userId: 'usr_011', _id: 'perf_011', profesiones: ['Animador 3D', 'Modelador'],              habilidades: ['Blender', 'Cinema 4D', 'Substance Painter'],    descripcion: 'Animador 3D especializado en visualizaciones de producto, branded content y animación para publicidad.' },
  { userId: 'usr_012', _id: 'perf_012', profesiones: ['Directora de Arte', 'Diseñadora Editorial'], habilidades: ['InDesign', 'Illustrator', 'Photoshop'],     descripcion: 'Directora de arte con enfoque en editoriales de moda, conceptualización visual y dirección de sesiones fotográficas.' },
  { userId: 'usr_013', _id: 'perf_013', profesiones: ['Fotógrafo', 'Videógrafo'],               habilidades: ['Premiere', 'DaVinci Resolve', 'Lightroom'],     descripcion: 'Fotógrafo y videógrafo documental especializado en contenido para marcas, eventos y narrativas visuales.' },
  { userId: 'usr_014', _id: 'perf_014', profesiones: ['Diseñadora UX', 'Brand Designer'],       habilidades: ['Figma', 'Webflow', 'Illustrator'],              descripcion: 'Diseñadora UX y brand designer enfocada en identidad digital, sistemas de diseño y experiencias de usuario.' },
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
// usr_002 y usr_005 son clientes del seed original; usr_022..usr_030 son los nuevos
const CLIENTES = ['usr_002', 'usr_005', 'usr_022', 'usr_023', 'usr_024', 'usr_025', 'usr_026', 'usr_027', 'usr_028', 'usr_029', 'usr_030'];

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

    // Transcripciones hardcodeadas antiguas (usaban source_ids incorrectos)
    const delTrans = await db.collection('transcripciones').deleteMany({
      _id: { $in: ['trans_001', 'trans_002', 'trans_003', 'trans_004', 'trans_005'] }
    });
    console.log(`  transcripciones antiguas eliminadas: ${delTrans.deletedCount}`);

    // Cursos con IDs cur_1XX (del seed original que no tienen capítulos con IDs explícitos)
    const delCurOld = await db.collection('cursos').deleteMany({ _id: /^cur_1\d+$/ });
    console.log(`  cursos cur_1XX eliminados: ${delCurOld.deletedCount}`);

    // Resetear contadores afectados
    await db.collection('contador').updateMany(
      { _id: { $in: ['usuarios', 'perfil_creativo', 'perfil_empresa', 'oferta_laboral', 'oferta_asesoria', 'solicitudes', 'pagos', 'asesoria'] } },
      { $set: { secuencia: 0 } }
    );
    console.log('  contadores reseteados a 0');

    // Desactivar validador Atlas para oferta_encargo (Int32 vs Double en rango_pago)
    try {
      await db.command({ collMod: 'oferta_encargo', validationLevel: 'off' });
      console.log('  validador oferta_encargo desactivado (Int32/Double fix)');
    } catch (e) {
      console.log(`  ⚠️  collMod oferta_encargo: ${e.message}`);
    }
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
      telefono: u.telefono,
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

  const empresas  = USUARIOS_NUEVOS.filter(u => u.tipo === 'EMPRESA');
  // Logos disponibles en la carpeta: 1.jfif, 2.jfif, 3.png — se rotan
  const LOGOS_DSP = [fotoEmp(1), fotoEmp(2), fotoEmp(3)];

  for (let i = 0; i < empresas.length; i++) {
    const u    = empresas[i];
    const logo = LOGOS_DSP[i % LOGOS_DSP.length];

    // Buscar el perfil empresa via API usando el _id_perfil que definimos
    const perfil = await api('GET', `/api/perfil-empresa/${u.perf}`);
    if (!perfil) { console.log(`  ⚠️  Sin perfil empresa para ${u._id} (${u.perf})`); continue; }

    const upd = await api('PUT', `/api/perfil-empresa/${perfil._id}`, { logo });
    if (upd) console.log(`  ✅ ${perfil._id} (${u._id}) logo → ${logo}`);
  }
}

// ── FASE 2: Transcripciones (vía HTTP — controller auto-ejecuta pipeline RAG) ─

async function crearTranscripciones() {
  console.log(`\n📝 FASE 2: Transcripciones vía HTTP (${TRANS_JSON.length} registros)`);
  console.log('     ⏳ Pipeline síncrono: cada transcripción espera sus 3 estrategias antes de continuar...');

  let creadas = 0;
  let procesadas = 0;
  let omitidas = 0;

  for (const t of TRANS_JSON) {
    const existe = await api('GET', `/api/transcripciones/${t._id}`);

    if (!existe) {
      // No existe → crear vía HTTP (el controller ejecuta el pipeline automáticamente)
      const r = await api('POST', '/api/transcripciones', {
        _id:            t._id,
        source_id:      t.source_id,
        texto_completo: t.texto_completo,
        lineas:         t.lineas,
      });
      if (r) {
        creadas++;
        console.log(`  ✅ ${r._id} creada + pipeline ejecutado`);
      }
      continue;
    }

    // Ya existe → verificar si tiene chunks en vector_transcripciones
    const chunks = await directDB(async db =>
      db.collection('vector_transcripciones').countDocuments({ transcripcion_id: t._id })
    );

    if (chunks >= 3) {
      // Tiene al menos 1 chunk por estrategia → ya procesada
      omitidas++;
      continue;
    }

    // Existe pero sin chunks (creada antes del pipeline) → procesar ahora
    const r = await api('POST', `/api/transcripciones/${t._id}/procesar`);
    if (r) {
      procesadas++;
      const totales = Object.values(r.resultados ?? {}).map(x => x.chunks_generados).join(' / ');
      console.log(`  🔄 ${t._id} procesada | chunks: ${totales}`);
    }
  }

  console.log(`  Resumen: ${creadas} creadas | ${procesadas} procesadas | ${omitidas} completas`);
}

// ── FASE 3: Cursos (vía HTTP desde data/cursos.json) ─────────────────────────

async function crearCursos() {
  console.log(`\n📚 FASE 3: Cursos desde JSON vía HTTP (${CURSOS_JSON.length} cursos)`);

  // Construir mapeo perfId → userId dinámicamente desde la API
  const perfiles = await api('GET', '/api/creativos');
  const perfAUsr = {};
  for (const p of (perfiles ?? [])) {
    perfAUsr[p._id] = p.user_id;
  }
  console.log(`  Mapeo perfil→usuario: ${JSON.stringify(perfAUsr)}`);

  for (const curso of CURSOS_JSON) {
    const existe = await api('GET', `/api/cursos/${curso._id}`);
    if (existe) { console.log(`  ⏭️  ${curso._id} ya existe`); continue; }

    // cursos.json usa IDs de perfil_creativo; el controller valida contra usuarios
    const creadores = curso.creadores.map(id => perfAUsr[id] ?? id);

    const r = await api('POST', '/api/cursos', {
      _id:         curso._id,
      nombre:      curso.nombre,
      descripcion: curso.descripcion,
      precio:      curso.precio,
      categorias:  curso.categorias,
      creadores,
      capitulos:   curso.capitulos,  // prepararCapitulos() respeta el _id si viene
    });
    if (r) console.log(`  ✅ ${r._id} — "${r.nombre}" | creadores: ${r.creadores} | caps: ${r.capitulos?.length ?? 0}`);
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

  // Usuarios que pueden publicar encargos (clientes + empresas)
  const CLIENTES_EMPRESA = ['usr_002', 'usr_005', 'usr_022', 'usr_023', 'usr_024', 'usr_025', 'usr_015', 'usr_016', 'usr_017', 'usr_018'];

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
  const { total, maxN } = await directDB(async db => {
    const docs = await db.collection('publicaciones').find({}, { projection: { _id: 1 } }).toArray();
    const max  = docs.reduce((m, p) => {
      const n = parseInt((p._id ?? '').replace(/\D/g, ''));
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return { total: docs.length, maxN: max };
  });
  const faltan = Math.max(0, 20 - total);
  console.log(`  Actuales: ${total} (max ID: ${maxN}) — a crear: ${faltan}`);

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
    // perf_011 (Carlos — Animador 3D)
    { creativo: 'perf_011', sub: 'post_sociales', file: '33.jfif', desc: 'Animación de producto en 3D para lanzamiento de sneaker edición limitada. Loop de 5 segundos.',    cats: ['3D', 'Animación'],           esPortafolio: true  },
    { creativo: 'perf_011', sub: 'post_sociales', file: '34.jfif', desc: 'Modelado arquitectónico en Blender de espacio coworking minimalista para renders de marketing.',    cats: ['3D', 'Modelado'],            esPortafolio: true  },
    // perf_012 (Luciana — Directora de Arte)
    { creativo: 'perf_012', sub: 'post_sociales', file: '35.jfif', desc: 'Dirección de arte para editorial de moda colombiana. Concepto visual: botánica urbana.',            cats: ['Dirección de Arte', 'Moda'], esPortafolio: true  },
    { creativo: 'perf_012', sub: 'post_sociales', file: '36.jfif', desc: 'Layout editorial para revista de arquitectura. Retícula modular con tipografía sans-serif.',        cats: ['Editorial', 'Tipografía'],   esPortafolio: false },
    // perf_013 (Mateo — Fotógrafo/Videógrafo)
    { creativo: 'perf_013', sub: 'post_sociales', file: '37.jfif', desc: 'Cobertura fotográfica de festival gastronómico en Cali. Serie de 20 imágenes documentales.',        cats: ['Fotografía', 'Documental'],  esPortafolio: true  },
    // perf_014 (Natalia — UX/Brand)
    { creativo: 'perf_014', sub: 'post_sociales', file: '38.jfif', desc: 'Sistema de diseño para app de delivery local. Componentes en Figma con dark mode incluido.',        cats: ['UX Design', 'Sistemas'],     esPortafolio: true  },
  ];

  let nextPubN = maxN + 1;  // siguiente al máximo existente
  for (let i = 0; i < faltan; i++) {
    const p = PUBS[i % PUBS.length];
    const imagenUrl = imgPub(p.sub, p.file);
    const id = `pub_${String(nextPubN++).padStart(3, '0')}`;

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
  if (!faltan) return;

  // Calcular el máximo N en IDs existentes para evitar colisiones
  const maxN = actuales.reduce((m, s) => {
    const n = parseInt((s._id ?? '').replace(/\D/g, ''));
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);

  const todasOfertas = await api('GET', '/api/oferta-asesoria');
  const ofertaIds    = todasOfertas.map(o => o._id).filter(id => id !== 'of_ase_102');

  for (let i = 0; i < faltan; i++) {
    const num      = maxN + i + 1;
    const id       = `sol_${String(num).padStart(3, '0')}`;
    const cliente  = CLIENTES[i % CLIENTES.length];
    const ofertaId = ofertaIds[i % ofertaIds.length];
    const hora     = 9 + (i % 8);

    const s = await api('POST', '/api/solicitudes', {
      _id:                id,
      usuario_id:         cliente,
      oferta_asesoria_id: ofertaId,
      descripcion:        `Solicitud de asesoría #${num} — busco guía profesional en diseño creativo y desarrollo de portafolio para el mercado colombiano.`,
      estado:             'aprobada',
      fecha:              new Date(2026, 5, 10 + (i % 20)).toISOString(),
      hora_inicio:        `${String(hora).padStart(2, '0')}:00`,
      hora_fin:           `${String(hora + 1).padStart(2, '0')}:00`,
    });
    if (s) console.log(`  ✅ ${s._id} (cliente: ${cliente}, oferta: ${ofertaId})`);
  }
}

// ── FASE 9: Pagos + Asesorías (dependencia circular) ─────────────────────────

async function crearPagosYAsesorias() {
  console.log('\n💳 FASE 9: Pagos ASESORIA + Asesorías (objetivo ≥ 20 c/u)');

  const [todasSol, todasAse, pagosActuales] = await Promise.all([
    api('GET', '/api/solicitudes'),
    api('GET', '/api/asesorias'),
    api('GET', '/api/pagos'),
  ]);

  const conAsesoria = new Set(todasAse.map(a => a.solicitud_id));
  const sinAsesoria = todasSol.filter(s => s.estado === 'aprobada' && !conAsesoria.has(s._id));
  console.log(`  Solicitudes sin asesoría: ${sinAsesoria.length} | Asesorías actuales: ${todasAse.length}`);
  if (!sinAsesoria.length) { console.log('  ⏭️  Nada que crear'); return; }

  // Max N real en pagos existentes (evita colisión con IDs como pago_444)
  const maxPagoN = pagosActuales.reduce((m, p) => {
    const n = parseInt((p._id ?? '').replace(/\D/g, ''));
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);

  // Max N en asesorias, ignorando ase_444 (seed especial de workaround)
  const maxAseN = todasAse.reduce((m, a) => {
    const n = parseInt((a._id ?? '').replace(/\D/g, ''));
    if (n === 444) return m;
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);

  let pagoN = maxPagoN;
  const pagosNuevos = [];

  for (let i = 0; i < sinAsesoria.length; i++) {
    pagoN++;
    const id      = `pago_${String(pagoN).padStart(3, '0')}`;
    const cliente = CLIENTES[i % CLIENTES.length];
    const hora    = 10 + (i % 8);

    const p = await api('POST', '/api/pagos', {
      _id:       id,
      tipo:      'ASESORIA',
      source_id: 'ase_444',   // workaround ciclo ASESORIA: ase_444 ya existe en seed
      user_id:   cliente,
      monto:     150000 + i * 20000,
      estado:    'pagado',
      fecha:     new Date(2026, 5, 5 + (i % 25)).toISOString(),
      hora:      `${String(hora).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
    });
    if (p) pagosNuevos.push(p._id);
    else pagoN--;
  }
  console.log(`  Pagos ASESORIA creados: ${pagosNuevos.length}`);

  let aseN = maxAseN;
  for (let i = 0; i < Math.min(sinAsesoria.length, pagosNuevos.length); i++) {
    aseN++;
    const id  = `ase_${String(aseN).padStart(3, '0')}`;
    const num = String(aseN).padStart(3, '0');

    const a = await api('POST', '/api/asesorias', {
      _id:             id,
      pago_id:         pagosNuevos[i],
      solicitud_id:    sinAsesoria[i]._id,
      link_reunion:    `https://meet.kreato.com/sesion-${num}`,
      video_grabacion: `${BASE}/grabaciones/sesion_${num}.mp4`,
    });
    if (a) console.log(`  ✅ ${a._id} (pago: ${pagosNuevos[i]}, sol: ${sinAsesoria[i]._id})`);
    else aseN--;
  }
}

// ── FASE 10: Encargos (ciclo pago↔encargo resuelto con encargo pre-existente) ─

async function crearEncargos() {
  console.log('\n🔨 FASE 10: Encargos (objetivo ≥ 20)');

  const actuales = await api('GET', '/api/encargos');
  const faltan   = Math.max(0, 20 - actuales.length);
  console.log(`  Actuales: ${actuales.length} — a crear: ${faltan}`);
  if (!faltan) return;

  // Ciclo encargo↔pago(ENCARGO): encargoController solo valida pago.tipo==='ENCARGO',
  // no que pago.source_id coincida con el nuevo encargo. Usamos el enc pre-existente.
  const encargoBase = actuales[0]?._id;
  if (!encargoBase) { console.log('  ⚠️  Sin encargo base para workaround — saltando'); return; }

  const [pagosAct, ofertasAct, perfilesAct] = await Promise.all([
    api('GET', '/api/pagos'),
    api('GET', '/api/oferta-encargo'),
    api('GET', '/api/creativos'),
  ]);

  const maxPagoN = pagosAct.reduce((m, p) => {
    const n = parseInt((p._id ?? '').replace(/\D/g, ''));
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  const maxEncN = actuales.reduce((m, e) => {
    const n = parseInt((e._id ?? '').replace(/\D/g, ''));
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);

  const perfIds  = perfilesAct.map(p => p._id);
  const abiertas = ofertasAct.filter(o => o.estado === 'abierta');
  console.log(`  Ofertas abiertas: ${abiertas.length} | Base encargo: ${encargoBase}`);

  let pagoN = maxPagoN;
  let encN  = maxEncN;

  for (let i = 0; i < faltan && i < abiertas.length; i++) {
    const oferta = abiertas[i];
    const perfId = perfIds[i % perfIds.length];

    // 1. Agregar postulacion a la oferta (perfil_creativo postula precio)
    const ofertaUpd = await api('POST', `/api/oferta-encargo/${oferta._id}/postulaciones`, {
      perfil_creativo_id:           perfId,
      precio:                       800000 + i * 150000,
      cantidad_retroalimentaciones: 2,
    });
    if (!ofertaUpd) { console.log(`  ⚠️  Postulación falló en ${oferta._id}`); continue; }

    const posts     = ofertaUpd.postulaciones;
    const nuevaPost = posts[posts.length - 1];

    // 2. Pago tipo ENCARGO — source_id apunta al encargo base (workaround ciclo)
    pagoN++;
    const pago = await api('POST', '/api/pagos', {
      _id:       `pago_${String(pagoN).padStart(3, '0')}`,
      tipo:      'ENCARGO',
      source_id: encargoBase,
      user_id:   oferta.usuario_id,
      monto:     nuevaPost.precio,
      estado:    'pagado',
      fecha:     new Date(2026, 4, 1 + (i % 28)).toISOString(),
    });
    if (!pago) { pagoN--; continue; }

    // 3. Encargo apuntando al pago nuevo y la postulacion recién creada
    encN++;
    const enc = await api('POST', '/api/encargos', {
      _id:                           `enc_${String(encN).padStart(3, '0')}`,
      oferta_encargo_id:             oferta._id,
      postulacion_id:                nuevaPost._id,
      pago_id:                       pago._id,
      fecha_max:                     new Date(2026, 7, 1 + (i % 28)).toISOString(),
      retroalimentaciones_acordadas: 2,
      estado:                        'activo',
    });
    if (enc) console.log(`  ✅ ${enc._id} | oferta: ${oferta._id} | post: ${nuevaPost._id} | pago: ${pago._id}`);
    else encN--;
  }
}

// ── FASE: Comentarios ────────────────────────────────────────────────────────

async function crearComentarios() {
  console.log('\n💬 FASE: Comentarios (objetivo ≥ 20)');

  const total  = await directDB(async db => db.collection('comentarios').countDocuments());
  const faltan = Math.max(0, 20 - total);
  console.log(`  Actuales: ${total} — a crear: ${faltan}`);
  if (!faltan) return;

  // Un capítulo por curso (17 cursos × 6 caps; usamos el primero de cada uno)
  const CAPS = [
    'cap_2001','cap_2007','cap_2013','cap_2019','cap_2025','cap_2031',
    'cap_2037','cap_2043','cap_2049','cap_2055','cap_2061','cap_2067',
    'cap_2073','cap_2079','cap_2085','cap_2091','cap_2097','cap_2101',
    'cap_2003','cap_2009',
  ];

  // IDs de publicaciones reales (lectura directa — no inserción)
  const pubIds = await directDB(async db =>
    db.collection('publicaciones').find({}, { projection: { _id: 1 } })
      .limit(20).map(d => d._id).toArray()
  );

  const COMENTADORES = [
    'usr_001','usr_002','usr_003','usr_004','usr_005',
    'usr_022','usr_023','usr_024','usr_025','usr_026',
  ];
  const TEXTOS_CAP = [
    'Excelente explicación. Me ayudó a entender la teoría de forma muy clara.',
    'El ejercicio práctico al final fue clave para afianzar lo aprendido.',
    'Me gustaría ver más ejemplos con proyectos reales colombianos, pero muy sólido.',
    'La forma en que explican los temas es muy clara. Volví a ver el capítulo dos veces.',
    'Perfecto para principiantes. No asume conocimiento previo y explica cada paso.',
    '¿Tienen recursos adicionales para profundizar en este tema? Muy buen contenido.',
    'Aplicé lo aprendido en un proyecto real y funcionó perfectamente. Gracias.',
  ];
  const TEXTOS_PUB = [
    'Trabajo increíble, el manejo del color es impresionante.',
    'Me encanta el concepto detrás de esta pieza. Muy original.',
    '¿Qué herramienta usaste para lograr ese efecto de textura?',
    'Este tipo de trabajo es exactamente lo que busco para mi proyecto.',
    'La composición está muy bien equilibrada, felicitaciones.',
    'Inspirador. Justo el estilo que quería para mi próxima campaña.',
  ];

  let creados = 0;
  for (let i = 0; i < faltan; i++) {
    // 2 de cada 3 comentarios en capítulos, 1 en publicaciones
    const enCap      = i % 3 !== 0;
    const target_type = enCap ? 'capitulo' : 'publicacion';
    const target_id   = enCap ? CAPS[i % CAPS.length] : pubIds[i % pubIds.length];
    if (!target_id) continue;

    const r = await api('POST', '/api/comentarios', {
      target_id,
      target_type,
      user_id:  COMENTADORES[i % COMENTADORES.length],
      contenido: enCap ? TEXTOS_CAP[i % TEXTOS_CAP.length] : TEXTOS_PUB[i % TEXTOS_PUB.length],
    });
    if (r) {
      creados++;
      console.log(`  ✅ ${r._id} → ${target_type}:${target_id}`);
    }
  }
  console.log(`  Creados: ${creados}`);
}

// ── FASE: Vector Cursos (RAG — 3 chunks por curso) ───────────────────────────

async function crearVectorCursos() {
  console.log('\n🧠 FASE: Vector Cursos (DESCRIPCION + TEMARIO + OBJETIVO por curso)');
  console.log('     ⏳ 22 cursos × 3 embeddings MiniLM — puede tardar varios minutos...');

  // Borrar los existentes (creados sin pipeline real)
  await directDB(async db => {
    const del = await db.collection('vector_cursos').deleteMany({});
    console.log(`  🗑️  vector_cursos eliminados: ${del.deletedCount}`);
  });

  const cursos = await api('GET', '/api/cursos');
  console.log(`  Cursos a procesar: ${cursos.length}`);
  let creados = 0;

  for (const curso of cursos) {
    const caps = curso.capitulos ?? [];
    const temario = caps.map(c => c.titulo).filter(Boolean).join(' | ');

    const chunks = [
      {
        tipo:     'DESCRIPCION',
        contenido: `${curso.nombre}. ${curso.descripcion}`,
      },
      {
        tipo:     'TEMARIO',
        contenido: temario
          ? `Temario de "${curso.nombre}": ${temario}`
          : `${curso.nombre} — curso sin temario definido`,
      },
      {
        tipo:     'OBJETIVO',
        contenido: `Curso de ${(curso.categorias ?? []).join(', ')}: ${curso.nombre}`,
      },
    ];

    let ok = 0;
    for (const chunk of chunks) {
      const r = await api('POST', '/api/vector/cursos', {
        curso_id: curso._id,
        tipo:     chunk.tipo,
        contenido: chunk.contenido,
      });
      if (r) { creados++; ok++; }
    }
    console.log(`  ✅ ${curso._id} — ${ok}/3 vectores`);
  }

  console.log(`  Total vector_cursos creados: ${creados} (esperado: ${cursos.length * 3})`);
}

// ── FASE: Usuarios Extra (nivel 5) ───────────────────────────────────────────

async function crearUsuariosExtra() {
  console.log('\n👥 FASE: Usuarios Extra (8 CREATIVO + 12 EMPRESA)');

  for (const u of USUARIOS_EXTRA) {
    const existe = await api('GET', `/api/usuarios/${u._id}`);
    if (existe) { console.log(`  ⏭️  ${u._id} ya existe`); continue; }

    const body = {
      _id:          u._id,
      nombre:       u.nombre,
      correo:       u.correo,
      telefono:     u.telefono,
      password:     'Kreato2026*',
      tipo_usuario: u.tipo,
      intereses:    u.intereses ?? [],
      ...(u.tipo === 'CREATIVO' && {
        _id_perfil:  u.perf,
        descripcion: `Profesional creativo colombiano — ${u.nombre}`,
      }),
      ...(u.tipo === 'EMPRESA' && {
        _id_perfil:  u.perf,
        nit:         u.nit,
        sector:      u.sector,
        descripcion: `Empresa de diseño creativo — ${u.nombre}`,
      }),
    };

    const r = await api('POST', '/api/usuarios', body);
    if (r) console.log(`  ✅ ${r._id} | ${u.tipo} | ${u.nombre}`);
  }
}

// ── FASE: Completar perfiles creativos extra ──────────────────────────────────

async function completarPerfilesCreativosExtra() {
  console.log('\n🎨 FASE: Completar PerfilCreativo Extra (foto + habilidades reales)');

  for (const p of PERFILES_CREATIVOS_EXTRA2) {
    const porId = await directDB(async db => db.collection('perfil_creativo').findOne({ _id: p._id }));
    if (!porId) { console.log(`  ⚠️  ${p._id} no encontrado`); continue; }

    const upd = await api('PUT', `/api/creativos/${p._id}`, {
      profesiones: p.profesiones,
      habilidades: p.habilidades,
      descripcion: p.descripcion,
      experiencia: 'Más de 3 años trabajando en diseño creativo en Colombia',
      foto_perfil: USUARIOS_EXTRA.find(u => u._id === p.userId)?.foto ?? null,
    });
    if (upd) console.log(`  ✅ ${p._id} actualizado`);
  }
}

// ── FASE: Logos empresas extra ────────────────────────────────────────────────

async function actualizarLogosEmpresaExtra() {
  console.log('\n🏢 FASE: Logos para PerfilEmpresa Extra');

  const empresas  = USUARIOS_EXTRA.filter(u => u.tipo === 'EMPRESA');
  const LOGOS_DSP = [fotoEmp(1), fotoEmp(2), fotoEmp(3)];

  for (let i = 0; i < empresas.length; i++) {
    const u      = empresas[i];
    const logo   = u.logo ?? LOGOS_DSP[i % LOGOS_DSP.length];
    const perfil = await api('GET', `/api/perfil-empresa/${u.perf}`);
    if (!perfil) { console.log(`  ⚠️  Sin perfil empresa para ${u._id} (${u.perf})`); continue; }
    const upd = await api('PUT', `/api/perfil-empresa/${perfil._id}`, { logo });
    if (upd) console.log(`  ✅ ${perfil._id} (${u._id}) logo → ${logo}`);
  }
}

// ── FASE: Vector PerfilCreativo (1 chunk por perfil) ─────────────────────────

async function crearVectorPerfilCreativo() {
  console.log('\n🧠 FASE: Vector PerfilCreativo (descripcion + profesiones + habilidades)');

  await directDB(async db => {
    const del = await db.collection('vector_perfil_creativo').deleteMany({});
    console.log(`  🗑️  vector_perfil_creativo eliminados: ${del.deletedCount}`);
  });

  const perfiles = await api('GET', '/api/creativos');
  console.log(`  Perfiles a procesar: ${perfiles.length}`);
  let creados = 0;

  for (const p of perfiles) {
    const chunks = [
      { tipo: 'bio',         contenido: p.descripcion ?? `Perfil creativo: ${p._id}` },
      { tipo: 'herramientas', contenido: p.habilidades?.length  ? `Herramientas: ${p.habilidades.join(', ')}`  : `Habilidades de ${p._id}` },
      { tipo: 'estilo',      contenido: p.profesiones?.length   ? `Especialidades: ${p.profesiones.join(', ')}` : `Profesiones de ${p._id}` },
    ];

    let ok = 0;
    for (const chunk of chunks) {
      const r = await api('POST', '/api/vector/perfil', {
        perfil_creativo_id: p._id,
        tipo:               chunk.tipo,
        contenido:          chunk.contenido,
        estrategia_chunking: 'descripcion_completa',
      });
      if (r) { creados++; ok++; }
    }
    console.log(`  ${ok === 3 ? '✅' : '⚠️ '} ${p._id} — ${ok}/3 chunks`);
  }

  console.log(`  Total vector_perfil_creativo creados: ${creados} (esperado: ${perfiles.length * 3})`);
}

// ── FASE: Vector OfertaLaboral (1 chunk por oferta) ───────────────────────────

async function crearVectorOfertaLaboral() {
  console.log('\n🧠 FASE: Vector OfertaLaboral (cargo + descripcion)');

  await directDB(async db => {
    const del = await db.collection('vector_oferta_laboral').deleteMany({});
    console.log(`  🗑️  vector_oferta_laboral eliminados: ${del.deletedCount}`);
  });

  const ofertas = await api('GET', '/api/oferta-laboral');
  console.log(`  Ofertas a procesar: ${ofertas.length}`);
  let creados = 0;

  for (const o of ofertas) {
    const r = await api('POST', '/api/vector/oferta-laboral', {
      oferta_laboral_id: o._id,
      contenido:         `${o.cargo}. ${o.descripcion}`,
    });
    if (r) { creados++; console.log(`  ✅ ${o._id} — "${o.cargo}"`); }
  }

  console.log(`  Total vector_oferta_laboral creados: ${creados}`);
}

// ── FASE: Recrear perfil_creativo faltantes (perf_001, perf_003, perf_004) ────

const PERFILES_FALTANTES = [
  {
    _id: 'perf_001', user_id: 'usr_001',
    descripcion:  'Ilustradora y diseñadora UX con pasión por la identidad visual, la tipografía y las interfaces digitales. Especializada en branding para marcas emergentes colombianas.',
    profesiones:  ['Ilustradora Digital', 'Diseñadora UX'],
    habilidades:  ['Illustrator', 'Figma', 'Procreate', 'Photoshop'],
    experiencia:  'Más de 4 años en diseño gráfico, UX y branding en Bogotá.',
  },
  {
    _id: 'perf_003', user_id: 'usr_003',
    descripcion:  'Fotógrafa editorial especializada en moda, retrato de marca personal y fotografía de producto para marcas locales colombianas.',
    profesiones:  ['Fotógrafa Editorial', 'Directora de Arte'],
    habilidades:  ['Lightroom', 'Capture One', 'Photoshop', 'Hasselblad'],
    experiencia:  'Más de 5 años en fotografía editorial y dirección de sesiones en Medellín.',
  },
  {
    _id: 'perf_004', user_id: 'usr_004',
    descripcion:  'Motion designer y animador 2D/3D con foco en branded content, campañas digitales y motion graphics para publicidad y redes sociales.',
    profesiones:  ['Motion Designer', 'Animador 2D/3D'],
    habilidades:  ['After Effects', 'Cinema 4D', 'Premiere', 'Blender'],
    experiencia:  'Más de 3 años en animación y producción audiovisual para marcas en Colombia.',
  },
];

async function recrearPerfilesFaltantes() {
  console.log('\n🎨 FASE: Recrear perfiles creativos faltantes (perf_001, perf_003, perf_004)');

  for (const p of PERFILES_FALTANTES) {
    const existe = await api('GET', `/api/creativos/${p._id}`);
    if (existe) { console.log(`  ⏭️  ${p._id} ya existe`); continue; }

    const r = await api('POST', '/api/creativos', p);
    if (r) console.log(`  ✅ ${r._id} creado (${p.user_id})`);
  }
}

// ── FASE: Vectorizar oferta_encargo (vector_descripcion + vectores_imagenes) ──

async function vectorizarOfertaEncargo() {
  console.log('\n🧠 FASE: Vectorizar oferta_encargo (vector_descripcion + vectores_imagenes)');

  const ofertas = await api('GET', '/api/oferta-encargo');
  console.log(`  Ofertas a procesar: ${ofertas.length}`);
  let ok = 0;

  for (const oe of ofertas) {
    const r = await api('PATCH', `/api/oferta-encargo/${oe._id}/revectorizar`);
    if (r) {
      const dims = r.vector_descripcion?.length ?? 0;
      const nImg = r.vectores_imagenes?.length ?? 0;
      console.log(`  ✅ ${oe._id} — vector_descripcion: ${dims} dims, vectores_imagenes: ${nImg}`);
      ok++;
    } else {
      console.log(`  ❌ ${oe._id} — falló`);
    }
  }

  console.log(`  Total vectorizados: ${ok}/${ofertas.length}`);
}

// ── FASE: Limpiar vector_descripcion de oferta_laboral (campo redundante) ─────

async function limpiarVectorDescripcionLaboral() {
  console.log('\n🧹 FASE: $unset vector_descripcion de oferta_laboral');

  await directDB(async db => {
    const r = await db.collection('oferta_laboral').updateMany(
      { vector_descripcion: { $exists: true } },
      { $unset: { vector_descripcion: '' } }
    );
    console.log(`  Documentos actualizados: ${r.modifiedCount}`);
  });
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

  // ── Nivel 0: ✅ COMPLETADO ──────────────────────────────────────────────────
  // await limpiezaDB();
  // await crearUsuarios();
  // await completarPerfilesCreativos();
  // await actualizarLogosEmpresa();

  // ── Nivel 1: ✅ COMPLETADO ──────────────────────────────────────────────────
  // await crearCursos();
  // await crearOfertaEncargo();
  // await crearPublicaciones();

  // ── Nivel 2: ✅ COMPLETADO ─────────────────────────────────────────────────
  // await crearTranscripciones();
  // await crearOfertaLaboral();
  // await crearOfertaAsesoria();
  // await crearComentarios();

  // ── Nivel 3: ✅ COMPLETADO ─────────────────────────────────────────────────
  // await crearPublicaciones();
  // await crearSolicitudes();

  // ── Nivel 4: (pendiente) ────────────────────────────────────────────────────
  // await crearPagosYAsesorias();
  // await crearEncargos();

  // ── Vectores: ✅ COMPLETADO ───────────────────────────────────────────────
  // await crearVectorCursos();
  // await crearVectorOfertaLaboral();

  // ── Nivel 5: ✅ COMPLETADO ────────────────────────────────────────────────
  // await crearUsuariosExtra();              // 8 CREATIVO + 12 EMPRESA
  // await completarPerfilesCreativosExtra(); // foto + habilidades + vectoriza (síncrono ahora)
  // await actualizarLogosEmpresaExtra();     // logos en los 12 empresas

  // ── Vector perfil_creativo: ✅ COMPLETADO ─────────────────────────────────
  // await crearVectorPerfilCreativo();

  // ── Perfiles faltantes + vectores oferta_encargo ──────────────────────────
  await recrearPerfilesFaltantes();
  // await limpiarVectorDescripcionLaboral();  // ✅ ya corrió (20 docs actualizados)
  await vectorizarOfertaEncargo();

  await resumenFinal();
}

main().catch(console.error);
