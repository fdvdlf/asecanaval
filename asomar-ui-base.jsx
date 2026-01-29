import React, { useState, useEffect } from 'react';
import { 
  Anchor, 
  User, 
  LogOut, 
  BookOpen, 
  MapPin, 
  Phone, 
  Mail, 
  Edit2, 
  Save, 
  Search, 
  Shield, 
  Menu, 
  X,
  FileText,
  CreditCard,
  PhoneCall,
  Filter,
  RefreshCw,
  PlayCircle,
  CheckCircle,
  ArrowLeft,
  Download,
  Clock,
  Award
} from 'lucide-react';

// --- MOCK DATA (Simulando la Base de Datos) ---
const MOCK_USER = {
  nombres: 'Roberto',
  apellidos: 'Gómez de la Torre',
  cip: '129485',
  dni: '12345678',
  promocion: '1995',
  grado: 'Capitán de Corbeta',
  especialidad: 'Ingeniería de Sistemas',
  situacion: 'Retiro',
  foto: null, 
  forma_aporte: 'Descuento Planilla',
  email: 'roberto.gomez@email.com',
  celular: '998877665',
  telefono_casa: '456-7890',
  direccion: 'Av. La Marina 2505, San Miguel',
  distrito: 'Lima'
};

const MOCK_PADRON = [
  { id: 1, dni: '12345678', cip: '129485', nombre: 'Roberto Gómez', grado: 'Cap. Corbeta', promo: '1995', estado: 'Activo', especialidad: 'Ingeniería' },
  { id: 2, dni: '87654321', cip: '887766', nombre: 'Luis Alarcón', grado: 'Teniente 1ro', promo: '1998', estado: 'Moroso', especialidad: 'Cubierta' },
  { id: 3, dni: '11223344', cip: '554433', nombre: 'Carlos Ferrero', grado: 'Almirante', promo: '1980', estado: 'Activo', especialidad: 'Inteligencia' },
  { id: 4, dni: '55667788', cip: '000001', nombre: 'Miguel Grau (H)', grado: 'Gran Almirante', promo: '1854', estado: 'Honorario', especialidad: 'Comando' },
  { id: 5, dni: '99887766', cip: '223344', nombre: 'Jorge Chávez', grado: 'Teniente 2do', promo: '1995', estado: 'Inactivo', especialidad: 'Aviación' },
];

