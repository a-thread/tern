/** The scene's drawing: its size in scene units, and the fixed pieces of the sky and water. */
export class SceneCanvas {
  static readonly WIDTH = 260;
  static readonly HEIGHT = 132;
  /** The light of the stars and the ripples: part of the scene's art, not the app's palette. */
  static readonly PAPER = '#FBFAF7';
  static readonly STARS = [
    { x: 30, y: 16, r: 1.2 },
    { x: 120, y: 12, r: 1 },
    { x: 215, y: 22, r: 1.3 },
    { x: 170, y: 34, r: 0.9 },
  ];
  /** The sun's reflection, under it. */
  static readonly SHIMMER = [
    { x1: 56, x2: 84, y: 90 },
    { x1: 60, x2: 80, y: 98 },
    { x1: 64, x2: 76, y: 106 },
  ];
  static readonly RIPPLES = [
    { x1: 150, x2: 200, y: 96 },
    { x1: 110, x2: 170, y: 110 },
    { x1: 190, x2: 236, y: 118 },
  ];
  /** Where the sun sits across the sky, and its glow's radius before it pulses. */
  static readonly SUN_X = 70;
  static readonly HALO_RADIUS = 18;
}
