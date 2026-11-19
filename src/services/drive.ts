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
