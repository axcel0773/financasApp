import { describe, expect, it } from 'vitest';
import { aalDoToken, exigeCodigo, temSegundaEtapa } from './mfa';

const jwt = (payload: object) =>
  `x.${btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.y`;

describe('temSegundaEtapa', () => {
  it('só conta TOTP verificado', () => {
    expect(temSegundaEtapa([{ status: 'verified', factor_type: 'totp' }])).toBe(true);
    expect(temSegundaEtapa([{ status: 'unverified', factor_type: 'totp' }])).toBe(false);
    expect(temSegundaEtapa([{ status: 'verified', factor_type: 'phone' }])).toBe(false);
    expect(temSegundaEtapa([])).toBe(false);
    expect(temSegundaEtapa(undefined)).toBe(false);
  });
});
describe('aalDoToken', () => {
  it('lê aal2 e trata ausente, inválido ou vazio como aal1', () => {
    expect(aalDoToken(jwt({ aal: 'aal2' }))).toBe('aal2');
    expect(aalDoToken(jwt({ aal: 'aal1' }))).toBe('aal1');
    expect(aalDoToken(jwt({ sub: 'u' }))).toBe('aal1');
    expect(aalDoToken('lixo')).toBe('aal1');
    expect(aalDoToken(null)).toBe('aal1');
  });
});
describe('exigeCodigo', () => {
  const totp = [{ status: 'verified', factor_type: 'totp' }];
  it('pede o código só com fator verificado e sessão aal1', () => {
    expect(exigeCodigo(totp, 'aal1')).toBe(true);
    expect(exigeCodigo(totp, 'aal2')).toBe(false);
    expect(exigeCodigo([], 'aal1')).toBe(false);
  });
});
