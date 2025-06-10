const hojaPagos = "Pagos_GC";
let residentes = [];

async function cargarSelectorResidentes() {
  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Residentes!A2:H",
  });

  residentes = response.result.values || [];

  const selector = document.getElementById("selectorResidente");
  selector.innerHTML = '<option value="">Seleccione residente</option>';

  residentes.forEach((res, i) => {
    const display = `${res[1]} - ${res[2]} - Parcela ${res[3]}`;
    selector.innerHTML += `<option value="${i}">${display}</option>`;
  });

  document.getElementById("busquedaPago").addEventListener("input", e => {
    const filtro = e.target.value.toLowerCase();
    for (const opt of selector.options) {
      const texto = opt.text.toLowerCase();
      opt.style.display = texto.includes(filtro) ? "" : "none";
    }
  });
}

function obtenerTMC() {
  const tmc = parseFloat(localStorage.getItem("config_tmc") || "0");
  return isNaN(tmc) ? 0 : tmc;
}

async function mostrarHistorialPagos() {
  const index = document.getElementById("selectorResidente").value;
  if (index === "") return;
  const residente = residentes[index];
  const idResidente = residente[0];
  const parcela = residente[3];
  const valorGC = parseFloat(residente[7]);

  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${hojaPagos}!A2:I`,
  });

  const hoy = new Date();
  const pagos = (response.result.values || []).filter(p => p[1] === idResidente);

  const rows = pagos.map(pago => {
    const periodo = pago[3];
    const montoPagado = parseFloat(pago[5]) || 0;
    const fechaPago = pago[6] || "";
    const vencimiento = new Date(pago[4]);
    const mesesMora = hoy > vencimiento ? Math.floor((hoy - vencimiento) / (1000 * 60 * 60 * 24 * 30)) : 0;
    const interes = mesesMora > 0 ? ((valorGC * obtenerTMC()) / 100 / 12 * mesesMora) : 0;
    const multa = mesesMora > 0 ? (valorGC * 0.25 * mesesMora) : 0;
    const deudaTotal = valorGC + interes + multa - montoPagado;
    const estado = deudaTotal <= 0 ? "Pagado" : "Pendiente";
    const color = deudaTotal > 0 ? "red" : "green";

    return `
      <tr>
        <td>${periodo}</td>
        <td>${valorGC}</td>
        <td>${pago[4]}</td>
        <td>${montoPagado}</td>
        <td style="color:${color}">${(valorGC - montoPagado).toFixed(0)}</td>
        <td>${interes.toFixed(0)}</td>
        <td>${multa.toFixed(0)}</td>
        <td>${mesesMora}</td>
        <td><strong>${deudaTotal.toFixed(0)}</strong></td>
        <td>${estado}</td>
      </tr>
    `;
  });

  document.getElementById("detallePagos").innerHTML = `
    <h4>Historial de Pagos - Parcela ${parcela}</h4>
    <table>
      <thead>
        <tr>
          <th>Mes</th><th>Gasto</th><th>Vencimiento</th>
          <th>Pagado</th><th>Saldo</th><th>Interés</th>
          <th>¼ Multa</th><th>Mora</th><th>Deuda Total</th><th>Estado</th>
        </tr>
      </thead>
      <tbody>${rows.join("")}</tbody>
    </table>
  `;
}

document.getElementById("formPago").addEventListener("submit", async function (e) {
  e.preventDefault();

  const index = document.getElementById("selectorResidente").value;
  const residente = residentes[index];
  const idResidente = residente[0];
  const parcela = residente[3];

  const monto = parseFloat(document.getElementById("montoPago").value);
  const fecha = document.getElementById("fechaPago").value;
  const metodo = document.getElementById("metodoPago").value;
  const archivo = document.getElementById("archivoComprobante").files[0];

  let fileId = "";

  if (archivo) {
    const metadata = {
      name: `${fecha}-Comprobante.pdf`,
      mimeType: archivo.type,
      parents: [], // Lo puedes configurar luego con una carpeta ID si tienes ruta fija
    };
    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", archivo);

    const token = gapi.auth.getToken().access_token;
    const upload = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });

    const json = await upload.json();
    fileId = json.id;
  }

  const periodo = fecha.slice(0, 7);
  const vencimiento = `${periodo}-10`;

  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${hojaPagos}!A2:I`,
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [[
        "", idResidente, parcela, periodo, vencimiento,
        monto, fecha, metodo, fileId
      ]]
    }
  });

  alert("Pago registrado");
  document.getElementById("formPago").reset();
  mostrarHistorialPagos();
});
