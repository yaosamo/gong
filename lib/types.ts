export type Celebration = {
  id: string;
  name: string;
  comment: string;
  createdAt: string;
  reactions: number;
  locationLabel: string;
  city: string | null;
  region: string | null;
  country: string | null;
};

export type CelebrationInput = {
  name: string;
  comment: string;
};

export type CursorPresence = {
  id: string;
  name: string;
  x: number;
  y: number;
  updatedAt: string;
  color: string;
};
