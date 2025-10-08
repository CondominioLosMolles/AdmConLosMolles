import { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Copy,
  FileText
} from 'lucide-react';
import { useGoogleSheets } from '../hooks/useGoogleSheets';

const ConfiguracionGoogleSheets = () => {
  const { isConfigured, isLoading, error, configure, verificarConexion } = useGoogleSheets();
  const [webAppURL, setWebAppURL] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const handleConfigure = async () => {
    if (!webAppURL.trim()) {
      return;
    }

    try {
      configure(webAppURL.trim());
      
      // Probar la conexión inmediatamente después de configurar
      setTestingConnection(true);
      const isConnected = await verificarConexion();
      setConnectionStatus(isConnected ? 'success' : 'error');
    } catch (err) {
      setConnectionStatus('error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    
    try {
      const isConnected = await verificarConexion();
      setConnectionStatus(isConnected ? 'success' : 'error');
    } catch (err) {
      setConnectionStatus('error');
    } finally {
      setTestingConnection(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Configuración de Google Sheets</h2>
        <Badge variant={isConfigured ? 'default' : 'secondary'}>
          {isConfigured ? 'Configurado' : 'No configurado'}
        </Badge>
      </div>

      {/* Estado de conexión */}
      {isConfigured && (
        <Card className="bg-white shadow-lg border-0 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {connectionStatus === 'success' && (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="text-green-700 font-medium">Conectado correctamente</span>
                  </>
                )}
                {connectionStatus === 'error' && (
                  <>
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    <span className="text-red-700 font-medium">Error de conexión</span>
                  </>
                )}
                {connectionStatus === null && (
                  <>
                    <Settings className="h-6 w-6 text-gray-600" />
                    <span className="text-gray-700 font-medium">Estado desconocido</span>
                  </>
                )}
              </div>
              <Button 
                onClick={handleTestConnection}
                disabled={testingConnection}
                variant="outline"
                size="sm"
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Probando...
                  </>
                ) : (
                  'Probar Conexión'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuración de URL */}
      <Card className="bg-white shadow-lg border-0 rounded-2xl">
        <CardHeader>
          <CardTitle>Configurar Google Apps Script</CardTitle>
          <CardDescription>
            Ingresa la URL de tu Google Apps Script desplegado como Web App
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webAppURL">URL del Web App</Label>
            <Input
              id="webAppURL"
              type="url"
              placeholder="https://script.google.com/macros/s/AKfycbwGWsfdHdZNNZD7tBNklHjneSxCoidtgrvTlwKZLMdj1qpzPvpUZgZqLAEvtAhFiYRI8g/exec"
              value={webAppURL}
              onChange={(e) => setWebAppURL(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <Button 
            onClick={handleConfigure}
            disabled={!webAppURL.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Configurando...
              </>
            ) : (
              'Configurar Conexión'
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instrucciones */}
      <Card className="bg-white shadow-lg border-0 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Instrucciones de Configuración</span>
          </CardTitle>
          <CardDescription>
            Sigue estos pasos para configurar la integración con Google Sheets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                1
              </div>
              <div>
                <p className="font-medium">Abre Google Apps Script</p>
                <p className="text-sm text-gray-600">
                  Ve a{' '}
                  <a 
                    href="https://script.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center"
                  >
                    script.google.com
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                2
              </div>
              <div>
                <p className="font-medium">Crea un nuevo proyecto</p>
                <p className="text-sm text-gray-600">
                  Copia y pega el código de Google Apps Script que se encuentra en el archivo funcionesSHEET.txt
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                3
              </div>
              <div>
                <p className="font-medium">Vincula tu Google Sheet</p>
                <p className="text-sm text-gray-600">
                  Asegúrate de que el script esté vinculado a tu hoja de cálculo CONTABILIDADSISTEMALOSMOLLES.xlsx
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                4
              </div>
              <div>
                <p className="font-medium">Despliega como Web App</p>
                <p className="text-sm text-gray-600">
                  Ve a "Implementar" → "Nueva implementación" → "Tipo: Aplicación web"
                </p>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-1">Configuración recomendada:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Ejecutar como: Yo (tu email)</li>
                    <li>• Quién tiene acceso: Cualquier persona</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                5
              </div>
              <div>
                <p className="font-medium">Copia la URL del Web App</p>
                <p className="text-sm text-gray-600">
                  Después del despliegue, copia la URL que termina en "/exec" y pégala arriba
                </p>
              </div>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Asegúrate de que tu Google Sheet tenga exactamente las mismas hojas y columnas 
              que se muestran en el archivo CONTABILIDADSISTEMALOSMOLLES.xlsx para que la integración funcione correctamente.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Código de ejemplo */}
      <Card className="bg-white shadow-lg border-0 rounded-2xl">
        <CardHeader>
          <CardTitle>Código de Google Apps Script</CardTitle>
          <CardDescription>
            Copia este código en tu proyecto de Google Apps Script
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{`// Ejemplo de función básica para probar la conexión
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({status: "ok"}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // Tu código del archivo funcionesSHEET.txt va aquí
  // ...
}`}</code>
            </pre>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(`// Ejemplo de función básica para probar la conexión
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({status: "ok"}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // Tu código del archivo funcionesSHEET.txt va aquí
  // ...
}`)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfiguracionGoogleSheets;
