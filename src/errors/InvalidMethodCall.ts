export class InvalidMethodCall extends Error {
  constructor(currentType: string) {
    super(`Method can not be called on the current type ${currentType}`);
    Object.setPrototypeOf(this, InvalidMethodCall.prototype);
  }
}
