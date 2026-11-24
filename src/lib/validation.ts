export function isSafeHandle(value: string): boolean {
  return /^[a-zA-Z0-9._-]{1,45}$/.test(value);
}
