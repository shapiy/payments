export class BusinessException extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class NegativeAmountException extends BusinessException {
  constructor(amount: string) {
    super(`Payment refused. Net amount cannot be negative: ${amount}`);
  }
}
