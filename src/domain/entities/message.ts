import { generateId } from '../../infrastructure/utils/id.utils';
import { CommandNames } from './command';

export interface Source {
  title: string;
  uri: string;
}

export interface MessageImage {
  base64Data: string;
  mimeType: string;
  fileName?: string;
}

export enum MessageType {
  USER = 'user',
  AI = 'ai',
  CLEAR = CommandNames.CLEAR,
  SEARCH = CommandNames.SEARCH,
  SETTINGS = CommandNames.SETTINGS,
  TOKENS = CommandNames.TOKENS,
  FONT = CommandNames.FONT,
  THEME = CommandNames.THEME,
  API_KEY = CommandNames.API_KEY,
  RESET = CommandNames.RESET,
  INFO = CommandNames.INFO,
  MODEL = CommandNames.MODEL,
  THINK = CommandNames.THINK,
  GRAMMAR = CommandNames.GRAMMAR,
  IMAGE = CommandNames.IMAGE,
  AUDIO = CommandNames.AUDIO,
  HELP = CommandNames.HELP,
}

export class Message {
  constructor(
    public readonly id: string,
    public readonly role: 'user' | 'model' | 'system',
    public readonly type: MessageType,
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
    type: MessageType,
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
    const uniqueId = generateId();
    return new Message(
      uniqueId,
      role,
      type,
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
    return Message.create('user', MessageType.USER, text, timestamp);
  }

  static createModel(
    text: string,
    timestamp?: string,
    sources?: Source[],
    modelName?: string
  ): Message {
    return Message.create('model', MessageType.AI, text, timestamp, sources, undefined, modelName);
  }

  static createSystem(text: string, timestamp?: string): Message {
    return Message.create('system', MessageType.USER, text, timestamp);
  }

  static createCommand(command: string, commandInput: string, timestamp?: string): Message {
    const commandType = this.getCommandType(command);
    return Message.create('system', commandType, '', timestamp, undefined, undefined, undefined, undefined, undefined, command, commandInput);
  }

  private static getCommandType(command: string): MessageType {
    const normalizedCommand = command.toLowerCase().replace(/^\/+/, '');
    switch (normalizedCommand) {
      case CommandNames.CLEAR:
        return MessageType.CLEAR;
      case CommandNames.SEARCH:
        return MessageType.SEARCH;
      case CommandNames.SETTINGS:
        return MessageType.SETTINGS;
      case CommandNames.TOKENS:
        return MessageType.TOKENS;
      case CommandNames.FONT:
        return MessageType.FONT;
      case CommandNames.THEME:
        return MessageType.THEME;
      case CommandNames.API_KEY:
        return MessageType.API_KEY;
      case CommandNames.RESET:
        return MessageType.RESET;
      case CommandNames.INFO:
        return MessageType.INFO;
      case CommandNames.MODEL:
        return MessageType.MODEL;
      case CommandNames.THINK:
        return MessageType.THINK;
      case CommandNames.GRAMMAR:
        return MessageType.GRAMMAR;
      case CommandNames.IMAGE:
        return MessageType.IMAGE;
      case CommandNames.AUDIO:
        return MessageType.AUDIO;
      case CommandNames.HELP:
        return MessageType.HELP;
      default:
        return MessageType.USER; // Fallback
    }
  }

  withUpdatedText(newText: string): Message {
    return new Message(
      this.id,
      this.role,
      this.type,
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
      this.type,
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
      this.type,
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
      this.type,
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
      this.type,
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

  withType(type: MessageType): Message {
    return new Message(
      this.id,
      this.role,
      type,
      this.text,
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
}

