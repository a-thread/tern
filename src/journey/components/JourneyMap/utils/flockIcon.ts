/**
 * Which of the flock's tern silhouettes a friend flies as: picked from their name, so each
 * friend keeps the same bird from day to day. `count` is how many silhouettes there are.
 */
export function flockIconIndex(name: string, count: number): number {
  if (count <= 0) return 0;
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % count;
}
