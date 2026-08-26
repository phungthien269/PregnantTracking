/** Ghép class: bỏ qua falsy. @mevabe/ui không khai clsx trong deps nên tự viết. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
