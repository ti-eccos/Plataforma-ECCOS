import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  VisuallyHidden,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Edit, Trash2, Image, Type, Calendar, AlertCircle, Upload, FileImage, User, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Notice,
  createNotice,
  updateNotice,
  deleteNotice,
  deactivateNotice,
  subscribeToActiveNotices
} from '@/services/noticeService';
import {
  resizeImage,
  validateImageFile,
  generateImagePreview
} from '@/components/imageUtils';
import { cn } from '@/lib/utils';

const styles = `
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

interface NoticeBoardProps {
  className?: string;
}

const NoticeBoard: React.FC<NoticeBoardProps> = ({ className = '' }) => {
  const { currentUser, isSuperAdmin, userPermissions } = useAuth();
  const canEditNoticeBoard = isSuperAdmin || userPermissions['notice-board-edit'];
  
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!document.querySelector('#line-clamp-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'line-clamp-styles';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }
  }, []);

  useEffect(() => {
    let unsubscribe: () => void;
    unsubscribe = subscribeToActiveNotices((newNotices) => {
      setNotices(newNotices);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const [newNotice, setNewNotice] = useState<Partial<Notice & { imageFile?: File }>>({
    type: 'text',
    title: '',
    content: '',
    priority: 'medium',
    isActive: true,
  });

  const handleAddNotice = async () => {
    if (!currentUser || !newNotice.title) return;
    setIsUploading(true);
    try {
      await createNotice({
        type: newNotice.type || 'text',
        title: newNotice.title,
        content: newNotice.content ?? '',
        imageFile: newNotice.imageFile,
        priority: newNotice.priority || 'medium',
        expiresAt: newNotice.expiresAt,
        isActive: true,
        createdBy: currentUser.email || 'admin',
      });
      resetForm();
    } catch (error) {
      console.error('Erro ao criar aviso:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditNotice = (notice: Notice) => {
    setEditingNotice(notice);
    setNewNotice({
      ...notice,
      expiresAt: notice.expiresAt ? new Date(notice.expiresAt) : undefined,
    });
    setShowAddForm(true);
  };

  const handleUpdateNotice = async () => {
    if (!editingNotice || !currentUser) return;
    setIsUploading(true);
    try {
      await updateNotice(editingNotice.id, {
        ...newNotice,
        imageFile: newNotice.imageFile,
        updatedBy: currentUser.email || 'admin',
      });
      resetForm();
    } catch (error) {
      console.error('Erro ao atualizar aviso:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeactivateNotice = async (id: string) => {
    if (!currentUser) return;
    try {
      await deleteNotice(id);
    } catch (error) {
      console.error('Erro ao excluir aviso:', error);
    }
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }
    try {
      setIsUploading(true);
      const resizedFile = await resizeImage(file, 800, 600, 0.8);
      const preview = await generateImagePreview(resizedFile);
      setNewNotice(prev => ({ ...prev, imageFile: resizedFile }));
      setImagePreview(preview);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      alert('Erro ao processar a imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setEditingNotice(null);
    setNewNotice({
      type: 'text',
      title: '',
      content: '',
      priority: 'medium',
      isActive: true,
    });
    setShowAddForm(false);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'medium': return <Calendar className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className={cn(
      "w-full bg-gradient-to-br from-white via-purple-50 to-gray-50 rounded-3xl shadow-2xl border-2 p-7 mb-8 transform transition-all duration-300 hover:shadow-3xl hover:-translate-y-1",
      className
    )}>
      {canEditNoticeBoard && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-eccos-purple to-sidebar bg-clip-text text-transparent flex items-center gap-2 mb-4">
            Quadro de Avisos
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
              size="sm"
              className="border-eccos-purple text-eccos-purple hover:bg-eccos-purple hover:text-white"
            >
              <Edit className="w-4 h-4 mr-1" />
              {isEditing ? 'Finalizar' : 'Gerenciar'}
            </Button>
            {notices.length < 4 && (
              <Button
                onClick={() => setShowAddForm(true)}
                size="sm"
                className="bg-eccos-purple hover:bg-sidebar text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            )}
          </div>
        </div>
      )}

      {notices.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {notices.map((notice) => (
            <Card
              key={notice.id}
              className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden cursor-pointer"
              onClick={() => setSelectedNotice(notice)}
            >
              {canEditNoticeBoard && isEditing && (
                <div className="absolute top-3 left-3 z-10 flex gap-1">
                  <Button 
                    onClick={(e) => { e.stopPropagation(); handleEditNotice(notice); }} 
                    size="sm" 
                    variant="outline" 
                    className="w-8 h-8 p-0 bg-white/90 hover:bg-white border-gray-300"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={(e) => { e.stopPropagation(); handleDeactivateNotice(notice.id); }}
                    size="sm"
                    variant="outline"
                    className="w-8 h-8 p-0 bg-white/90 hover:bg-red-50 border-gray-300 hover:border-red-300 hover:text-red-600"
                    title="Excluir permanentemente"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}

              <CardContent className="p-0">
                <div className="px-4 pt-4 flex justify-end">
                  <Badge className={`${getPriorityColor(notice.priority)} border text-xs`}>
                    <span className="flex items-center gap-1">
                      {getPriorityIcon(notice.priority)}
                      {notice.priority === 'high' ? 'Urgente' :
                      notice.priority === 'medium' ? 'Importante' : 'Normal'}
                    </span>
                  </Badge>
                </div>

                {notice.type === 'image' && notice.imageUrl && (
                  <div className="relative w-full h-48 rounded-t-2xl overflow-hidden bg-gray-100">
                    <img
                      src={notice.imageUrl}
                      alt={notice.title}
                      className="w-full h-full object-contain bg-white"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm leading-tight">{notice.title}</h3>
                  {notice.content && (
                    <p className="text-gray-600 text-xs leading-relaxed line-clamp-3">{notice.content}</p>
                  )}
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      {new Date(notice.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gray-50 border border-gray-200 rounded-2xl">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 text-gray-500 mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum aviso ativo</h3>
            <p className="text-gray-600 mb-4">
              {canEditNoticeBoard 
                ? "Adicione avisos importantes para que os usuários fiquem informados." 
                : "Não há avisos no momento. Por favor, verifique mais tarde."}
            </p>
            {canEditNoticeBoard && (
              <Button onClick={() => setShowAddForm(true)} className="bg-eccos-purple hover:bg-sidebar text-white">
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Primeiro Aviso
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {canEditNoticeBoard && showAddForm && (
        <Card className="bg-white border border-gray-200 rounded-2xl shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">{editingNotice ? 'Editar Aviso' : 'Novo Aviso'}</h3>
              <Button onClick={resetForm} variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Aviso</label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setNewNotice(prev => ({ ...prev, type: 'text', imageFile: undefined }))}
                    variant={newNotice.type === 'text' ? 'default' : 'outline'}
                    size="sm"
                    className={newNotice.type === 'text' ? 'bg-eccos-purple hover:bg-sidebar' : ''}
                  >
                    <Type className="w-4 h-4 mr-1" /> Texto
                  </Button>
                  <Button
                    onClick={() => setNewNotice(prev => ({ ...prev, type: 'image' }))}
                    variant={newNotice.type === 'image' ? 'default' : 'outline'}
                    size="sm"
                    className={newNotice.type === 'image' ? 'bg-eccos-purple hover:bg-sidebar' : ''}
                  >
                    <Image className="w-4 h-4 mr-1" /> Imagem
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                <input
                  type="text"
                  value={newNotice.title || ''}
                  onChange={(e) => setNewNotice(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eccos-purple focus:border-transparent"
                  placeholder="Digite o título do aviso"
                />
              </div>

              {newNotice.type === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagem</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        disabled={isUploading}
                      >
                        <Upload className="w-4 h-4" />
                        {isUploading ? 'Processando...' : 'Selecionar Imagem'}
                      </Button>
                      {newNotice.imageFile && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FileImage className="w-4 h-4" />
                          <span>{newNotice.imageFile.name}</span>
                          <Button
                            type="button"
                            onClick={() => {
                              setNewNotice(prev => ({ ...prev, imageFile: undefined }));
                              setImagePreview(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            variant="ghost"
                            size="sm"
                            className="w-6 h-6 p-0 text-gray-400 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      {editingNotice && editingNotice.imageUrl && !newNotice.imageFile && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FileImage className="w-4 h-4" />
                          <span>Imagem atual</span>
                        </div>
                      )}
                    </div>
                    {imagePreview && (
                      <div className="border border-gray-200 rounded-lg p-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-md"
                        />
                      </div>
                    )}
                    {editingNotice && editingNotice.imageUrl && !imagePreview && (
                      <div className="border border-gray-200 rounded-lg p-2">
                        <img
                          src={editingNotice.imageUrl}
                          alt="Imagem atual"
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <p className="text-xs text-gray-500 mt-1">Imagem atual</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Formatos aceitos: JPEG, PNG, GIF, WebP. Tamanho máximo: 10MB (será otimizada automaticamente)
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo</label>
                <textarea
                  value={newNotice.content || ''}
                  onChange={(e) => setNewNotice(prev => ({ ...prev, content: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eccos-purple focus:border-transparent resize-none"
                  placeholder="Digite o conteúdo do aviso"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
                <div className="flex gap-2">
                  {[
                    { value: 'low', label: 'Normal', color: 'bg-blue-600 hover:bg-blue-700' },
                    { value: 'medium', label: 'Importante', color: 'bg-yellow-600 hover:bg-yellow-700' },
                    { value: 'high', label: 'Urgente', color: 'bg-red-600 hover:bg-red-700' }
                  ].map((priority) => (
                    <Button
                      key={priority.value}
                      onClick={() => setNewNotice(prev => ({ ...prev, priority: priority.value as any }))}
                      variant={newNotice.priority === priority.value ? 'default' : 'outline'}
                      size="sm"
                      className={newNotice.priority === priority.value ? priority.color : ''}
                    >
                      {priority.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <Button onClick={resetForm} variant="outline" disabled={isUploading}>
                  Cancelar
                </Button>
                <Button
                  onClick={editingNotice ? handleUpdateNotice : handleAddNotice}
                  className="bg-eccos-purple hover:bg-sidebar text-white"
                  disabled={!newNotice.title || isUploading}
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enviando...
                    </div>
                  ) : (
                    `${editingNotice ? 'Atualizar' : 'Adicionar'} Aviso`
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedNotice && (
        <Dialog open={true} onOpenChange={() => setSelectedNotice(null)}>
          <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden gap-0">
            <VisuallyHidden>
              <DialogTitle>{selectedNotice.title}</DialogTitle>
              <DialogDescription>
                {selectedNotice.content || "Sem conteúdo disponível."}
              </DialogDescription>
            </VisuallyHidden>

            <div className="flex flex-col max-h-[95vh] overflow-hidden">
              <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${
                      selectedNotice.priority === 'high' 
                        ? 'bg-red-50 text-red-700 border-red-200' 
                        : selectedNotice.priority === 'medium'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {selectedNotice.priority === 'high' && <AlertCircle className="w-4 h-4" />}
                      {selectedNotice.priority === 'medium' && <Calendar className="w-4 h-4" />}
                      {selectedNotice.priority === 'low' && <Calendar className="w-4 h-4" />}
                      {selectedNotice.priority === 'high' ? 'Urgente' : 
                      selectedNotice.priority === 'medium' ? 'Importante' : 'Normal'}
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                      {selectedNotice.type === 'image' ? '🖼️ Imagem' : '📝 Texto'}
                    </div>
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight pr-4">
                    {selectedNotice.title}
                  </h1>
                </div>
                
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="flex-shrink-0 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 group"
                  aria-label="Fechar modal"
                >
                  <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {selectedNotice.type === 'image' && selectedNotice.imageUrl && (
                  <div className="bg-gray-50 border-b border-gray-200">
                    <div className="max-w-4xl mx-auto">
                      <img
                        src={selectedNotice.imageUrl}
                        alt={selectedNotice.title}
                        className="w-full max-h-[60vh] object-contain bg-white"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="flex items-center justify-center h-64 bg-gray-100 text-gray-500">
                                <div class="text-center">
                                  <div class="text-4xl mb-2">🖼️</div>
                                  <p>Imagem não pôde ser carregada</p>
                                </div>
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="px-6 py-6">
                  {selectedNotice.content && (
                    <div className="mb-8">
                      <div className="prose prose-lg max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base md:text-lg">
                          {selectedNotice.content}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                      Informações do Aviso
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">Publicado em</p>
                          <p className="text-gray-600 mt-1">
                            {new Date(selectedNotice.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">Criado por</p>
                          <p className="text-gray-600 mt-1 truncate">
                            {selectedNotice.createdBy || 'Sistema'}
                          </p>
                        </div>
                      </div>

                      {selectedNotice.updatedAt && (
                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <Clock className="w-4 h-4 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">Atualizado em</p>
                            <p className="text-gray-600 mt-1">
                              {new Date(selectedNotice.updatedAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {selectedNotice.updatedBy && (
                              <p className="text-xs text-gray-500 mt-1">
                                por {selectedNotice.updatedBy}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedNotice.expiresAt && (
                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">Expira em</p>
                            <p className="text-gray-600 mt-1">
                              {new Date(selectedNotice.expiresAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </p>
                            {new Date(selectedNotice.expiresAt) < new Date() && (
                              <p className="text-xs text-red-600 font-medium mt-1">
                                Este aviso expirou
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default NoticeBoard;