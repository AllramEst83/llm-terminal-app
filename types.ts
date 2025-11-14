
export interface Source {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  sources?: Source[];
  timestamp?: string;
}