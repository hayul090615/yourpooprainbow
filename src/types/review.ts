export type ToiletReview = {
  id: string;
  toiletId: string;
  rating: number;
  cleanliness: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  authorUserId: string;
  likeCount: number;
};

export type ToiletReviewInput = {
  toiletId: string;
  toiletName: string;
  rating: number;
  cleanliness: number;
  content: string;
};
