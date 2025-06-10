const hojaEgresos = "Egresos";
const hojaMultas = "Multas";

function mostrarTabContabilidad(tab) {
  document.querySelectorAll(".contab-tab").forEach(t => t.classList.add("hidden"));
  document.getElementById(tab).classList.remove("hidden");

  if (tab === "ingresos") cargarIngresos();
  if (tab === "egresos") cargarEgresos();
}

async function cargarIngresos() {
  const tbody = document.querySelector("#tablaIngresos tbody");
  tbody.innerHTML = "";

  const pagosResp = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Pagos_GC!A2:I",
  });

  const multasResp = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Multas!A2:G",
  });

  const pagos = pagosResp.result.values || [];
  const multas = multasResp.result.values || [];

  pagos.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>Gasto Común</td>
        <td>${p[6]}</td>
        <td>ID ${p[1]}</td>
        <td>${p[2]}</td>
        <td>${p[5]}</td>
      </tr>
    `;
  });

  multas.filter(m => m[5] === "Pagada").forEach(m => {
    tbody.innerHTML += `
      <tr>
        <td>Multa</td>
        <td>${m[6]}</td>
        <td>ID ${m[1]}</td>
        <td>-</td>
        <td>${m[3]}</td>
      </tr>
    `;
  });
}

async function cargarEgresos() {
  const tbody = document.querySelector("#tablaEgresos tbody");
  tbody.innerHTML = "";

  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Egresos!A2:G",
  });

  const egresos = response.result.values || [];

  egresos.forEach(e => {
    tbody.innerHTML += `
      <tr>
        <td>${e[1]}</td>
        <td>${e[2]}</td>
        <td>${e[3]}</td>
        <td>${e[4]}</td>
        <td>${e[5]}</td>
      </tr>
    `;
  });
}

document.getElementById("formEgreso").addEventListener("submit", async function (e) {
  e.preventDefault();

  const fecha = document.getElementById("fechaEgreso").value;
  const categoria = document.getElementById("categoriaEgreso").value;
  const descripcion = document.getElementById("descripcionEgreso").value;
  const proveedor = document.getElementById("proveedorEgreso").value;
  const monto = document.getElementById("montoEgreso").value;
  const archivo = document.getElementById("archivoEgreso").files[0];

  let fileId = "";

  if (archivo) {
    const metadata = {
      name: `${fecha}-${descripcion}.pdf`,
      mimeType: archivo.type,
      parents: [],
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

  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Egresos!A2:G",
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [[ "", fecha, categoria, descripcion, proveedor, monto, fileId ]]
    }
  });

  alert("Egreso registrado");
  document.getElementById("formEgreso").reset();
  document.getElementById("formEgreso").classList.add("hidden");
  cargarEgresos();
});
