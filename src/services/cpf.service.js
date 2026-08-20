/**
 * Remove tudo que não for dígito (pontos, traço, espaços) de uma string.
 * @param {string} raw
 * @returns {string} 
 */
function normalizeCpf(raw) {
  return String(raw || '').replace(/\D/g, '');
}

/**
 * Formata um CPF já normalizado (11 dígitos) no padrão 000.000.000-00.
 * @param {string} normalized
 * @returns {string}
 */
function formatCpf(normalized) {
  if (normalized.length !== 11) return normalized;
  return normalized.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Valida um CPF (aceita tanto formatado quanto só dígitos) e devolve um resultado estruturado.
 * @param {string} raw 
 * @returns {{
 *   valid: boolean,
 *   normalized: string,
 *   formatted: string,
 *   reason?: 'EMPTY'|'INVALID_LENGTH'|'REPEATED_DIGITS'|'CHECK_DIGIT_MISMATCH'
 * }}
 */
function validateCpf(raw) {
  const normalized = normalizeCpf(raw);

  if (!normalized) {
    return { valid: false, normalized, formatted: normalized, reason: 'EMPTY' };
  }

  if (normalized.length !== 11) {
    return { valid: false, normalized, formatted: normalized, reason: 'INVALID_LENGTH' };
  }

  // Ex.: 111.111.111-11, 222.222.222-22 ... nunca são CPFs reais emitidos.
  if (/^(\d)\1{10}$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      formatted: formatCpf(normalized),
      reason: 'REPEATED_DIGITS',
    };
  }

  // 1º dígito verificador: calculado a partir dos 9 primeiros dígitos,
  // com pesos de 10 a 2.
  const firstNineDigits = normalized.slice(0, 9);
  const firstCheckDigit = calcDigit(firstNineDigits, 10);

  // 2º dígito verificador: calculado a partir dos 9 primeiros dígitos +
  // o 1º dígito verificador (10 dígitos no total), com pesos de 11 a 2.
  const firstTenDigits = firstNineDigits + String(firstCheckDigit);
  const secondCheckDigit = calcDigit(firstTenDigits, 11);

  const expected = `${firstCheckDigit}${secondCheckDigit}`;
  const actual = normalized.slice(9, 11);

  if (expected !== actual) {
    return {
      valid: false,
      normalized,
      formatted: formatCpf(normalized),
      reason: 'CHECK_DIGIT_MISMATCH',
    };
  }

  return { valid: true, normalized, formatted: formatCpf(normalized) };
}

module.exports = { normalizeCpf, formatCpf, validateCpf };
