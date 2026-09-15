export type FeedbackType = 'bug' | 'suggestion' | 'toilet_update';
export type FeedbackArea = 'map' | 'service' | 'auth' | 'other';
export type FeedbackStatus = 'received' | 'reviewing' | 'resolved';

export type FeedbackInput = {
  type: FeedbackType;
  area: FeedbackArea;
  title: string;
  message: string;
};

export type Feedback = FeedbackInput & {
  id: string;
  status: FeedbackStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  adminReply: string | null;
  likeCount: number;
};
