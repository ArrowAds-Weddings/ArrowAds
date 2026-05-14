import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Save, 
  LogOut, 
  ChevronLeft, 
  Plus, 
  Grid, 
  Settings,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Layout,
  Type,
  Hash,
  Lock,
  User,
  Link as LinkIcon,
  Unlink
} from 'lucide-react';
import { driveService, DriveImage, GalleryConfig, DriveAlbum } from './driveService';

const FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const ADMIN_USER = import.meta.env.VITE_ADMIN_USERNAME || 'Admin';
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || '123123123';

export default function Admin() {
  // Authentication states
  const [isLocalAuthenticated, setIsLocalAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dashboard states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryConfig['images']>([]);
  const [untrackedImages, setUntrackedImages] = useState<DriveImage[]>([]);
  const [activeTab, setActiveTab] = useState<'gallery' | 'albums'>('gallery');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Album states
  const [albums, setAlbums] = useState<DriveAlbum[]>([]);
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [galleryFolderId, setGalleryFolderId] = useState<string | null>(FOLDER_ID);
  const [albumImages, setAlbumImages] = useState<DriveImage[]>([]);
  const [newAlbumName, setNewAlbumName] = useState('');
  const albumFileInputRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tokenClientRef = useRef<any>(null);

  // --- Auth & Session Logic ---
  useEffect(() => {
    // 1. Check local session
    const localAuth = sessionStorage.getItem('admin_auth');
    if (localAuth === 'true') {
      setIsLocalAuthenticated(true);
    }

    // 2. Initialize Google Identity Service
    const initGis = () => {
      try {
        if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
          console.log('Google Auth not yet ready...');
          return;
        }
        
        // @ts-ignore
        tokenClientRef.current = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly',
          callback: (response: any) => {
            if (response.error !== undefined) {
               console.error('Google Auth Error:', response);
               return;
            }
            setAccessToken(response.access_token);
            sessionStorage.setItem('drive_token', response.access_token);
            showStatus('success', 'Google Drive linked successfully!');
          },
        });
        console.log('Google Auth initialized successfully');
      } catch (err) {
        console.error('Error during initGis:', err);
      }
    };

    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (script) {
      script.addEventListener('load', initGis);
    }
    
    // Also try to init after a short delay if script already exists
    const timer = setTimeout(initGis, 1000);

    // 3. Check drive token session
    const savedToken = sessionStorage.getItem('drive_token');
    if (savedToken) {
      setAccessToken(savedToken);
    }
    
    setIsLoading(false);
    
    return () => {
      if (script) script.removeEventListener('load', initGis);
      clearTimeout(timer);
    };
  }, []);

  const handleLocalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername === ADMIN_USER && loginPassword === ADMIN_PASS) {
      setIsLocalAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid credentials. Access denied.');
    }
  };

  const handleDriveConnect = () => {
    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken();
    } else {
      showStatus('error', 'Google API not ready. Please refresh.');
    }
  };

  const handleLogout = () => {
    setIsLocalAuthenticated(false);
    setAccessToken(null);
    sessionStorage.removeItem('admin_auth');
    sessionStorage.removeItem('drive_token');
  };

  // --- Data Loading ---
  useEffect(() => {
    if (isLocalAuthenticated) {
      fetchData();
    }
  }, [isLocalAuthenticated]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (!FOLDER_ID || !API_KEY) {
        showStatus('error', 'DRIVE_FOLDER_ID or API_KEY is missing in .env');
        setIsLoading(false);
        return;
      }

      // We only need API_KEY for fetching/viewing
      const fetchedAlbums = await driveService.listAlbums(FOLDER_ID, API_KEY);
      const galleryFolder = fetchedAlbums.find(a => a.name.toLowerCase() === 'gallery');
      const targetGalleryFolderId = galleryFolder ? galleryFolder.id : FOLDER_ID;
      
      setGalleryFolderId(targetGalleryFolderId);

      const [driveFiles, galleryConfig] = await Promise.all([
        driveService.listFiles(targetGalleryFolderId, API_KEY),
        driveService.getGalleryConfig(targetGalleryFolderId, API_KEY)
      ]);

      const configImages = galleryConfig?.images || [];
      const folderImages = driveFiles.filter(f => f.name !== 'gallery.json');
      const untracked = folderImages.filter(f => !configImages.find(ci => ci.id === f.id));
      
      setGalleryItems(configImages.sort((a, b) => a.order - b.order));
      setUntrackedImages(untracked);

      const filteredAlbums = fetchedAlbums.filter(a => a.name.toLowerCase() !== 'gallery');
      setAlbums(filteredAlbums);
      if (filteredAlbums.length > 0) {
        setActiveAlbumId(filteredAlbums[0].id);
        fetchAlbumImages(filteredAlbums[0].id);
      }
      
    } catch (error) {
      console.error(error);
      showStatus('error', 'Failed to fetch data from Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAlbumImages = async (albumId: string) => {
    if (!API_KEY) return;
    try {
      const images = await driveService.listAlbumImages(albumId, API_KEY);
      setAlbumImages(images);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newAlbumName.trim() || !FOLDER_ID) return;
    setIsSaving(true);
    try {
      const newAlbum = await driveService.createAlbumFolder(newAlbumName.trim(), FOLDER_ID, accessToken);
      setAlbums(prev => [...prev, { id: newAlbum.id, name: newAlbum.name }]);
      setNewAlbumName('');
      setActiveAlbumId(newAlbum.id);
      setAlbumImages([]);
      showStatus('success', 'Album created!');
    } catch (error) {
      showStatus('error', 'Failed to create album.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    if (!accessToken) return;
    
    const albumToDelete = albums.find(a => a.id === albumId);
    if (albumToDelete && (albumToDelete.name.toLowerCase() === 'album' || albumToDelete.name.toLowerCase() === 'gallery')) {
      showStatus('error', `The "${albumToDelete.name}" folder is protected and cannot be deleted.`);
      return;
    }

    if (!window.confirm('Delete this entire album and all its photos?')) return;
    
    setIsSaving(true);
    try {
      await driveService.deleteFile(albumId, accessToken);
      setAlbums(prev => prev.filter(a => a.id !== albumId));
      if (activeAlbumId === albumId) {
        if (albums.length > 1) {
          const nextAlbum = albums.find(a => a.id !== albumId);
          if (nextAlbum) {
            setActiveAlbumId(nextAlbum.id);
            fetchAlbumImages(nextAlbum.id);
          }
        } else {
          setActiveAlbumId(null);
          setAlbumImages([]);
        }
      }
      showStatus('success', 'Album deleted.');
    } catch (error) {
      showStatus('error', 'Failed to delete album.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAlbumUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !accessToken || !activeAlbumId) return;

    setIsSaving(true);
    showStatus('success', `Uploading ${files.length} images to album...`);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 2 * 1024 * 1024) {
          const proceed = window.confirm(`"${file.name}" is quite large (${(file.size / 1024 / 1024).toFixed(1)}MB). Large files can slow down your website. Would you like to upload it anyway?`);
          if (!proceed) continue;
        }

        const maxNum = albumImages.length > 0 ? Math.max(...albumImages.map(img => parseInt(img.name.split('.')[0]) || 0)) : 0;
        const nextIndex = maxNum + 1 + i;
        const newFileName = `${nextIndex}.jpeg`;
        const renamedFile = new File([file], newFileName, { type: file.type });

        const uploadedFile = await driveService.uploadFile(renamedFile, activeAlbumId, accessToken);
        setAlbumImages(prev => [...prev, { id: uploadedFile.id, name: newFileName }]);
      }
      showStatus('success', 'Upload to album complete!');
    } catch (error) {
      showStatus('error', 'Upload failed.');
    } finally {
      setIsSaving(false);
      if (albumFileInputRef.current) albumFileInputRef.current.value = '';
    }
  };

  const handleDeleteAlbumImage = async (id: string) => {
    if (!accessToken) return;
    if (!window.confirm('Delete this photo from the album?')) return;
    
    setIsSaving(true);
    try {
      await driveService.deleteFile(id, accessToken);
      setAlbumImages(prev => prev.filter(item => item.id !== id));
      showStatus('success', 'Image removed from album.');
    } catch (error) {
      showStatus('error', 'Delete failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportOne = (img: DriveImage) => {
    const maxOrder = galleryItems.length > 0 ? Math.max(...galleryItems.map(item => item.order)) : 0;
    const newItem = {
      id: img.id,
      filename: img.name,
      title: 'New Wedding Moment',
      category: 'Photography',
      size: 'normal' as const,
      order: maxOrder + 1
    };
    setGalleryItems(prev => [...prev, newItem].sort((a, b) => a.order - b.order));
    setUntrackedImages(prev => prev.filter(f => f.id !== img.id));
    showStatus('success', 'Photo added to collection! Save to finalize.');
  };

  const handleImportAll = () => {
    const maxOrder = galleryItems.length > 0 ? Math.max(...galleryItems.map(item => item.order)) : 0;
    const newItems = untrackedImages.map((img, idx) => ({
      id: img.id,
      filename: img.name,
      title: 'New Wedding Moment',
      category: 'Photography',
      size: 'normal' as const,
      order: maxOrder + idx + 1
    }));
    setGalleryItems(prev => [...prev, ...newItems].sort((a, b) => a.order - b.order));
    setUntrackedImages([]);
    showStatus('success', `${untrackedImages.length} photos added! Save to finalize.`);
  };

  // --- Image Actions ---
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !accessToken) {
      if (!accessToken) showStatus('error', 'Please connect Google Drive first.');
      return;
    }

    setIsSaving(true);
    showStatus('success', `Uploading ${files.length} images...`);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (file.size > 2 * 1024 * 1024) {
          const proceed = window.confirm(`"${file.name}" is quite large (${(file.size / 1024 / 1024).toFixed(1)}MB). Large files can slow down your website. Would you like to upload it anyway?`);
          if (!proceed) continue;
        }

        const maxOrder = galleryItems.length > 0 ? Math.max(...galleryItems.map(item => item.order)) : 0;
        const nextIndex = maxOrder + 1;
        const newFileName = `${nextIndex}.jpeg`;
        const renamedFile = new File([file], newFileName, { type: file.type });

        const uploadedFile = await driveService.uploadFile(renamedFile, galleryFolderId || FOLDER_ID, accessToken);
        const newItem = {
          id: uploadedFile.id,
          filename: newFileName,
          title: 'New Wedding Moment',
          category: 'Photography',
          size: 'normal' as const,
          order: nextIndex
        };
        setGalleryItems(prev => [...prev, newItem]);
      }
      showStatus('success', 'Upload complete! Don\'t forget to save.');
    } catch (error) {
      showStatus('error', 'Upload failed. Check permissions.');
    } finally {
      setIsSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) {
      showStatus('error', 'Please connect Google Drive first.');
      return;
    }
    if (!window.confirm('Delete this photo from Drive?')) return;
    
    setIsSaving(true);
    try {
      await driveService.deleteFile(id, accessToken);
      setGalleryItems(prev => prev.filter(item => item.id !== id));
      setUntrackedImages(prev => prev.filter(item => item.id !== id));
      showStatus('success', 'Image removed.');
    } catch (error) {
      showStatus('error', 'Delete failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateItem = (id: string, field: string, value: any) => {
    setGalleryItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSaveAll = async () => {
    if (!accessToken) {
      showStatus('error', 'Connect Google Drive to save changes.');
      return;
    }
    setIsSaving(true);
    try {
      const config: GalleryConfig = { images: galleryItems };
      await driveService.saveGalleryConfig(galleryFolderId || FOLDER_ID, config, accessToken);
      showStatus('success', 'Saved to Drive!');
    } catch (error) {
      showStatus('error', 'Failed to save config.');
    } finally {
      setIsSaving(false);
    }
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // --- RENDER: LOGIN ---
  if (!isLocalAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
        <div className="absolute inset-0 z-0 opacity-20 overflow-hidden">
          <div className="bg-blob bg-blob-1 top-[-10%] right-[10%]"></div>
          <div className="bg-blob bg-blob-2 bottom-[-10%] left-[10%]"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gold opacity-50"></div>
          
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gold/10 rounded-3xl flex items-center justify-center mx-auto mb-6 transform -rotate-3">
              <Lock className="text-gold w-8 h-8" />
            </div>
            <h1 className="text-2xl text-white font-serif tracking-[0.2em] mb-2 uppercase">Luxe Admin</h1>
            <p className="text-slate-400 text-xs tracking-widest uppercase">Arrow Ads Wedding Studio</p>
          </div>
          
          <form onSubmit={handleLocalLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-gold" />
                <input 
                  type="text" 
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none focus:border-gold/50 transition-all"
                  placeholder="Enter username"
                  autoComplete="username"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-gold" />
                <input 
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none focus:border-gold/50 transition-all font-mono"
                  placeholder="********"
                  autoComplete="current-password"
                />
              </div>
            </div>
            
            <AnimatePresence>
              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 rounded-xl flex items-center space-x-2"
                >
                  <AlertCircle size={14} />
                  <span>{loginError}</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <button 
              type="submit"
              className="w-full bg-gold/90 py-5 rounded-2xl text-slate-950 font-bold tracking-[0.2em] hover:bg-white transition-all duration-500 transform active:scale-[0.98] mt-4"
            >
              LOGIN TO DASHBOARD
            </button>
          </form>
          
          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest leading-relaxed">
              &copy; 2026 ARROW ADS WEDDING • SECURE SERVER
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- RENDER: DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-gold/20">
      {/* Dynamic Cursor Overide */}
      <style>{`body { cursor: auto !important; }`}</style>
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a href="/" className="p-2 hover:bg-slate-100 rounded-full transition-all group">
              <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-gold" />
            </a>
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <h1 className="font-serif text-xl tracking-widest uppercase">
              ARROW ADS <span className="text-gold italic">Admin</span>
            </h1>
          </div>

          <div className="flex items-center space-x-6">
            <AnimatePresence>
              {statusMessage && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium ${
                    statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{statusMessage.text}</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <button 
              onClick={handleSaveAll}
              disabled={isSaving || !accessToken}
              className="px-6 py-2 bg-slate-900 text-white rounded-xl flex items-center space-x-2 hover:bg-gold transition-all disabled:opacity-30 shadow-lg shadow-black/5"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
              <span className="text-sm font-bold tracking-widest">SAVE</span>
            </button>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-8">
        <div className="flex gap-10">
          {/* Sidebar */}
          <aside className="w-72 flex-shrink-0 space-y-6">
            {/* Folder Status Widget */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden relative group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full -mr-8 -mt-8 transition-all group-hover:scale-150"></div>
               <h3 className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-4">Drive Connection</h3>
               {accessToken ? (
                 <div className="flex items-center space-x-3 text-green-600">
                    <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center">
                       <CheckCircle2 size={20} />
                    </div>
                    <div>
                       <p className="text-xs font-bold uppercase">Linked</p>
                       <p className="text-[10px] text-slate-400">Read/Write Access Active</p>
                    </div>
                 </div>
               ) : (
                 <button 
                  onClick={handleDriveConnect}
                  className="w-full py-4 bg-gold/10 text-gold rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 hover:bg-gold hover:text-white transition-all border border-dashed border-gold/30"
                 >
                   <LinkIcon size={14} />
                   <span>CONNECT GOOGLE DRIVE</span>
                 </button>
               )}
            </div>

            <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab('gallery')}
                className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all ${
                  activeTab === 'gallery' ? 'bg-white text-gold shadow-sm font-bold' : 'text-slate-500 hover:bg-white/50'
                }`}
              >
                <Grid size={18} />
                <span className="text-sm">Wedding Gallery</span>
              </button>
              <button 
                onClick={() => setActiveTab('albums')}
                className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all ${
                  activeTab === 'albums' ? 'bg-white text-gold shadow-sm font-bold' : 'text-slate-500 hover:bg-white/50'
                }`}
              >
                <ImageIcon size={18} />
                <span className="text-sm">Albums</span>
              </button>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all text-red-400 hover:text-red-500 hover:bg-red-50"
              >
                <LogOut size={18} />
                <span className="text-sm">Secure Logout</span>
              </button>
            </nav>

            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden">
               <div className="absolute bottom-0 right-0 opacity-10"><ImageIcon size={100} /></div>
               <h3 className="text-gold font-serif text-lg mb-4 italic">Management</h3>
               <p className="text-slate-400 text-xs leading-relaxed mb-6">
                 Note: Uploading and Deleting photos requires an active Google Drive token. Link your drive if buttons are disabled.
               </p>
               <div className="flex items-center space-x-2 text-gold">
                  <Camera size={14} />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Total: {galleryItems.length}</span>
               </div>
            </div>
          </aside>

          {/* Content Area */}
          <div className="flex-1">
            {activeTab === 'gallery' && (
              <div className="space-y-8">
                {/* Upload Section - Only Show if Linked */}
                {accessToken ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative h-48 border-2 border-dashed border-slate-200 bg-white rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all hover:border-gold hover:shadow-2xl hover:shadow-gold/10"
                  >
                    <input 
                      type="file" 
                      multiple 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleUpload}
                      accept="image/*"
                    />
                    <div className="w-14 h-14 bg-slate-50 rounded-3xl flex items-center justify-center mb-4 group-hover:bg-gold/10 transition-all transform group-hover:rotate-12">
                      <Upload className="text-slate-400 group-hover:text-gold w-6 h-6" />
                    </div>
                    <p className="text-slate-900 font-bold uppercase tracking-widest text-xs">Drop Wedding Photos Here</p>
                    <p className="text-slate-400 text-[10px] mt-2 uppercase tracking-[0.2em]">Auto-renamed in sequence</p>
                  </motion.div>
                ) : (
                  <div className="h-48 bg-slate-100 rounded-[2rem] flex flex-col items-center justify-center border border-slate-200 border-dashed grayscale">
                    <Unlink className="text-slate-300 w-10 h-10 mb-4" />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Link Google Drive to Upload</p>
                  </div>
                )}

                {/* Gallery List */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-serif italic">The Collection</h2>
                    <div className="h-[1px] flex-1 bg-slate-200 mx-8"></div>
                  </div>

                  {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-gold" />
                    </div>
                  ) : galleryItems.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-24 text-center border border-slate-100">
                      <ImageIcon className="mx-auto text-slate-100 mb-6" size={48} />
                      <p className="italic text-slate-400">No memories in the collection yet.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {galleryItems.map((item, index) => (
                        <motion.div 
                          key={item.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-8 group hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                        >
                          {/* Image Thumbnail */}                           <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-50 flex-shrink-0 relative border border-slate-100 shadow-inner">
                             <img 
                                src={`https://drive.google.com/thumbnail?id=${item.id}&sz=w400`}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                alt={item.title}
                                onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                                style={{ opacity: 0.1, transition: 'opacity 0.5s' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Wait...';
                                }}
                             />
                             <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-gold text-[9px] px-2 py-1 rounded-lg uppercase font-bold tracking-wider">
                               #{index + 1}
                             </div>
                          </div>

                          {/* Editable Fields */}
                          <div className="flex-1 grid grid-cols-12 gap-8">
                            <div className="col-span-2 border-r border-slate-100 pr-8 flex flex-col justify-center">
                              <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2 flex items-center">
                                <Hash size={10} className="mr-1.5" /> Order
                              </label>
                              <input 
                                type="number" 
                                value={item.order} 
                                onChange={(e) => handleUpdateItem(item.id, 'order', parseInt(e.target.value))}
                                className="w-full font-serif text-xl bg-transparent outline-none focus:text-gold transition-colors"
                              />
                            </div>
                            <div className="col-span-6 flex flex-col justify-center gap-2">
                              <div>
                                <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2 flex items-center">
                                  <Type size={10} className="mr-1.5" /> Moments Caption
                                </label>
                                <input 
                                  type="text" 
                                  value={item.title} 
                                  onChange={(e) => handleUpdateItem(item.id, 'title', e.target.value)}
                                  className="w-full font-serif text-xl bg-transparent outline-none focus:text-gold transition-colors"
                                  placeholder="Enter Caption..."
                                />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2 flex items-center">
                                  <Type size={10} className="mr-1.5" /> Sub-Message
                                </label>
                                <input 
                                  type="text" 
                                  value={item.category} 
                                  onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                                  className="w-full font-sans text-xs bg-transparent outline-none focus:text-gold transition-colors text-slate-500"
                                  placeholder="Enter Sub-Message..."
                                />
                              </div>
                            </div>
                            <div className="col-span-4 flex items-center justify-end px-4 gap-4">
                              <select 
                                value={item.size} 
                                onChange={(e) => handleUpdateItem(item.id, 'size', e.target.value)}
                                className="bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-tighter outline-none border border-slate-100 hover:border-gold transition-colors"
                              >
                                <option value="normal">Square</option>
                                <option value="tall">Dramatic</option>
                                <option value="short">Wide</option>
                              </select>
                              <button 
                                onClick={() => handleDelete(item.id)}
                                disabled={!accessToken}
                                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all disabled:hidden"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Untracked Images Section */}
                {untrackedImages.length > 0 && (
                  <div className="mt-16 bg-slate-900/5 p-10 rounded-[3rem] border border-slate-200 border-dashed relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                      <div>
                        <h3 className="font-serif italic text-2xl text-slate-900 mb-2">New Photos Detected</h3>
                        <p className="text-slate-500 text-xs tracking-widest uppercase font-bold">Found {untrackedImages.length} images in folder but not in collection</p>
                      </div>
                      <button 
                        onClick={handleImportAll}
                        className="px-6 py-3 bg-slate-900 text-gold rounded-xl text-[10px] font-black tracking-[0.2em] hover:bg-gold hover:text-slate-950 transition-all shadow-xl shadow-slate-900/10 uppercase"
                      >
                        Add All to Collection
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {untrackedImages.map(img => (
                        <motion.div 
                          key={img.id}
                          whileHover={{ y: -5 }}
                          className="relative group rounded-[2rem] overflow-hidden aspect-square bg-white shadow-sm border border-slate-100"
                        >
                          <img src={`https://drive.google.com/thumbnail?id=${img.id}&sz=w400`} className="w-full h-full object-cover" alt={img.name} />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-4 backdrop-blur-[2px]">
                            <p className="text-white text-[10px] font-bold mb-4 text-center line-clamp-1">{img.name}</p>
                            <button 
                              onClick={() => handleImportOne(img)}
                              className="px-4 py-2 bg-gold text-slate-950 rounded-lg text-[9px] font-black tracking-widest uppercase hover:bg-white transition-colors"
                            >
                              Add Image
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'albums' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-serif italic">Album Management</h2>
                  <div className="h-[1px] flex-1 bg-slate-200 mx-8"></div>
                </div>

                {/* Create Album */}
                {accessToken && (
                  <form onSubmit={handleCreateAlbum} className="flex space-x-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
                    <input 
                      type="text"
                      value={newAlbumName}
                      onChange={e => setNewAlbumName(e.target.value)}
                      placeholder="New Album Name"
                      className="flex-1 bg-slate-50 px-6 py-3 rounded-2xl outline-none focus:border-gold border border-transparent transition-colors"
                    />
                    <button type="submit" disabled={isSaving || !newAlbumName.trim()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl hover:bg-gold transition-colors font-bold tracking-widest text-xs flex items-center space-x-2 disabled:opacity-50">
                      <Plus size={16} /> <span>CREATE</span>
                    </button>
                  </form>
                )}

                {/* Album Selection */}
                {albums.length > 0 ? (
                  <div className="flex flex-col space-y-6">
                    <div className="flex space-x-4 overflow-x-auto pb-4">
                      {albums.map(album => (
                        <div key={album.id} className="relative group flex-shrink-0">
                          <button
                            onClick={() => { setActiveAlbumId(album.id); fetchAlbumImages(album.id); }}
                            className={`px-6 py-3 rounded-2xl whitespace-nowrap font-bold text-sm transition-colors pr-12 ${activeAlbumId === album.id ? 'bg-gold text-white shadow-lg shadow-gold/20' : 'bg-white text-slate-500 border border-slate-200 hover:border-gold hover:text-gold'}`}
                          >
                            {album.name}
                          </button>
                          {accessToken && album.name !== 'Album' && album.name !== 'Gallery' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(album.id); }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {activeAlbumId && accessToken && (
                      <motion.div 
                        onClick={() => albumFileInputRef.current?.click()}
                        className="group relative h-32 border-2 border-dashed border-slate-200 bg-white rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all hover:border-gold hover:shadow-2xl hover:shadow-gold/10"
                      >
                        <input 
                          type="file" 
                          multiple 
                          ref={albumFileInputRef} 
                          className="hidden" 
                          onChange={handleAlbumUpload}
                          accept="image/*"
                        />
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-gold/10 transition-all transform group-hover:rotate-12">
                          <Upload className="text-slate-400 group-hover:text-gold w-5 h-5" />
                        </div>
                        <p className="text-slate-900 font-bold uppercase tracking-widest text-xs">Drop Photos to Album</p>
                      </motion.div>
                    )}

                    {/* Album Images Grid */}
                    {activeAlbumId && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        {albumImages.length === 0 ? (
                          <div className="col-span-full py-12 text-center text-slate-400 italic">No images in this album.</div>
                        ) : (
                          albumImages.map((img) => (
                            <motion.div key={img.id} initial={{opacity:0}} animate={{opacity:1}} className="relative group rounded-2xl overflow-hidden aspect-square bg-white border border-slate-100 shadow-sm">
                              <img src={`https://drive.google.com/thumbnail?id=${img.id}&sz=w400`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={img.name} />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center flex-col gap-2">
                                <span className="text-white font-bold tracking-widest text-sm">{img.name}</span>
                                {accessToken && (
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteAlbumImage(img.id); }} className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform">
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 italic">No albums created yet.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sync Overlay */}
      <AnimatePresence>
        {isSaving && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/70 backdrop-blur-md flex flex-col items-center justify-center p-12"
          >
            <div className="w-20 h-20 bg-gold/10 rounded-[2rem] flex items-center justify-center mb-6">
               <Loader2 className="w-10 h-10 text-gold animate-spin" />
            </div>
            <p className="text-slate-900 font-serif text-2xl tracking-[0.1em] text-center max-w-sm uppercase italic">
              Synchronizing with Cloud Storage...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
