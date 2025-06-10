// scripts/utils/drive.js - Funciones para interactuar con Google Drive
async function uploadToDrive(file, folderPath, residenteId) {
  const metadata = {
    name: file.name,
    mimeType: file.type,
    parents: [await getFolderId(folderPath)]
  };
  
  const form = new FormData();
  form.append(
    'metadata', 
    new Blob([JSON.stringify(metadata)], {type: 'application/json'})
  );
  form.append('file', file);
  
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files',  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: form
  });
  
  const data = await res.json();
  return data.id; // ID del archivo para guardar en Sheets
}
