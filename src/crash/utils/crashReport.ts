export class CrashReportLimits {
  /** Enough frames to place a release (Hermes) stack against its source map. */
  static readonly MAX_STACK_LINES = 25;
}

export type CrashContext = {
  version: string;
  platform: string;
  at: Date;
};

/** Anything thrown, as an Error; JS lets you throw a string or an object. */
export function asError(thrown: unknown): Error {
  if (thrown instanceof Error) return thrown;
  if (typeof thrown === 'string') return new Error(thrown);
  try {
    return new Error(JSON.stringify(thrown));
  } catch {
    return new Error(String(thrown));
  }
}

/** Plain text a person can paste into an email or issue. */
export function crashReport(error: Error, ctx: CrashContext): string {
  const stack = (error?.stack ?? '')
    .split('\n')
    .slice(0, CrashReportLimits.MAX_STACK_LINES)
    .join('\n');
  return [
    `Tern ${ctx.version} on ${ctx.platform}`,
    ctx.at.toISOString(),
    `${error?.name}: ${error?.message}`,
    stack,
  ]
    .filter(Boolean)
    .join('\n');
}
