import { Message } from '../domain/Message';
import { getCurrentTimestamp } from '../utils/dateUtils';
import { createInitialMessages } from '../utils/messageUtils';

export class MessageService {
  static getInitialMessages(): Message[] {
    return createInitialMessages();
  }

  static createUserMessage(text: string): Message {
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


