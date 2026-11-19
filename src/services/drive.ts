/**
 * Google Drive API Client for Virtual Photobooth
 * Handles finding/creating the "virtual moment" folder and uploading framed photos.
 */

export interface DriveFolderInfo {
  id: string;
  name: string;
  webViewLink?: string;
}

export interface UploadResult {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink?: string;
}

/**
 * Find or create the target folder (default: "virtual moment")
 */
export async function getOrCreateVirtualMomentFolder(
  accessToken: string,
  folderName = 'virtual moment'
): Promise<DriveFolderInfo> {
  const query = encodeURIComponent(
    `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&spaces=drive`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!searchRes.ok) {
    const errorText = await searchRes.text();
    throw new Error(`Gagal mencari folder di Google Drive: ${errorText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const existingFolder = searchData.files[0];
    return {
      id: existingFolder.id,
      name: existingFolder.name,
      webViewLink: existingFolder.webViewLink,
    };
  }

  // Create new folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Folder foto tamu otomatis dari Virtual Photobooth PutraTechno',
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Gagal membuat folder '${folderName}' di Google Drive: ${errorText}`);
  }

  const newFolder = await createRes.json();
  return {
    id: newFolder.id,
    name: newFolder.name,
    webViewLink: newFolder.webViewLink,
  };
}

/**
 * Upload high-resolution photo dataUrl to Google Drive inside the target folder
 */
export async function uploadPhotoToDrive(
  accessToken: string,
  folderId: string,
  fileName: string,
  dataUrl: string
): Promise<UploadResult> {
  // Extract base64 and mime type from dataUrl
  const matches = dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Format data gambar tidak valid.');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  // Convert base64 to Blob / Uint8Array
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  const metadata = {
    name: fileName,
    parents: [folderId],
    description: 'Foto Virtual Photobooth - PutraTechno',
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json; charset=UTF-8' })
  );
  form.append('file', blob);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal mengunggah foto ke Google Drive: ${errorText}`);
  }

  const result = await res.json();
  return {
    id: result.id,
    name: result.name,
    webViewLink: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
    webContentLink: result.webContentLink,
  };
}

export const APPS_SCRIPT_TEMPLATE = `const TARGET_FOLDER_ID = 'ISI_DENGAN_ID_FOLDER_GOOGLE_DRIVE_ANDA'; // Opsional, kosongkan jika masuk ke root Drive

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const base64Data = payload.imageBase64.split(',')[1] || payload.imageBase64;
    const mimeType = payload.mimeType || 'image/png';
    const fileName = payload.fileName || \`upload_\${new Date().getTime()}.png\`;

    const decodedBytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);

    const folder = TARGET_FOLDER_ID
      ? DriveApp.getFolderById(TARGET_FOLDER_ID)
      : DriveApp.getRootFolder();

    const file = folder.createFile(blob);

    // Opsional: buat file bisa dilihat siapa saja yang punya link (berguna untuk QR code download)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        fileId: file.getId(),
        fileUrl: file.getUrl(),
        downloadUrl: \`https://drive.google.com/uc?export=download&id=\${file.getId()}\`
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

/**
 * Upload high-resolution photo via Google Apps Script Web App webhook (no OAuth popup needed)
 */
export async function uploadPhotoViaAppsScript(
  webAppUrl: string,
  fileName: string,
  dataUrl: string
): Promise<UploadResult> {
  const cleanUrl = webAppUrl.trim();
  if (!cleanUrl || !cleanUrl.startsWith('https://script.google.com/')) {
    throw new Error('URL Google Apps Script tidak valid (harus diawali https://script.google.com/...).');
  }

  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  const mimeType = matches ? matches[1] : 'image/png';

  const res = await fetch(cleanUrl, {
    method: 'POST',
    redirect: 'follow',
    // Use text/plain to avoid CORS preflight OPTIONS failure on Google Apps Script
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      imageBase64: dataUrl,
      mimeType,
      fileName,
    }),
  });

  if (!res.ok) {
    throw new Error(`Apps Script merespons dengan status ${res.status}`);
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(
      'Respons Apps Script bukan JSON valid. Pastikan Deploy Web App menggunakan akses "Anyone" (Siapa saja).'
    );
  }

  if (data.status !== 'success') {
    throw new Error(data.message || 'Apps Script mengembalikan status error.');
  }

  return {
    id: data.fileId,
    name: fileName,
    webViewLink: data.fileUrl || `https://drive.google.com/file/d/${data.fileId}/view`,
    webContentLink: data.downloadUrl || `https://drive.google.com/uc?export=download&id=${data.fileId}`,
  };
}

