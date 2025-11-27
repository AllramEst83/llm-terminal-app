export interface Source {
  title: string;
  uri: string;
}

export interface MessageImage {
  base64Data: string;
  mimeType: string;
  fileName?: string;
}

// Counter to ensure unique message IDs even when created in the same millisecond
let messageIdCounter = 0;

export class Message {
  constructor(
    public readonly id: string,
    public readonly role: 'user' | 'model' | 'system',
    public readonly text: string,
    public readonly timestamp?: string,
    public readonly sources?: Source[],
    public readonly imageData?: string,
    public readonly modelName?: string,
    public readonly imageMimeType?: string,
    public readonly images?: MessageImage[],
    public readonly command?: string,
    public readonly commandInput?: string
  ) {}

  static create(
    role: 'user' | 'model' | 'system',
    text: string,
    timestamp?: string,
    sources?: Source[],
    imageData?: string,
    modelName?: string,
    imageMimeType?: string,
    images?: MessageImage[],
    command?: string,
    commandInput?: string
  ): Message {
    // Use timestamp + counter + random to ensure uniqueness
    const uniqueId = `${Date.now()}-${++messageIdCounter}-${Math.random().toString(36).substring(2, 9)}`;
    return new Message(
      uniqueId,
      role,
      text,
      timestamp,
      sources,
      imageData,
      modelName,
      imageMimeType,
      images,
      command,
      commandInput
    );
  }

  static createUser(text: string, timestamp?: string): Message {
    return Message.create('user', text, timestamp);
  }

  static createModel(
    text: string,
    timestamp?: string,
    sources?: Source[],
    modelName?: string
  ): Message {
    return Message.create('model', text, timestamp, sources, undefined, modelName);
  }

  static createSystem(text: string, timestamp?: string): Message {
    return Message.create('system', text, timestamp);
  }

  static createCommand(command: string, commandInput: string, timestamp?: string): Message {
    return Message.create('system', '', timestamp, undefined, undefined, undefined, undefined, undefined, command, commandInput);
  }

  withUpdatedText(newText: string): Message {
    return new Message(
      this.id,
      this.role,
      newText,
      this.timestamp,
      this.sources,
      this.imageData,
      this.modelName,
      this.imageMimeType,
      this.images,
      this.command,
      this.commandInput
    );
  }

  withSources(sources: Source[]): Message {
    return new Message(
      this.id,
      this.role,
      this.text,
      this.timestamp,
      sources,
      this.imageData,
      this.modelName,
      this.imageMimeType,
      this.images,
      this.command,
      this.commandInput
    );
  }

  withImageData(imageData: string, imageMimeType?: string): Message {
    return new Message(
      this.id,
      this.role,
      this.text,
      this.timestamp,
      this.sources,
      imageData,
      this.modelName,
      imageMimeType || this.imageMimeType,
      this.images,
      this.command,
      this.commandInput
    );
  }

  withModelName(modelName: string): Message {
    return new Message(
      this.id,
      this.role,
      this.text,
      this.timestamp,
      this.sources,
      this.imageData,
      modelName,
      this.imageMimeType,
      this.images,
      this.command,
      this.commandInput
    );
  }

  withImages(images: MessageImage[]): Message {
    return new Message(
      this.id,
      this.role,
      this.text,
      this.timestamp,
      this.sources,
      this.imageData,
      this.modelName,
      this.imageMimeType,
      images,
      this.command,
      this.commandInput
    );
  }
}

