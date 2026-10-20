/**
 * Browser storage is per browser, not per account. Keys for anything that belongs
 * to a person (drafts, history, context) go through here so a second account on the
 * same machine never hydrates the first account's data.
 */
export function accountStorageKey(base: string, accountId?: string | null): string {
  return accountId ? `${base}::${accountId}` : base;
}
