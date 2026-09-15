export type User = {
  id: string;
  email: string;
  nickname: string;
  name: string;
  profileImage: string | null;
  role: 'user' | 'admin';
};

export type SignUpInput = {
  email: string;
  password: string;
  nickname: string;
};
