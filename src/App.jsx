import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { 
  Home, 
  Users, 
  CreditCard, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  MessageSquare, 
  Settings,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Loader2,
  Zap,
  Activity
} from 'lucide-react'
import './App.css'
import ConfiguracionGoogleSheets from './components/ConfiguracionGoogleSheets'
import { useGoogleSheets, useResidentes, usePagosGC, useConvenios } from './hooks/useGoogleSheets'

// Componente de Navegación Lateral
const Sidebar = ({ activeModule, setActiveModule }) => {
  const { isConfigured } = useGoogleSheets();
  
  const modules = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'residentes', name: 'Residentes', icon: Users },
    { id: 'pagos', name: 'Pagos GC', icon: CreditCard },
    { id: 'convenios', name: 'Convenios', icon: FileText },
    { id: 'egresos', name: 'Egresos', icon: TrendingUp },
    { id: 'ingresos', name: 'Ingresos Extra', icon: DollarSign },
    { id: 'comunicaciones', name: 'Comunicaciones', icon: MessageSquare },
    { id: 'configuracion', name: 'Configuración', icon: Settings },
  ]

  return (
    <div className="neumorphic-sidebar w-64 h-screen p-6 fixed left-0 top-0">
      <div className="mb-8 slide-in-left">
        <div className="flex items-center space-x-3 mb-2">
          <div className="neumorphic-icon-container p-2">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Los Molles</h1>
            <p className="text-sm text-gray-600">Sistema de Administración</p>
          </div>
        </div>
        {isConfigured && (
          <div className="neumorphic-badge success mt-3 px-3 py-1 inline-flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            <span className="text-xs font-medium">Conectado</span>
          </div>
        )}
      </div>
      
      <nav className="space-y-3">
        {modules.map((module, index) => {
          const Icon = module.icon
          const isDisabled = !isConfigured && module.id !== 'configuracion'
          
          return (
            <button
              key={module.id}
              onClick={() => !isDisabled && setActiveModule(module.id)}
              disabled={isDisabled}
              className={`neumorphic-nav-item w-full flex items-center space-x-3 px-4 py-3 font-medium transition-all duration-300 stagger-animation ${
                activeModule === module.id ? 'active' : ''
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Icon className="h-5 w-5" />
              <span>{module.name}</span>
            </button>
          )
        })}
      </nav>
      
      {!isConfigured && (
        <div className="neumorphic-card mt-6 p-4 bg-gradient-to-br from-yellow-50 to-orange-50 fade-in-up">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="h-4 w-4 text-yellow-600" />
            <p className="text-xs font-semibold text-yellow-800">Configuración Requerida</p>
          </div>
          <p className="text-xs text-yellow-700">
            Configure Google Sheets para acceder a todas las funciones del sistema
          </p>
        </div>
      )}
    </div>
  )
}

// Componente Dashboard
const Dashboard = () => {
  const { residentes, isLoading: loadingResidentes } = useResidentes();
  const { pagos, isLoading: loadingPagos } = usePagosGC();
  const { convenios, isLoading: loadingConvenios } = useConvenios();

  // Calcular estadísticas dinámicas
  const totalResidentes = residentes.length;
  const pagosAlDia = (pagos || []).filter(p => p.Estado === 'Pagado').length;
  const conveniosActivos = (convenios || []).filter(c => c.Estado === 'Activo').length;
  const deudaTotal = (residentes || []).reduce((total, r) => total + (parseFloat(r.Saldo_Convenio_Actual) || 0), 0);

  const stats = [
    { title: 'Total Residentes', value: totalResidentes.toString(), icon: Users, color: 'blue', loading: loadingResidentes },
    { title: 'Pagos al Día', value: pagosAlDia.toString(), icon: CheckCircle, color: 'green', loading: loadingPagos },
    { title: 'Convenios Activos', value: conveniosActivos.toString(), icon: FileText, color: 'orange', loading: loadingConvenios },
    { title: 'Deuda Total', value: `$${deudaTotal.toLocaleString()}`, icon: AlertTriangle, color: 'red', loading: loadingResidentes },
  ]

  // Últimos pagos (filtrar los más recientes)
  const ultimosPagos = (pagos || [])
    .filter(p => p.Estado === 'Pagado')
    .sort((a, b) => new Date(b.Fecha_Pago) - new Date(a.Fecha_Pago))
    .slice(0, 3);

  // Convenios pendientes
  const conveniosPendientes = (convenios || [])
    .filter(c => c.Estado === 'Activo')
    .slice(0, 3);

  return (
    <div className="space-y-8 fade-in-up">
      <div className="flex items-center justify-between slide-in-right">
        <div>
          <h2 className="text-4xl font-bold text-gradient mb-2">Dashboard</h2>
          <p className="text-gray-600">Resumen general del condominio Los Molles</p>
        </div>
        <div className="neumorphic-badge px-4 py-2 flex items-center space-x-2">
          <Activity className="h-4 w-4 text-blue-600 pulse-animation" />
          <span className="text-sm font-medium">Actualizado hace 5 min</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="neumorphic-stat-card p-6 stagger-animation" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  {stat.loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="loading-skeleton w-16 h-8"></div>
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900 floating-animation">{stat.value}</p>
                  )}
                </div>
                <div className={`neumorphic-icon-container p-4 bg-gradient-to-br from-${stat.color}-100 to-${stat.color}-200`}>
                  <Icon className={`h-8 w-8 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="neumorphic-card p-0 overflow-hidden slide-in-left">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Últimos Pagos Registrados</h3>
            <p className="text-gray-600 text-sm">Pagos recibidos recientemente</p>
          </div>
          <div className="p-6">
            {loadingPagos ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="loading-skeleton h-16 rounded-lg"></div>
                ))}
              </div>
            ) : ultimosPagos.length > 0 ? (
              <div className="space-y-4">
                {ultimosPagos.map((pago, index) => (
                  <div key={index} className="neumorphic-list-item p-4 stagger-animation" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="neumorphic-icon-container w-12 h-12 flex items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100">
                          <span className="text-green-600 font-bold">{pago.N_Parcela}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{pago.Nombre_Residente}</p>
                          <p className="text-sm text-gray-600">{pago.Fecha_Pago}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 text-lg">${pago.Monto_Pagado?.toLocaleString()}</p>
                        <div className="neumorphic-badge success text-xs px-2 py-1">Pagado</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4 floating-animation" />
                <p className="text-gray-500 font-medium">No hay pagos recientes</p>
              </div>
            )}
          </div>
        </div>

        <div className="neumorphic-card p-0 overflow-hidden slide-in-right">
          <div className="p-6 bg-gradient-to-r from-orange-50 to-amber-50">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Convenios Pendientes</h3>
            <p className="text-gray-600 text-sm">Convenios que requieren seguimiento</p>
          </div>
          <div className="p-6">
            {loadingConvenios ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="loading-skeleton h-16 rounded-lg"></div>
                ))}
              </div>
            ) : conveniosPendientes.length > 0 ? (
              <div className="space-y-4">
                {conveniosPendientes.map((convenio, index) => (
                  <div key={index} className="neumorphic-list-item p-4 stagger-animation" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="neumorphic-icon-container w-12 h-12 flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100">
                          <span className="text-orange-600 font-bold">{convenio.N_Parcela}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Convenio {convenio.ID_Convenio}</p>
                          <p className="text-sm text-gray-600">Parcela {convenio.N_Parcela}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="neumorphic-badge warning text-xs px-2 py-1 mb-1">{convenio.Estado}</div>
                        <p className="text-sm text-gray-600">
                          Saldo: ${convenio.Saldo_Pendiente?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4 floating-animation" />
                <p className="text-gray-500 font-medium">No hay convenios activos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente Residentes
const Residentes = () => {
  const { residentes, isLoading, error, cargarResidentes } = useResidentes();
  const [searchTerm, setSearchTerm] = useState('');
  
  const residentesFiltrados = (residentes || []).filter(residente =>
    residente.Nombre_Completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    residente.N_Parcela?.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-8 fade-in-up">
      <div className="flex items-center justify-between slide-in-right">
        <div>
          <h2 className="text-4xl font-bold text-gradient mb-2">Gestión de Residentes</h2>
          <p className="text-gray-600">Administra la información de todos los residentes</p>
        </div>
        <button className="neumorphic-button px-6 py-3 flex items-center space-x-2 font-medium text-blue-600 interactive-element">
          <Plus className="h-5 w-5" />
          <span>Nuevo Residente</span>
        </button>
      </div>

      <div className="neumorphic-card p-0 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Lista de Residentes</h3>
              <p className="text-gray-600 text-sm">Total: {residentesFiltrados.length} residentes</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar residente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="neumorphic-input pl-10 pr-4 py-2 w-64 text-sm"
                />
              </div>
              <button className="neumorphic-button px-4 py-2 flex items-center space-x-2 text-sm interactive-element">
                <Filter className="h-4 w-4" />
                <span>Filtros</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="loading-skeleton h-20 rounded-lg"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4 floating-animation" />
              <p className="text-red-600 font-semibold text-lg mb-2">Error al cargar residentes</p>
              <p className="text-gray-500 text-sm mb-6">{error}</p>
              <button 
                onClick={cargarResidentes} 
                className="neumorphic-button px-6 py-3 text-blue-600 font-medium interactive-element"
              >
                Reintentar
              </button>
            </div>
          ) : residentesFiltrados.length > 0 ? (
            <div className="space-y-4">
              {residentesFiltrados.map((residente, index) => (
                <div key={index} className="neumorphic-list-item p-6 stagger-animation" style={{ animationDelay: `${index * 0.05}s` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="neumorphic-icon-container w-16 h-16 flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                        <span className="text-blue-600 font-bold text-lg">{residente.N_Parcela}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">{residente.Nombre_Completo}</h3>
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-4 w-4" />
                            <span>{residente.Email || 'Sin email'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="h-4 w-4" />
                            <span>{residente.Telefono || 'Sin teléfono'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className={`neumorphic-badge ${residente.Estado === 'Activo' ? 'success' : 'error'} px-3 py-1`}>
                        {residente.Estado}
                      </div>
                      <p className="text-sm font-medium text-gray-700">GC: ${residente.Valor_Gasto_Comun?.toLocaleString()}</p>
                      {residente.Saldo_a_Favor > 0 && (
                        <p className="text-sm font-medium text-green-600">
                          Saldo a favor: ${residente.Saldo_a_Favor?.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4 floating-animation" />
              <p className="text-gray-500 font-medium text-lg">No se encontraron residentes</p>
              <p className="text-gray-400 text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente Pagos GC
const PagosGC = () => {
  const { pagos, isLoading, error } = usePagosGC();

  // Calcular estadísticas
  const pagosMes = (pagos || []).filter(p => p.Estado === 'Pagado').length;
  const pendientes = (pagos || []).filter(p => p.Estado === 'Pendiente').length;
  const morosos = (pagos || []).filter(p => p.Estado === 'Moroso').length;

  const statsCards = [
    { title: 'Pagos del Mes', value: pagosMes, icon: CheckCircle, color: 'green' },
    { title: 'Pendientes', value: pendientes, icon: Clock, color: 'orange' },
    { title: 'Morosos', value: morosos, icon: AlertTriangle, color: 'red' },
  ];

  return (
    <div className="space-y-8 fade-in-up">
      <div className="flex items-center justify-between slide-in-right">
        <div>
          <h2 className="text-4xl font-bold text-gradient mb-2">Gestión de Pagos GC</h2>
          <p className="text-gray-600">Control de pagos de gastos comunes</p>
        </div>
        <button className="neumorphic-button px-6 py-3 flex items-center space-x-2 font-medium text-green-600 interactive-element">
          <Plus className="h-5 w-5" />
          <span>Registrar Pago</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="neumorphic-stat-card p-6 stagger-animation" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className={`text-3xl font-bold text-${stat.color}-600 floating-animation`}>{stat.value}</p>
                </div>
                <div className={`neumorphic-icon-container p-4 bg-gradient-to-br from-${stat.color}-100 to-${stat.color}-200`}>
                  <Icon className={`h-8 w-8 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="neumorphic-card p-0 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Historial de Pagos</h3>
          <p className="text-gray-600 text-sm">Registro completo de pagos de gastos comunes</p>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="loading-skeleton h-20 rounded-lg"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4 floating-animation" />
              <p className="text-red-600 font-semibold text-lg mb-2">Error al cargar pagos</p>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          ) : pagos.length > 0 ? (
            <div className="space-y-4">
              {pagos.slice(0, 10).map((pago, index) => (
                <div key={index} className="neumorphic-list-item p-6 stagger-animation" style={{ animationDelay: `${index * 0.05}s` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="neumorphic-icon-container w-14 h-14 flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                        <span className="text-blue-600 font-bold">{pago.N_Parcela}</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{pago.Nombre_Residente}</p>
                        <p className="text-sm text-gray-600">{pago.Periodo}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="font-bold text-gray-900 text-xl">${pago.Monto_Pagado?.toLocaleString()}</p>
                      <div className={`neumorphic-badge ${
                        pago.Estado === 'Pagado' ? 'success' : 
                        pago.Estado === 'Pendiente' ? 'warning' : 
                        'error'
                      } px-3 py-1`}>
                        {pago.Estado}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4 floating-animation" />
              <p className="text-gray-500 font-medium text-lg">No hay pagos registrados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente principal de la aplicación
function App() {
  const [activeModule, setActiveModule] = useState('dashboard')
  const { isConfigured } = useGoogleSheets();

  // Si no está configurado, mostrar configuración por defecto
  useEffect(() => {
    if (!isConfigured) {
      setActiveModule('configuracion');
    }
  }, [isConfigured]);

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />
      case 'residentes':
        return <Residentes />
      case 'pagos':
        return <PagosGC />
      case 'convenios':
        return (
          <div className="text-center py-20 fade-in-up">
            <FileText className="h-20 w-20 text-gray-300 mx-auto mb-6 floating-animation" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">Módulo de Convenios</h3>
            <p className="text-gray-500">Próximamente disponible</p>
          </div>
        )
      case 'egresos':
        return (
          <div className="text-center py-20 fade-in-up">
            <TrendingUp className="h-20 w-20 text-gray-300 mx-auto mb-6 floating-animation" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">Módulo de Egresos</h3>
            <p className="text-gray-500">Próximamente disponible</p>
          </div>
        )
      case 'ingresos':
        return (
          <div className="text-center py-20 fade-in-up">
            <DollarSign className="h-20 w-20 text-gray-300 mx-auto mb-6 floating-animation" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">Módulo de Ingresos Extra</h3>
            <p className="text-gray-500">Próximamente disponible</p>
          </div>
        )
      case 'comunicaciones':
        return (
          <div className="text-center py-20 fade-in-up">
            <MessageSquare className="h-20 w-20 text-gray-300 mx-auto mb-6 floating-animation" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">Módulo de Comunicaciones</h3>
            <p className="text-gray-500">Próximamente disponible</p>
          </div>
        )
      case 'configuracion':
        return <ConfiguracionGoogleSheets />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen gradient-bg-light">
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />
      <main className="ml-64 p-8">
        {renderModule()}
      </main>
    </div>
  )
}

export default App
