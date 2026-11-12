import { ROTULO_CARTEIRA, type WalletKind } from '@/core/wallets/domain';
import { Card } from '../primitives/card';
import { Chip } from '../primitives/chip';
import { AmountDisplay } from './amount-display';

export function WalletCard({
  nome,
  kind,
  saldoCents,
  children,
}: {
  nome: string;
  kind: WalletKind;
  saldoCents: number;
  children?: React.ReactNode;
}) {
  const beneficio = kind === 'meal_voucher' || kind === 'food_voucher';
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-muted">{nome}</p>
          <AmountDisplay
            cents={saldoCents}
            size="lg"
            tom={saldoCents < 0 ? 'expense' : 'default'}
          />
        </div>
        <Chip tom={beneficio ? 'info' : 'neutral'}>{ROTULO_CARTEIRA[kind]}</Chip>
      </div>
      {children}
    </Card>
  );
}
