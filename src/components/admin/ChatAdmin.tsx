import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Send, 
  Paperclip, 
  X, 
  FileText, 
  Image, 
  Download, 
  Check, 
  CheckCheck, 
  MoreVertical,
  Edit2,
  Trash2,
  Save,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { 
  addMessageToRequest,
  uploadFile,
  markMessagesAsRead,
  editMessage,
  deleteMessage
} from "@/services/sharedService";
import {FileAttachment, MessageData, RequestData,} from '@/services/types';
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import TextareaAutosize from "react-textarea-autosize";

interface ChatAdminProps {
  request: RequestData | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onMessageSent: () => void;
  onMessagesRead?: (requestId: string) => void;
}

const ChatAdmin = ({ 
  request, 
  isOpen, 
  onOpenChange, 
  onMessageSent,
  onMessagesRead
}: ChatAdminProps) => {
  const { currentUser } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Estado para permissão de notificações
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

  const getParticipants = () => {
    if (!messages.length) return [];
    const participants = new Set<string>();
    messages.forEach(msg => {
      if (msg.userName && !msg.isDeleted) {
        participants.add(msg.userName);
      }
    });
    return Array.from(participants);
  };

  useEffect(() => {
    if (!request || !isOpen) return;

    let initialLoad = true;
    let previousMessageCount = messages.length;

    const unsubscribe = onSnapshot(
      doc(db, request.collectionName, request.id),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const currentMessages = data.messages || [];
          
          if (!initialLoad && currentMessages.length > previousMessageCount) {
            setHasNewMessage(true);
            
            // Notificar apenas se o chat não estiver aberto
            if (!isOpen && notificationPermission === "granted") {
              const lastMessage = currentMessages[currentMessages.length - 1];
              // Verificar se a última mensagem não é do usuário atual
              if (lastMessage && currentUser && lastMessage.userId !== currentUser.uid) {
                showNotification(
                  "Nova mensagem",
                  `${lastMessage.userName}: ${lastMessage.message || "Arquivo enviado"}`
                );
              }
            }
          }
          
          setMessages(currentMessages);
          previousMessageCount = currentMessages.length;
          setIsLoading(false);
          initialLoad = false;
        }
      }
    );

    return () => unsubscribe();
  }, [request, isOpen, notificationPermission, messages.length]); // Adicionado messages.length

  // Solicitar permissão para notificações quando o componente montar
  useEffect(() => {
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  }, []);

  // Função para mostrar notificação
  const showNotification = (title: string, body: string) => {
    if (notificationPermission === "granted") {
      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico",
        requireInteraction: false
      });

      // Fechar a notificação após 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (request && isOpen && currentUser) {
      const markAsRead = async () => {
        try {
          await markMessagesAsRead(
            request.id, 
            request.collectionName, 
            currentUser.uid, 
            true
          );
          
          if (onMessagesRead) {
            onMessagesRead(request.id);
          }
        } catch (error) {
          console.error("Erro ao marcar mensagens como lidas:", error);
        }
      };
      
      markAsRead();
    }
  }, [request, isOpen, currentUser, onMessagesRead]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 10MB permitido.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async () => {
    if (!request || (!newMessage.trim() && !selectedFile) || !currentUser) return;
    
    try {
      setIsLoading(true);
      let attachment: FileAttachment | undefined;

      if (selectedFile) {
        setUploadProgress(0);
        attachment = await uploadFile(selectedFile, request.id);
        setUploadProgress(100);
      }

      await addMessageToRequest(
        request.id, 
        newMessage || (selectedFile ? `Arquivo enviado: ${selectedFile.name}` : ""), 
        true,
        request.collectionName,
        currentUser?.displayName || "Administrador",
        currentUser.uid,
        attachment
      );
      
      setNewMessage("");
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      toast.success("Mensagem enviada");
      onMessageSent();
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!request || !editingText.trim()) return;

    try {
      await editMessage(
        request.id,
        request.collectionName,
        messageId,
        editingText,
        currentUser?.uid || ""
      );
      
      setEditingMessageId(null);
      setEditingText("");
      toast.success("Mensagem editada");
    } catch (error) {
      toast.error("Erro ao editar mensagem");
      console.error("Error:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!request) return;

    try {
      await deleteMessage(
        request.id,
        request.collectionName,
        messageId,
        currentUser?.uid || ""
      );
      
      toast.success("Mensagem apagada");
    } catch (error) {
      toast.error("Erro ao apagar mensagem");
      console.error("Error:", error);
    }
  };

  const startEditing = (message: MessageData) => {
    setEditingMessageId(message.id);
    setEditingText(message.message);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const canEditOrDelete = (message: MessageData) => {
    return currentUser && message.userId === currentUser.uid && !message.isDeleted;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const renderMessageStatus = (msg: MessageData) => {
    if (msg.isAdmin) {
      if (msg.read && msg.readBy && msg.readBy.length > 0) {
        return <CheckCheck className="h-4 w-4 text-blue-500" />;
      } else if (msg.delivered) {
        return <Check className="h-4 w-4 text-gray-400" />;
      }
    }
    return null;
  };

  // Handler para tecla Enter no campo de nova mensagem
  const handleNewMessageKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handler para tecla Enter no campo de edição
  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, messageId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditMessage(messageId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                Chat da Solicitação
                {hasNewMessage && (
                  <Badge variant="destructive" className="text-xs">
                    Nova mensagem
                  </Badge>
                )}
              </DialogTitle>
              {request && (
                <DialogDescription>
                  {getReadableRequestType(request.type)} - {request.userName || request.userEmail} - 
                  {format(new Date(request.createdAt.toMillis()), "dd/MM/yyyy", { locale: ptBR })}
                  {getParticipants().length > 0 && (
                    <span className="ml-2">
                      | Participantes: {getParticipants().join(", ")}
                    </span>
                  )}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto p-2 border rounded-md">
              {messages.length > 0 ? (
                messages.map((msg, index) => (
                  <div 
                    key={msg.id || index} 
                    className={`relative group p-3 rounded-lg ${
                      msg.isDeleted 
                        ? 'bg-gray-100 text-gray-500 italic' 
                        : msg.isAdmin 
                        ? 'bg-primary text-primary-foreground ml-8' 
                        : 'bg-muted mr-8'
                    }`}
                  >
                    {canEditOrDelete(msg) && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => startEditing(msg)}>
                              <Edit2 className="h-3 w-3 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Apagar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}

                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">
                        {msg.userName}
                        {msg.isEdited && !msg.isDeleted && (
                          <span className="ml-2 text-xs opacity-70">(Editada)</span>
                        )}
                      </span>
                      <div className="flex items-center gap-1">
                        <span>
                          {format(
                            new Date(msg.timestamp.toMillis()),
                            "dd/MM HH:mm",
                            { locale: ptBR }
                          )}
                          {msg.isEdited && msg.editedAt && (
                            <span className="ml-1 text-xs opacity-70">
                              (editada {format(
                                new Date(msg.editedAt.toMillis()),
                                "dd/MM HH:mm",
                                { locale: ptBR }
                              )})
                            </span>
                          )}
                        </span>
                        {renderMessageStatus(msg)}
                      </div>
                    </div>
                    
                    {msg.attachment && !msg.isDeleted && (
                      <div className="mb-2 p-2 bg-white/10 rounded border border-white/20">
                        <div className="flex items-center gap-2">
                          {getFileIcon(msg.attachment.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{msg.attachment.name}</p>
                            <p className="text-xs opacity-75">{formatFileSize(msg.attachment.size)}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(msg.attachment!.url, '_blank')}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {msg.attachment.type.startsWith('image/') && (
                          <div className="mt-2">
                            <img 
                              src={msg.attachment.url} 
                              alt={msg.attachment.name}
                              className="max-w-full h-auto rounded cursor-pointer"
                              style={{ maxHeight: '200px' }}
                              onClick={() => window.open(msg.attachment!.url, '_blank')}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {editingMessageId === msg.id ? (
                      <div className="space-y-2">
                        <TextareaAutosize
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => handleEditKeyDown(e, msg.id)}
                          className="min-h-[60px] resize-none w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Edite sua mensagem..."
                          minRows={2}
                          maxRows={6}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEditMessage(msg.id)}
                            disabled={!editingText.trim()}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      msg.message && <p className={msg.isDeleted ? "text-gray-500 italic" : ""}>{msg.message}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma mensagem ainda</p>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
          
          {selectedFile && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded border">
              {getFileIcon(selectedFile.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRemoveFile}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
          
          {/* Área de entrada de mensagens reorganizada */}
          <div className="flex gap-2 items-end pl-3">
            <div className="flex-1">
              <TextareaAutosize
                placeholder="Digite sua mensagem..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleNewMessageKeyDown}
                disabled={isLoading}
                minRows={1}
                maxRows={3}
                className="w-full min-h-[40px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div className="flex gap-2 mb-1.5 mr-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="*/*"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="flex-shrink-0"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button 
                onClick={handleSendMessage} 
                className="flex-shrink-0"
                disabled={isLoading || (!newMessage.trim() && !selectedFile)}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const getReadableRequestType = (type: string): string => {
  switch (type) {
    case "reservation": return "Reserva";
    case "purchase": return "Compra";
    case "support": return "Suporte";
    default: return type;
  }
};

export default ChatAdmin;