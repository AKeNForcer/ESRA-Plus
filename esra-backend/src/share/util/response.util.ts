export function responseJson(
  message: string | null,
  result: any | null = null,
  other: object | null = null,
  success: boolean = true
): object {
  return {
    success,
    message,
    ...(result ? { result } : { } ),
    ...(other ? other : { } ),
  }
}