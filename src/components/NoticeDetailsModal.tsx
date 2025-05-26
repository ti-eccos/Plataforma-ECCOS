import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  VisuallyHidden
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Notice } from '@/services/noticeService';

interface NoticeDetailsModalProps {
  notice: Notice;
  onClose: () => void;
}

export const NoticeDetailsModal: React.FC<NoticeDetailsModalProps> = ({ notice, onClose }) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        {/* Título e descrição acessíveis */}
        <VisuallyHidden>
          <DialogTitle>{notice.title}</DialogTitle>
          <DialogDescription>
            {notice.content || "Sem conteúdo disponível."}
          </DialogDescription>
        </VisuallyHidden>

        {/* Container com scroll */}
        <div className="max-h-[90vh] overflow-y-auto">
          {/* Header com botão de fechar */}
          <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 pr-8">{notice.title}</h2>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Imagem (se existir) */}
          {notice.type === 'image' && notice.imageUrl && (
            <div className="px-6 pt-4">
              <div className="w-full bg-gray-50 rounded-lg overflow-hidden">
                <img
                  src={notice.imageUrl}
                  alt={notice.title}
                  className="w-full h-auto max-h-96 object-contain mx-auto block"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          {/* Conteúdo de texto */}
          {notice.content && (
            <div className="px-6 py-4">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
                {notice.content}
              </p>
            </div>
          )}

          {/* Data */}
          <div className="px-6 pb-6">
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Publicado em:</span>{' '}
                {new Date(notice.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              {notice.updatedAt && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Atualizado em:</span>{' '}
                  {new Date(notice.updatedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
              {notice.expiresAt && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Expira em:</span>{' '}
                  {new Date(notice.expiresAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};