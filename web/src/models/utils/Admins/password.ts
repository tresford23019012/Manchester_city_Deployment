export const MIN_LENGTH = 12;

export type PasswordCheck = { label: string; ok: boolean };

export function passwordChecks(pw: string): PasswordCheck[] {
  return [
    { label: `At least ${MIN_LENGTH} characters`, ok: pw.length >= MIN_LENGTH },
    { label: "An uppercase letter", ok: /[A-Z]/.test(pw) },
    { label: "A lowercase letter", ok: /[a-z]/.test(pw) },
    { label: "A number", ok: /\d/.test(pw) },
  ];
}

// Uses the browser's secure random generator. Letters that look alike (O/0, l/1/I) are left out.
export function generatePassword(length = 16): string {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%*?"];
  const all = sets.join("");
  const rnd = (max: number) => {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % max;
  };
  const chars = sets.map((s) => s[rnd(s.length)]); // at least one from every set
  while (chars.length < length) chars.push(all[rnd(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
