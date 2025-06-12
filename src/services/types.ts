import { Timestamp } from "firebase/firestore";

export type RequestStatus = "pending" | "approved" | "rejected" | "waitingDelivery" | "delivered" | "completed" | "canceled";
export type RequestType = "reservation" | "purchase" | "support";

export interface FileAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface MessageData {
  message: string;
  isAdmin: boolean;
  userName: string;
  timestamp: Timestamp;
  id: string;
  delivered: boolean;
  read: boolean;
  readBy?: string[];
  attachment?: FileAttachment;
  userId: string;
  isDeleted?: boolean;
  isEdited?: boolean;
  editedAt?: Timestamp;
  originalMessage?: string;
}

export interface RequestData {
  id: string;
  collectionName: string;
  type: RequestType;
  status: RequestStatus;
  description?: string;
  userName: string;
  userEmail: string;
  userId: string;
  createdAt: Timestamp;
  equipmentNames: string[];
  equipmentIds: string[];
  equipmentQuantities: { [type: string]: number };
  unreadMessages?: number;
  hasUnreadMessages?: boolean;
  [key: string]: any;
}