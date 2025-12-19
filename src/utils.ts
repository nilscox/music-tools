export function assert(value: unknown, message = 'Assertion error'): asserts value {
  if (!value) {
    throw new Error(message);
  }
}
