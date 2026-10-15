/** What the scanner is doing: waiting for a code, looking one up, or showing why that did not work. */
export enum ScanPhaseKind {
  Scanning = 'scanning',
  Looking = 'looking',
  Miss = 'miss',
  Error = 'error',
}

export type ScanPhase =
  | { kind: ScanPhaseKind.Scanning }
  | { kind: ScanPhaseKind.Looking }
  | { kind: ScanPhaseKind.Miss; name?: string }
  | { kind: ScanPhaseKind.Error };
