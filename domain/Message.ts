export interface Source {
  title: string;
  uri: string;
}

export class Message {
  constructor(
    public readonly id: string,
    public readonly role: 'user' | 'model' | 'system',
    public readonly text: string,
    public readonly timestamp?: string,
    public readonly sources?: Source[],
    public readonly imageData?: string
  ) {}

  static create(
    role: 'user' | 'model' | 'system',
    text: string,
    timestamp?: string,
    sources?: Source[],
    imageData?: string
  ): Message {
    return new Message(
      Date.now().toString(),
      role,
      text,
      timestamp,
      sources,
      imageData
    );
  }

  static createUser(text: string, timestamp?: string): Message {
    return Message.create('user', text, timestamp);
  }

  static createModel(text: string, timestamp?: string, sources?: Source[]): Message {
    return Message.create('model', text, timestamp, sources);
  }

  static createSystem(text: string, timestamp?: string): Message {
    return Message.create('system', text, timestamp);
  }

  withUpdatedText(newText: string): Message {
    return new Message(
      this.id,
      this.role,
      newText,
      this.timestamp,
      this.sources,
      this.imageData
    );
  }

  withSources(sources: Source[]): Message {
    return new Message(
      this.id,
      this.role,
      this.text,
      this.timestamp,
      sources,
      this.imageData
    );
  }

  withImageData(imageData: string): Message {
    return new Message(
      this.id,
      this.role,
      this.text,
      this.timestamp,
      this.sources,
      imageData
    );
  }
}

