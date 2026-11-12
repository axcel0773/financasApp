/** Fila de escrita offline (IndexedDB). O reenvio é idempotente: o `clientId` é único no banco. */
const DB = 'financas-offline';
const STORE = 'fila';

interface Base {
  /** Chave da fila. Em criar é o clientId do lançamento; em editar/excluir é `op:id`. */
  clientId: string;
  criadoEm: string;
  tentativas: number;
  ultimoErro?: string;
}
export interface ItemCriar extends Base {
  op: 'criar';
  walletId: string;
  categoryId: string | null;
  kind: 'expense' | 'income';
  amountCents: number;
  occurredOn: string;
  note: string | null;
}
export interface ItemEditar extends Base {
  op: 'editar';
  alvoId: string;
  walletId: string;
  categoryId: string | null;
  amountCents: number;
  occurredOn: string;
  note: string | null;
}
export interface ItemExcluir extends Base {
  op: 'excluir';
  alvoId: string;
}
export type ItemFila = ItemCriar | ItemEditar | ItemExcluir;
type SemMeta<T> = T extends Base ? Omit<T, 'criadoEm' | 'tentativas' | 'ultimoErro'> : never;
export type NovoItemFila = SemMeta<ItemFila>;

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'clientId' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function tx<T>(
  modo: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const r = fn(db.transaction(STORE, modo).objectStore(STORE));
    r.onsuccess = () => {
      resolve(r.result);
      db.close();
    };
    r.onerror = () => {
      reject(r.error);
      db.close();
    };
  });
}
const avisar = () => window.dispatchEvent(new Event('fila-alterada'));

export async function enfileirar(item: NovoItemFila): Promise<void> {
  await tx('readwrite', (s) =>
    s.put({ ...item, criadoEm: new Date().toISOString(), tentativas: 0 } satisfies ItemFila),
  );
  avisar();
}
/** Itens antigos (antes de existir `op`) eram sempre criações. */
export async function listarFila(): Promise<ItemFila[]> {
  const itens = await tx('readonly', (s) => s.getAll() as IDBRequest<(ItemFila | Omit<ItemCriar, 'op'>)[]>);
  return itens.map((i) => ('op' in i ? i : { ...i, op: 'criar' as const }));
}
export async function removerDaFila(clientId: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(clientId));
  avisar();
}
export async function limparFila(): Promise<void> {
  await tx('readwrite', (s) => s.clear());
  if (typeof indexedDB.databases === 'function') indexedDB.deleteDatabase(DB);
  avisar();
}

/** Envia item a item. Sucesso remove da fila; falha mantém (com contagem e motivo) para a próxima tentativa. */
export async function sincronizarFila(
  enviar: (i: ItemFila) => Promise<{ ok: boolean; message?: string | null }>,
): Promise<{ enviados: number; falhas: number }> {
  let enviados = 0,
    falhas = 0;
  for (const item of (await listarFila()).sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))) {
    try {
      const r = await enviar(item);
      if (r.ok) {
        await removerDaFila(item.clientId);
        enviados++;
      } else {
        await tx('readwrite', (s) =>
          s.put({ ...item, tentativas: item.tentativas + 1, ultimoErro: r.message ?? 'Recusado pelo servidor.' }),
        );
        falhas++;
      }
    } catch {
      falhas++;
    }
  }
  avisar();
  return { enviados, falhas };
}
