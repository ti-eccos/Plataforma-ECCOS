import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, Paperclip, X, FileText, Image, Download, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { 
  addMessageToRequest,
  MessageData,
  RequestData,
  getRequestById,
  uploadFile,
  markMessagesAsRead,
  FileAttachment
} from "@/services/reservationService";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ChatAdminProps {
  request: RequestData | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onMessageSent: () => void;
}

const ChatAdmin = ({ request, isOpen, onOpenChange, onMessageSent }: ChatAdminProps) => {
  const { currentUser } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!request || !isOpen) return;

    const unsubscribe = onSnapshot(
      doc(db, request.collectionName, request.id),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setMessages(data.messages || []);
          setIsLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [request, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (request && isOpen && currentUser) {
      // Marcar mensagens como lidas quando o chat é aberto
      markMessagesAsRead(request.id, request.collectionName, currentUser.uid, true);
    }
  }, [request, isOpen, currentUser]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar tamanho do arquivo (máximo 10MB)
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
    if (!request || (!newMessage.trim() && !selectedFile)) return;
    
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
      // Mensagem do admin
      if (msg.read && msg.readBy && msg.readBy.length > 0) {
        return <CheckCheck className="h-4 w-4 text-blue-500" />;
      } else if (msg.delivered) {
        return <Check className="h-4 w-4 text-gray-400" />;
      }
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                Chat da Solicitação
                {request?.hasUnreadMessages && (
                  <Badge variant="destructive" className="text-xs">
                    Nova mensagem
                  </Badge>
                )}
              </DialogTitle>
              {request && (
                <DialogDescription>
                  {getReadableRequestType(request.type)} - {request.userName || request.userEmail} - {format(
                    new Date(request.createdAt.toMillis()),
                    "dd/MM/yyyy",
                    { locale: ptBR }
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
                    className={`p-3 rounded-lg ${msg.isAdmin ? 'bg-primary text-primary-foreground ml-8' : 'bg-muted mr-8'}`}
                  >
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{msg.userName}</span>
                      <div className="flex items-center gap-1">
                        <span>
                          {format(
                            new Date(msg.timestamp.toMillis()),
                            "dd/MM HH:mm",
                            { locale: ptBR }
                          )}
                        </span>
                        {renderMessageStatus(msg)}
                      </div>
                    </div>
                    
                    {msg.attachment && (
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
                    
                    {msg.message && <p>{msg.message}</p>}
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
          
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Textarea 
                placeholder="Digite sua mensagem..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="resize-none"
                disabled={isLoading}
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-2">
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