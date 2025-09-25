export class UserError extends Error {
  public readonly isUserFacing: boolean;

  constructor(message: string) {
    super(message);
    this.name = "UserError";
    this.isUserFacing = true;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SystemError extends Error {
  public readonly isUserFacing: boolean;

  constructor(message: string) {
    super(message);
    this.name = "SystemError";
    this.isUserFacing = false;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}