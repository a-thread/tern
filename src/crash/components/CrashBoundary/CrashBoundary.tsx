import React from 'react';
import CrashScreen from '../../CrashScreen';
import { onFatalError } from '../../fatalErrors';
import { asError } from '../../utils/crashReport';

type State = { error: Error | null; attempt: number };

/**
 * Shows the crash screen for a render error, or a fatal one from anywhere else, rather than
 * letting it close the app. Try again remounts everything below it.
 */
export default class CrashBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null, attempt: 0 };
  private unsubscribe: (() => void) | null = null;

  static getDerivedStateFromError(thrown: unknown): Partial<State> {
    return { error: asError(thrown) };
  }

  componentDidMount() {
    this.unsubscribe = onFatalError((error) => this.setState({ error }));
  }

  componentWillUnmount() {
    this.unsubscribe?.();
  }

  componentDidCatch(error: unknown) {
    console.error('Caught by CrashBoundary', error);
  }

  private retry = () =>
    this.setState(({ attempt }) => ({ error: null, attempt: attempt + 1 }));

  render() {
    if (this.state.error) {
      return <CrashScreen error={this.state.error} onRetry={this.retry} />;
    }
    return (
      <React.Fragment key={this.state.attempt}>
        {this.props.children}
      </React.Fragment>
    );
  }
}