// --- MOCK DATA CURSOS ---
const COURSES = [
  {
    id: 101,
    title: "Seguridad y Defensa Internacional",
    instructor: "Valm. (r) Juan Pérez",
    duration: "4 Semanas",
    progress: 35,
    // Imagen: Radar moderno / Buque actual
    image: "https://images.unsplash.com/photo-1598335624128-444702958742?q=80&w=800&auto=format&fit=crop", 
    modules: [
      { 
        id: 1, 
        title: "Panorama Geopolítico 2025", 
        duration: "45 min", 
        completed: true,
        description: "En este módulo analizaremos el panorama geopolítico actual, enfocándonos en las tensiones emergentes en la cuenca del Indo-Pacífico y su impacto directo en la seguridad marítima nacional. Se revisarán casos de estudio recientes y proyecciones estratégicas para el quinquenio."
      },
      { id: 2, title: "Amenazas Asimétricas en el Pacífico", duration: "50 min", completed: false, description: "Estudio de las nuevas amenazas no convencionales que afectan la seguridad en la región Asia-Pacífico." },
      { id: 3, title: "Ciberseguridad Naval", duration: "60 min", completed: false, description: "Protocolos de defensa ante ataques cibernéticos a infraestructuras críticas navales." },
      { id: 4, title: "Estrategias de Cooperación Regional", duration: "40 min", completed: false, description: "Mecanismos de integración naval y ejercicios combinados en la región." },
    ]
  },
  {
    id: 102,
    title: "Historia Naval: La Campaña Marítima de 1879",
    instructor: "Historiador Naval Luis Alva",
    duration: "6 Semanas",
    progress: 0,
    // Imagen: Pintura antigua de barco / Monitor Huáscar (simulado con barco de época)
    image: "https://images.unsplash.com/photo-1533602534571-70802c34d402?q=80&w=800&auto=format&fit=crop",
    modules: [
      {
        id: 1,
        title: "Antecedentes y el Poder Naval en 1879",
        duration: "50 min",
        completed: false,
        description: "Análisis comparativo de las escuadras de Perú y Chile al inicio del conflicto. Revisión del Tratado de 1873 y la situación política previa a la declaratoria de guerra. Estado operativo del Monitor Huáscar y la Fragata Independencia."
      },
      {
        id: 2,
        title: "El Combate Naval de Iquique",
        duration: "60 min",
        completed: false,
        description: "Estudio táctico de las maniobras del 21 de mayo de 1879. El hundimiento de la Esmeralda, la pérdida de la Independencia en Punta Gruesa y las consecuencias estratégicas inmediatas para la campaña."
      },
      {
        id: 3,
        title: "Las Correrías del Huáscar",
        duration: "55 min",
        completed: false,
        description: "Los seis meses de jaque a la escuadra chilena. Análisis de la ruptura de bloqueos, capturas de transportes y la estrategia de 'Flota en Potencia' ejecutada por el Gran Almirante Miguel Grau."
      },
      {
        id: 4,
        title: "El Combate de Angamos",
        duration: "70 min",
        completed: false,
        description: "Reconstrucción minuto a minuto del 8 de octubre de 1879. La emboscada envolvente, el sacrificio de la tripulación y el final de la campaña marítima formal. Legado de honor y valores navales."
      },
      {
        id: 5,
        title: "El Bloqueo del Callao y la Defensa de Lima",
        duration: "45 min",
        completed: false,
        description: "La resistencia naval tras la pérdida de los buques capitales. El uso de torpedos, la lancha 'Unión' y el hundimiento final de la escuadra para evitar su captura."
      }
    ]
  },
  {
    id: 103,
    title: "Historia del Terrorismo y Pacificación",
    instructor: "CALM. (r) Miguel Santos",
    duration: "6 Semanas",
    progress: 15,
    // Imagen: Bandera peruana / Desfile militar (patriótico)
    image: "https://images.unsplash.com/photo-1535970793548-5231c5905f15?q=80&w=800&auto=format&fit=crop",
    modules: [
      { 
        id: 1, 
        title: "Orígenes del Terrorismo en el Perú", 
        duration: "45 min", 
        completed: true,
        description: "Análisis profundo de los factores sociopolíticos de los años 70 y 80 que permitieron el surgimiento de organizaciones terroristas como Sendero Luminoso y el MRTA. Revisión de los primeros atentados y la respuesta inicial del Estado ante la agresión terrorista."
      },
      { id: 2, title: "La Marina de Guerra en el Frente Interno", duration: "55 min", completed: false, description: "El despliegue de la Fuerza de Infantería de Marina en Ayacucho y zonas de emergencia. Estrategias de control territorial y relación con la población civil." },
      { id: 3, title: "Evolución Estratégica: Del Control Territorial a la Inteligencia", duration: "60 min", completed: false, description: "Análisis académico de la transformación de la doctrina militar peruana. Estudio comparado de las estrategias de contención inicial versus las operaciones de inteligencia estratégica que permitieron la desarticulación de las cúpulas subversivas." },
      { id: 4, title: "Sociología de la Violencia y Legitimidad del Estado", duration: "50 min", completed: false, description: "Examen crítico de las dinámicas sociales que instrumentalizaron los grupos terroristas. Evaluación académica sobre la legitimidad del uso de la fuerza por parte del Estado, el marco legal de los estados de excepción y la defensa de la democracia." },
      { id: 5, title: "Proceso de Pacificación Nacional", duration: "40 min", completed: false, description: "El declive de las organizaciones terroristas, los comités de autodefensa y la consolidación de la paz. Retos actuales en el VRAEM." },
      { id: 6, title: "La CVR: Análisis Crítico del Informe", duration: "60 min", completed: false, description: "Estudio del informe final de la Comisión de la Verdad y Reconciliación (CVR). Debate sobre la terminología empleada, sesgos ideológicos y el reconocimiento a la labor de las Fuerzas Armadas en la defensa de la democracia." }
    ]
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState('login'); // login, user, admin, classroom, course
  const [user, setUser] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleLogin = (dni, password) => {
    if (dni === 'admin') {
      setCurrentView('admin');
    } else {
      setUser(MOCK_USER);
      setCurrentView('user');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedCourse(null);
    setCurrentView('login');
  };

  const navigateTo = (view, data = null) => {
    if (data) setSelectedCourse(data);
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {currentView === 'login' && <LoginScreen onLogin={handleLogin} />}
      
      {currentView === 'user' && user && (
        <UserDashboard user={user} onLogout={handleLogout} onNavigate={navigateTo} />
      )}
      
      {currentView === 'classroom' && user && (
        <VirtualClassroom user={user} onLogout={handleLogout} onNavigate={navigateTo} />
      )}
      
      {currentView === 'course' && user && selectedCourse && (
        <CoursePlayer user={user} course={selectedCourse} onNavigate={navigateTo} />
      )}

      {currentView === 'admin' && <AdminDashboard onLogout={handleLogout} data={MOCK_PADRON} />}
    </div>
  );
}

// --- PANTALLA DE LOGIN ---
function LoginScreen({ onLogin }) {
  const [dni, setDni] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!dni || !pass) {
      setError('Por favor ingrese su DNI y contraseña');
      return;
    }
    onLogin(dni, pass);
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="md:w-1/2 bg-slate-900 flex flex-col justify-center items-center p-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <Anchor size={80} className="mb-6 text-amber-500" />
        <h1 className="text-4xl font-bold tracking-wider text-center">ASOMAR</h1>
        <p className="mt-4 text-slate-300 text-center max-w-md">Asociación de Ex-Cadetes Navales del Perú.<br /> Plataforma de Gestión Institucional.</p>
        <div className="mt-12 text-sm text-slate-500">Unidos por la Tradición Naval</div>
      </div>
      <div className="md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Bienvenido</h2>
          <p className="text-slate-500 mb-8">Ingrese sus credenciales para acceder.</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">DNI (Usuario)</label>
              <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Ingrese su número de DNI" maxLength={8}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none" placeholder="••••••••"/>
            </div>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">{error}</div>}
            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition shadow-lg">INGRESAR</button>
            <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded border border-blue-100"><span className="font-bold">Demo:</span> Usa DNI "12345678" para Socio, "admin" para Directiva.</div>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- DASHBOARD DEL SOCIO ---
function UserDashboard({ user, onLogout, onNavigate }) {
  const [formData, setFormData] = useState({
    email: user.email,
    celular: user.celular,
    telefono_casa: user.telefono_casa,
    direccion: user.direccion,
    distrito: user.distrito
  });
  const [isEditing, setIsEditing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar user={user} onLogout={onLogout} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Mi Ficha Personal</h1>
          <p className="text-slate-500">Gestione su información y acceda a los servicios institucionales.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            {/* Identity Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                <Shield className="text-slate-500" size={20} />
                <h3 className="font-semibold text-slate-700">Identidad Naval</h3>
              </div>
              <div className="p-6 flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
                  {user.foto ? <img src={user.foto} alt="Foto" className="w-full h-full rounded-full" /> : <User size={48} />}
                </div>
                <h2 className="text-xl font-bold text-center text-slate-900">{user.nombres} {user.apellidos}</h2>
                <span className="inline-block mt-2 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wider">{user.situacion}</span>
                <div className="w-full mt-6 space-y-4">
                  <InfoRow label="CIP" value={user.cip} />
                  <InfoRow label="Promoción" value={user.promocion} />
                  <InfoRow label="Grado" value={user.grado} />
                  <InfoRow label="Especialidad" value={user.especialidad} />
                </div>
              </div>
            </div>

            {/* Acceso Aula Virtual (ACTIVO) */}
            <div 
              onClick={() => onNavigate('classroom')}
              className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl shadow-lg p-6 text-white relative overflow-hidden group cursor-pointer transition transform hover:scale-[1.02] hover:shadow-xl"
            >
              <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12 group-hover:opacity-20 transition">
                 <BookOpen size={120} />
              </div>
              <h3 className="text-lg font-bold flex items-center gap-2 relative z-10">
                <BookOpen size={20} className="text-amber-400"/> AULA VIRTUAL
              </h3>
              <p className="text-slate-300 text-sm mt-2 relative z-10 mb-4">
                Acceda a cursos de capacitación y conferencias grabadas.
              </p>
              <div className="relative z-10 flex items-center justify-between bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10">
                 <div className="text-xs">
                   <span className="block text-amber-400 font-bold">Curso Activo</span>
                   Seguridad Internacional
                 </div>
                 <div className="bg-amber-500 text-slate-900 p-1.5 rounded-full">
                   <PlayCircle size={16} />
                 </div>
              </div>
              <button className="mt-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2 px-4 rounded text-sm w-full transition">
                INGRESAR AL AULA
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText className="text-slate-500" size={20} />
                  <h3 className="font-semibold text-slate-700">Datos de Contacto</h3>
                </div>
                <button 
                  onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                  className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition ${isEditing ? 'bg-green-600 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
                >
                  {isEditing ? <><Save size={16} /> Guardar</> : <><Edit2 size={16} /> Editar Datos</>}
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup icon={<Phone size={18} />} label="Teléfono Celular" name="celular" value={formData.celular} onChange={handleInputChange} disabled={!isEditing} type="tel" />
                  <InputGroup icon={<PhoneCall size={18} />} label="Teléfono Fijo / Casa" name="telefono_casa" value={formData.telefono_casa} onChange={handleInputChange} disabled={!isEditing} type="tel" />
                  <div className="md:col-span-2">
                    <InputGroup icon={<Mail size={18} />} label="Correo Electrónico" name="email" value={formData.email} onChange={handleInputChange} disabled={!isEditing} type="email" />
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-6">
                  <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2"><MapPin size={16} className="text-amber-500" /> Dirección Actual</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <InputGroup label="Dirección / Calle" name="direccion" value={formData.direccion} onChange={handleInputChange} disabled={!isEditing} />
                    </div>
                    <div>
                      <InputGroup label="Distrito" name="distrito" value={formData.distrito} onChange={handleInputChange} disabled={!isEditing} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-6">
               <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><CreditCard size={20} className="text-blue-600" /> Estado de Aportes</h4>
               <p className="text-sm text-blue-800 mb-2">Su estado actual es <span className="font-bold text-green-600">AL DÍA</span>.</p>
               <div className="bg-blue-100/50 p-3 rounded-lg text-sm text-blue-900 flex flex-col sm:flex-row gap-4 mb-2">
                  <div><span className="text-xs text-blue-500 uppercase font-bold block">Modalidad de Aporte</span><span className="font-semibold">{user.forma_aporte}</span></div>
                  <div><span className="text-xs text-blue-500 uppercase font-bold block">Próximo Vencimiento</span><span className="font-semibold">30/11/2025</span></div>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- VISTA AULA VIRTUAL (CATÁLOGO) ---
function VirtualClassroom({ user, onLogout, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} onLogout={onLogout} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      
      <div className="bg-slate-900 text-white py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <button onClick={() => onNavigate('user')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition text-sm font-medium">
            <ArrowLeft size={16} /> Volver al Dashboard
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="text-amber-500" /> Aula Virtual Naval
          </h1>
          <p className="text-slate-300 mt-2 max-w-2xl">
            Plataforma de capacitación continua para asociados. Acceda a cursos de actualización, historia y estrategia.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Clock size={20} className="text-slate-500" /> Mis Cursos
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COURSES.map(course => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition hover:shadow-md">
              <div className="h-40 bg-slate-200 relative">
                <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                {course.progress > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-700">
                    <div className="h-full bg-amber-500" style={{ width: `${course.progress}%` }}></div>
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-2">
                   <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded uppercase tracking-wide">Curso</span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2 leading-tight">{course.title}</h3>
                <p className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                  <User size={14} /> {course.instructor}
                </p>
                
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <Clock size={12} /> {course.duration}
                  </span>
                  <button 
                    onClick={() => onNavigate('course', course)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 
                      ${course.progress > 0 
                        ? 'bg-slate-900 text-white hover:bg-slate-800' 
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    {course.progress > 0 ? 'Continuar' : 'Empezar'}
                    {course.progress > 0 ? <PlayCircle size={16} /> : null}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// --- REPRODUCTOR DEL CURSO ---
function CoursePlayer({ user, course, onNavigate }) {
  const [activeModule, setActiveModule] = useState(course.modules.length > 0 ? course.modules[0] : null);

  // Si el curso no tiene módulos definidos (placeholders)
  if (!activeModule && course.modules.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-md">
          <Clock className="mx-auto text-amber-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Curso en Preparación</h2>
          <p className="text-slate-500 mb-6">El contenido de "{course.title}" estará disponible próximamente.</p>
          <button onClick={() => onNavigate('classroom')} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium">Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col h-screen overflow-hidden">
      {/* Header del Curso */}
      <header className="bg-slate-900 text-white shadow-md z-20 flex-none h-16">
        <div className="max-w-full px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={() => onNavigate('classroom')} className="p-2 hover:bg-slate-800 rounded-full transition text-slate-400 hover:text-white">
               <ArrowLeft size={20} />
             </button>
             <div className="border-l border-slate-700 pl-4">
               <h1 className="text-sm font-bold text-amber-400 uppercase tracking-wider text-xs">Curso</h1>
               <div className="text-base font-bold truncate max-w-xs md:max-w-md">{course.title}</div>
             </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm">
             <div className="flex items-center gap-2">
               <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-green-500" style={{ width: `${course.progress}%` }}></div>
               </div>
               <span className="text-slate-400">{course.progress}%</span>
             </div>
          </div>
        </div>
      </header>

      {/* Cuerpo Principal */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        
        {/* Columna Izquierda: Video y Contenido */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            {/* Reproductor de Video Simulado */}
            <div className="aspect-video bg-black rounded-xl shadow-lg overflow-hidden relative group mb-6">
              {/* Imagen de fondo del video coherente con el curso */}
              <img src={course.image} className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="bg-amber-500 text-slate-900 rounded-full p-4 transform transition group-hover:scale-110 shadow-xl">
                  <PlayCircle size={48} fill="currentColor" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                 <span className="text-white font-bold text-lg">{activeModule.title}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                   <h2 className="text-2xl font-bold text-slate-900">{activeModule.title}</h2>
                   <p className="text-slate-500">Módulo {activeModule.id} • {activeModule.duration}</p>
                </div>
                <button className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-green-200">
                  <CheckCircle size={16} /> Marcar como Visto
                </button>
              </div>
              
              <hr className="border-slate-100 my-4" />
              
              <h3 className="font-bold text-slate-800 mb-2">Descripción</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                {activeModule.description || "La descripción de este módulo estará disponible una vez que el instructor libere el contenido completo."}
              </p>

              <h3 className="font-bold text-slate-800 mb-2">Material Complementario</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-amber-200 transition cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <FileText className="text-red-500" size={20} />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Lectura: Material Académico.pdf</span>
                  </div>
                  <Download size={16} className="text-slate-400 group-hover:text-amber-500" />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-amber-200 transition cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <FileText className="text-blue-500" size={20} />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Diapositivas de la Sesión.pptx</span>
                  </div>
                  <Download size={16} className="text-slate-400 group-hover:text-amber-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Playlist (Sidebar) */}
        <div className="w-full md:w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
             <h3 className="font-bold text-slate-700">Contenido del Curso</h3>
             <div className="text-xs text-slate-500 mt-1">{course.modules.filter(m => m.completed).length} / {course.modules.length} Completados</div>
          </div>
          <div className="overflow-y-auto flex-1">
             {course.modules.map((module) => (
               <div 
                 key={module.id}
                 onClick={() => setActiveModule(module)}
                 className={`p-4 border-b border-slate-100 cursor-pointer transition flex gap-3 hover:bg-slate-50
                   ${activeModule.id === module.id ? 'bg-amber-50 border-l-4 border-l-amber-500' : 'border-l-4 border-l-transparent'}
                 `}
               >
                 <div className="mt-1">
                   {module.completed 
                     ? <CheckCircle size={16} className="text-green-500" /> 
                     : <PlayCircle size={16} className={activeModule.id === module.id ? "text-amber-500" : "text-slate-300"} />
                   }
                 </div>
                 <div>
                   <div className={`text-sm font-medium mb-1 ${activeModule.id === module.id ? 'text-slate-900' : 'text-slate-600'}`}>
                     {module.title}
                   </div>
                   <div className="text-xs text-slate-400 flex items-center gap-1">
                     <Clock size={10} /> {module.duration}
                   </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- NAVBAR COMPONENT ---
function Navbar({ user, onLogout, mobileMenuOpen, setMobileMenuOpen }) {
  return (
    <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Anchor className="text-amber-400" size={24} />
            <span className="font-bold tracking-wide">ASOMAR</span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-slate-300">Hola, {user.grado} {user.apellidos}</span>
            <button onClick={onLogout} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-sm transition">
              <LogOut size={16} /> Salir
            </button>
          </div>
          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-300 hover:text-white">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-800 px-4 pt-2 pb-4 border-t border-slate-700">
          <div className="flex flex-col gap-3">
            <div className="text-sm text-amber-400 font-medium">{user.grado} {user.apellidos}</div>
            <button onClick={onLogout} className="flex items-center gap-2 text-slate-300"><LogOut size={16} /> Cerrar Sesión</button>
          </div>
        </div>
      )}
    </nav>
  );
}

// --- ADMIN DASHBOARD ---
function AdminDashboard({ onLogout, data }) {
  const [filters, setFilters] = useState({ nombre: '', identidad: '', promo: '', estado: '' });
  const estadosDisponibles = ['Activo', 'Moroso', 'Inactivo', 'Honorario'];

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  const clearFilters = () => setFilters({ nombre: '', identidad: '', promo: '', estado: '' });

  const filteredData = data.filter(socio => {
    const matchNombre = socio.nombre.toLowerCase().includes(filters.nombre.toLowerCase());
    const matchIdentidad = socio.dni.includes(filters.identidad) || (socio.cip && socio.cip.includes(filters.identidad));
    const matchPromo = filters.promo === '' || socio.promo.includes(filters.promo);
    const matchEstado = filters.estado === '' || socio.estado === filters.estado;
    return matchNombre && matchIdentidad && matchPromo && matchEstado;
  });

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
           <div className="font-bold tracking-wide flex items-center gap-2"><div className="bg-amber-500 text-slate-900 px-2 py-0.5 rounded text-xs font-bold">ADMIN</div>ASOMAR</div>
           <button onClick={onLogout} className="text-sm text-slate-300 hover:text-white flex gap-2 items-center"><LogOut size={16} /> Salir</button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div><h1 className="text-2xl font-bold text-slate-800">Padrón de Socios</h1><p className="text-slate-500 text-sm">Gestión de asociados y actualización de datos.</p></div>
          <div className="flex gap-2">
             <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm">+ Nuevo Socio</button>
             <button className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm">Exportar Excel</button>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center gap-2 mb-4 text-slate-700 font-semibold border-b border-slate-100 pb-2"><Filter size={18} className="text-amber-500"/> Filtros de Búsqueda</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><label className="block text-xs font-medium text-slate-500 mb-1">Apellidos / Nombres</label><div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={16} /><input type="text" name="nombre" placeholder="Buscar nombre..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={filters.nombre} onChange={handleFilterChange}/></div></div>
            <div><label className="block text-xs font-medium text-slate-500 mb-1">DNI o CIP</label><input type="text" name="identidad" placeholder="Ej. 12345678" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={filters.identidad} onChange={handleFilterChange}/></div>
            <div><label className="block text-xs font-medium text-slate-500 mb-1">Año de Promoción</label><input type="text" name="promo" placeholder="Ej. 1995" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={filters.promo} onChange={handleFilterChange}/></div>
            <div><label className="block text-xs font-medium text-slate-500 mb-1">Estado</label><select name="estado" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none bg-white" value={filters.estado} onChange={handleFilterChange}><option value="">Todos</option>{estadosDisponibles.map(est => (<option key={est} value={est}>{est}</option>))}</select></div>
          </div>
          <div className="mt-4 flex justify-end"><button onClick={clearFilters} className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 transition"><RefreshCw size={12} /> Limpiar Filtros</button></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Socio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Identificación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Naval</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredData.map((socio) => (
                  <tr key={socio.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">{socio.nombre.charAt(0)}</div><div className="ml-4"><div className="text-sm font-medium text-slate-900">{socio.nombre}</div><div className="text-xs text-slate-500">{socio.email || 'Sin correo'}</div></div></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="flex flex-col"><span className="text-xs text-slate-500">DNI: <span className="text-slate-900 font-mono">{socio.dni}</span></span><span className="text-xs text-slate-500">CIP: <span className="text-slate-900 font-mono">{socio.cip}</span></span></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="flex flex-col"><span className="text-sm text-slate-900">{socio.grado}</span><span className="text-xs text-slate-500">Promo: {socio.promo} • {socio.especialidad}</span></div></td>
                    <td className="px-6 py-4 whitespace-nowrap">{socio.estado === 'Activo' ? (<span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">Activo</span>) : socio.estado === 'Moroso' ? (<span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">Moroso</span>) : (<span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800 border border-slate-200">{socio.estado}</span>)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button className="text-indigo-600 hover:text-indigo-900 mr-4 font-semibold text-xs border border-indigo-200 px-3 py-1 rounded hover:bg-indigo-50 transition">Ver Ficha</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length === 0 && <div className="p-12 text-center"><div className="bg-slate-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3"><Search className="text-slate-300" size={32} /></div><h3 className="text-slate-900 font-medium">No se encontraron socios</h3><p className="text-slate-500 text-sm mt-1">Intenta ajustar los filtros de búsqueda.</p><button onClick={clearFilters} className="mt-4 text-amber-600 text-sm font-medium hover:underline">Limpiar todos los filtros</button></div>}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Componentes UI Reutilizables ---
function InfoRow({ label, value }) { return (<div className="flex justify-between border-b border-slate-100 last:border-0 py-2"><span className="text-sm text-slate-500">{label}</span><span className="text-sm font-medium text-slate-800">{value}</span></div>); }
function InputGroup({ label, value, onChange, name, disabled, icon, type = "text" }) { return (<div className="relative"><label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">{label}</label><div className="relative">{icon && (<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">{icon}</div>)}<input type={type} name={name} value={value} onChange={onChange} disabled={disabled} className={`block w-full rounded-lg sm:text-sm transition ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 ${disabled ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed border' : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 border shadow-sm'}`} /></div></div>); }
