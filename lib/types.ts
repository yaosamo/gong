export type Celebration = {
  id: string;
  name: string;
  comment: string;
  createdAt: string;
  reactions: number;
  authorSessionId: string | null;
  noteX: number | null;
  noteY: number | null;
  noteRotate: number | null;
  locationLabel: string;
  city: string | null;
  region: string | null;
  country: string | null;
};

export type CelebrationInput = {
  name: string;
  comment: string;
  authorSessionId: string;
};

export type CelebrationPositionInput = {
  noteX: number;
  noteY: number;
  noteRotate: number;
};

export type CursorPresence = {
  id: string;
  name: string;
  x: number;
  y: number;
  updatedAt: string;
  color: string;
};
