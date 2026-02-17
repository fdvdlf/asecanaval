import React, { useState, useEffect, useCallback } from 'react';
import { 
  Anchor, 
  User, 
  Users,
  Globe,
  TrendingUp,
  Briefcase,
  Settings,
  LogOut, 
  Bell,
  BookOpen, 
  MapPin, 
  Phone, 
  Mail, 
  Edit2, 
  Edit,
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
  AlertCircle,
  ArrowLeft,
  Download,
  Clock,
  ChevronDown,
  Award,
  PlusCircle,
  Newspaper
} from 'lucide-react';
import { useAuth } from './auth/AuthContext.jsx';

export default function App() {
  const [currentView, setCurrentView] = useState('login'); // login, user, admin, classroom, course, dues, services
  const [selectedCourse, setSelectedCourse] = useState(null);
  const { user, login, logout, tokens, registerDeviceToken, updateUser } = useAuth();
  const [memberProfile, setMemberProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3100';
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  const handleLogout = useCallback(() => {
    setSelectedCourse(null);
    setCurrentView('login');
    setMemberProfile(null);
    setProfileError('');
    logout();
  }, [logout]);

  const loadProfile = useCallback(async () => {
    if (!tokens?.accessToken) {
      return;
    }

    setProfileLoading(true);
    setProfileError('');
    try {
      const response = await fetch(`${apiUrl}/me`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        setProfileError('No se pudo cargar la ficha del asociado.');
        return;
      }

      const data = await response.json();
      setMemberProfile(data);
    } catch {
      setProfileError('No se pudo cargar la ficha del asociado.');
    } finally {
      setProfileLoading(false);
    }
  }, [apiUrl, tokens?.accessToken, handleLogout]);

  useEffect(() => {
    if (!user) {
      setCurrentView('login');
    } else if (user?.role === 'ADMIN' || user?.role === 'GERENCIA' || user?.role === 'SERVICIOS') {
      setCurrentView('admin');
    } else if (user?.role === 'ASOCIADO') {
      setCurrentView('user');
    } else if (user) {
      setCurrentView('user');
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'ASOCIADO') {
      loadProfile();
    } else {
      setMemberProfile(null);
      setProfileError('');
    }
  }, [user?.role, loadProfile]);

  useEffect(() => {
    if (!user || !tokens?.accessToken) {
      return;
    }

    const fakeToken = `web-demo-${user.dni || user.id || 'user'}`;
    registerDeviceToken?.('web', fakeToken);
  }, [user, tokens?.accessToken, registerDeviceToken]);

  useEffect(() => {
    if (user?.mustChangePassword) {
      setPasswordModalOpen(true);
    } else {
      setPasswordModalOpen(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setPasswordError('');
      setPasswordMessage('');
    }
  }, [user?.mustChangePassword]);

  const handleLogin = async (dni, password) => {
    const authUser = await login(dni, password);
    if (authUser.role === 'ADMIN' || authUser.role === 'GERENCIA' || authUser.role === 'SERVICIOS') {
      setCurrentView('admin');
    } else if (authUser.role === 'ASOCIADO') {
      setCurrentView('user');
    } else {
      setCurrentView('user');
    }
  };

  const navigateTo = (view, data = null) => {
    if (data) setSelectedCourse(data);
    setCurrentView(view);
  };

  const handlePasswordFieldChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    if (!tokens?.accessToken) {
      return;
    }

    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Completa la nueva clave.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('La clave debe tener al menos 6 caracteres.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Las claves no coinciden.');
      return;
    }

    setPasswordSaving(true);
    setPasswordError('');
    setPasswordMessage('');
    try {
      const response = await fetch(`${apiUrl}/auth/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ newPassword: passwordForm.newPassword }),
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        setPasswordError('No se pudo actualizar la clave.');
        return;
      }

      updateUser?.({ mustChangePassword: false });
      setPasswordMessage('Clave actualizada.');
    } catch {
      setPasswordError('No se pudo actualizar la clave.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {currentView === 'login' && <LoginScreen onLogin={handleLogin} />}
      
      {currentView === 'user' && (
        <UserDashboard
          user={memberProfile}
          loading={profileLoading}
          error={profileError}
          onLogout={handleLogout}
          onNavigate={navigateTo}
          onProfileUpdate={setMemberProfile}
        />
      )}
      
      {currentView === 'classroom' && memberProfile && (
        <VirtualClassroom user={memberProfile} onLogout={handleLogout} onNavigate={navigateTo} />
      )}
      
      {currentView === 'course' && memberProfile && selectedCourse && (
        <CoursePlayer user={memberProfile} course={selectedCourse} onNavigate={navigateTo} onLogout={handleLogout} />
      )}

      {currentView === 'dues' && memberProfile && (
        <DuesView user={memberProfile} onLogout={handleLogout} onNavigate={navigateTo} />
      )}

      {currentView === 'services' && memberProfile && (
        <ServicesView user={memberProfile} onLogout={handleLogout} onNavigate={navigateTo} />
      )}

      {currentView === 'admin' && (
        <AdminDashboard
          onLogout={handleLogout}
        />
      )}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="text-sm font-semibold text-slate-900">Configura tu clave</div>
              <div className="text-xs text-slate-500 mt-1">
                Primer ingreso detectado. Ingresa una clave propia para continuar.
              </div>
            </div>
            <form onSubmit={submitPasswordChange} className="p-6 space-y-4">
              {passwordError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                  {passwordError}
                </div>
              )}
              {passwordMessage && (
                <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm border border-green-200">
                  {passwordMessage}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nueva clave</label>
                <input
                  type="password"
                  name="newPassword"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordFieldChange}
                  disabled={passwordSaving}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Confirmar clave</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordFieldChange}
                  disabled={passwordSaving}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 text-white font-semibold py-2 rounded-lg hover:bg-slate-800 transition"
                disabled={passwordSaving}
              >
                {passwordSaving ? 'Guardando...' : 'Guardar clave'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- PANTALLA DE LOGIN ---
function LoginScreen({ onLogin }) {
  const [dni, setDni] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dni) {
      setError('Por favor ingrese su DNI.');
      return;
    }
    try {
      setError('');
      const passwordValue = pass || dni;
      await onLogin(dni, passwordValue);
    } catch (err) {
      setError(err?.message || 'Credenciales invalidas');
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="md:w-1/2 bg-slate-900 flex flex-col justify-center items-center p-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <Anchor size={80} className="mb-6 text-amber-500" />
        <h1 className="text-4xl font-bold tracking-wider text-center">ASECANAVAL</h1>
        <p className="mt-4 text-slate-300 text-center max-w-md">Unidos por la tradición.<br /> Plataforma de Gestión Institucional.</p>
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
              <div className="mt-2 text-xs text-slate-500">Primer ingreso: deja la clave en blanco y usa solo tu DNI.</div>
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
function UserDashboard({ user, loading, error, onLogout, onNavigate, onProfileUpdate }) {
  const { tokens, user: authUser } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3100';
  const [formData, setFormData] = useState({
    email: '',
    celular: '',
    telefono_casa: '',
    direccion: '',
    distrito: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    if (!user) return;
    setFormData({
      email: user.email || '',
      celular: user.celular || '',
      telefono_casa: user.telefono_casa || '',
      direccion: user.direccion || '',
      distrito: user.distrito || ''
    });
  }, [user]);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!tokens?.accessToken || !user) return;
      setSummaryLoading(true);
      setSummaryError('');
      try {
        const response = await fetch(`${apiUrl}/me/dues/summary`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (response.status === 401) {
          onLogout();
          return;
        }

        if (!response.ok) {
          setSummaryError('No se pudo cargar el estado de aportes.');
          return;
        }

        const data = await response.json();
        setSummary(data);
      } catch {
        setSummaryError('No se pudo cargar el estado de aportes.');
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchSummary();
  }, [apiUrl, tokens?.accessToken, user, onLogout]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!tokens?.accessToken || !user) return;
      setAnnouncementsLoading(true);
      setAnnouncementsError('');
      try {
        const response = await fetch(`${apiUrl}/me/announcements`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (response.status === 401) {
          onLogout();
          return;
        }

        if (!response.ok) {
          setAnnouncementsError('No se pudieron cargar los comunicados.');
          return;
        }

        const data = await response.json();
        setAnnouncements(Array.isArray(data.data) ? data.data : []);
      } catch {
        setAnnouncementsError('No se pudieron cargar los comunicados.');
      } finally {
        setAnnouncementsLoading(false);
      }
    };

    fetchAnnouncements();
  }, [apiUrl, tokens?.accessToken, user, onLogout]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (!tokens?.accessToken) {
      onLogout();
      return;
    }

    setIsSaving(true);
    setSaveError('');
    try {
      const response = await fetch(`${apiUrl}/me/contact`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setSaveError('No se pudo guardar los datos.');
        return;
      }

      const updated = await response.json();
      onProfileUpdate?.(updated);
      setFormData({
        email: updated.email || '',
        celular: updated.celular || '',
        telefono_casa: updated.telefono_casa || '',
        direccion: updated.direccion || '',
        distrito: updated.distrito || ''
      });
      setIsEditing(false);
    } catch {
      setSaveError('No se pudo guardar los datos.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 w-full max-w-md animate-pulse">
          <div className="h-4 w-40 bg-slate-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 w-full bg-slate-200 rounded"></div>
            <div className="h-3 w-5/6 bg-slate-200 rounded"></div>
            <div className="h-3 w-4/6 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 w-full max-w-md text-center">
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
            {error || 'No se pudo cargar la ficha del asociado.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar user={user} onLogout={onLogout} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}
        {saveError && (
          <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
            {saveError}
          </div>
        )}
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
                  <InfoRow label="DNI" value={user.dni || authUser?.dni} />
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

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Award className="text-amber-500" size={20} />
                <h3 className="font-semibold text-slate-700">Servicios</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Solicita trámites y servicios institucionales.
              </p>
              <button
                onClick={() => onNavigate('services')}
                className="w-full bg-slate-900 text-white font-bold py-2 px-4 rounded text-sm hover:bg-slate-800 transition"
              >
                VER SERVICIOS
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
                  onClick={handleSave}
                  className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition ${isEditing ? 'bg-green-600 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
                >
                  {isEditing ? <><Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar'}</> : <><Edit2 size={16} /> Editar Datos</>}
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

            <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                <FileText className="text-slate-500" size={20} />
                <h3 className="font-semibold text-slate-700">Comunicados</h3>
              </div>
              <div className="p-6 space-y-3">
                {announcementsError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                    {announcementsError}
                  </div>
                )}
                {announcementsLoading && (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map((row) => (
                      <div key={`announcement-skeleton-${row}`} className="h-4 w-full bg-slate-200 rounded"></div>
                    ))}
                  </div>
                )}
                {!announcementsLoading && announcements.slice(0, 5).map((announcement) => (
                  <button
                    key={announcement.id}
                    onClick={() => setSelectedAnnouncement(announcement)}
                    className="w-full text-left border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition"
                  >
                    <div className="text-sm font-semibold text-slate-900">{announcement.title}</div>
                    <div className="text-xs text-slate-500 mt-1">Publicado: {formatDate(announcement.created_at)}</div>
                  </button>
                ))}
                {!announcementsLoading && announcements.length === 0 && (
                  <div className="text-sm text-slate-500">No hay comunicados disponibles.</div>
                )}
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-6">
               <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><CreditCard size={20} className="text-blue-600" /> Estado de Aportes</h4>
               {summaryError && <div className="bg-red-50 text-red-600 p-2 rounded-md text-xs border border-red-200 mb-2">{summaryError}</div>}
               <p className="text-sm text-blue-800 mb-2">
                 Su estado actual es{' '}
                 <span className={`font-bold ${summary?.status === 'MOROSO' ? 'text-red-600' : 'text-green-600'}`}>
                   {summaryLoading ? '...' : summary?.status === 'MOROSO' ? 'MOROSO' : 'AL DÍA'}
                 </span>.
               </p>
               <div className="bg-blue-100/50 p-3 rounded-lg text-sm text-blue-900 flex flex-col sm:flex-row gap-4 mb-2">
                  <div><span className="text-xs text-blue-500 uppercase font-bold block">Modalidad de Aporte</span><span className="font-semibold">{user.forma_aporte}</span></div>
                  <div><span className="text-xs text-blue-500 uppercase font-bold block">Próximo Vencimiento</span><span className="font-semibold">{summaryLoading ? '...' : formatDate(summary?.nextDueDate)}</span></div>
               </div>
               <button onClick={() => onNavigate('dues')} className="text-xs font-semibold text-blue-700 hover:underline">Ver mis cuotas</button>
            </div>
          </div>
        </div>
      </main>
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-xl w-full">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Comunicado</h3>
              <button onClick={() => setSelectedAnnouncement(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <div className="text-xs text-slate-500 mb-2">Publicado: {formatDate(selectedAnnouncement.created_at)}</div>
              <div className="text-lg font-bold text-slate-900 mb-3">{selectedAnnouncement.title}</div>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {selectedAnnouncement.body}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- VISTA AULA VIRTUAL (CATÁLOGO) ---
function VirtualClassroom({ user, onLogout, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { tokens } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3100';
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState('');
  const [catalogCourses, setCatalogCourses] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  const [enrollmentMessage, setEnrollmentMessage] = useState('');
  const [enrollmentError, setEnrollmentError] = useState('');

  const loadMemberCourses = useCallback(async () => {
    if (!tokens?.accessToken) return;
    setCoursesLoading(true);
    setCoursesError('');
    try {
      const response = await fetch(`${apiUrl}/me/courses`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setCourses([]);
        setCoursesError('No se pudieron cargar los cursos.');
        return;
      }

      const payload = await response.json();
      setCourses(Array.isArray(payload.data) ? payload.data : []);
    } catch {
      setCourses([]);
      setCoursesError('No se pudieron cargar los cursos.');
    } finally {
      setCoursesLoading(false);
    }
  }, [apiUrl, tokens?.accessToken, onLogout]);

  const loadCatalogCourses = useCallback(async () => {
    if (!tokens?.accessToken) return;
    setCatalogLoading(true);
    setCatalogError('');
    try {
      const response = await fetch(`${apiUrl}/me/courses/catalog`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setCatalogCourses([]);
        setCatalogError('No se pudo cargar el catalogo de cursos.');
        return;
      }

      const payload = await response.json();
      setCatalogCourses(Array.isArray(payload.data) ? payload.data : []);
    } catch {
      setCatalogCourses([]);
      setCatalogError('No se pudo cargar el catalogo de cursos.');
    } finally {
      setCatalogLoading(false);
    }
  }, [apiUrl, tokens?.accessToken, onLogout]);

  useEffect(() => {
    loadMemberCourses();
    loadCatalogCourses();
  }, [loadMemberCourses, loadCatalogCourses]);

  const requestEnrollment = async (courseId) => {
    if (!tokens?.accessToken) return;
    setEnrollingCourseId(courseId);
    setEnrollmentMessage('');
    setEnrollmentError('');
    try {
      const response = await fetch(`${apiUrl}/me/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setEnrollmentError('No se pudo enviar la solicitud.');
        return;
      }

      const payload = await response.json();
      const status = payload.status || 'PENDING';
      const enrolled = Boolean(payload.enrolled);
      setCatalogCourses((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? { ...course, enrolled, enrollment_status: status }
            : course,
        ),
      );
      setEnrollmentMessage(
        enrolled ? 'Matrícula aprobada.' : 'Solicitud enviada. Espera la aprobación del administrador.',
      );
      loadMemberCourses();
    } catch {
      setEnrollmentError('No se pudo enviar la solicitud.');
    } finally {
      setEnrollingCourseId(null);
    }
  };

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
        {coursesError && (
          <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
            {coursesError}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coursesLoading && (
            <>
              {[1, 2, 3].map((item) => (
                <div key={`course-skeleton-${item}`} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col animate-pulse">
                  <div className="h-40 bg-slate-200"></div>
                  <div className="p-5 flex-1 space-y-3">
                    <div className="h-4 w-24 bg-slate-200 rounded"></div>
                    <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                    <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
                    <div className="h-8 w-full bg-slate-200 rounded"></div>
                  </div>
                </div>
              ))}
            </>
          )}
          {!coursesLoading && courses.map(course => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition hover:shadow-md">
              <div className="h-40 bg-slate-200 relative">
                <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
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
          {!coursesLoading && courses.length === 0 && (
            <div className="col-span-full bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center text-sm text-slate-500">
              No tienes cursos matriculados.
            </div>
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <BookOpen size={20} className="text-slate-500" /> Catalogo de Cursos
          </h2>
          {enrollmentMessage && (
            <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-md text-sm border border-green-200">
              {enrollmentMessage}
            </div>
          )}
          {enrollmentError && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
              {enrollmentError}
            </div>
          )}
          {catalogError && (
            <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
              {catalogError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogLoading && (
              <>
                {[1, 2, 3].map((item) => (
                  <div key={`catalog-skeleton-${item}`} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col animate-pulse">
                    <div className="h-40 bg-slate-200"></div>
                    <div className="p-5 flex-1 space-y-3">
                      <div className="h-4 w-24 bg-slate-200 rounded"></div>
                      <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                      <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
                      <div className="h-8 w-full bg-slate-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {!catalogLoading && catalogCourses.map((course) => {
              const status = course.enrollment_status || (course.enrolled ? 'APPROVED' : null);
              return (
              <div key={course.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition hover:shadow-md">
                <div className="h-40 bg-slate-200 relative">
                  <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-2">
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded uppercase tracking-wide">Curso</span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2 leading-tight">{course.title}</h3>
                  <p className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                    <User size={14} /> {course.instructor}
                  </p>
                  <div className="text-xs text-slate-400 mb-4">
                    {course.module_count ?? 0} módulos • {course.duration}
                  </div>
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    {status === 'APPROVED' ? (
                      <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                        Matriculado
                      </span>
                    ) : status === 'PENDING' ? (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                        Pendiente
                      </span>
                    ) : status === 'REJECTED' ? (
                      <button
                        onClick={() => requestEnrollment(course.id)}
                        className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
                        disabled={enrollingCourseId === course.id}
                      >
                        {enrollingCourseId === course.id ? 'Solicitando...' : 'Solicitar nuevamente'}
                      </button>
                    ) : (
                      <button
                        onClick={() => requestEnrollment(course.id)}
                        className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
                        disabled={enrollingCourseId === course.id}
                      >
                        {enrollingCourseId === course.id ? 'Solicitando...' : 'Solicitar Matrícula'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
            })}
            {!catalogLoading && catalogCourses.length === 0 && (
              <div className="col-span-full bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center text-sm text-slate-500">
                No hay cursos disponibles.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- REPRODUCTOR DEL CURSO ---
function CoursePlayer({ user, course, onNavigate, onLogout }) {
  const { tokens } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3100';
  const [courseDetail, setCourseDetail] = useState(null);
  const [modules, setModules] = useState([]);
  const [activeModule, setActiveModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState('');
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!tokens?.accessToken) return;
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${apiUrl}/courses/${course.id}`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (response.status === 401) {
          onLogout?.();
          return;
        }

        if (!response.ok) {
          setError('No se pudo cargar el curso.');
          return;
        }

        const payload = await response.json();
        const modulesWithState = (payload.modules || []).map((module) => ({
          ...module,
          completed: false,
        }));
        const progressFromApi = Number.isFinite(course.progress) ? course.progress : null;
        if (progressFromApi !== null && modulesWithState.length > 0) {
          const completedCount = Math.round((progressFromApi / 100) * modulesWithState.length);
          modulesWithState.forEach((module, index) => {
            if (index < completedCount) {
              module.completed = true;
            }
          });
        }
        setCourseDetail(payload);
        setModules(modulesWithState);
        setActiveModule(modulesWithState[0] || null);
      } catch {
        setError('No se pudo cargar el curso.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [apiUrl, course.id, tokens?.accessToken, onLogout]);

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!activeModule || !tokens?.accessToken) return;
      setMaterialsLoading(true);
      setMaterialsError('');
      try {
        const response = await fetch(`${apiUrl}/modules/${activeModule.id}/materials`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (response.status === 401) {
          onLogout?.();
          return;
        }

        if (!response.ok) {
          setMaterials([]);
          setMaterialsError('No se pudieron cargar los materiales.');
          return;
        }

        const payload = await response.json();
        setMaterials(Array.isArray(payload.data) ? payload.data : []);
      } catch {
        setMaterials([]);
        setMaterialsError('No se pudieron cargar los materiales.');
      } finally {
        setMaterialsLoading(false);
      }
    };

    fetchMaterials();
  }, [apiUrl, activeModule, tokens?.accessToken, onLogout]);

  const handleMarkComplete = async () => {
    const targetModule = activeModule || modules[0];
    if (!targetModule || !tokens?.accessToken) return;
    if (targetModule.completed) return;
    setMarkingComplete(true);
    try {
      const response = await fetch(`${apiUrl}/me/modules/${targetModule.id}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        onLogout?.();
        return;
      }

      if (!response.ok) {
        return;
      }

      setModules((prev) =>
        prev.map((module) =>
          module.id === targetModule.id ? { ...module, completed: true } : module,
        ),
      );
      setActiveModule((prev) => (prev ? { ...prev, completed: true } : { ...targetModule, completed: true }));
    } finally {
      setMarkingComplete(false);
    }
  };

  const displayCourse = courseDetail || course;
  const totalModules = modules.length;
  const completedModules = modules.filter((module) => module.completed).length;
  const progressPercent = totalModules ? Math.round((completedModules / totalModules) * 100) : (course.progress || 0);
  const currentModule = activeModule || modules[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-md animate-pulse">
          <div className="h-4 w-40 bg-slate-200 rounded mx-auto mb-4"></div>
          <div className="h-3 w-56 bg-slate-100 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-md">
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200 mb-4">
            {error}
          </div>
          <button onClick={() => onNavigate('classroom')} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium">Volver</button>
        </div>
      </div>
    );
  }

  if (!currentModule && totalModules === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-md">
          <Clock className="mx-auto text-amber-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Curso en Preparación</h2>
          <p className="text-slate-500 mb-6">El contenido de "{displayCourse.title}" estará disponible próximamente.</p>
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
               <div className="text-base font-bold truncate max-w-xs md:max-w-md">{displayCourse.title}</div>
             </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm">
             <div className="flex items-center gap-2">
               <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-green-500" style={{ width: `${progressPercent}%` }}></div>
               </div>
               <span className="text-slate-400">{progressPercent}%</span>
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
              <img src={displayCourse.image_url} className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="bg-amber-500 text-slate-900 rounded-full p-4 transform transition group-hover:scale-110 shadow-xl">
                  <PlayCircle size={48} fill="currentColor" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                 <span className="text-white font-bold text-lg">{currentModule?.title}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                   <h2 className="text-2xl font-bold text-slate-900">{currentModule?.title}</h2>
                   <p className="text-slate-500">Módulo {currentModule?.id} • {currentModule?.duration}</p>
                </div>
                <button
                  onClick={handleMarkComplete}
                  className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-green-200"
                  disabled={markingComplete || currentModule?.completed}
                >
                  <CheckCircle size={16} /> {currentModule?.completed ? 'Visto' : markingComplete ? 'Guardando...' : 'Marcar como Visto'}
                </button>
              </div>
              
              <hr className="border-slate-100 my-4" />
              
              <h3 className="font-bold text-slate-800 mb-2">Descripción</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                {currentModule?.description || "La descripción de este módulo estará disponible una vez que el instructor libere el contenido completo."}
              </p>

              <h3 className="font-bold text-slate-800 mb-2">Material Complementario</h3>
              {materialsError && (
                <div className="bg-red-50 text-red-600 p-2 rounded-md text-xs border border-red-200 mb-2">{materialsError}</div>
              )}
              <div className="space-y-2">
                {materialsLoading && (
                  <>
                    {[1, 2].map((row) => (
                      <div key={`material-skeleton-${row}`} className="p-3 bg-slate-50 rounded-lg border border-slate-100 animate-pulse">
                        <div className="h-3 w-40 bg-slate-200 rounded"></div>
                      </div>
                    ))}
                  </>
                )}
                {!materialsLoading && materials.map((material) => {
                  const isPdf = material.type?.toLowerCase() === 'pdf';
                  const fileUrl = material.file_url?.startsWith('http') ? material.file_url : `${apiUrl}${material.file_url}`;
                  return (
                    <a
                      key={material.id}
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-amber-200 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className={isPdf ? 'text-red-500' : 'text-blue-500'} size={20} />
                        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{material.title}</span>
                      </div>
                      <Download size={16} className="text-slate-400 group-hover:text-amber-500" />
                    </a>
                  );
                })}
                {!materialsLoading && materials.length === 0 && (
                  <div className="text-sm text-slate-500">No hay materiales disponibles.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Playlist (Sidebar) */}
        <div className="w-full md:w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
             <h3 className="font-bold text-slate-700">Contenido del Curso</h3>
             <div className="text-xs text-slate-500 mt-1">{completedModules} / {totalModules} Completados</div>
          </div>
          <div className="overflow-y-auto flex-1">
             {modules.map((module) => {
               const isActive = currentModule?.id === module.id;
               return (
               <div 
                 key={module.id}
                 onClick={() => setActiveModule(module)}
                 className={`p-4 border-b border-slate-100 cursor-pointer transition flex gap-3 hover:bg-slate-50
                   ${isActive ? 'bg-amber-50 border-l-4 border-l-amber-500' : 'border-l-4 border-l-transparent'}
                 `}
               >
                 <div className="mt-1">
                   {module.completed 
                     ? <CheckCircle size={16} className="text-green-500" /> 
                     : <PlayCircle size={16} className={isActive ? "text-amber-500" : "text-slate-300"} />
                   }
                 </div>
                 <div>
                   <div className={`text-sm font-medium mb-1 ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                     {module.title}
                   </div>
                   <div className="text-xs text-slate-400 flex items-center gap-1">
                     <Clock size={10} /> {module.duration}
                   </div>
                 </div>
               </div>
             )})}
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
            <span className="font-bold tracking-wide">ASECANAVAL</span>
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
function AdminDashboard({ onLogout }) {
  const { tokens, user } = useAuth();
  const [view, setView] = useState(() => (user?.role === 'SERVICIOS' ? 'servicios' : 'dashboard'));
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [selectedSocio, setSelectedSocio] = useState(null);
  const [padronSearch, setPadronSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState('');
  const [adminUserRoleDrafts, setAdminUserRoleDrafts] = useState({});
  const [adminUserRoleSavingId, setAdminUserRoleSavingId] = useState(null);
  const [adminUserRoleMessage, setAdminUserRoleMessage] = useState('');
  const [usersRefreshKey, setUsersRefreshKey] = useState(0);
  const [createUserForm, setCreateUserForm] = useState({ dni: '', role: 'SERVICIOS' });
  const [createUserSaving, setCreateUserSaving] = useState(false);
  const [createUserError, setCreateUserError] = useState('');
  const [createUserMessage, setCreateUserMessage] = useState('');
  const [filters, setFilters] = useState({
    nombre: '',
    identidad: '',
    promo: '',
    estado: '',
    distrito: '',
    grado: '',
    situacion: '',
    especialidad: '',
  });
  const estadosDisponibles = ['Activo', 'Moroso', 'Inactivo'];
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3100';
  const canManageRequests = user?.role === 'ADMIN' || user?.role === 'GERENCIA' || user?.role === 'SERVICIOS';
  const canManageUsers = user?.role === 'ADMIN';
  const isServicesOnly = user?.role === 'SERVICIOS';
  const canAccessClassroomAdmin = user?.role === 'ADMIN' || user?.role === 'GERENCIA';
  const requestStatuses = ['RECIBIDO', 'EN_REVISION', 'OBSERVADO', 'APROBADO', 'RECHAZADO', 'FINALIZADO'];
  const [serviceFilters, setServiceFilters] = useState({ serviceId: '', status: '' });
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState('');
  const [exportingMembers, setExportingMembers] = useState(false);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState('');
  const [serviceSummary, setServiceSummary] = useState(null);
  const [serviceSummaryLoading, setServiceSummaryLoading] = useState(false);
  const [serviceSummaryError, setServiceSummaryError] = useState('');
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentRequestsLoading, setRecentRequestsLoading] = useState(false);
  const [recentRequestsError, setRecentRequestsError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestForm, setRequestForm] = useState({ status: '', notesAdmin: '', scheduledAt: '' });
  const [requestSaving, setRequestSaving] = useState(false);
  const [requestSaveError, setRequestSaveError] = useState('');
  const [requestSaveMessage, setRequestSaveMessage] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState('');
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    body: '',
    segmentType: 'ALL',
    segmentValue: '',
  });
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [announcementSaveError, setAnnouncementSaveError] = useState('');
  const [announcementSaveMessage, setAnnouncementSaveMessage] = useState('');
  const emptyMemberForm = {
    dni: '',
    cip: '',
    nombres: '',
    apellidos: '',
    promocion: '',
    grado: '',
    especialidad: '',
    situacion: '',
    forma_aporte: '',
    email: '',
    celular: '',
    telefono_casa: '',
    direccion: '',
    distrito: '',
    estado: 'Activo',
    foto_url: '',
  };
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberModalMode, setMemberModalMode] = useState('view'); // view, edit, create
  const [memberForm, setMemberForm] = useState(emptyMemberForm);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState('');
const [memberSaving, setMemberSaving] = useState(false);
  const [memberSaveMessage, setMemberSaveMessage] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [sectionsOpen, setSectionsOpen] = useState({
    classroom: false,
    announcements: false,
    services: false,
  });
  const [memberSummary, setMemberSummary] = useState(null);
  const [memberSummaryLoading, setMemberSummaryLoading] = useState(false);
  const [memberSummaryError, setMemberSummaryError] = useState('');
  const [classroomSummary, setClassroomSummary] = useState(null);
  const [classroomSummaryLoading, setClassroomSummaryLoading] = useState(false);
  const [classroomSummaryError, setClassroomSummaryError] = useState('');
  const emptyCourseForm = {
    title: '',
    instructor: '',
    duration: '',
    image_url: '',
  };
  const emptyModuleForm = {
    title: '',
    duration: '',
    description: '',
    order: '',
  };
  const emptyMaterialForm = {
    id: null,
    title: '',
    file_url: '',
    type: 'PDF',
  };
  const [classroomCourses, setClassroomCourses] = useState([]);
  const [classroomLoading, setClassroomLoading] = useState(false);
  const [classroomError, setClassroomError] = useState('');
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [courseModalMode, setCourseModalMode] = useState('create');
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [courseSaving, setCourseSaving] = useState(false);
  const [courseSaveError, setCourseSaveError] = useState('');
  const [courseSaveMessage, setCourseSaveMessage] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [courseDetail, setCourseDetail] = useState(null);
  const [courseDetailLoading, setCourseDetailLoading] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [enrollmentsError, setEnrollmentsError] = useState('');
  const [enrollmentDni, setEnrollmentDni] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentUpdatingId, setEnrollmentUpdatingId] = useState(null);
  const [moduleForm, setModuleForm] = useState(emptyModuleForm);
  const [moduleMode, setModuleMode] = useState('create');
  const [moduleSaving, setModuleSaving] = useState(false);
  const [moduleSaveError, setModuleSaveError] = useState('');
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [materialForm, setMaterialForm] = useState(emptyMaterialForm);
  const [materialMode, setMaterialMode] = useState('create');
  const [materialSaving, setMaterialSaving] = useState(false);
  const [materialSaveError, setMaterialSaveError] = useState('');
  const [materialUploading, setMaterialUploading] = useState(false);
  const [materialUploadError, setMaterialUploadError] = useState('');

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  const clearFilters = () => setFilters({
    nombre: '',
    identidad: '',
    promo: '',
    estado: '',
    distrito: '',
    grado: '',
    situacion: '',
    especialidad: '',
  });
  const toggleSection = (key) => {
    setSectionsOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleServiceFilterChange = (e) => {
    const { name, value } = e.target;
    setServiceFilters(prev => ({ ...prev, [name]: value }));
  };
  const clearServiceFilters = () => setServiceFilters({ serviceId: '', status: '' });

  const statusFilterMap = {
    Pendiente: 'RECIBIDO',
    'En trámite': 'EN_REVISION',
    Finalizado: 'FINALIZADO',
  };

  useEffect(() => {
    const mappedStatus = statusFilterMap[filterStatus] || '';
    setServiceFilters((prev) => ({
      ...prev,
      status: mappedStatus,
    }));
  }, [filterStatus]);

  const handleAnnouncementFormChange = (e) => {
    const { name, value } = e.target;
    setAnnouncementForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'segmentType' && value === 'ALL') {
        next.segmentValue = '';
      }
      return next;
    });
  };

  const toMemberForm = (member) => ({
    dni: member?.dni || '',
    cip: member?.cip || '',
    nombres: member?.nombres || '',
    apellidos: member?.apellidos || '',
    promocion: member?.promocion || member?.promo || '',
    grado: member?.grado || '',
    especialidad: member?.especialidad || '',
    situacion: member?.situacion || '',
    forma_aporte: member?.forma_aporte || '',
    email: member?.email || '',
    celular: member?.celular || '',
    telefono_casa: member?.telefono_casa || '',
    direccion: member?.direccion || '',
    distrito: member?.distrito || '',
    estado: member?.estado || 'Activo',
    foto_url: member?.foto_url || '',
  });

  const toMemberListItem = (member) => {
    const nombre = member?.nombre || `${member?.nombres || ''} ${member?.apellidos || ''}`.trim();
    return {
      id: member?.id,
      dni: member?.dni,
      cip: member?.cip || null,
      nombre: nombre || 'Sin nombre',
      grado: member?.grado || '',
      promo: member?.promocion || member?.promo || '',
      estado: member?.estado || '',
      especialidad: member?.especialidad || '',
      email: member?.email || null,
    };
  };

  const toSocioDetail = (member) => ({
    id: member?.id,
    dni: member?.dni || '',
    cip: member?.cip || '',
    nombre: member?.nombre || `${member?.nombres || ''} ${member?.apellidos || ''}`.trim(),
    grado: member?.grado || '',
    promo: member?.promocion || member?.promo || '',
    especialidad: member?.especialidad || '',
    estado: member?.estado || '',
    email: member?.email || '',
    celular: member?.celular || member?.telefono_casa || '',
    direccion: member?.direccion || '',
  });

  const toUiStatus = (status) => {
    switch (status) {
      case 'RECIBIDO':
        return 'Pendiente';
      case 'EN_REVISION':
        return 'En trámite';
      case 'OBSERVADO':
        return 'Observado';
      case 'APROBADO':
        return 'Aprobado';
      case 'RECHAZADO':
        return 'Rechazado';
      case 'FINALIZADO':
        return 'Finalizado';
      default:
        return status || 'Pendiente';
    }
  };

  const resetMemberModal = () => {
    setMemberError('');
    setMemberSaveMessage('');
    setMemberLoading(false);
    setMemberSaving(false);
  };

  const openCreateMember = () => {
    resetMemberModal();
    setSelectedMemberId(null);
    setMemberForm(emptyMemberForm);
    setMemberModalMode('create');
    setMemberModalOpen(true);
  };

  const openSocioDetails = async (memberId) => {
    if (!tokens?.accessToken) {
      return;
    }

    const preview = members.find((member) => member.id === memberId);
    if (preview) {
      setSelectedSocio(toSocioDetail(preview));
    }

    setMemberLoading(true);
    try {
      const response = await fetch(`${apiUrl}/admin/members/${memberId}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      setSelectedSocio(toSocioDetail(payload));
    } finally {
      setMemberLoading(false);
    }
  };

  const openMemberDetails = async (memberId) => {
    if (!tokens?.accessToken) {
      return;
    }

    resetMemberModal();
    setSelectedMemberId(memberId);
    setMemberModalMode('view');
    setMemberModalOpen(true);
    setMemberLoading(true);
    try {
      const response = await fetch(`${apiUrl}/admin/members/${memberId}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setMemberError('No se pudo cargar la ficha del socio.');
        return;
      }

      const payload = await response.json();
      setMemberForm(toMemberForm(payload));
    } catch {
      setMemberError('No se pudo cargar la ficha del socio.');
    } finally {
      setMemberLoading(false);
    }
  };

  const openMemberEdit = async (memberId) => {
    await openMemberDetails(memberId);
    setMemberModalMode('edit');
  };

  const closeMemberModal = () => {
    setMemberModalOpen(false);
    setMemberModalMode('view');
    setSelectedMemberId(null);
    setMemberForm(emptyMemberForm);
    resetMemberModal();
  };

  const handleMemberFormChange = (e) => {
    const { name, value } = e.target;
    setMemberForm((prev) => ({ ...prev, [name]: value }));
  };

  const startEditMember = () => {
    setMemberSaveMessage('');
    setMemberError('');
    setMemberModalMode('edit');
  };

  const saveMember = async () => {
    if (!tokens?.accessToken) {
      return;
    }

    const requiredFields = [
      'dni',
      'nombres',
      'apellidos',
      'promocion',
      'grado',
      'especialidad',
      'situacion',
      'forma_aporte',
      'estado',
    ];

    const missing = requiredFields.find((field) => !memberForm[field]?.toString().trim());
    if (missing) {
      setMemberError('Completa los campos obligatorios.');
      return;
    }

    const toOptional = (value) => {
      const trimmed = value?.toString().trim();
      return trimmed ? trimmed : null;
    };

    const payload = {
      dni: memberForm.dni.trim(),
      cip: toOptional(memberForm.cip),
      nombres: memberForm.nombres.trim(),
      apellidos: memberForm.apellidos.trim(),
      promocion: memberForm.promocion.trim(),
      grado: memberForm.grado.trim(),
      especialidad: memberForm.especialidad.trim(),
      situacion: memberForm.situacion.trim(),
      forma_aporte: memberForm.forma_aporte.trim(),
      email: toOptional(memberForm.email),
      celular: toOptional(memberForm.celular),
      telefono_casa: toOptional(memberForm.telefono_casa),
      direccion: toOptional(memberForm.direccion),
      distrito: toOptional(memberForm.distrito),
      estado: memberForm.estado,
      foto_url: toOptional(memberForm.foto_url),
    };

    setMemberSaving(true);
    setMemberError('');
    setMemberSaveMessage('');

    try {
      const isCreate = memberModalMode === 'create';
      const targetId = selectedMemberId;
      const response = await fetch(
        isCreate ? `${apiUrl}/admin/members` : `${apiUrl}/admin/members/${targetId}`,
        {
          method: isCreate ? 'POST' : 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setMemberError('No se pudo guardar el socio.');
        return;
      }

      const saved = await response.json();
      const listItem = toMemberListItem(saved);
      setMembers((prev) => {
        if (isCreate) {
          return [listItem, ...prev];
        }
        return prev.map((item) => (item.id === listItem.id ? { ...item, ...listItem } : item));
      });
      setMemberForm(toMemberForm(saved));
      setMemberModalMode('view');
      setSelectedMemberId(saved.id);
      setMemberSaveMessage(isCreate ? 'Socio creado correctamente.' : 'Socio actualizado.');
    } catch {
      setMemberError('No se pudo guardar el socio.');
    } finally {
      setMemberSaving(false);
    }
  };

  const handleCourseFormChange = (e) => {
    const { name, value } = e.target;
    setCourseForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleModuleFormChange = (e) => {
    const { name, value } = e.target;
    setModuleForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMaterialFormChange = (e) => {
    const { name, value } = e.target;
    setMaterialForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetCourseModalState = () => {
    setCourseSaveError('');
    setCourseSaveMessage('');
    setCourseSaving(false);
    setCourseDetail(null);
    setCourseDetailLoading(false);
    setEnrollments([]);
    setEnrollmentsLoading(false);
    setEnrollmentsError('');
    setEnrollmentDni('');
    setEnrolling(false);
    setEnrollmentUpdatingId(null);
    setModuleForm(emptyModuleForm);
    setModuleMode('create');
    setModuleSaveError('');
    setModuleSaving(false);
    setActiveModuleId(null);
    setMaterialForm(emptyMaterialForm);
    setMaterialMode('create');
    setMaterialSaveError('');
    setMaterialSaving(false);
    setMaterialUploading(false);
    setMaterialUploadError('');
  };

  const openCreateCourse = () => {
    resetCourseModalState();
    setSelectedCourseId(null);
    setCourseModalMode('create');
    setCourseForm(emptyCourseForm);
    setCourseModalOpen(true);
  };

  const loadCourseDetail = async (courseId) => {
    if (!tokens?.accessToken) {
      return;
    }

    setCourseDetailLoading(true);
    setCourseSaveError('');
    try {
      const response = await fetch(`${apiUrl}/admin/classroom/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setCourseSaveError('No se pudo cargar el curso.');
        return;
      }

      const payload = await response.json();
      setCourseDetail(payload);
      setCourseForm({
        title: payload.title || '',
        instructor: payload.instructor || '',
        duration: payload.duration || '',
        image_url: payload.image_url || '',
      });
      setSelectedCourseId(payload.id);
    } catch {
      setCourseSaveError('No se pudo cargar el curso.');
    } finally {
      setCourseDetailLoading(false);
    }
  };

  const loadEnrollments = async (courseId) => {
    if (!tokens?.accessToken) {
      return;
    }

    setEnrollmentsLoading(true);
    setEnrollmentsError('');
    try {
      const response = await fetch(`${apiUrl}/admin/classroom/courses/${courseId}/enrollments`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setEnrollments([]);
        setEnrollmentsError('No se pudieron cargar las matrículas.');
        return;
      }

      const payload = await response.json();
      setEnrollments(Array.isArray(payload.data) ? payload.data : []);
    } catch {
      setEnrollments([]);
      setEnrollmentsError('No se pudieron cargar las matrículas.');
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  const openEditCourse = async (courseId) => {
    resetCourseModalState();
    setCourseModalMode('edit');
    setCourseModalOpen(true);
    await loadCourseDetail(courseId);
    await loadEnrollments(courseId);
  };

  const closeCourseModal = () => {
    setCourseModalOpen(false);
    setCourseModalMode('create');
    setCourseForm(emptyCourseForm);
    setSelectedCourseId(null);
    resetCourseModalState();
  };

  const addEnrollment = async () => {
    if (!tokens?.accessToken || !selectedCourseId) {
      return;
    }

    const dniValue = enrollmentDni.trim();
    if (!dniValue) {
      setEnrollmentsError('Ingresa el DNI del socio.');
      return;
    }

    setEnrolling(true);
    setEnrollmentsError('');
    try {
      const response = await fetch(`${apiUrl}/admin/classroom/courses/${selectedCourseId}/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ dni: dniValue }),
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setEnrollmentsError('No se pudo registrar la matricula.');
        return;
      }

      const saved = await response.json();
      setEnrollments((prev) => {
        const exists = prev.some((item) => item.id === saved.id);
        return exists ? prev : [saved, ...prev];
      });
      setEnrollmentDni('');
    } catch {
      setEnrollmentsError('No se pudo registrar la matricula.');
    } finally {
      setEnrolling(false);
    }
  };

  const updateEnrollmentStatus = async (enrollmentId, status) => {
    if (!tokens?.accessToken) {
      return;
    }

    setEnrollmentUpdatingId(enrollmentId);
    setEnrollmentsError('');
    try {
      const response = await fetch(`${apiUrl}/admin/classroom/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setEnrollmentsError('No se pudo actualizar la matricula.');
        return;
      }

      const updated = await response.json();
      setEnrollments((prev) =>
        prev.map((item) => (item.id === updated.id ? { ...item, status: updated.status } : item)),
      );
    } catch {
      setEnrollmentsError('No se pudo actualizar la matricula.');
    } finally {
      setEnrollmentUpdatingId(null);
    }
  };

  const saveCourse = async () => {
    if (!tokens?.accessToken) {
      return;
    }

    if (!courseForm.title.trim() || !courseForm.instructor.trim() || !courseForm.duration.trim() || !courseForm.image_url.trim()) {
      setCourseSaveError('Completa los campos obligatorios.');
      return;
    }

    setCourseSaving(true);
    setCourseSaveError('');
    setCourseSaveMessage('');

    try {
      const isCreate = courseModalMode === 'create';
      const targetId = selectedCourseId;
      const response = await fetch(
        isCreate ? `${apiUrl}/admin/classroom/courses` : `${apiUrl}/admin/classroom/courses/${targetId}`,
        {
          method: isCreate ? 'POST' : 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({
            title: courseForm.title.trim(),
            instructor: courseForm.instructor.trim(),
            duration: courseForm.duration.trim(),
            image_url: courseForm.image_url.trim(),
          }),
        },
      );

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setCourseSaveError('No se pudo guardar el curso.');
        return;
      }

      const saved = await response.json();
      setClassroomCourses((prev) => {
        if (isCreate) {
          return [
            {
              id: saved.id,
              title: saved.title,
              instructor: saved.instructor,
              duration: saved.duration,
              image_url: saved.image_url,
              module_count: 0,
            },
            ...prev,
          ];
        }
        return prev.map((course) =>
          course.id === saved.id
            ? {
                ...course,
                title: saved.title,
                instructor: saved.instructor,
                duration: saved.duration,
                image_url: saved.image_url,
              }
            : course,
        );
      });

      setCourseDetail((prev) => {
        if (prev && prev.id === saved.id) {
          return { ...prev, ...saved };
        }
        if (isCreate) {
          return { ...saved, modules: [] };
        }
        return prev;
      });
      setSelectedCourseId(saved.id);
      setCourseModalMode('edit');
      setCourseSaveMessage(isCreate ? 'Curso creado.' : 'Curso actualizado.');
    } catch {
      setCourseSaveError('No se pudo guardar el curso.');
    } finally {
      setCourseSaving(false);
    }
  };

  const startCreateModule = () => {
    setModuleMode('create');
    setModuleForm(emptyModuleForm);
    setModuleSaveError('');
    setActiveModuleId(null);
    setMaterialForm(emptyMaterialForm);
    setMaterialMode('create');
    setMaterialSaveError('');
  };

  const startEditModule = (module) => {
    setModuleMode('edit');
    setModuleForm({
      title: module?.title || '',
      duration: module?.duration || '',
      description: module?.description || '',
      order: module?.order ?? '',
    });
    setActiveModuleId(module?.id || null);
    setModuleSaveError('');
  };

  const saveModule = async () => {
    if (!tokens?.accessToken || !selectedCourseId) {
      return;
    }

    if (!moduleForm.title.trim() || !moduleForm.duration.trim() || !moduleForm.description.trim()) {
      setModuleSaveError('Completa los campos del modulo.');
      return;
    }

    setModuleSaving(true);
    setModuleSaveError('');

    try {
      const isCreate = moduleMode === 'create';
      const targetId = activeModuleId;
      if (!isCreate && !targetId) {
        setModuleSaveError('Selecciona un modulo para editar.');
        return;
      }
      const payload = {
        title: moduleForm.title.trim(),
        duration: moduleForm.duration.trim(),
        description: moduleForm.description.trim(),
      };
      const orderValue = moduleForm.order?.toString().trim();
      if (orderValue) {
        const orderNumber = Number(orderValue);
        if (!Number.isNaN(orderNumber)) {
          payload.order = orderNumber;
        }
      }

      const response = await fetch(
        isCreate
          ? `${apiUrl}/admin/classroom/courses/${selectedCourseId}/modules`
          : `${apiUrl}/admin/classroom/modules/${targetId}`,
        {
          method: isCreate ? 'POST' : 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setModuleSaveError('No se pudo guardar el modulo.');
        return;
      }

      const saved = await response.json();
      setCourseDetail((prev) => {
        if (!prev) return prev;
        const modules = prev.modules || [];
        const nextModules = isCreate
          ? [...modules, { ...saved, materials: [] }]
          : modules.map((item) => (item.id === saved.id ? { ...item, ...saved } : item));
        nextModules.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        return { ...prev, modules: nextModules };
      });

      if (isCreate) {
        setClassroomCourses((prev) =>
          prev.map((course) =>
            course.id === selectedCourseId
              ? { ...course, module_count: (course.module_count || 0) + 1 }
              : course,
          ),
        );
      }

      setModuleMode('create');
      setModuleForm(emptyModuleForm);
    } catch {
      setModuleSaveError('No se pudo guardar el modulo.');
    } finally {
      setModuleSaving(false);
    }
  };

  const applyMaterialUpdate = (saved, isCreate, moduleId) => {
    setCourseDetail((prev) => {
      if (!prev) return prev;
      const nextModules = (prev.modules || []).map((module) => {
        if (module.id !== moduleId) {
          return module;
        }
        const materials = module.materials || [];
        const nextMaterials = isCreate
          ? [...materials, saved]
          : materials.map((item) => (item.id === saved.id ? { ...item, ...saved } : item));
        return { ...module, materials: nextMaterials };
      });
      return { ...prev, modules: nextModules };
    });
  };

  const deriveMaterialType = (mimeType) => {
    if (!mimeType) return '';
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    if (mimeType.startsWith('image/')) return 'IMAGEN';
    if (mimeType.includes('presentation')) return 'PPT';
    if (mimeType.includes('word')) return 'DOC';
    return 'ARCHIVO';
  };

  const startCreateMaterial = (moduleId) => {
    setActiveModuleId(moduleId);
    setMaterialMode('create');
    setMaterialForm(emptyMaterialForm);
    setMaterialSaveError('');
    setMaterialUploadError('');
  };

  const startEditMaterial = (material, moduleId) => {
    setActiveModuleId(moduleId);
    setMaterialMode('edit');
    setMaterialForm({
      id: material?.id ?? null,
      title: material?.title || '',
      file_url: material?.file_url || '',
      type: material?.type || 'PDF',
    });
    setMaterialSaveError('');
    setMaterialUploadError('');
  };

  const saveMaterial = async () => {
    if (!tokens?.accessToken || !activeModuleId) {
      return;
    }

    if (!materialForm.title.trim() || !materialForm.file_url.trim() || !materialForm.type.trim()) {
      setMaterialSaveError('Completa los campos del material.');
      return;
    }

    setMaterialSaving(true);
    setMaterialSaveError('');

    try {
      const isCreate = materialMode === 'create';
      const targetId = materialForm.id;
      if (!isCreate && !targetId) {
        setMaterialSaveError('Selecciona un material para editar.');
        return;
      }
      const response = await fetch(
        isCreate
          ? `${apiUrl}/admin/classroom/modules/${activeModuleId}/materials`
          : `${apiUrl}/admin/classroom/materials/${targetId}`,
        {
          method: isCreate ? 'POST' : 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({
            title: materialForm.title.trim(),
            file_url: materialForm.file_url.trim(),
            type: materialForm.type.trim(),
          }),
        },
      );

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setMaterialSaveError('No se pudo guardar el material.');
        return;
      }

      const saved = await response.json();
      applyMaterialUpdate(saved, isCreate, activeModuleId);

      setMaterialMode('create');
      setMaterialForm(emptyMaterialForm);
    } catch {
      setMaterialSaveError('No se pudo guardar el material.');
    } finally {
      setMaterialSaving(false);
    }
  };

  const uploadMaterialFile = async (file) => {
    if (!file || !tokens?.accessToken || !activeModuleId) {
      return;
    }

    setMaterialUploading(true);
    setMaterialUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (materialForm.title.trim()) {
        formData.append('title', materialForm.title.trim());
      }
      const fallbackType = deriveMaterialType(file.type);
      const explicitType = materialForm.type.trim();
      const typeValue = explicitType && explicitType !== 'PDF' ? explicitType : (fallbackType || explicitType);
      if (typeValue) {
        formData.append('type', typeValue);
      }

      const response = await fetch(`${apiUrl}/admin/classroom/modules/${activeModuleId}/materials/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setMaterialUploadError('No se pudo subir el archivo.');
        return;
      }

      const saved = await response.json();
      applyMaterialUpdate(saved, true, activeModuleId);
      setMaterialMode('create');
      setMaterialForm(emptyMaterialForm);
    } catch {
      setMaterialUploadError('No se pudo subir el archivo.');
    } finally {
      setMaterialUploading(false);
    }
  };

  useEffect(() => {
    const fetchMembers = async () => {
      if (!tokens?.accessToken || !canManageUsers) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (filters.nombre) params.set('nombre', filters.nombre);
      if (filters.identidad) params.set('identidad', filters.identidad);
      if (filters.promo) params.set('promo', filters.promo);
      if (filters.estado) params.set('estado', filters.estado);
      if (filters.distrito) params.set('distrito', filters.distrito);
      if (filters.grado) params.set('grado', filters.grado);
      if (filters.situacion) params.set('situacion', filters.situacion);
      if (filters.especialidad) params.set('especialidad', filters.especialidad);
      if (padronSearch.trim()) params.set('search', padronSearch.trim());
      if (padronSearch.trim()) params.set('search', padronSearch.trim());
      params.set('page', '1');
      params.set('limit', '50');

      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/admin/members?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (response.status === 401) {
          onLogout();
          return;
        }

        if (!response.ok) {
          setMembers([]);
          return;
        }

        const payload = await response.json();
        setMembers(Array.isArray(payload.data) ? payload.data : []);
      } catch {
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [filters, padronSearch, tokens?.accessToken, apiUrl, onLogout, canManageUsers]);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!tokens?.accessToken || !canManageUsers) {
        setMemberSummary(null);
        setMemberSummaryLoading(false);
        return;
      }

      setMemberSummaryLoading(true);
      setMemberSummaryError('');
      try {
        const response = await fetch(`${apiUrl}/admin/members/summary`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (response.status === 401) {
          onLogout();
          return;
        }

        if (!response.ok) {
          setMemberSummaryError('No se pudo cargar el resumen.');
          setMemberSummary(null);
          return;
        }

        const payload = await response.json();
        setMemberSummary(payload);
      } catch {
        setMemberSummaryError('No se pudo cargar el resumen.');
        setMemberSummary(null);
      } finally {
        setMemberSummaryLoading(false);
      }
    };

    fetchSummary();
  }, [apiUrl, tokens?.accessToken, onLogout, canManageUsers]);

  useEffect(() => {
    const fetchServiceSummary = async () => {
      if (!canManageRequests || !tokens?.accessToken) {
        return;
      }

      setServiceSummaryLoading(true);
      setServiceSummaryError('');
      try {
        const response = await fetch(`${apiUrl}/admin/service-requests/summary`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (response.status === 401) {
          onLogout();
          return;
        }

        if (!response.ok) {
          setServiceSummaryError('No se pudo cargar el resumen de solicitudes.');
          setServiceSummary(null);
          return;
        }

        const payload = await response.json();
        setServiceSummary(payload);
      } catch {
        setServiceSummaryError('No se pudo cargar el resumen de solicitudes.');
        setServiceSummary(null);
      } finally {
        setServiceSummaryLoading(false);
      }
    };

    fetchServiceSummary();
  }, [apiUrl, canManageRequests, tokens?.accessToken, onLogout]);

  useEffect(() => {
    const fetchRecentRequests = async () => {
      if (!canManageRequests || !tokens?.accessToken) {
        return;
      }

      setRecentRequestsLoading(true);
      setRecentRequestsError('');
      try {
        const params = new URLSearchParams();
        params.set('limit', '5');
        const response = await fetch(`${apiUrl}/admin/service-requests?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (response.status === 401) {
          onLogout();
          return;
        }

        if (!response.ok) {
          setRecentRequests([]);
          setRecentRequestsError('No se pudo cargar la actividad reciente.');
          return;
        }

        const payload = await response.json();
        setRecentRequests(Array.isArray(payload.data) ? payload.data : []);
      } catch {
        setRecentRequests([]);
        setRecentRequestsError('No se pudo cargar la actividad reciente.');
      } finally {
        setRecentRequestsLoading(false);
      }
    };

    fetchRecentRequests();
  }, [apiUrl, canManageRequests, tokens?.accessToken, onLogout]);

  useEffect(() => {
    const fetchClassroomSummary = async () => {
      if (!tokens?.accessToken || !canAccessClassroomAdmin) {
        setClassroomSummary(null);
        setClassroomSummaryLoading(false);
        return;
      }

      setClassroomSummaryLoading(true);
      setClassroomSummaryError('');
      try {
        const response = await fetch(`${apiUrl}/admin/classroom/summary`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (response.status === 401) {
          onLogout();
          return;
        }

        if (!response.ok) {
          setClassroomSummary(null);
          setClassroomSummaryError('No se pudo cargar el resumen del aula virtual.');
          return;
        }

        const payload = await response.json();
        setClassroomSummary(payload);
      } catch {
        setClassroomSummary(null);
        setClassroomSummaryError('No se pudo cargar el resumen del aula virtual.');
      } finally {
        setClassroomSummaryLoading(false);
      }
    };

    fetchClassroomSummary();
  }, [apiUrl, tokens?.accessToken, onLogout, canAccessClassroomAdmin]);

  useEffect(() => {
    const fetchAdminCourses = async () => {
      if (!tokens?.accessToken || !canAccessClassroomAdmin) {
        setClassroomCourses([]);
        setClassroomLoading(false);
        return;
      }

      setClassroomLoading(true);
      setClassroomError('');
      try {
        const response = await fetch(`${apiUrl}/admin/classroom/courses`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (response.status === 401) {
          onLogout();
          return;
        }

        if (!response.ok) {
          setClassroomCourses([]);
          setClassroomError('No se pudieron cargar los cursos.');
          return;
        }

        const payload = await response.json();
        setClassroomCourses(Array.isArray(payload.data) ? payload.data : []);
      } catch {
        setClassroomCourses([]);
        setClassroomError('No se pudieron cargar los cursos.');
      } finally {
        setClassroomLoading(false);
      }
    };

    fetchAdminCourses();
  }, [apiUrl, tokens?.accessToken, onLogout, canAccessClassroomAdmin]);

  useEffect(() => {
    if (!tokens?.accessToken || view !== 'config' || !canManageUsers) {
      return;
    }

    const controller = new AbortController();
    const fetchAdminUsers = async () => {
      setAdminUsersLoading(true);
      setAdminUsersError('');
      setAdminUserRoleMessage('');
      try {
        const params = new URLSearchParams();
        if (userSearch.trim()) params.set('search', userSearch.trim());
        if (roleFilter) params.set('role', roleFilter);

        const response = await fetch(`${apiUrl}/admin/users?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          signal: controller.signal,
        });

        if (response.status === 401) {
          onLogout();
          return;
        }

        if (!response.ok) {
          setAdminUsers([]);
          setAdminUsersError('No se pudieron cargar los usuarios.');
          return;
        }

        const payload = await response.json();
        setAdminUsers(Array.isArray(payload.data) ? payload.data : []);
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }
        setAdminUsers([]);
        setAdminUsersError('No se pudieron cargar los usuarios.');
      } finally {
        setAdminUsersLoading(false);
      }
    };

    fetchAdminUsers();
    return () => controller.abort();
  }, [apiUrl, canManageUsers, onLogout, roleFilter, tokens?.accessToken, userSearch, view, usersRefreshKey]);

  useEffect(() => {
    const nextDrafts = {};
    adminUsers.forEach((adminUser) => {
      nextDrafts[adminUser.id] = adminUser.role;
    });
    setAdminUserRoleDrafts(nextDrafts);
  }, [adminUsers]);

  const exportMembers = async () => {
    if (!tokens?.accessToken) {
      return;
    }

    const params = new URLSearchParams();
    if (filters.nombre) params.set('nombre', filters.nombre);
    if (filters.identidad) params.set('identidad', filters.identidad);
    if (filters.promo) params.set('promo', filters.promo);
    if (filters.estado) params.set('estado', filters.estado);
    if (filters.distrito) params.set('distrito', filters.distrito);
    if (filters.grado) params.set('grado', filters.grado);
    if (filters.situacion) params.set('situacion', filters.situacion);
    if (filters.especialidad) params.set('especialidad', filters.especialidad);

    setExportingMembers(true);
    try {
      const response = await fetch(`${apiUrl}/admin/members/export?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'padron.csv';
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } finally {
      setExportingMembers(false);
    }
  };

  const updateUserRole = async (userId) => {
    if (!tokens?.accessToken) {
      return;
    }

    const target = adminUsers.find((item) => item.id === userId);
    if (!target) {
      return;
    }

    const nextRole = adminUserRoleDrafts[userId];
    if (!nextRole || nextRole === target.role) {
      return;
    }

    setAdminUserRoleSavingId(userId);
    setAdminUsersError('');
    setAdminUserRoleMessage('');

    try {
      const response = await fetch(`${apiUrl}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ role: nextRole }),
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setAdminUsersError('No se pudo actualizar el rol.');
        return;
      }

      const updated = await response.json();
      setAdminUsers((prev) =>
        prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
      );
      setAdminUserRoleMessage('Rol actualizado.');
    } catch {
      setAdminUsersError('No se pudo actualizar el rol.');
    } finally {
      setAdminUserRoleSavingId(null);
    }
  };

  const handleCreateUserChange = (event) => {
    const { name, value } = event.target;
    setCreateUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const createAdminUser = async () => {
    if (!tokens?.accessToken || !canManageUsers) {
      return;
    }

    const dniValue = createUserForm.dni.trim();
    if (!dniValue) {
      setCreateUserError('Ingresa el DNI del usuario.');
      return;
    }

    setCreateUserSaving(true);
    setCreateUserError('');
    setCreateUserMessage('');
    try {
      const response = await fetch(`${apiUrl}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ dni: dniValue, role: createUserForm.role }),
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setCreateUserError('No se pudo crear el usuario.');
        return;
      }

      setCreateUserMessage('Usuario creado o actualizado.');
      setCreateUserForm({ dni: '', role: 'SERVICIOS' });
      setUsersRefreshKey((prev) => prev + 1);
    } catch {
      setCreateUserError('No se pudo crear el usuario.');
    } finally {
      setCreateUserSaving(false);
    }
  };

  useEffect(() => {
    const fetchServices = async () => {
      if (!canManageRequests || !tokens?.accessToken) {
        return;
      }

      setServicesLoading(true);
      setServicesError('');
      try {
        const response = await fetch(`${apiUrl}/services`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (response.status === 401) {
          onLogout();
          return;
        }

        if (!response.ok) {
          setServices([]);
          return;
        }

        const payload = await response.json();
        setServices(Array.isArray(payload.data) ? payload.data : []);
      } catch {
        setServices([]);
        setServicesError('No se pudieron cargar los servicios.');
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServices();
  }, [apiUrl, canManageRequests, tokens?.accessToken, onLogout]);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!canManageRequests || !tokens?.accessToken) {
        return;
      }

      const params = new URLSearchParams();
      if (serviceFilters.status) params.set('status', serviceFilters.status);
      if (serviceFilters.serviceId) params.set('serviceId', serviceFilters.serviceId);

      setRequestsLoading(true);
      setRequestsError('');
      try {
        const response = await fetch(`${apiUrl}/admin/service-requests?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (response.status === 401) {
          onLogout();
          return;
        }

        if (!response.ok) {
          setServiceRequests([]);
          return;
        }

        const payload = await response.json();
        setServiceRequests(Array.isArray(payload.data) ? payload.data : []);
      } catch {
        setServiceRequests([]);
        setRequestsError('No se pudieron cargar las solicitudes.');
      } finally {
        setRequestsLoading(false);
      }
    };

    fetchRequests();
  }, [apiUrl, canManageRequests, serviceFilters, tokens?.accessToken, onLogout]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!canManageRequests || !tokens?.accessToken) {
        return;
      }

      setAnnouncementsLoading(true);
      setAnnouncementsError('');
      try {
        const response = await fetch(`${apiUrl}/admin/announcements`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (response.status === 401) {
          onLogout();
          return;
        }

        if (!response.ok) {
          setAnnouncements([]);
          setAnnouncementsError('No se pudieron cargar los comunicados.');
          return;
        }

        const payload = await response.json();
        setAnnouncements(Array.isArray(payload.data) ? payload.data : []);
      } catch {
        setAnnouncements([]);
        setAnnouncementsError('No se pudieron cargar los comunicados.');
      } finally {
        setAnnouncementsLoading(false);
      }
    };

    fetchAnnouncements();
  }, [apiUrl, canManageRequests, tokens?.accessToken, onLogout]);

  const createAnnouncement = async () => {
    if (!tokens?.accessToken) {
      return;
    }

    if (announcementForm.segmentType !== 'ALL' && !announcementForm.segmentValue.trim()) {
      setAnnouncementSaveError('Ingrese el valor del segmento.');
      return;
    }

    setAnnouncementSaving(true);
    setAnnouncementSaveError('');
    setAnnouncementSaveMessage('');
    try {
      const payload = {
        title: announcementForm.title,
        body: announcementForm.body,
        segmentType: announcementForm.segmentType,
      };
      if (announcementForm.segmentType !== 'ALL' && announcementForm.segmentValue) {
        payload.segmentValue = announcementForm.segmentValue;
      }

      const response = await fetch(`${apiUrl}/admin/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setAnnouncementSaveError('No se pudo publicar el comunicado.');
        return;
      }

      const created = await response.json();
      setAnnouncements(prev => [created, ...prev]);
      setAnnouncementSaveMessage('Comunicado publicado.');
      setAnnouncementForm({ title: '', body: '', segmentType: 'ALL', segmentValue: '' });
    } catch {
      setAnnouncementSaveError('No se pudo publicar el comunicado.');
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const serviceOptions = services.length > 0
    ? services
    : Array.from(
        new Map(
          serviceRequests.map((request) => [request.serviceId, { id: request.serviceId, name: request.serviceName }]),
        ).values(),
      );

  const openRequest = (request) => {
    setSelectedRequest(request);
    setRequestForm({
      status: request.status || '',
      notesAdmin: request.notes_admin || '',
      scheduledAt: request.scheduled_at ? toDateTimeInputValue(request.scheduled_at) : '',
    });
    setRequestSaveError('');
    setRequestSaveMessage('');
  };

  const handleRequestFormChange = (e) => {
    const { name, value } = e.target;
    setRequestForm(prev => ({ ...prev, [name]: value }));
  };

  const saveRequest = async () => {
    if (!selectedRequest || !tokens?.accessToken) {
      return;
    }

    const previousStatus = selectedRequest.status;
    setRequestSaving(true);
    setRequestSaveError('');
    setRequestSaveMessage('');
    try {
      const payload = {
        status: requestForm.status,
        notesAdmin: requestForm.notesAdmin ?? '',
      };
      if (requestForm.scheduledAt) {
        payload.scheduledAt = new Date(requestForm.scheduledAt).toISOString();
      }

      const response = await fetch(`${apiUrl}/admin/service-requests/${selectedRequest.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setRequestSaveError('No se pudieron guardar los cambios.');
        return;
      }

      const updated = await response.json();
      setServiceRequests((prev) =>
        prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
      );
      setSelectedRequest((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
      setRecentRequests((prev) =>
        prev.map((item) => (item.id === updated.id ? { ...item, status: updated.status, scheduled_at: updated.scheduled_at, notes_admin: updated.notes_admin } : item)),
      );
      setServiceSummary((prev) => {
        if (!prev) return prev;
        if (previousStatus === 'RECIBIDO' && updated.status !== 'RECIBIDO') {
          return { ...prev, pending: Math.max((prev.pending ?? 0) - 1, 0) };
        }
        if (previousStatus !== 'RECIBIDO' && updated.status === 'RECIBIDO') {
          return { ...prev, pending: (prev.pending ?? 0) + 1 };
        }
        return prev;
      });
      setRequestSaveMessage('Solicitud actualizada.');
    } catch {
      setRequestSaveError('No se pudieron guardar los cambios.');
    } finally {
      setRequestSaving(false);
    }
  };

  const isMemberReadOnly = memberModalMode === 'view' || memberLoading;
  const isDniLocked = memberModalMode !== 'create' || memberLoading;
  const memberDisplayName = `${memberForm.nombres} ${memberForm.apellidos}`.trim();
  const activeModule = courseDetail?.modules?.find((module) => module.id === activeModuleId) || null;
  const enrollmentBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return { label: 'Aprobado', className: 'bg-green-100 text-green-800 border-green-200' };
      case 'PENDING':
        return { label: 'Pendiente', className: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'REJECTED':
        return { label: 'Rechazado', className: 'bg-red-100 text-red-800 border-red-200' };
      default:
        return { label: status || 'Estado', className: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const roleOptions = ['ADMIN', 'GERENCIA', 'TESORERIA', 'SERVICIOS', 'ASOCIADO'];
  const roleLabels = {
    ADMIN: 'Administrador',
    GERENCIA: 'Gerencia',
    TESORERIA: 'Tesorería',
    SERVICIOS: 'Servicios',
    ASOCIADO: 'Asociado',
  };

  const roleLabel = (role) => roleLabels[role] || role;

  const totalSocios = memberSummary?.total ?? members.length;
  const activosSocios = memberSummary?.activos ?? members.filter((member) => member.estado === 'Activo').length;
  const morososSocios = memberSummary?.morosos ?? members.filter((member) => member.estado === 'Moroso').length;
  const solicitudesPendientes = serviceSummary?.pending ?? 0;
  const activosPercent = totalSocios ? Math.round((activosSocios / totalSocios) * 100) : 0;
  const classroomCoursesCount = classroomSummary?.courses ?? classroomCourses.length;
  const classroomEnrollmentCount = classroomSummary?.enrollments ?? 0;
  const activityRequests = recentRequests.slice(0, 3);

  useEffect(() => {
    if (isServicesOnly && view !== 'servicios') {
      setView('servicios');
    }
  }, [isServicesOnly, view]);
  const serviceList = serviceRequests;

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col shadow-2xl z-20">
        <div className="h-20 flex items-center px-6 border-b border-slate-800 font-bold text-white tracking-wider gap-3">
          <div className="bg-amber-500 p-1.5 rounded"><Anchor className="text-slate-900" size={20} /></div>
          <span>ASECANAVAL</span>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto flex-1">
          <div className="text-xs font-bold text-slate-500 uppercase px-3 py-2 mt-2 tracking-wider">Principal</div>
          {!isServicesOnly && (
            <SidebarItem icon={<TrendingUp size={18} />} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          )}
          {!isServicesOnly && (
            <SidebarItem icon={<Users size={18} />} label="Padrón de Socios" active={view === 'padron'} onClick={() => setView('padron')} />
          )}
          {!isServicesOnly && (
            <SidebarItem
              icon={<Newspaper size={18} />}
              label="Actualidad Internacional"
              active={view === 'news'}
              onClick={() => setView('news')}
            />
          )}
          {canManageRequests && (
            <SidebarItem
              icon={<Briefcase size={18} />}
              label="Solicitudes"
              active={view === 'servicios'}
              onClick={() => setView('servicios')}
              badge={solicitudesPendientes}
            />
          )}
          {!isServicesOnly && (
            <>
              <div className="text-xs font-bold text-slate-500 uppercase px-3 py-2 mt-6 tracking-wider">Educación</div>
              <button
                onClick={() => setView('classroom')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition group ${
                  view === 'classroom' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BookOpen size={18} className="group-hover:text-amber-400 transition-colors" /> Aula Virtual
              </button>
            </>
          )}
          {!isServicesOnly && canManageUsers && (
            <>
              <div className="text-xs font-bold text-slate-500 uppercase px-3 py-2 mt-6 tracking-wider">Sistema</div>
              <SidebarItem
                icon={<Settings size={18} />}
                label="Configuración"
                active={view === 'config'}
                onClick={() => setView('config')}
              />
            </>
          )}
        </div>
        <div className="p-4 border-t border-slate-800">
          <button className="w-full flex items-center gap-2 text-slate-400 hover:text-white transition text-sm px-2" onClick={onLogout}>
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 shadow-sm z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {view === 'dashboard' && 'Panel de Control'}
              {view === 'padron' && 'Padrón de Socios'}
              {view === 'servicios' && 'Centro de Servicios'}
              {view === 'classroom' && 'Aula Virtual'}
              {view === 'news' && 'Actualidad Internacional'}
              {view === 'config' && 'Configuración'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Bienvenido al sistema de gestión ASECANAVAL</p>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-slate-600 transition">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-slate-900">Admin. General</div>
                <div className="text-xs text-slate-500">Secretaria</div>
              </div>
              <div className="h-10 w-10 bg-slate-900 rounded-full flex items-center justify-center font-bold text-amber-500 shadow-md">AG</div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-100 p-8">
          {view === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-8">
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Métricas Clave</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Total Socios"
                    value={memberSummaryLoading ? '...' : totalSocios}
                    icon={<Users size={24} className="text-blue-600" />}
                    color="bg-blue-50"
                  />
                  <StatCard
                    title="Socios Activos"
                    value={memberSummaryLoading ? '...' : activosSocios}
                    subtext={`${activosPercent}% del padrón`}
                    icon={<CheckCircle size={24} className="text-green-600" />}
                    color="bg-green-50"
                  />
                  <StatCard
                    title="En Mora"
                    value={memberSummaryLoading ? '...' : morososSocios}
                    subtext="Acción requerida"
                    icon={<AlertCircle size={24} className="text-red-600" />}
                    color="bg-red-50"
                  />
                  {canManageRequests && (
                    <StatCard
                      title="Solicitudes"
                      value={serviceSummaryLoading ? '...' : solicitudesPendientes}
                      subtext="Pendientes de revisión"
                      icon={<Briefcase size={24} className="text-amber-600" />}
                      color="bg-amber-50"
                    />
                  )}
                </div>
                {classroomSummaryError && (
                  <div className="mt-4 text-sm text-red-600">{classroomSummaryError}</div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
                  <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Clock size={18} className="text-slate-400" /> Actividad Reciente
                    </h3>
                    {canManageRequests && (
                      <button onClick={() => setView('servicios')} className="text-xs font-bold text-blue-600 hover:underline">Ver Todo</button>
                    )}
                  </div>
                  <div className="p-6 space-y-6">
                    {recentRequestsLoading && (
                      <div className="text-sm text-slate-400">Cargando actividad...</div>
                    )}
                    {!recentRequestsLoading && activityRequests.length === 0 && (
                      <div className="text-sm text-slate-400">No hay actividad reciente.</div>
                    )}
                    {!recentRequestsLoading && activityRequests.map((request) => {
                      const statusLabel = toUiStatus(request.status);
                      const isPending = statusLabel === 'Pendiente';
                      const detail = request.notes_member || request.notes_admin || 'Solicitud';
                      return (
                        <div key={request.id} className="flex items-start gap-4">
                          <div className={`mt-1 p-2 rounded-full ${isPending ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                            {isPending ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <p className="text-sm font-bold text-slate-900">{request.serviceName}</p>
                              <span className="text-xs text-slate-400">{formatDate(request.requested_at)}</span>
                            </div>
                            <p className="text-sm text-slate-600 mt-0.5">Solicitud de {request.nombre} - {detail}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg text-white p-6 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <BookOpen size={140} />
                  </div>

                  <div>
                    <div className="bg-white/10 w-fit px-3 py-1 rounded-full text-xs font-bold mb-4 backdrop-blur-sm border border-white/10">Aula Virtual</div>
                    <h3 className="text-2xl font-bold mb-1">Estado Académico</h3>
                    <p className="text-slate-400 text-sm">Resumen del periodo actual</p>
                  </div>

                  <div className="mt-8 space-y-4 relative z-10">
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                      <span className="text-sm text-slate-300">Cursos Activos</span>
                      <span className="font-bold text-xl">{classroomSummaryLoading ? '...' : classroomCoursesCount}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                      <span className="text-sm text-slate-300">Alumnos Inscritos</span>
                      <span className="font-bold text-xl">{classroomSummaryLoading ? '...' : classroomEnrollmentCount}</span>
                    </div>
                    <button onClick={() => setView('classroom')} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2 rounded-lg mt-2 transition shadow-lg">
                      Administrar Aula
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'padron' && (
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              <div className="bg-white p-4 rounded-t-xl border border-slate-200 border-b-0 flex justify-between items-center shadow-sm z-10">
                <div className="relative w-72">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar por Nombre, DNI o CIP..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none transition"
                    value={padronSearch}
                    onChange={(e) => setPadronSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                    onClick={exportMembers}
                    disabled={exportingMembers}
                  >
                    <Download size={16} /> {exportingMembers ? 'Exportando...' : 'Exportar'}
                  </button>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 shadow-md transition transform active:scale-95"
                    onClick={openCreateMember}
                  >
                    <PlusCircle size={16} /> Nuevo Socio
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 border-t-0 px-5 py-4">
                <div className="flex items-center gap-2 text-slate-700 font-semibold mb-4">
                  <Filter size={18} className="text-amber-500" /> Filtros rápidos
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Apellidos / Nombres</label>
                    <input
                      type="text"
                      name="nombre"
                      placeholder="Buscar nombre..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={filters.nombre}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">DNI o CIP</label>
                    <input
                      type="text"
                      name="identidad"
                      placeholder="Ej. 12345678"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={filters.identidad}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Año de Promoción</label>
                    <input
                      type="text"
                      name="promo"
                      placeholder="Ej. 1995"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={filters.promo}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Estado</label>
                    <select
                      name="estado"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none bg-white"
                      value={filters.estado}
                      onChange={handleFilterChange}
                    >
                      <option value="">Todos</option>
                      {estadosDisponibles.map((estado) => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Distrito</label>
                    <input
                      type="text"
                      name="distrito"
                      placeholder="Ej. Lima"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={filters.distrito}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Grado</label>
                    <input
                      type="text"
                      name="grado"
                      placeholder="Ej. Capitán"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={filters.grado}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Situación</label>
                    <input
                      type="text"
                      name="situacion"
                      placeholder="Ej. Retiro"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={filters.situacion}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Especialidad</label>
                    <input
                      type="text"
                      name="especialidad"
                      placeholder="Ej. Sistemas"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={filters.especialidad}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 transition"
                  >
                    <RefreshCw size={12} /> Limpiar filtros
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-b-xl flex-1 overflow-hidden shadow-sm">
                <div className="overflow-auto h-full">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Socio</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Identificación</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Datos Navales</th>
                        <th className="px-6 py-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {!loading && members.map((socio) => (
                        <tr
                          key={socio.id}
                          onClick={() => openSocioDetails(socio.id)}
                          className="hover:bg-blue-50/50 transition group cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm border border-slate-200 group-hover:border-blue-200 group-hover:bg-white transition">
                                {(socio.nombre || '?').charAt(0)}
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition">{socio.nombre}</p>
                                <p className="text-xs text-slate-500">{socio.email || 'Sin correo'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-slate-700 bg-slate-100 px-1.5 rounded w-fit text-xs">DNI: {socio.dni}</span>
                              <span className="font-mono text-slate-500 text-xs px-1.5">CIP: {socio.cip || '--'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={socio.estado} />
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            <div className="font-medium text-slate-800">{socio.grado}</div>
                            <div className="text-xs text-slate-400">Promo {socio.promo}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              className="text-slate-300 group-hover:text-blue-600 p-2 rounded-full hover:bg-blue-100 transition"
                              onClick={(event) => {
                                event.stopPropagation();
                                openSocioDetails(socio.id);
                              }}
                            >
                              <FileText size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!loading && members.length === 0 && (
                    <div className="p-12 text-center text-slate-400">No se encontraron socios.</div>
                  )}
                  {loading && (
                    <div className="p-12 text-center text-slate-400">Cargando socios...</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {view === 'news' && (
            <NewsSection apiUrl={apiUrl} tokens={tokens} onLogout={onLogout} />
          )}

          {view === 'servicios' && canManageRequests && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex gap-2 bg-slate-50/50 justify-between items-center">
                  <div className="flex gap-2">
                    {['Todos', 'Pendiente', 'En trámite', 'Finalizado'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${filterStatus === status ? 'bg-slate-800 text-white shadow' : 'text-slate-500 bg-white border border-slate-200 hover:bg-slate-100'}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                  <button className="text-slate-400 hover:text-slate-600"><Download size={18} /></button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Solicitud</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Socio</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Estado</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {!requestsLoading && serviceList.map((request) => {
                        const detail = request.notes_member || request.notes_admin || 'Solicitud';
                        return (
                          <tr key={request.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800">{request.serviceName}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{detail} • {formatDate(request.requested_at)}</div>
                              {request.scheduled_at && (
                                <div className="text-xs text-slate-500">Programado: {formatDateTime(request.scheduled_at)}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                              {request.nombre}
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={toUiStatus(request.status)} />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => openRequest(request)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-bold border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg transition hover:bg-blue-100"
                              >
                                Gestionar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {!requestsLoading && serviceList.length === 0 && (
                    <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                      <Briefcase size={32} className="mb-2 opacity-20" />
                      No hay solicitudes con este filtro.
                    </div>
                  )}
                  {requestsLoading && (
                    <div className="p-12 text-center text-slate-400">Cargando solicitudes...</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {view === 'classroom' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <BookOpen size={20} className="text-amber-500" /> Aula Virtual
                  </h3>
                  <p className="text-sm text-slate-500">
                    Administra cursos, módulos, materiales y matrículas de los asociados.
                  </p>
                </div>
                <button
                  onClick={openCreateCourse}
                  className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition shadow-sm"
                >
                  <PlusCircle size={16} /> Nuevo curso
                </button>
              </div>

              {classroomError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                  {classroomError}
                </div>
              )}

              {classroomLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((skeleton) => (
                    <div key={`classroom-skeleton-${skeleton}`} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="h-40 bg-slate-100 animate-pulse"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse"></div>
                        <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse"></div>
                        <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!classroomLoading && classroomCourses.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
                  No hay cursos registrados aún.
                </div>
              )}

              {!classroomLoading && classroomCourses.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classroomCourses.map((course) => (
                    <div key={course.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="h-40 bg-slate-100 relative overflow-hidden">
                        {course.image_url ? (
                          <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <BookOpen size={36} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                        <div className="absolute bottom-3 left-4 right-4">
                          <div className="text-xs uppercase tracking-wider text-amber-400 font-bold">Curso</div>
                          <div className="text-white font-semibold leading-tight">{course.title}</div>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col gap-3">
                        <div className="text-sm text-slate-600">
                          <span className="font-semibold text-slate-800">{course.instructor || 'Sin instructor'}</span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <Clock size={14} /> {course.duration || 'Duración no definida'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {course.module_count ?? 0} módulos registrados
                        </div>
                        <div className="mt-auto flex justify-end">
                          <button
                            onClick={() => openEditCourse(course.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-bold border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg transition hover:bg-blue-100"
                          >
                            Gestionar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'config' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Users size={20} className="text-amber-500" /> Usuarios y roles
                  </h3>
                  <p className="text-sm text-slate-500">
                    Administra los permisos de acceso al panel.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Buscar por DNI o nombre..."
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      disabled={!canManageUsers}
                    />
                  </div>
                  <select
                    className="w-full sm:w-52 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none bg-white"
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                    disabled={!canManageUsers}
                  >
                    <option value="">Todos los roles</option>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {roleLabel(role)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {canManageUsers && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">Crear usuario</div>
                      <div className="text-xs text-slate-500">Define el acceso inicial y el rol del usuario.</div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      <input
                        type="text"
                        name="dni"
                        placeholder="DNI del usuario"
                        className="w-full sm:w-48 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                        value={createUserForm.dni}
                        onChange={handleCreateUserChange}
                        maxLength={12}
                      />
                      <select
                        name="role"
                        className="w-full sm:w-48 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none bg-white"
                        value={createUserForm.role}
                        onChange={handleCreateUserChange}
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {roleLabel(role)}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={createAdminUser}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition"
                        disabled={createUserSaving}
                      >
                        {createUserSaving ? 'Guardando...' : 'Crear'}
                      </button>
                    </div>
                  </div>
                  {createUserError && (
                    <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                      {createUserError}
                    </div>
                  )}
                  {createUserMessage && (
                    <div className="mt-4 bg-green-50 text-green-700 p-3 rounded-md text-sm border border-green-200">
                      {createUserMessage}
                    </div>
                  )}
                </div>
              )}

              {!canManageUsers && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-sm text-slate-500">
                  No tienes permisos para administrar usuarios.
                </div>
              )}

              {canManageUsers && adminUsersError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                  {adminUsersError}
                </div>
              )}

              {canManageUsers && adminUserRoleMessage && (
                <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm border border-green-200">
                  {adminUserRoleMessage}
                </div>
              )}

              {canManageUsers && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Usuario</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Contacto</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Rol</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {adminUsersLoading && (
                          <tr>
                            <td colSpan={4} className="px-6 py-6 text-center text-sm text-slate-500">
                              Cargando usuarios...
                            </td>
                          </tr>
                        )}
                        {!adminUsersLoading && adminUsers.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-6 text-center text-sm text-slate-500">
                              No se encontraron usuarios.
                            </td>
                          </tr>
                        )}
                        {!adminUsersLoading && adminUsers.map((adminUser) => {
                          const draftRole = adminUserRoleDrafts[adminUser.id] ?? adminUser.role;
                          const hasChanges = draftRole !== adminUser.role;
                          return (
                            <tr key={adminUser.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4">
                                <div className="text-sm font-semibold text-slate-900">
                                  {adminUser.nombres || adminUser.apellidos
                                    ? `${adminUser.nombres} ${adminUser.apellidos}`.trim()
                                    : 'Sin ficha registrada'}
                                </div>
                                <div className="text-xs text-slate-500">DNI {adminUser.dni}</div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">
                                {adminUser.email || 'Sin correo'}
                              </td>
                              <td className="px-6 py-4">
                                <select
                                  className="w-full max-w-[200px] px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none bg-white"
                                  value={draftRole}
                                  onChange={(event) =>
                                    setAdminUserRoleDrafts((prev) => ({
                                      ...prev,
                                      [adminUser.id]: event.target.value,
                                    }))
                                  }
                                >
                                  {roleOptions.map((role) => (
                                    <option key={role} value={role}>
                                      {roleLabel(role)}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => updateUserRole(adminUser.id)}
                                  disabled={!hasChanges || adminUserRoleSavingId === adminUser.id}
                                  className={`text-xs font-bold border px-3 py-1.5 rounded-lg transition ${
                                    hasChanges
                                      ? 'text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100'
                                      : 'text-slate-400 border-slate-200 bg-slate-50 cursor-not-allowed'
                                  }`}
                                >
                                  {adminUserRoleSavingId === adminUser.id ? 'Guardando...' : 'Guardar'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedSocio && (
            <SocioDetailModal
              socio={selectedSocio}
              onClose={() => setSelectedSocio(null)}
              onEdit={() => {
                if (selectedSocio?.id) {
                  openMemberEdit(selectedSocio.id);
                }
              }}
            />
          )}

          {selectedRequest && (
            <RequestDetailModal
              request={selectedRequest}
              requestForm={requestForm}
              onChange={handleRequestFormChange}
              onClose={() => setSelectedRequest(null)}
              onSave={saveRequest}
              saving={requestSaving}
              error={requestSaveError}
              message={requestSaveMessage}
              statusOptions={requestStatuses}
            />
          )}
        </main>
      </div>

      {courseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Aula Virtual</div>
                <div className="text-lg font-bold text-slate-900">
                  {courseModalMode === 'create' ? 'Nuevo Curso' : courseDetail?.title || 'Gestionar Curso'}
                </div>
              </div>
              <button onClick={closeCourseModal} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {courseSaveError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                  {courseSaveError}
                </div>
              )}
              {courseSaveMessage && (
                <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm border border-green-200">
                  {courseSaveMessage}
                </div>
              )}
              {courseDetailLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((row) => (
                    <div key={`course-loading-${row}`} className="h-4 w-full bg-slate-100 rounded"></div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Título</label>
                      <input
                        type="text"
                        name="title"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                        value={courseForm.title}
                        onChange={handleCourseFormChange}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Instructor</label>
                      <input
                        type="text"
                        name="instructor"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                        value={courseForm.instructor}
                        onChange={handleCourseFormChange}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Duración</label>
                      <input
                        type="text"
                        name="duration"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                        value={courseForm.duration}
                        onChange={handleCourseFormChange}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Imagen (URL)</label>
                      <input
                        type="text"
                        name="image_url"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                        value={courseForm.image_url}
                        onChange={handleCourseFormChange}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={saveCourse}
                      className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
                      disabled={courseSaving}
                    >
                      {courseSaving ? 'Guardando...' : 'Guardar Curso'}
                    </button>
                  </div>

                  {courseModalMode === 'edit' && (
                    <div className="border-t border-slate-200 pt-6 space-y-6">
                      <div className="space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-800">Matrícula</div>
                            <div className="text-xs text-slate-500">Registra socios al curso.</div>
                          </div>
                        </div>
                        {enrollmentsError && (
                          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                            {enrollmentsError}
                          </div>
                        )}
                        <div className="flex flex-col md:flex-row gap-3">
                          <input
                            type="text"
                            placeholder="DNI del socio"
                            className="w-full md:w-64 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                            value={enrollmentDni}
                            onChange={(e) => setEnrollmentDni(e.target.value)}
                          />
                          <button
                            onClick={addEnrollment}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
                            disabled={enrolling}
                          >
                            {enrolling ? 'Matriculando...' : 'Matricular'}
                          </button>
                        </div>
                        <div className="space-y-2">
                          {enrollmentsLoading && (
                            <div className="text-sm text-slate-500">Cargando matrículas...</div>
                          )}
                          {!enrollmentsLoading && enrollments.map((enrollment) => {
                            const badge = enrollmentBadge(enrollment.status);
                            return (
                              <div key={enrollment.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-slate-200 rounded-lg p-3">
                                <div>
                                  <div className="text-sm font-medium text-slate-800">{enrollment.apellidos} {enrollment.nombres}</div>
                                  <div className="text-xs text-slate-500">DNI {enrollment.dni} • {enrollment.grado} • Promo {enrollment.promocion}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${badge.className}`}>
                                    {badge.label}
                                  </span>
                                  {enrollment.status === 'PENDING' && (
                                    <>
                                      <button
                                        onClick={() => updateEnrollmentStatus(enrollment.id, 'APPROVED')}
                                        className="text-xs font-semibold text-green-700 border border-green-200 px-3 py-1 rounded hover:bg-green-50 transition"
                                        disabled={enrollmentUpdatingId === enrollment.id}
                                      >
                                        Aprobar
                                      </button>
                                      <button
                                        onClick={() => updateEnrollmentStatus(enrollment.id, 'REJECTED')}
                                        className="text-xs font-semibold text-red-700 border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition"
                                        disabled={enrollmentUpdatingId === enrollment.id}
                                      >
                                        Rechazar
                                      </button>
                                    </>
                                  )}
                                  {enrollment.status === 'REJECTED' && (
                                    <button
                                      onClick={() => updateEnrollmentStatus(enrollment.id, 'APPROVED')}
                                      className="text-xs font-semibold text-green-700 border border-green-200 px-3 py-1 rounded hover:bg-green-50 transition"
                                      disabled={enrollmentUpdatingId === enrollment.id}
                                    >
                                      Aprobar
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {!enrollmentsLoading && enrollments.length === 0 && (
                            <div className="text-sm text-slate-500">No hay socios matriculados.</div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-800">Módulos</div>
                          <div className="text-xs text-slate-500">Agrega y edita el contenido del curso.</div>
                        </div>
                        <button
                          onClick={startCreateModule}
                          className="text-xs font-semibold text-slate-700 border border-slate-300 px-3 py-1 rounded hover:bg-slate-50 transition"
                        >
                          Nuevo Módulo
                        </button>
                      </div>
                      <div className="space-y-3">
                        {(courseDetail?.modules || []).map((module) => (
                          <div key={module.id} className="border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-800">{module.title}</div>
                              <div className="text-xs text-slate-500">
                                Orden {module.order} • {module.duration} • {module.materials?.length || 0} materiales
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditModule(module)}
                                className="text-xs font-semibold text-indigo-600 border border-indigo-200 px-3 py-1 rounded hover:bg-indigo-50 transition"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => startCreateMaterial(module.id)}
                                className="text-xs font-semibold text-slate-700 border border-slate-300 px-3 py-1 rounded hover:bg-slate-50 transition"
                              >
                                Materiales
                              </button>
                            </div>
                          </div>
                        ))}
                        {courseDetail?.modules?.length === 0 && (
                          <div className="text-sm text-slate-500">No hay módulos registrados.</div>
                        )}
                      </div>

                      {moduleSaveError && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                          {moduleSaveError}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Título del Módulo</label>
                          <input
                            type="text"
                            name="title"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                            value={moduleForm.title}
                            onChange={handleModuleFormChange}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Duración</label>
                          <input
                            type="text"
                            name="duration"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                            value={moduleForm.duration}
                            onChange={handleModuleFormChange}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Orden</label>
                          <input
                            type="number"
                            name="order"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                            value={moduleForm.order}
                            onChange={handleModuleFormChange}
                            min="1"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-slate-500 mb-1">Descripcion</label>
                          <textarea
                            name="description"
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                            value={moduleForm.description}
                            onChange={handleModuleFormChange}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={saveModule}
                          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
                          disabled={moduleSaving}
                        >
                          {moduleSaving ? 'Guardando...' : moduleMode === 'create' ? 'Agregar Módulo' : 'Actualizar Módulo'}
                        </button>
                      </div>

                      {activeModule && (
                        <div className="border-t border-slate-200 pt-6 space-y-4">
                          <div>
                            <div className="text-sm font-semibold text-slate-800">Materiales - {activeModule.title}</div>
                            <div className="text-xs text-slate-500">Asocia videos, PDFs o enlaces.</div>
                          </div>
                          <div className="space-y-2">
                            {(activeModule.materials || []).map((material) => (
                              <div key={material.id} className="flex items-center justify-between gap-3 border border-slate-200 rounded-lg p-3">
                                <div>
                                  <div className="text-sm font-medium text-slate-800">{material.title}</div>
                                  <div className="text-xs text-slate-500">{material.type}</div>
                                </div>
                                <button
                                  onClick={() => startEditMaterial(material, activeModule.id)}
                                  className="text-xs font-semibold text-indigo-600 border border-indigo-200 px-3 py-1 rounded hover:bg-indigo-50 transition"
                                >
                                  Editar
                                </button>
                              </div>
                            ))}
                            {activeModule.materials?.length === 0 && (
                              <div className="text-sm text-slate-500">No hay materiales para este modulo.</div>
                            )}
                          </div>
                          {materialSaveError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                              {materialSaveError}
                            </div>
                          )}
                          {materialUploadError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                              {materialUploadError}
                            </div>
                          )}
                          <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <input
                              id={`material-upload-${activeModule.id}`}
                              type="file"
                              className="hidden"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = '';
                                uploadMaterialFile(file);
                              }}
                            />
                            <button
                              onClick={() => document.getElementById(`material-upload-${activeModule.id}`)?.click()}
                              className="text-xs font-semibold text-slate-700 border border-slate-300 px-3 py-2 rounded hover:bg-slate-50 transition"
                              disabled={materialUploading}
                            >
                              {materialUploading ? 'Subiendo...' : 'Subir archivo'}
                            </button>
                            <div className="text-xs text-slate-400">
                              Usa esta opcion para cargar PDF, video o documentos.
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Título</label>
                              <input
                                type="text"
                                name="title"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                value={materialForm.title}
                                onChange={handleMaterialFormChange}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
                              <select
                                name="type"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none bg-white"
                                value={materialForm.type}
                                onChange={handleMaterialFormChange}
                              >
                                <option value="PDF">PDF</option>
                                <option value="VIDEO">VIDEO</option>
                                <option value="IMAGEN">IMAGEN</option>
                                <option value="LINK">LINK</option>
                                <option value="PPT">PPT</option>
                                <option value="DOC">DOC</option>
                                <option value="ARCHIVO">ARCHIVO</option>
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-slate-500 mb-1">URL / Archivo</label>
                              <input
                                type="text"
                                name="file_url"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                value={materialForm.file_url}
                                onChange={handleMaterialFormChange}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={saveMaterial}
                              className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
                              disabled={materialSaving}
                            >
                              {materialSaving ? 'Guardando...' : materialMode === 'create' ? 'Agregar Material' : 'Actualizar Material'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {memberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Socio</div>
                <div className="text-lg font-bold text-slate-900">
                  {memberModalMode === 'create'
                    ? 'Nuevo Socio'
                    : memberDisplayName || 'Ficha del Socio'}
                </div>
              </div>
              <button onClick={closeMemberModal} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {memberError && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                  {memberError}
                </div>
              )}
              {memberSaveMessage && (
                <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-md text-sm border border-green-200">
                  {memberSaveMessage}
                </div>
              )}
              {memberLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((row) => (
                    <div key={`member-loading-${row}`} className="h-4 w-full bg-slate-100 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">DNI</label>
                    <input
                      type="text"
                      name="dni"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={memberForm.dni}
                      onChange={handleMemberFormChange}
                      disabled={isDniLocked}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">CIP</label>
                    <input
                      type="text"
                      name="cip"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={memberForm.cip}
                      onChange={handleMemberFormChange}
                      disabled={isMemberReadOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nombres</label>
                    <input
                      type="text"
                      name="nombres"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={memberForm.nombres}
                      onChange={handleMemberFormChange}
                      disabled={isMemberReadOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Apellidos</label>
                    <input
                      type="text"
                      name="apellidos"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={memberForm.apellidos}
                      onChange={handleMemberFormChange}
                      disabled={isMemberReadOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Promoción</label>
                    <input
                      type="text"
                      name="promocion"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={memberForm.promocion}
                      onChange={handleMemberFormChange}
                      disabled={isMemberReadOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Grado</label>
                    <input
                      type="text"
                      name="grado"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={memberForm.grado}
                      onChange={handleMemberFormChange}
                      disabled={isMemberReadOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Especialidad</label>
                    <input
                      type="text"
                      name="especialidad"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={memberForm.especialidad}
                      onChange={handleMemberFormChange}
                      disabled={isMemberReadOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Situacion</label>
                    <input
                      type="text"
                      name="situacion"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={memberForm.situacion}
                      onChange={handleMemberFormChange}
                      disabled={isMemberReadOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Forma de aporte</label>
                    <input
                      type="text"
                      name="forma_aporte"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={memberForm.forma_aporte}
                      onChange={handleMemberFormChange}
                      disabled={isMemberReadOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Estado</label>
                    <select
                      name="estado"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none bg-white"
                      value={memberForm.estado}
                      onChange={handleMemberFormChange}
                      disabled={isMemberReadOnly}
                    >
                      {estadosDisponibles.map((estado) => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={memberForm.email}
                      onChange={handleMemberFormChange}
                      disabled={isMemberReadOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Celular</label>
                    <input
                      type="text"
                      name="celular"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={memberForm.celular}
                      onChange={handleMemberFormChange}
                      disabled={isMemberReadOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Telefono casa</label>
                    <input
                      type="text"
                      name="telefono_casa"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={memberForm.telefono_casa}
                      onChange={handleMemberFormChange}
                      disabled={isMemberReadOnly}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Dirección</label>
                    <input
                      type="text"
                      name="direccion"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={memberForm.direccion}
                      onChange={handleMemberFormChange}
                      disabled={isMemberReadOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Distrito</label>
                    <input
                      type="text"
                      name="distrito"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={memberForm.distrito}
                      onChange={handleMemberFormChange}
                      disabled={isMemberReadOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Foto URL</label>
                    <input
                      type="text"
                      name="foto_url"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={memberForm.foto_url}
                      onChange={handleMemberFormChange}
                      disabled={isMemberReadOnly}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={closeMemberModal}
                className="text-sm text-slate-600 hover:text-slate-900"
                disabled={memberSaving}
              >
                Cerrar
              </button>
              {memberModalMode === 'view' ? (
                <button
                  onClick={startEditMember}
                  className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition"
                  disabled={memberLoading}
                >
                  Editar
                </button>
              ) : (
                <button
                  onClick={saveMember}
                  className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
                  disabled={memberSaving}
                >
                  {memberSaving ? 'Guardando...' : memberModalMode === 'create' ? 'Crear socio' : 'Guardar cambios'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- VISTA MIS CUOTAS ---
function DuesView({ user, onLogout, onNavigate }) {
  const { tokens } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3100';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dues, setDues] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [uploadState, setUploadState] = useState({});
  const [paymentIds, setPaymentIds] = useState({});
  const maxUploadBytes = 5 * 1024 * 1024;

  useEffect(() => {
    const fetchDues = async () => {
      if (!tokens?.accessToken) return;
      setLoading(true);
      setError('');
      try {
        const year = new Date().getFullYear();
        const response = await fetch(`${apiUrl}/me/dues?year=${year}`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (response.status === 401) {
          onLogout();
          return;
        }

        if (!response.ok) {
          setError('No se pudieron cargar las cuotas.');
          return;
        }

        const payload = await response.json();
        setDues(Array.isArray(payload.data) ? payload.data : []);
      } catch {
        setError('No se pudieron cargar las cuotas.');
      } finally {
        setLoading(false);
      }
    };

    fetchDues();
  }, [apiUrl, tokens?.accessToken, onLogout]);

  const updateUploadState = (dueId, next) => {
    setUploadState(prev => ({ ...prev, [dueId]: { ...(prev[dueId] || {}), ...next } }));
  };

  const validateFile = (file) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const hasValidType = allowedTypes.includes(file.type);
    const hasValidExt = /\.(pdf|png|jpe?g)$/i.test(file.name);
    if (!hasValidType && !hasValidExt) {
      return 'Formato no permitido. Solo PDF, JPG o PNG.';
    }
    if (file.size > maxUploadBytes) {
      return 'Archivo demasiado grande. Límite 5MB.';
    }
    return '';
  };

  const handleUpload = async (due, file) => {
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) {
      updateUploadState(due.id, { status: 'error', message: validationError });
      return;
    }

    if (!tokens?.accessToken) {
      onLogout();
      return;
    }

    updateUploadState(due.id, { status: 'uploading', message: 'Subiendo voucher...' });

    try {
      let paymentId = paymentIds[due.id];
      if (!paymentId) {
        const paymentResponse = await fetch(`${apiUrl}/me/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({
            due_id: due.id,
            amount: Number(due.amount) || 0,
            method: 'VOUCHER',
            reference: file.name,
            voucher_url: null,
          }),
        });

        if (paymentResponse.status === 401) {
          onLogout();
          return;
        }

        if (!paymentResponse.ok) {
          updateUploadState(due.id, { status: 'error', message: 'No se pudo crear el pago.' });
          return;
        }

        const paymentData = await paymentResponse.json();
        paymentId = paymentData.id;
        setPaymentIds(prev => ({ ...prev, [due.id]: paymentId }));
      }

      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(`${apiUrl}/me/payments/${paymentId}/voucher`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: formData,
      });

      if (uploadResponse.status === 401) {
        onLogout();
        return;
      }

      if (!uploadResponse.ok) {
        updateUploadState(due.id, { status: 'error', message: 'No se pudo subir el voucher.' });
        return;
      }

      updateUploadState(due.id, { status: 'success', message: 'Voucher enviado.' });
    } catch {
      updateUploadState(due.id, { status: 'error', message: 'No se pudo subir el voucher.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} onLogout={onLogout} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <div className="bg-slate-900 text-white py-10 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <button onClick={() => onNavigate('user')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition text-sm font-medium">
            <ArrowLeft size={16} /> Volver al Dashboard
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CreditCard className="text-amber-500" /> Mis Cuotas
          </h1>
          <p className="text-slate-300 mt-2 max-w-2xl">
            Revisa el detalle mensual de tus aportes.
          </p>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-700">Cuotas del Año</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {loading && (
              <>
                {[1, 2, 3, 4, 5].map((row) => (
                  <div key={`due-skeleton-${row}`} className="p-4 animate-pulse flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-3 w-32 bg-slate-200 rounded"></div>
                      <div className="h-2 w-24 bg-slate-100 rounded"></div>
                    </div>
                    <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
                  </div>
                ))}
              </>
            )}
            {!loading && dues.map((due) => {
              const dueUploadState = uploadState[due.id];
              const isUploading = dueUploadState?.status === 'uploading';
              return (
                <div key={due.id} className="p-4 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{formatMonth(due.month)} {due.year}</div>
                      <div className="text-xs text-slate-500">Vence: {formatDate(due.due_date)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                        due.status === 'PAID'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : due.status === 'WAIVED'
                            ? 'bg-slate-100 text-slate-800 border-slate-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {due.status === 'PAID' ? 'Pagado' : due.status === 'WAIVED' ? 'Exonerado' : 'Pendiente'}
                      </span>
                      {due.status === 'PENDING' && (
                        <>
                          <input
                            id={`voucher-${due.id}`}
                            type="file"
                            className="hidden"
                            accept=".pdf,image/jpeg,image/png"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              event.target.value = '';
                              handleUpload(due, file);
                            }}
                          />
                          <button
                            onClick={() => document.getElementById(`voucher-${due.id}`)?.click()}
                            className="text-xs font-semibold text-slate-700 border border-slate-300 px-3 py-1 rounded hover:bg-slate-50 transition"
                            disabled={isUploading}
                          >
                            {isUploading ? 'Subiendo...' : 'Subir voucher'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {dueUploadState?.message && (
                    <div className={`text-xs rounded-md border p-2 ${
                      dueUploadState.status === 'success'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      {dueUploadState.message}
                    </div>
                  )}
                </div>
              );
            })}
            {!loading && dues.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">
                No hay cuotas registradas para este año.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- VISTA SERVICIOS ---
function ServicesView({ user, onLogout, onNavigate }) {
  const { tokens } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3100';
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState('');
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [createState, setCreateState] = useState({});
  const [scheduleState, setScheduleState] = useState({});
  const [uploadState, setUploadState] = useState({});
  const maxUploadBytes = 5 * 1024 * 1024;

  const loadServices = useCallback(async () => {
    if (!tokens?.accessToken) return;
    setServicesLoading(true);
    setServicesError('');
    try {
      const response = await fetch(`${apiUrl}/services`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setServicesError('No se pudieron cargar los servicios.');
        return;
      }

      const payload = await response.json();
      setServices(Array.isArray(payload.data) ? payload.data : []);
    } catch {
      setServicesError('No se pudieron cargar los servicios.');
    } finally {
      setServicesLoading(false);
    }
  }, [apiUrl, tokens?.accessToken, onLogout]);

  const loadRequests = useCallback(async () => {
    if (!tokens?.accessToken) return;
    setRequestsLoading(true);
    setRequestsError('');
    try {
      const response = await fetch(`${apiUrl}/me/service-requests`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setRequestsError('No se pudieron cargar las solicitudes.');
        return;
      }

      const payload = await response.json();
      setRequests(Array.isArray(payload.data) ? payload.data : []);
    } catch {
      setRequestsError('No se pudieron cargar las solicitudes.');
    } finally {
      setRequestsLoading(false);
    }
  }, [apiUrl, tokens?.accessToken, onLogout]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const updateCreateState = (serviceId, next) => {
    setCreateState(prev => ({ ...prev, [serviceId]: { ...(prev[serviceId] || {}), ...next } }));
  };

  const updateScheduleState = (serviceId, field, value) => {
    setScheduleState(prev => ({
      ...prev,
      [serviceId]: {
        ...(prev[serviceId] || { date: '', time: '' }),
        [field]: value,
      },
    }));
  };

  const updateUploadState = (requestId, next) => {
    setUploadState(prev => ({ ...prev, [requestId]: { ...(prev[requestId] || {}), ...next } }));
  };

  const handleCreateRequest = async (serviceId) => {
    if (!tokens?.accessToken) {
      onLogout();
      return;
    }

    const schedule = scheduleState[serviceId] || { date: '', time: '' };
    if (!schedule.date || !schedule.time) {
      updateCreateState(serviceId, { status: 'error', message: 'Selecciona fecha y hora para la cita.' });
      return;
    }

    const scheduledDate = new Date(`${schedule.date}T${schedule.time}`);
    if (Number.isNaN(scheduledDate.getTime())) {
      updateCreateState(serviceId, { status: 'error', message: 'La fecha u hora no es válida.' });
      return;
    }

    updateCreateState(serviceId, { status: 'loading', message: '' });
    try {
      const response = await fetch(`${apiUrl}/service-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ serviceId, scheduledAt: scheduledDate.toISOString() }),
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        updateCreateState(serviceId, { status: 'error', message: 'No se pudo enviar la solicitud.' });
        return;
      }

      updateCreateState(serviceId, { status: 'success', message: 'Solicitud enviada.' });
      setScheduleState(prev => ({ ...prev, [serviceId]: { date: '', time: '' } }));
      loadRequests();
    } catch {
      updateCreateState(serviceId, { status: 'error', message: 'No se pudo enviar la solicitud.' });
    }
  };

  const validateFile = (file) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const hasValidType = allowedTypes.includes(file.type);
    const hasValidExt = /\.(pdf|png|jpe?g)$/i.test(file.name);
    if (!hasValidType && !hasValidExt) {
      return 'Formato no permitido. Solo PDF, JPG o PNG.';
    }
    if (file.size > maxUploadBytes) {
      return 'Archivo demasiado grande. Limite 5MB.';
    }
    return '';
  };

  const handleUploadAttachment = async (requestId, file) => {
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) {
      updateUploadState(requestId, { status: 'error', message: validationError });
      return;
    }

    if (!tokens?.accessToken) {
      onLogout();
      return;
    }

    updateUploadState(requestId, { status: 'uploading', message: 'Subiendo documento...' });
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${apiUrl}/me/service-requests/${requestId}/attachments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        updateUploadState(requestId, { status: 'error', message: 'No se pudo subir el documento.' });
        return;
      }

      updateUploadState(requestId, { status: 'success', message: 'Documento adjuntado.' });
    } catch {
      updateUploadState(requestId, { status: 'error', message: 'No se pudo subir el documento.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} onLogout={onLogout} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <div className="bg-slate-900 text-white py-10 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <button onClick={() => onNavigate('user')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition text-sm font-medium">
            <ArrowLeft size={16} /> Volver al Dashboard
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Award className="text-amber-500" /> Servicios
          </h1>
          <p className="text-slate-300 mt-2 max-w-2xl">
            Gestiona solicitudes y trámites disponibles para los asociados.
          </p>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {servicesError && (
          <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
            {servicesError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {servicesLoading && (
            <>
              {[1, 2, 3, 4].map((item) => (
                <div key={`service-skeleton-${item}`} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
                  <div className="h-4 w-32 bg-slate-200 rounded mb-3"></div>
                  <div className="h-3 w-full bg-slate-100 rounded mb-2"></div>
                  <div className="h-3 w-5/6 bg-slate-100 rounded mb-6"></div>
                  <div className="h-9 w-full bg-slate-200 rounded"></div>
                </div>
              ))}
            </>
          )}
          {!servicesLoading && services.map((service) => {
            const state = createState[service.id];
            const isCreating = state?.status === 'loading';
            return (
              <div key={service.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <div className="mb-2">
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded uppercase tracking-wide">Servicio</span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{service.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{service.description}</p>
                {service.requirements && (
                  <div className="text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-slate-700">Requisitos:</span> {service.requirements}
                  </div>
                )}
                {service.schedule && (
                  <div className="text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-slate-700">Horario:</span> {service.schedule}
                  </div>
                )}
                {(service.phones || service.email) && (
                  <div className="text-xs text-slate-500 mb-4">
                    {service.phones && (
                      <div><span className="font-semibold text-slate-700">Telefonos:</span> {service.phones}</div>
                    )}
                    {service.email && (
                      <div><span className="font-semibold text-slate-700">Correo:</span> {service.email}</div>
                    )}
                  </div>
                )}
                <div className="mt-2 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Día</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={(scheduleState[service.id]?.date) || ''}
                      onChange={(event) => updateScheduleState(service.id, 'date', event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Hora</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={(scheduleState[service.id]?.time) || ''}
                      onChange={(event) => updateScheduleState(service.id, 'time', event.target.value)}
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleCreateRequest(service.id)}
                  className="mt-auto bg-slate-900 text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-slate-800 transition"
                  disabled={isCreating}
                >
                  {isCreating ? 'Enviando...' : 'Solicitar'}
                </button>
                {state?.message && (
                  <div className={`mt-3 text-xs rounded-md border p-2 ${
                    state.status === 'success'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-600 border-red-200'
                  }`}>
                    {state.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FileText size={20} className="text-slate-500" /> Mis Solicitudes
          </h2>
          {requestsError && (
            <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
              {requestsError}
            </div>
          )}
          <div className="space-y-4">
            {requestsLoading && (
              <>
                {[1, 2, 3].map((item) => (
                  <div key={`request-skeleton-${item}`} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-pulse">
                    <div className="h-3 w-40 bg-slate-200 rounded mb-3"></div>
                    <div className="h-2 w-56 bg-slate-100 rounded mb-2"></div>
                    <div className="h-2 w-48 bg-slate-100 rounded mb-4"></div>
                    <div className="h-8 w-32 bg-slate-200 rounded"></div>
                  </div>
                ))}
              </>
            )}
            {!requestsLoading && requests.map((request) => {
              const state = uploadState[request.id];
              const isUploading = state?.status === 'uploading';
              const badge = getServiceStatusBadge(request.status);
              return (
                <div key={request.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{request.serviceName}</div>
                      <div className="text-xs text-slate-500">Solicitado: {formatDate(request.requested_at)}</div>
                      {request.scheduled_at && (
                        <div className="text-xs text-slate-500">Programado: {formatDateTime(request.scheduled_at)}</div>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  {request.notes_member && (
                    <div className="text-xs text-slate-500 mt-3">
                      <span className="font-semibold text-slate-700">Notas:</span> {request.notes_member}
                    </div>
                  )}
                  {request.notes_admin && (
                    <div className="text-xs text-slate-500 mt-2">
                      <span className="font-semibold text-slate-700">Respuesta:</span> {request.notes_admin}
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-3">
                    <input
                      id={`service-attachment-${request.id}`}
                      type="file"
                      className="hidden"
                      accept=".pdf,image/jpeg,image/png"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        handleUploadAttachment(request.id, file);
                      }}
                    />
                    <button
                      onClick={() => document.getElementById(`service-attachment-${request.id}`)?.click()}
                      className="text-xs font-semibold text-slate-700 border border-slate-300 px-3 py-1 rounded hover:bg-slate-50 transition"
                      disabled={isUploading}
                    >
                      {isUploading ? 'Subiendo...' : 'Adjuntar documento'}
                    </button>
                  </div>
                  {state?.message && (
                    <div className={`mt-3 text-xs rounded-md border p-2 ${
                      state.status === 'success'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      {state.message}
                    </div>
                  )}
                </div>
              );
            })}
            {!requestsLoading && requests.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-sm text-slate-500 text-center">
                Aun no tienes solicitudes registradas.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Componentes Admin Dashboard ---
function SidebarItem({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition relative ${
        active ? 'bg-slate-800 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white text-slate-300'
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge > 0 && (
        <span className="ml-auto bg-amber-500 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({ title, value, subtext, icon, color, trend }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-start transition hover:shadow-md hover:-translate-y-1">
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase mb-1 tracking-wide">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {subtext && <p className="text-xs text-slate-400 mt-1 font-medium">{subtext}</p>}
        {trend && (
          <p className="text-xs text-green-600 mt-1 font-bold flex items-center gap-1">
            <TrendingUp size={12} /> {trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color} shadow-sm`}>{icon}</div>
    </div>
  );
}

function DataField({ icon, label, value, color, truncate }) {
  const bgColors = { blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600' };
  return (
    <div className="flex items-center gap-4 group">
      <div className={`p-2.5 rounded-lg transition-colors ${bgColors[color]}`}>{icon}</div>
      <div className={`${truncate ? 'overflow-hidden' : ''} flex-1`}>
        <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
        <p className={`text-sm font-semibold text-slate-900 ${truncate ? 'truncate' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status, size = 'sm' }) {
  const styles = {
    Activo: 'bg-green-100 text-green-800 border-green-200',
    Finalizado: 'bg-green-100 text-green-800 border-green-200',
    Moroso: 'bg-red-100 text-red-800 border-red-200',
    Observado: 'bg-red-100 text-red-800 border-red-200',
    Pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
    'En trámite': 'bg-blue-100 text-blue-800 border-blue-200',
    Inactivo: 'bg-slate-100 text-slate-800 border-slate-200',
    Honorario: 'bg-purple-100 text-purple-800 border-purple-200',
    Aprobado: 'bg-green-100 text-green-800 border-green-200',
    Rechazado: 'bg-red-100 text-red-800 border-red-200',
  };
  const sizeClass = size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center rounded-full font-bold border ${sizeClass} ${styles[status] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
      {status}
    </span>
  );
}

function NewsCard({ item, renderImage, categoryLabel = 'Internacional' }) {
  if (!item) {
    return null;
  }
  const authorInitial = (item.author || item.source || 'R').trim().charAt(0) || 'R';
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noreferrer"
      className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
    >
      <div className="relative h-48 overflow-hidden">
        {renderImage(item, 'w-full h-full object-cover transition-transform duration-700 group-hover:scale-105')}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-blue-800 shadow-sm uppercase tracking-wider">
          {item.source}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <span className="text-xs font-semibold text-blue-500 mb-2 uppercase tracking-wide flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          {categoryLabel}
        </span>
        <h3 className="text-lg font-bold text-slate-900 leading-snug mb-3 group-hover:text-blue-700 transition-colors">
          {item.title}
        </h3>
        {item.summary && (
          <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-2 flex-grow">
            {item.summary}
          </p>
        )}
        <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
              {authorInitial}
            </div>
            <span>{item.author || 'Redaccion'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} />
            {formatDateTime(item.publishedAt)}
          </div>
        </div>
      </div>
    </a>
  );
}

function BreakingNewsItem({ item }) {
  if (!item) {
    return null;
  }
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noreferrer"
      className="relative pl-6 pb-6 border-l-2 border-slate-100 last:border-0 hover:border-blue-200 transition-colors group"
    >
      <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white group-hover:bg-blue-500 transition-colors" />
      <span className="text-xs font-medium text-slate-400 block mb-1">
        {formatTime(item.publishedAt)} - <span className="text-blue-600">{item.source}</span>
      </span>
      <h4 className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 cursor-pointer transition-colors leading-snug">
        {item.title}
      </h4>
    </a>
  );
}


function NewsSection({ apiUrl, tokens, onLogout }) {
  const [items, setItems] = useState([]);
  const [sources, setSources] = useState([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');

  const loadNews = useCallback(async () => {
    if (!tokens?.accessToken) {
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${apiUrl}/news?category=internacional`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        onLogout?.();
        return;
      }

      if (!response.ok) {
        setError('No se pudieron cargar las noticias.');
        return;
      }

      const payload = await response.json();
      setItems(Array.isArray(payload.data) ? payload.data : []);
      setSources(Array.isArray(payload.sources) ? payload.sources : []);
      setUpdatedAt(payload.updatedAt || '');
      setMessage(payload.message || '');
    } catch {
      setError('No se pudieron cargar las noticias.');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, tokens?.accessToken, onLogout]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const sortedItems = [...items].sort((a, b) => {
    const dateA = a?.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b?.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateB - dateA;
  });

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? sortedItems.filter((item) => {
        const title = item?.title?.toLowerCase() || '';
        const summary = item?.summary?.toLowerCase() || '';
        const source = item?.source?.toLowerCase() || '';
        return title.includes(normalizedQuery) || summary.includes(normalizedQuery) || source.includes(normalizedQuery);
      })
    : sortedItems;

  const hero = filteredItems[0];
  const highlights = filteredItems.slice(1, 4);
  const secondary = filteredItems.slice(4, 7);
  const latest = filteredItems.slice(7, 13);
  const videoItem = filteredItems.find((item) => item?.videoUrl && item?.id !== hero?.id);
  const showEmpty = !loading && filteredItems.length === 0;

  const getYoutubeId = (url) => {
    if (!url) return '';
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : '';
  };

  const renderMedia = (item) => {
    if (!item?.videoUrl) {
      return null;
    }
    const videoUrl = item.videoUrl;
    const youtubeId = getYoutubeId(videoUrl);
    if (youtubeId) {
      return (
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title={item.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    return (
      <video className="w-full h-full object-cover" controls>
        <source src={videoUrl} />
      </video>
    );
  };

  const renderImage = (item, className) => {
    if (item?.imageUrl) {
      return <img src={item.imageUrl} alt={item.title} className={className} />;
    }
    return (
      <div className={`${className} bg-gradient-to-br from-slate-200 via-slate-100 to-white flex items-center justify-center`}>
        <Newspaper size={32} className="text-slate-400" />
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="w-full bg-slate-900 rounded-2xl p-8 relative overflow-hidden flex flex-col gap-6 shadow-2xl shadow-slate-900/20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-slate-900/90"></div>
        {hero?.imageUrl && (
          <img
            src={hero.imageUrl}
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
            alt="Noticias"
          />
        )}

        <div className="relative z-10">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-sm">
            Edicion diaria
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
            Panorama global: analisis y sucesos multimedia
          </h1>
          <p className="text-slate-200 text-sm md:text-lg max-w-2xl">
            Una mirada curada a los eventos mas importantes que estan dando forma al escenario geopolitico actual.
          </p>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="text-xs text-slate-300">
            Actualizado: <span className="font-semibold text-white">{formatDateTime(updatedAt)}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadNews}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-lg border border-white/10 transition"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 text-slate-300" size={16} />
              <input
                type="text"
                placeholder="Buscar noticias..."
                className="pl-9 pr-4 py-2 bg-slate-800/70 border border-slate-700 rounded-full text-xs text-white w-56 focus:w-72 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
          {error}
        </div>
      )}
      {message && !error && (
        <div className="bg-amber-50 text-amber-700 p-3 rounded-md text-sm border border-amber-200">
          {message}
        </div>
      )}

      {loading && items.length === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
            <div className="h-72 bg-slate-200"></div>
            <div className="p-6 space-y-3">
              <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
              <div className="h-3 w-full bg-slate-100 rounded"></div>
              <div className="h-3 w-5/6 bg-slate-100 rounded"></div>
            </div>
          </div>
          <div className="lg:col-span-5 space-y-6">
            {[1, 2, 3].map((item) => (
              <div key={`news-skeleton-${item}`} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse space-y-3">
                <div className="h-32 bg-slate-200 rounded"></div>
                <div className="h-3 w-2/3 bg-slate-200 rounded"></div>
                <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showEmpty && !error && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          {normalizedQuery ? 'No hay resultados para tu busqueda.' : 'No hay noticias disponibles. En breve cargaremos los feeds.'}
        </div>
      )}

      {!loading && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-9 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[450px]">
              {hero && (
                <a
                  href={hero.link}
                  target="_blank"
                  rel="noreferrer"
                  className="relative rounded-2xl overflow-hidden group shadow-lg cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
                  {renderImage(hero, 'w-full h-full object-cover transition-transform duration-700 group-hover:scale-110')}
                  <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded mb-3 inline-block shadow-lg">
                      {hero.source}
                    </span>
                    <h2 className="text-2xl font-bold text-white mb-3 leading-snug drop-shadow-lg">
                      {hero.title}
                    </h2>
                    {hero.summary && (
                      <p className="text-slate-200 text-sm line-clamp-2 mb-4 hidden md:block">
                        {hero.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-white/80 text-xs font-medium">
                      <span>{formatDateTime(hero.publishedAt)}</span>
                    </div>
                  </div>
                </a>
              )}

              <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg flex flex-col relative group">
                <div className="relative flex-grow bg-black">
                  {videoItem ? (
                    renderMedia(videoItem)
                  ) : (
                    renderImage(hero, 'w-full h-full object-cover opacity-70')
                  )}
                  {!videoItem && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                        <PlayCircle size={32} className="text-white fill-white" />
                      </div>
                    </div>
                  )}
                  {videoItem && (
                    <span className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded font-mono">
                      Video
                    </span>
                  )}
                </div>
                <div className="p-6 bg-slate-800 text-white h-auto lg:h-40">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-blue-400 text-xs font-bold uppercase">Video destacado</span>
                  </div>
                  <h3 className="font-bold text-lg leading-snug mb-2 hover:text-blue-300 cursor-pointer transition-colors">
                    {videoItem?.title || hero?.title || 'Video destacado'}
                  </h3>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                Analisis y politica
              </h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <ChevronDown className="rotate-90 text-slate-500" size={20} />
                </button>
                <button className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <ChevronDown className="-rotate-90 text-slate-500" size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {highlights.map((item) => (
                <NewsCard key={item.id} item={item} renderImage={renderImage} />
              ))}
            </div>

            <div className="flex items-center justify-between mt-8">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                Economia y sociedad
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {secondary.map((item) => (
                <NewsCard key={item.id} item={item} renderImage={renderImage} />
              ))}
            </div>
          </div>

          <div className="xl:col-span-3">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg text-slate-800">Ultima hora</h3>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                </div>

                <div className="space-y-2">
                  {latest.map((item) => (
                    <BreakingNewsItem key={item.id} item={item} />
                  ))}
                </div>

                <button className="w-full mt-6 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                  Ver todo el historial <ChevronDown className="-rotate-90" size={16} />
                </button>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Globe size={100} />
                </div>
                <h4 className="font-bold text-sm opacity-80 mb-4 uppercase tracking-wider">Mercados globales</h4>
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span>S&P 500</span>
                    <span className="font-mono font-bold flex items-center gap-1 text-emerald-300">
                      4,185.20 <TrendingUp size={14} />
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span>EUR/USD</span>
                    <span className="font-mono font-bold flex items-center gap-1 text-red-300">
                      1.0842 <TrendingUp size={14} className="rotate-180" />
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Petroleo WTI</span>
                    <span className="font-mono font-bold flex items-center gap-1 text-emerald-300">
                      78.40 <TrendingUp size={14} />
                    </span>
                  </div>
                </div>
              </div>

              {sources.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-wrap gap-2 items-center">
                  <div className="text-xs uppercase tracking-widest text-slate-400 mr-2">Fuentes</div>
                  {sources.map((source) => (
                    <span
                      key={source.id}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {source.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SocioDetailModal({ socio, onClose, onEdit }) {
  const handleModalClick = (e) => e.stopPropagation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200" onClick={handleModalClick}>
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 h-32 relative flex items-start justify-end p-4">
          <button onClick={onClose} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition">
            <X size={20} />
          </button>
          <div className="absolute bottom-0 left-8 transform translate-y-1/2">
            <div className="h-24 w-24 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center shadow-lg overflow-hidden">
              <span className="text-3xl font-bold text-slate-500">{socio.nombre?.charAt(0)}</span>
            </div>
          </div>
        </div>

        <div className="pt-16 pb-8 px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">{socio.nombre}</h2>
              <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                {socio.grado} <span className="text-slate-300">•</span> {socio.especialidad || 'Sin especialidad'}
              </p>
            </div>
            <StatusBadge status={socio.estado} size="lg" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">Identidad Naval</h3>
              <DataField icon={<Shield size={18} />} label="Número CIP" value={socio.cip || 'No registrado'} color="blue" />
              <DataField icon={<FileText size={18} />} label="DNI" value={socio.dni} color="blue" />
              <DataField icon={<Users size={18} />} label="Promoción" value={socio.promo || 'No registrada'} color="blue" />
            </div>
            <div className="space-y-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">Información de Contacto</h3>
              <DataField icon={<Mail size={18} />} label="Correo Electrónico" value={socio.email || 'No registrado'} color="amber" truncate />
              <DataField icon={<Phone size={18} />} label="Telefono / Celular" value={socio.celular || 'No registrado'} color="amber" />
              <DataField icon={<MapPin size={18} />} label="Dirección" value={socio.direccion || 'No registrada'} color="amber" truncate />
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition">Ver Historial</button>
            <button onClick={onEdit} className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition flex items-center gap-2 shadow-lg shadow-slate-900/10">
              <Edit size={16} /> Editar Ficha
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestDetailModal({ request, requestForm, onChange, onClose, onSave, saving, error, message, statusOptions }) {
  const handleModalClick = (e) => e.stopPropagation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200" onClick={handleModalClick}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Solicitud</div>
            <div className="text-lg font-bold text-slate-900">{request.serviceName}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm border border-green-200">
              {message}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
              <div className="text-xs text-slate-500 uppercase font-semibold mb-2">Datos del Socio</div>
              <div className="text-sm text-slate-900 font-semibold">{request.nombre}</div>
              <div className="text-xs text-slate-500 mt-1">DNI: <span className="font-mono text-slate-700">{request.dni}</span></div>
              <div className="text-xs text-slate-500 mt-1">ID Socio: {request.memberId}</div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Estado</label>
                <select
                  name="status"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none bg-white"
                  value={requestForm.status}
                  onChange={onChange}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nota Administrativa</label>
                <textarea
                  name="notesAdmin"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                  value={requestForm.notesAdmin}
                  onChange={onChange}
                  placeholder="Agregue observaciones o indicaciones."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Fecha Programada</label>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                  value={requestForm.scheduledAt}
                  onChange={onChange}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={onSave}
              className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Componentes UI Reutilizables ---
function InfoRow({ label, value }) { return (<div className="flex justify-between border-b border-slate-100 last:border-0 py-2"><span className="text-sm text-slate-500">{label}</span><span className="text-sm font-medium text-slate-800">{value}</span></div>); }
function InputGroup({ label, value, onChange, name, disabled, icon, type = "text" }) { return (<div className="relative"><label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">{label}</label><div className="relative">{icon && (<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">{icon}</div>)}<input type={type} name={name} value={value} onChange={onChange} disabled={disabled} className={`block w-full rounded-lg sm:text-sm transition ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 ${disabled ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed border' : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 border shadow-sm'}`} /></div></div>); }

function formatDate(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('es-PE');
}

function formatDateTime(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  const datePart = date.toLocaleDateString('es-PE');
  const timePart = date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  return `${datePart} ${timePart}`;
}

function formatTime(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function toDateTimeInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (val) => String(val).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatMonth(month) {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[month - 1] || 'Mes';
}

function getServiceStatusBadge(status) {
  switch (status) {
    case 'RECIBIDO':
      return { label: 'Recibido', className: 'bg-slate-100 text-slate-800 border-slate-200' };
    case 'EN_REVISION':
      return { label: 'En revision', className: 'bg-amber-100 text-amber-800 border-amber-200' };
    case 'OBSERVADO':
      return { label: 'Observado', className: 'bg-red-100 text-red-800 border-red-200' };
    case 'APROBADO':
      return { label: 'Aprobado', className: 'bg-green-100 text-green-800 border-green-200' };
    case 'RECHAZADO':
      return { label: 'Rechazado', className: 'bg-red-100 text-red-800 border-red-200' };
    case 'FINALIZADO':
      return { label: 'Finalizado', className: 'bg-slate-100 text-slate-800 border-slate-200' };
    default:
      return { label: status || 'Estado', className: 'bg-slate-100 text-slate-800 border-slate-200' };
  }
}
