import React from 'react';
import { Dimensions, Image, StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { space } from '@/shared/theme';
import { Sprite } from '@/today/models/restScene';
import { RestScene } from '@/today/components/RestScene/RestScene';

// Reduce motion: no flight and no animation loop, so the scene is exactly as it settles.
jest.mock('@/shared/hooks/useReduceMotion', () => ({ useReduceMotion: () => true }));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useIsFocused: () => true,
}));

type Props = React.ComponentProps<typeof RestScene>;
const props = (extra: Partial<Props> = {}): Props => ({
  entrance: false,
  leaving: false,
  onLeft: () => {},
  title: 'Rest day',
  line: 'Your streak is safe.',
  detail: '2,310 steps · ☀ 9 days',
  ...extra,
});
const show = (extra: Partial<Props> = {}) => render(<RestScene {...props(extra)} />);

const sheetStyle = (ui: ReturnType<typeof show>) => StyleSheet.flatten(ui.UNSAFE_getByType(Image).props.style);
// Before the scene has been measured: the screen, less Today's side padding and the card's own.
const unit = () => (Dimensions.get('window').width - 2 * (space.lg + space.md)) / 260;

describe('RestScene', () => {
  it('says what it is, and what is going on', () => {
    const ui = show({ note: 'Reminders are quiet until tomorrow' });
    expect(ui.getByText('Rest day')).toBeTruthy();
    expect(ui.getByText('Your streak is safe.')).toBeTruthy();
    expect(ui.getByText('2,310 steps · ☀ 9 days')).toBeTruthy();
    expect(ui.getByText('Reminders are quiet until tomorrow')).toBeTruthy();
  });

  it('draws the tern from the whole landing sheet, from the first render', () => {
    const ui = show();
    const cell = Sprite.CELL.w * Sprite.SCALE * unit();
    const style = sheetStyle(ui);
    expect(style.width).toBeCloseTo(cell * Sprite.FRAMES);
    expect(style.height).toBeCloseTo(Sprite.CELL.h * Sprite.SCALE * unit());
  });

  it('fills the card: as wide as it is given, at the scene\'s proportions, not a fixed size', () => {
    const ui = show();
    const style = StyleSheet.flatten(ui.getByTestId('rest-scene').props.style);
    expect(style.alignSelf).toBe('stretch');
    expect(style.aspectRatio).toBeCloseTo(260 / 132);
    expect(style.width).toBeUndefined();
  });

  it('sizes the tern to the width the scene is actually laid out at', () => {
    const ui = show();
    fireEvent(ui.getByTestId('rest-scene'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 260, height: 132 } },
    });
    // One pixel per scene unit.
    expect(sheetStyle(ui).width).toBeCloseTo(Sprite.CELL.w * Sprite.SCALE * Sprite.FRAMES);
    fireEvent(ui.getByTestId('rest-scene'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 520, height: 264 } },
    });
    expect(sheetStyle(ui).width).toBeCloseTo(Sprite.CELL.w * Sprite.SCALE * Sprite.FRAMES * 2);
  });

  it('sits as wide as the cards around it, with no side margin of its own', () => {
    const ui = show({ heroRef: React.createRef() });
    const card = ui.getByTestId('rest-scene').parent;
    const flat = StyleSheet.flatten(card?.props.style);
    expect(flat?.marginHorizontal ?? 0).toBe(0);
  });

  it('shows the standing frame at rest', () => {
    const ui = show();
    const cell = sheetStyle(ui).width / Sprite.FRAMES;
    expect(sheetStyle(ui).left).toBeCloseTo(-Sprite.REST_FRAME * cell);
  });

  it('stands at once when a flight in was asked for, with reduce motion on', () => {
    const ui = show({ entrance: true });
    const cell = sheetStyle(ui).width / Sprite.FRAMES;
    expect(sheetStyle(ui).left).toBeCloseTo(-Sprite.REST_FRAME * cell);
  });

  it('is done leaving at once with reduce motion on, and only once', () => {
    const onLeft = jest.fn();
    const ui = show({ onLeft });
    expect(onLeft).not.toHaveBeenCalled();
    ui.rerender(<RestScene {...props({ leaving: true, onLeft })} />);
    expect(onLeft).toHaveBeenCalledTimes(1);
    ui.rerender(<RestScene {...props({ leaving: true, onLeft })} />);
    expect(onLeft).toHaveBeenCalledTimes(1);
  });

  it('calls it a touchdown at once when a flight in was asked for but motion is off, so nothing waits', () => {
    const onTouchdown = jest.fn();
    show({ entrance: true, onTouchdown });
    expect(onTouchdown).toHaveBeenCalled();
  });

  it('only waits on a touchdown after a flight in, not when it was already resting', () => {
    const onTouchdown = jest.fn();
    show({ entrance: false, onTouchdown });
    expect(onTouchdown).not.toHaveBeenCalled();
  });

  it('hands its card to the waypoint feathers as the place they start from', () => {
    const heroRef = React.createRef<import('react-native').View>();
    show({ heroRef });
    expect(heroRef.current).not.toBeNull();
  });
});
