import React from 'react';
import Svg, { Ellipse, G, Path } from 'react-native-svg';
import { render } from '@testing-library/react-native';

import { RestScenes } from '@/today/models/restScene';
import { Driftwood, DriftwoodDefs } from './Driftwood';

const draw = (lap = 0) =>
  render(
    <Svg>
      <DriftwoodDefs />
      <Driftwood lap={lap} />
    </Svg>,
  );

describe('Driftwood', () => {
  it('is a log, not a line: a body with grain, a knot, a cut end, branches and water around it', () => {
    const ui = draw();
    expect(ui.UNSAFE_getAllByType(Path).length).toBeGreaterThanOrEqual(15);
    expect(ui.UNSAFE_getAllByType(Ellipse).length).toBeGreaterThanOrEqual(6);
  });

  it('fills the body from the gradient it defines', () => {
    const ui = draw();
    const filled = ui.UNSAFE_getAllByType(Path).filter((p) => String(p.props.fill ?? '').startsWith('url(#'));
    expect(filled).toHaveLength(1);
    expect(filled[0].props.fill).toBe('url(#driftwoodBody)');
  });

  it('sits where the scene says the tern stands, level with the top of the log', () => {
    const ui = draw();
    // Drawn around (155, 79): moved by however far the scene's driftwood is from that.
    const moved = `translate(${RestScenes.DRIFTWOOD.x - 155} ${RestScenes.DRIFTWOOD.top - 79})`;
    expect(ui.UNSAFE_getAllByType(G).some((g) => g.props.transform === moved)).toBe(true);
  });

  it('drifts the laps of water with the ripples', () => {
    const laps = (lap: number) =>
      draw(lap)
        .UNSAFE_getAllByType(G)
        .find((g) => String(g.props.transform ?? '').startsWith('translate(') && g.props.stroke === '#FBFAF7')?.props.transform;
    expect(laps(0)).toBe('translate(0 0)');
    expect(laps(8)).toBe('translate(2.8 0)');
  });
});
