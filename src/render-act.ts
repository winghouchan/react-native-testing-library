import type { ReactTestRenderer, TestRendererOptions } from 'react-test-renderer';
import TestRenderer from 'react-test-renderer';

import act from './act';

export async function renderWithAct(
  component: React.ReactElement,
  options?: Partial<TestRendererOptions>,
): Promise<ReactTestRenderer> {
  let renderer: ReactTestRenderer;

  // This will be called synchronously.
  await act(async () => {
    // @ts-expect-error `TestRenderer.create` is not typed correctly
    renderer = TestRenderer.create(component, options);
  });

  // @ts-expect-error: `act` is synchronous, so `renderer` is already initialized here
  return renderer;
}
