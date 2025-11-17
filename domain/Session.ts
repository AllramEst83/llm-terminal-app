import { User } from './User';

export class Session {
  constructor(
    public readonly id: string,
    public readonly user: User,
    public readonly token: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date
  ) {}

  static create(user: User, token: string, expiresInHours: number = 24): Session {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000);
    
    return new Session(
      crypto.randomUUID(),
      user,
      token,
      expiresAt,
      now
    );
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  static fromJson(json: any): Session {
    return new Session(
      json.id,
      User.fromJson(json.user),
      json.token,
      new Date(json.expiresAt),
      new Date(json.createdAt)
    );
  }

  toJson(): any {
    return {
      id: this.id,
      user: this.user.toJson(),
      token: this.token,
      expiresAt: this.expiresAt.toISOString(),
      createdAt: this.createdAt.toISOString()
    };
  }
}
