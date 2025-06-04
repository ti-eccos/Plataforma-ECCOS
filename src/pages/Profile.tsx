// src/pages/Profile.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import AppLayout from '@/components/AppLayout';

const PencilIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className || "h-5 w-5"}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className || "h-5 w-5"}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

const Profile = () => {
  const { currentUser, loading: authLoading, updateUserData } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Estados para gerenciar a foto de perfil
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setDisplayName(userData.displayName || '');
          setBirthDate(userData.birthDate || '');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do perfil.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, toast]);

  // Limpar a URL de preview quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Verificar tipo de arquivo
      if (!file.type.match('image.*')) {
        toast({
          title: 'Erro',
          description: 'Por favor, selecione um arquivo de imagem (JPEG, PNG, etc.)',
          variant: 'destructive',
        });
        return;
      }
      
      // Verificar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'A imagem deve ter no máximo 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !currentUser) return null;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Criar referência para o storage
      const storageRef = ref(storage, `profile_pics/${currentUser.uid}`);
      const uploadTask = uploadBytesResumable(storageRef, photoFile);
      
      return new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            setIsUploading(false);
            console.error('Upload error:', error);
            toast({
              title: 'Erro no upload',
              description: 'Houve um problema ao fazer upload da imagem.',
              variant: 'destructive',
            });
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              setIsUploading(false);
              resolve(downloadURL);
            } catch (error) {
              setIsUploading(false);
              console.error('Error getting download URL:', error);
              toast({
                title: 'Erro',
                description: 'Não foi possível obter a URL da imagem.',
                variant: 'destructive',
              });
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      setIsUploading(false);
      console.error('Upload error:', error);
      toast({
        title: 'Erro no upload',
        description: 'Houve um problema ao fazer upload da imagem.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentUser || !currentUser.photoURL) return;
    
    if (!window.confirm('Tem certeza que deseja remover sua foto de perfil?')) {
      return;
    }
    
    setSaving(true);
    try {
      // 1. Remover a imagem do storage se for uma URL do Firebase Storage
      if (currentUser.photoURL.includes('firebase')) {
        const storageRef = ref(storage, `profile_pics/${currentUser.uid}`);
        try {
          await deleteObject(storageRef);
        } catch (error) {
          console.log('Storage file not found or already deleted');
        }
      }
      
      // 2. Atualizar o documento do usuário
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        photoURL: null
      });
      
      // 3. Atualizar o contexto local imediatamente
      updateUserData({ photoURL: null });
      
      // 4. Limpar estados locais
      setPhotoPreview(null);
      setPhotoFile(null);
      
      // 5. Limpar o input de arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: 'Foto removida',
        description: 'Sua foto de perfil foi removida com sucesso.',
      });
    } catch (error) {
      console.error('Error removing profile photo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a foto de perfil.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    
    setSaving(true);
    try {
      const updates: Record<string, any> = {
        displayName,
        birthDate
      };
      
      // Fazer upload da nova foto se existir
      if (photoFile) {
        const photoURL = await uploadPhoto();
        if (photoURL) {
          updates.photoURL = photoURL;
        }
      }
      
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, updates);
      
      // Atualizar o contexto local imediatamente
      updateUserData(updates);
      
      toast({
        title: 'Perfil atualizado',
        description: 'Seus dados foram salvos com sucesso.',
      });
      
      // Resetar estados da foto
      setPhotoFile(null);
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
        setPhotoPreview(null);
      }
      
      // Resetar o input de arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o perfil.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eccos-blue"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-6">Perfil do Usuário</h1>
        
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative group">
              {photoPreview || currentUser?.photoURL ? (
                <div className="h-16 w-16 rounded-full overflow-hidden">
                  <img
                    src={photoPreview || currentUser?.photoURL || ''}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full flex items-center justify-center bg-gradient-to-br from-sidebar to-eccos-purple text-white text-2xl font-bold">
                  {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              
              <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Label 
                  htmlFor="profilePhoto" 
                  className="cursor-pointer p-2 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100"
                >
                  <PencilIcon className="h-4 w-4 text-gray-800" />
                </Label>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{currentUser?.displayName || currentUser?.email}</h2>
              <p className="text-gray-500 capitalize">{currentUser?.role}</p>
            </div>
          </div>

          <Input
            id="profilePhoto"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
            disabled={isUploading || saving}
            ref={fileInputRef}
          />

          {isUploading && (
            <div className="mt-2 mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-eccos-blue h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enviando imagem... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="displayName">Nome</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
            
            <div>
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input
                type="date"
                id="birthDate"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
          </div>

          {/* Botão para remover foto */}
          {currentUser?.photoURL && !photoPreview && (
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={handleRemovePhoto}
                disabled={saving || isUploading}
                className="text-red-600 border-red-300 hover:bg-red-50 flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                <span>Remover Foto de Perfil</span>
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving || isUploading}
            className="min-w-[180px]"
          >
            {saving ? 'Salvando...' : (isUploading ? 'Enviando imagem...' : 'Salvar Alterações')}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;