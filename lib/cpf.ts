/** Remove tudo que não for dígito. */
export function cleanCpf(value: string): string {
  return (value ?? "").replace(/\D/g, "");
}

/** Valida CPF (11 dígitos + dígitos verificadores). */
export function isValidCpf(value: string): boolean {
  const cpf = cleanCpf(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // todos iguais

  const digit = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

/** Aplica máscara 000.000.000-00 (para exibição/input). */
export function formatCpf(value: string): string {
  const c = cleanCpf(value).slice(0, 11);
  return c
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
