import React from "react";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";

interface MessageBadgeProps {
  hasUnreadMessages: boolean;
  unreadCount?: number;
  className?: string;
}

const MessageBadge = ({ hasUnreadMessages, unreadCount, className = "" }: MessageBadgeProps) => {
  if (!hasUnreadMessages) return null;

  return (
    <Badge 
      variant="destructive" 
      className={`flex items-center gap-1 text-xs ${className}`}
    >
      <MessageCircle className="h-3 w-3" />
      {unreadCount && unreadCount > 0 ? unreadCount : "Nova"}
    </Badge>
  );
};

export default MessageBadge;