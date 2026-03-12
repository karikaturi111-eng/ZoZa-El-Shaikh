export interface Track {
  id: string;
  title: string;
  artist: string;
  coverurl: string;
  audiourl: string;
  duration: string;
  genre: string;
  description?: string;
  created_at?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: number;
}
