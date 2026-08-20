const { normalizeCpf, formatCpf, validateCpf } = require('../src/services/cpf.service');

describe('cpf.service', () => {
  describe('normalizeCpf', () => {
    it('remove pontuação e espaços', () => {
      expect(normalizeCpf('529.982.247-25')).toBe('52998224725');
      expect(normalizeCpf(' 529 982 247 25 ')).toBe('52998224725');
    });

    it('lida com entrada vazia/indefinida', () => {
      expect(normalizeCpf('')).toBe('');
      expect(normalizeCpf(undefined)).toBe('');
    });
  });

  describe('formatCpf', () => {
    it('formata 11 dígitos no padrão 000.000.000-00', () => {
      expect(formatCpf('52998224725')).toBe('529.982.247-25');
    });

    it('retorna o valor original se não tiver 11 dígitos', () => {
      expect(formatCpf('123')).toBe('123');
    });
  });

  describe('validateCpf', () => {
    it('aceita CPF válido formatado', () => {
      const result = validateCpf('529.982.247-25');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('52998224725');
    });

    it('aceita CPF válido apenas com dígitos', () => {
      const result = validateCpf('11144477735');
      expect(result.valid).toBe(true);
    });

    it('rejeita CPF vazio', () => {
      const result = validateCpf('');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('EMPTY');
    });

    it('rejeita CPF com tamanho inválido', () => {
      const result = validateCpf('123456');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('INVALID_LENGTH');
    });

    it('rejeita CPFs com todos os dígitos iguais', () => {
      const result = validateCpf('111.111.111-11');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('REPEATED_DIGITS');
    });

    it('rejeita CPF com dígito verificador incorreto', () => {
      const result = validateCpf('529.982.247-26');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('CHECK_DIGIT_MISMATCH');
    });
  });
});
