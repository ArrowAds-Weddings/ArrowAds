import axios from 'axios';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

export interface DriveAlbum {
  id: string;
  name: string;
}

export interface DriveImage {
  id: string;
  name: string;
  description?: string;
  thumbnailLink?: string;
  webContentLink?: string;
}

export interface GalleryConfig {
  images: {
    id: string;
    filename: string;
    title: string;
    category: string;
    size: 'normal' | 'tall' | 'short';
    order: number;
  }[];
}

export const driveService = {
  /**
   * Fetches the list of image files from a specific folder.
   */
  async listFiles(folderId: string, apiKey: string): Promise<DriveImage[]> {
    const q = `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`;
    const response = await axios.get(`${DRIVE_API_URL}?q=${encodeURIComponent(q)}&key=${apiKey}&fields=files(id,name,description,thumbnailLink,webContentLink)`);
    return response.data.files;
  },

  /**
   * Fetches the list of album folders from the root folder.
   */
  async listAlbums(folderId: string, apiKey: string): Promise<DriveAlbum[]> {
    const q = `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const response = await axios.get(`${DRIVE_API_URL}?q=${encodeURIComponent(q)}&key=${apiKey}&fields=files(id,name)`);
    return response.data.files;
  },

  /**
   * Fetches the list of image files from an album folder, sorted numerically.
   */
  async listAlbumImages(albumId: string, apiKey: string): Promise<DriveImage[]> {
    const q = `'${albumId}' in parents and mimeType contains 'image/' and trashed = false`;
    const response = await axios.get(`${DRIVE_API_URL}?q=${encodeURIComponent(q)}&key=${apiKey}&fields=files(id,name,description,thumbnailLink,webContentLink)`);
    
    // Sort files numerically by name (assuming format '1.jpg', '2.jpg')
    const files = response.data.files;
    return files.sort((a: DriveImage, b: DriveImage) => {
      const numA = parseInt(a.name.split('.')[0]) || 0;
      const numB = parseInt(b.name.split('.')[0]) || 0;
      return numA - numB;
    });
  },

  /**
   * Fetches the gallery.json configuration file from the folder.
   */
  async getGalleryConfig(folderId: string, apiKey: string): Promise<GalleryConfig | null> {
    const q = `'${folderId}' in parents and name = 'gallery.json' and trashed = false`;
    const searchResponse = await axios.get(`${DRIVE_API_URL}?q=${encodeURIComponent(q)}&key=${apiKey}&fields=files(id)`);
    
    if (searchResponse.data.files.length === 0) return null;

    const fileId = searchResponse.data.files[0].id;
    const contentResponse = await axios.get(`${DRIVE_API_URL}/${fileId}?alt=media&key=${apiKey}`);
    return contentResponse.data;
  },

  /**
   * Uploads a new image to Google Drive.
   */
  async uploadFile(file: File, folderId: string, accessToken: string) {
    const metadata = {
      name: file.name,
      parents: [folderId],
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', file);

    const response = await axios.post(UPLOAD_API_URL, formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  },

  /**
   * Creates a new album folder in Google Drive.
   */
  async createAlbumFolder(name: string, parentFolderId: string, accessToken: string) {
    const metadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId]
    };

    const response = await axios.post(DRIVE_API_URL, metadata, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  },

  /**
   * Deletes a file from Google Drive.
   */
  async deleteFile(fileId: string, accessToken: string) {
    await axios.delete(`${DRIVE_API_URL}/${fileId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  /**
   * Updates or creates the gallery.json metadata file.
   */
  async saveGalleryConfig(folderId: string, config: GalleryConfig, accessToken: string) {
    // 1. Check if gallery.json exists
    const q = `'${folderId}' in parents and name = 'gallery.json' and trashed = false`;
    const searchResponse = await axios.get(`${DRIVE_API_URL}?q=${encodeURIComponent(q)}&access_token=${accessToken}&fields=files(id)`);
    
    const fileId = searchResponse.data.files.length > 0 ? searchResponse.data.files[0].id : null;

    const metadata = {
      name: 'gallery.json',
      mimeType: 'application/json',
      parents: fileId ? undefined : [folderId],
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' }));

    if (fileId) {
      // Update existing
      await axios.patch(`${UPLOAD_API_URL.replace('files?', `files/${fileId}?`)}`, formData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } else {
      // Create new
      await axios.post(UPLOAD_API_URL, formData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
  }
};
