/** Fila de escrita offline (IndexedDB). O reenvio é idempotente: o `clientId` é único no banco. */
const DB = 'financas-offline';
const STORE = 'fila';

export interface ItemFila {
  clientId: string;
  walletId: string;
  categoryId: string | null;
  kind: 'expense' | 'income';
  amountCents: number;
  occurredOn: string;
  note: string | null;
  criadoEm: string;
  tentativas: number;
}

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

export async function enfileirar(item: Omit<ItemFila, 'criadoEm' | 'tentativas'>): Promise<void> {
  await tx('readwrite', (s) =>
    s.put({ ...item, criadoEm: new Date().toISOString(), tentativas: 0 } satisfies ItemFila),
  );
  avisar();
}
export const listarFila = (): Promise<ItemFila[]> =>
  tx('readonly', (s) => s.getAll() as IDBRequest<ItemFila[]>);
export async function removerDaFila(clientId: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(clientId));
  avisar();
}
export async function limparFila(): Promise<void> {
  await tx('readwrite', (s) => s.clear());
  if (typeof indexedDB.databases === 'function') indexedDB.deleteDatabase(DB);
  avisar();
}

/** Envia item a item. Sucesso remove da fila; falha mantém (com contagem) para a próxima tentativa. */
export async function sincronizarFila(
  enviar: (i: ItemFila) => Promise<{ ok: boolean }>,
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
        await tx('readwrite', (s) => s.put({ ...item, tentativas: item.tentativas + 1 }));
        falhas++;
      }
    } catch {
      falhas++;
    }
  }
  return { enviados, falhas };
}
