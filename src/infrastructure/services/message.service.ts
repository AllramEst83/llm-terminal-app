import { Message, type MessageImage } from '../../domain/entities/message';
import { getCurrentTimestamp } from '../utils/date.utils';
import { createInitialMessages } from '../utils/message.utils';

export class MessageService {
  static getInitialMessages(): Message[] {
    return createInitialMessages();
  }

  static createUserMessage(text: string, imageData?: string, imageMimeType?: string, images?: MessageImage[]): Message {
    if (images && images.length > 0) {
      return Message.create('user', text, getCurrentTimestamp(), undefined, undefined, undefined, undefined, images);
    }
    if (imageData && imageMimeType) {
      return Message.create('user', text, getCurrentTimestamp(), undefined, imageData, undefined, imageMimeType);
    }
    return Message.createUser(text, getCurrentTimestamp());
  }

  static createModelMessage(text: string, modelName?: string): Message {
    return Message.createModel(text, getCurrentTimestamp(), undefined, modelName);
  }

  static createSystemMessage(text: string): Message {
    return Message.createSystem(text, getCurrentTimestamp());
  }

  static createErrorMessage(text: string): Message {
    return Message.createSystem(text, getCurrentTimestamp());
  }

  static updateLastMessage(
    messages: Message[],
    updater: (message: Message) => Message
  ): Message[] {
    if (messages.length === 0) {
      return messages;
    }

    const newMessages = [...messages];
    const lastMessage = newMessages[newMessages.length - 1];
    newMessages[newMessages.length - 1] = updater(lastMessage);
    return newMessages;
  }

  static appendMessage(messages: Message[], message: Message): Message[] {
    return [...messages, message];
  }
}

