export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly username: string,
    public readonly createdAt: Date
  ) {}

  static create(email: string, username: string): User {
    return new User(
      crypto.randomUUID(),
      email,
      username,
      new Date()
    );
  }

  static fromJson(json: any): User {
    return new User(
      json.id,
      json.email,
      json.username,
      new Date(json.createdAt)
    );
  }

  toJson(): any {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      createdAt: this.createdAt.toISOString()
    };
  }
}
