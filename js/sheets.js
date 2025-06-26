// ==================================================================
//               API de Google Sheets y Autenticación
// ==================================================================
const SHEET_ID = '1Zf72DWa52R5yv9WB_2Jg59j2CC22s7N2J92u2J-G2xo';
const API_KEY = 'TU_API_KEY'; // Reemplazar con tu API Key real
const CLIENT_ID = 'TU_CLIENT_ID.apps.googleusercontent.com'; // Reemplazar con tu Client ID real
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/gmail.send';

let tokenClient;
let gapiInited = false;
let gisInited = false;

document.getElementById('authorize_button').style.visibility = 'hidden';
document.getElementById('signout_button').style.visibility = 'hidden';

function gapiLoad() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
    });
    gapiInited = true;
    maybeEnableButtons();
}

function gisInit() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // Se define en el momento de la llamada
    });
    gisInited = true;
    maybeEnableButtons();
}

function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        document.getElementById('signout_button').style.visibility = 'visible';
        document.getElementById('authorize_button').innerText = 'Refrescar Token';
        sessionStorage.setItem('gapi_token', JSON.stringify(gapi.client.getToken()));
        await cargarPagina('dashboard');
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        sessionStorage.removeItem('gapi_token');
        document.getElementById('content').innerHTML = "<p>Has cerrado la sesión. Por favor, autoriza para continuar.</p>";
        document.getElementById('authorize_button').innerText = 'Autorizar';
        document.getElementById('signout_button').style.visibility = 'hidden';
        document.getElementById('authorize_button').style.visibility = 'visible';
    }
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('authorize_button').style.visibility = 'visible';
    }
}

// ==================================================================
//               Funciones de Interacción con Google Sheets
// ==================================================================

// --- FUNCIONES DE LECTURA (GET) ---

function obtenerResidentes() {
    return gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Residentes!A2:S',
    }).then(response => response.result.values || []);
}

function obtenerPagosGC() {
  return gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Pagos_GC!A2:T', // Leemos hasta la columna T (20) por la descripción
  }).then(response => {
    // ---- INICIO DE LA CORRECCIÓN ----
    // Se añade el "|| []" para asegurar que siempre devolvemos un array,
    // incluso si la hoja está vacía. Esto soluciona el error .map is not a function of null.
    return response.result.values || [];
    // ---- FIN DE LA CORRECCIÓN ----
  });
}

function obtenerTIMCs() {
    return gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Config_TIMC!A2:C',
    }).then(response => response.result.values || []);
}


// --- FUNCIONES DE ESCRITURA (UPDATE/APPEND) ---

function agregarPagoGC(datosFila) {
    return gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Pagos_GC!A:S',
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datosFila],
        },
    });
}

function guardarTIMC(anio, mes, valor) {
    // Esta función es más compleja, necesita buscar la fila correcta o agregar una nueva.
    // Una implementación simple sería agregar siempre, pero lo ideal es buscar y actualizar.
    // Por simplicidad, aquí un ejemplo de búsqueda y actualización.
    const rangeToRead = `Config_TIMC!A2:C`;
    return gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: rangeToRead,
    }).then(response => {
        const rows = response.result.values || [];
        const rowIndex = rows.findIndex(row => row[0] == anio && row[1] == mes);
        
        if (rowIndex !== -1) {
            // Actualizar fila existente
            const rangeToUpdate = `Config_TIMC!C${rowIndex + 2}`;
            return gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: SHEET_ID,
                range: rangeToUpdate,
                valueInputOption: 'USER_ENTERED',
                resource: { values: [[valor]] }
            });
        } else {
            // Agregar nueva fila
            return gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: SHEET_ID,
                range: 'Config_TIMC!A:C',
                valueInputOption: 'USER_ENTERED',
                resource: { values: [[anio, mes, valor]] }
            });
        }
    });
}

function actualizarSaldoConvenioEnSheet(rowNum, nuevoSaldo) {
  const range = `Residentes!M${rowNum}`; // Columna M para Saldo Convenio
  return gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[nuevoSaldo]]
    }
  });
}

function marcarComprobanteEnviado(rowNum) {
  const range = `Pagos_GC!S${rowNum}`; // Columna S para Comprobante Enviado
  return gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [['SI']]
    }
  });
}


// ==================================================================
//               Funciones de Interacción con Google Drive y Gmail
// ==================================================================

const FOLDER_COMPROBANTES_ID = '1Q3EaKq5nQuX9gO6w3qg8iE8D6n-QyWlq'; // ID de la carpeta raíz de comprobantes

async function buscarOCrearCarpetaDeParcela(nombreCarpeta) {
    // Buscar si la carpeta ya existe
    const query = `mimeType='application/vnd.google-apps.folder' and name='${nombreCarpeta}' and '${FOLDER_COMPROBANTES_ID}' in parents and trashed=false`;
    const response = await gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name)',
    });
    
    if (response.result.files && response.result.files.length > 0) {
        return response.result.files[0].id; // Carpeta encontrada, devuelve su ID
    } else {
        // Crear la carpeta si no existe
        const fileMetadata = {
            'name': nombreCarpeta,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [FOLDER_COMPROBANTES_ID]
        };
        const createResponse = await gapi.client.drive.files.create({
            resource: fileMetadata,
            fields: 'id'
        });
        return createResponse.result.id; // Devuelve el ID de la nueva carpeta
    }
}

function subirComprobante(file, folderId) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = () => {
            const fileData = reader.result;
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            const metadata = {
                'name': `comprobante_${new Date().toISOString()}.pdf`, // Asumiendo PDF, se puede adaptar
                'mimeType': file.type,
                'parents': [folderId]
            };

            const multipartRequestBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: ' + file.type + '\r\n' +
                'Content-Transfer-Encoding: base64\r\n' +
                '\r\n' +
                btoa(String.fromCharCode.apply(null, new Uint8Array(fileData))) +
                close_delim;

            gapi.client.request({
                'path': '/upload/drive/v3/files',
                'method': 'POST',
                'params': { 'uploadType': 'multipart' },
                'headers': {
                    'Content-Type': 'multipart/related; boundary="' + boundary + '"'
                },
                'body': multipartRequestBody
            }).then(response => resolve(response.result), err => reject(err));
        };
    });
}

async function enviarCorreo(destinatario, asunto, cuerpoHtml) {
  const message = [
    `To: ${destinatario}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(asunto)))}?=`,
    '',
    cuerpoHtml
  ].join('\r\n');

  const rawMessage = btoa(unescape(encodeURIComponent(message))).replace(/\+/g, '-').replace(/\//g, '_');
  
  return gapi.client.gmail.users.messages.send({
    'userId': 'me',
    'resource': {
      'raw': rawMessage
    }
  });
}
