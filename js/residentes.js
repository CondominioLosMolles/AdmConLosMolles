const hojaResidentes = "Residentes";

async function cargarResidentes() {
  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${hojaResidentes}!A2:H`,
  });

  const tbody = document.querySelector("#tablaResidentes tbody");
  tbody.innerHTML = "";

  const data = response.result.values || [];

  data.forEach((fila, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${fila[1]}</td>
      <td>${fila[2]}</td>
      <td>${fila[3]}</td>
      <td>${fila[4]}</td>
      <td>${fila[5]}</td>
      <td>${fila[6]}</td>
      <td>${fila[7]}</td>
      <td>
        <button onclick="editarResidente(${i}, ${JSON.stringify(fila).replace(/"/g, '&quot;')})">✏️</button>
        <button onclick="eliminarResidente(${i})">🗑️</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function abrirFormularioResidente() {
  document.getElementById("modalResidente").classList.remove("hidden");
  document.getElementById("formResidente").reset();
  document.getElementById("residenteIndex").value = "";
  document.getElementById("modalTitulo").textContent = "Nuevo Residente";
}

function cerrarFormularioResidente() {
  document.getElementById("modalResidente").classList.add("hidden");
}

document.getElementById("formResidente").addEventListener("submit", async function (e) {
  e.preventDefault();

  const fila = [
    "", // ID autoincremental (lo dejaremos en blanco)
    document.getElementById("nombreResidente").value,
    document.getElementById("rutResidente").value,
    document.getElementById("parcelaResidente").value,
    document.getElementById("emailResidente").value,
    document.getElementById("telefonoResidente").value,
    document.getElementById("estadoResidente").value,
    document.getElementById("gastoResidente").value,
  ];

  const index = document.getElementById("residenteIndex").value;

  if (index === "") {
    // Nuevo
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${hojaResidentes}!A2:H`,
      valueInputOption: "USER_ENTERED",
      resource: { values: [fila] },
    });
  } else {
    // Edición
    const rowNumber = parseInt(index) + 2;
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${hojaResidentes}!A${rowNumber}:H${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      resource: { values: [fila] },
    });
  }

  cerrarFormularioResidente();
  cargarResidentes();
});

function editarResidente(index, fila) {
  document.getElementById("residenteIndex").value = index;
  document.getElementById("nombreResidente").value = fila[1];
  document.getElementById("rutResidente").value = fila[2];
  document.getElementById("parcelaResidente").value = fila[3];
  document.getElementById("emailResidente").value = fila[4];
  document.getElementById("telefonoResidente").value = fila[5];
  document.getElementById("estadoResidente").value = fila[6];
  document.getElementById("gastoResidente").value = fila[7];
  document.getElementById("modalTitulo").textContent = "Editar Residente";
  document.getElementById("modalResidente").classList.remove("hidden");
}

async function eliminarResidente(index) {
  if (!confirm("¿Seguro que deseas eliminar este residente?")) return;
  const rowNumber = index + 2;

  await gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: "ROWS",
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        },
      ],
    },
  });

  cargarResidentes();
}

document.getElementById("busquedaResidente").addEventListener("input", function () {
  const filtro = this.value.toLowerCase();
  document.querySelectorAll("#tablaResidentes tbody tr").forEach(tr => {
    const texto = tr.innerText.toLowerCase();
    tr.style.display = texto.includes(filtro) ? "" : "none";
  });
});

function exportarResidentesExcel() {
  alert("Función de exportación Excel será implementada en próximos módulos.");
}
