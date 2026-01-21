/**
 * Valida se um CPF é válido
 * @param cpf - CPF a ser validado (pode conter pontuação ou não)
 * @returns true se o CPF é válido, false caso contrário
 */
export function validarCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cpfLimpo = cpf.replace(/\D/g, '');

  // Verifica se tem 11 dígitos
  if (cpfLimpo.length !== 11) {
    return false;
  }

  // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return false;
  }

  // Valida primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    resto = 0;
  }
  if (resto !== parseInt(cpfLimpo.charAt(9))) {
    return false;
  }

  // Valida segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    resto = 0;
  }
  if (resto !== parseInt(cpfLimpo.charAt(10))) {
    return false;
  }

  return true;
}

/**
 * Normaliza um CPF removendo caracteres especiais
 * @param cpf - CPF a ser normalizado
 * @returns CPF apenas com números
 */
export function normalizarCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}
