import { FUSO_PADRAO } from './constants';
import type { IsoDate } from './competencia';

/** Relógio e UUID entram por ports: facilita testar datas. */
export interface Clock {
  hoje(): IsoDate;
  agora(): Date;
}
export interface IdGenerator {
  uuid(): string;
}

export const relogioSistema: Clock = {
  agora: () => new Date(),
  hoje: () =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: FUSO_PADRAO,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date()),
};
export const relogioFixo = (hoje: IsoDate): Clock => ({
  hoje: () => hoje,
  agora: () => new Date(`${hoje}T12:00:00Z`),
});
export const geradorUuid: IdGenerator = { uuid: () => crypto.randomUUID() };
