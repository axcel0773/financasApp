'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/infra/supabase/client.browser';
import { Button } from '@/ui/primitives/button';
import { Card } from '@/ui/primitives/card';
import { Field, Input } from '@/ui/primitives/fields';

type Fator = { id: string; status: string };

/** Autenticação em dois passos (TOTP) pelo Supabase Auth. O segredo é exibido uma vez, só para leitura no autenticador. */
export function MfaCard() {
  const [fatores, setFatores] = useState<Fator[] | null>(null);
  const [passo, setPasso] = useState<{ id: string; qr: string; segredo: string } | null>(null);
  const [codigo, setCodigo] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const db = createSupabaseBrowser();

  const carregar = async () => {
    const { data, error } = await db.auth.mfa.listFactors();
    if (error) {
      setMsg('Não foi possível ler o estado do 2FA.');
      setFatores([]);
      return;
    }
    setFatores(data.totp.map((f) => ({ id: f.id, status: f.status })));
  };
  useEffect(() => {
    void (async () => {
      const { data, error } = await db.auth.mfa.listFactors();
      if (error) {
        setMsg('Não foi possível ler o estado do 2FA.');
        setFatores([]);
        return;
      }
      setFatores(data.totp.map((f) => ({ id: f.id, status: f.status })));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ativo = fatores?.some((f) => f.status === 'verified');

  const iniciar = async () => {
    setMsg(null);
    const { data, error } = await db.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `app-${Date.now()}`,
    });
    if (error || !data) {
      setMsg('Não foi possível iniciar. Ative o MFA no painel do Supabase.');
      return;
    }
    setPasso({ id: data.id, qr: data.totp.qr_code, segredo: data.totp.secret });
  };
  const confirmar = async () => {
    if (!passo) return;
    const ch = await db.auth.mfa.challenge({ factorId: passo.id });
    if (ch.error) {
      setMsg('Falha ao validar.');
      return;
    }
    const v = await db.auth.mfa.verify({
      factorId: passo.id,
      challengeId: ch.data.id,
      code: codigo.trim(),
    });
    if (v.error) {
      setMsg('Código incorreto.');
      return;
    }
    setPasso(null);
    setCodigo('');
    setMsg('2FA ativado.');
    await carregar();
  };
  const remover = async () => {
    for (const f of fatores ?? []) await db.auth.mfa.unenroll({ factorId: f.id });
    setMsg('2FA desativado.');
    await carregar();
  };

  return (
    <Card className="space-y-3">
      <div>
        <p className="font-semibold">Verificação em duas etapas</p>
        <p className="text-sm text-muted">
          {fatores === null
            ? 'Carregando…'
            : ativo
              ? 'Ativada. Cadastre um segundo aplicativo como reserva, para o caso de perder o celular.'
              : 'Desativada. Recomendado ativar.'}
        </p>
      </div>
      {passo && (
        <div className="space-y-3">
          {/* QR é um data URI gerado pelo Supabase; <img> evita o otimizador do Next */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={passo.qr}
            alt="QR code para o app autenticador"
            width={180}
            height={180}
            className="rounded-md bg-white p-2"
          />
          <p className="break-all text-xs text-muted">
            Chave manual: <span className="amount">{passo.segredo}</span>
          </p>
          <Field label="Código de 6 dígitos">
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </Field>
          <Button type="button" onClick={confirmar} block>
            Confirmar
          </Button>
        </div>
      )}
      {!passo &&
        fatores !== null &&
        (ativo ? (
          <div className="space-y-2">
            <Button type="button" variant="secondary" onClick={iniciar} block>
              Adicionar outro aplicativo (reserva)
            </Button>
            <Button type="button" variant="secondary" onClick={remover} block>
              Desativar
            </Button>
          </div>
        ) : (
          <Button type="button" onClick={iniciar} block>
            Ativar 2FA
          </Button>
        ))}
      {msg && (
        <p role="status" className="text-sm">
          {msg}
        </p>
      )}
    </Card>
  );
}
