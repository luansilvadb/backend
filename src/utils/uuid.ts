/**
 * Utilitário para geração de IDs únicos
 */

// Gerar UUID v4 simples (sem dependência externa)
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Gerar ID prefixado para diferentes entidades
export function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

// IDs específicos para cada tipo de entidade
export const idGenerators = {
  user: () => generateId('user'),
  filtro: () => generateId('filtro'),
  job: () => generateId('job'),
  log: () => generateId('log'),
  export: () => generateId('export'),
  config: () => generateId('config')
};

// Validar formato de ID
export function isValidId(id: string, prefix?: string): boolean {
  const pattern = prefix 
    ? new RegExp(`^${prefix}_\\d+_[a-z0-9]{7}$`)
    : /^[a-z]+_\d+_[a-z0-9]{7}$/;
  
  return pattern.test(id);
}

// Extrair timestamp do ID
export function getTimestampFromId(id: string): number | null {
  const parts = id.split('_');
  if (parts.length >= 2) {
    const timestamp = parseInt(parts[1]);
    return isNaN(timestamp) ? null : timestamp;
  }
  return null;
}
