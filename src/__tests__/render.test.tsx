import * as React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import type { RenderAPI } from '..';
import { fireEvent, render, screen } from '..';

const PLACEHOLDER_FRESHNESS = 'Add custom freshness';
const PLACEHOLDER_CHEF = 'Who inspected freshness?';
const INPUT_FRESHNESS = 'Custom Freshie';
const INPUT_CHEF = 'I inspected freshie';
const DEFAULT_INPUT_CHEF = 'What did you inspect?';
const DEFAULT_INPUT_CUSTOMER = 'What banana?';

class MyButton extends React.Component<any> {
  render() {
    return (
      <Pressable onPress={this.props.onPress}>
        <Text>{this.props.children}</Text>
      </Pressable>
    );
  }
}

class Banana extends React.Component<any, { fresh: boolean }> {
  state = {
    fresh: false,
  };

  componentDidUpdate() {
    if (this.props.onUpdate) {
      this.props.onUpdate();
    }
  }

  componentWillUnmount() {
    if (this.props.onUnmount) {
      this.props.onUnmount();
    }
  }

  changeFresh = () => {
    this.setState((state) => ({
      fresh: !state.fresh,
    }));
  };

  render() {
    const test = 0;
    return (
      <View>
        <Text>Is the banana fresh?</Text>
        <Text testID="bananaFresh">{this.state.fresh ? 'fresh' : 'not fresh'}</Text>
        <TextInput
          testID="bananaCustomFreshness"
          placeholder={PLACEHOLDER_FRESHNESS}
          value={INPUT_FRESHNESS}
        />
        <TextInput
          testID="bananaChef"
          placeholder={PLACEHOLDER_CHEF}
          value={INPUT_CHEF}
          defaultValue={DEFAULT_INPUT_CHEF}
        />
        <TextInput defaultValue={DEFAULT_INPUT_CUSTOMER} />
        <TextInput defaultValue={'hello'} value="" />
        <MyButton onPress={this.changeFresh} type="primary">
          Change freshness!
        </MyButton>
        <Text testID="duplicateText">First Text</Text>
        <Text testID="duplicateText">Second Text</Text>
        <Text>{test}</Text>
      </View>
    );
  }
}

test('UNSAFE_getAllByType, UNSAFE_queryAllByType', async () => {
  await render(<Banana />);
  const [text, status, button] = screen.UNSAFE_getAllByType(Text);
  const InExistent = () => null;

  expect(text.props.children).toBe('Is the banana fresh?');
  expect(status.props.children).toBe('not fresh');
  expect(button.props.children).toBe('Change freshness!');
  expect(() => screen.UNSAFE_getAllByType(InExistent)).toThrow('No instances found');

  expect(screen.UNSAFE_queryAllByType(Text)[1]).toBe(status);
  expect(screen.UNSAFE_queryAllByType(InExistent)).toHaveLength(0);
});

test('UNSAFE_getByProps, UNSAFE_queryByProps', async () => {
  await render(<Banana />);
  const primaryType = screen.UNSAFE_getByProps({ type: 'primary' });

  expect(primaryType.props.children).toBe('Change freshness!');
  expect(() => screen.UNSAFE_getByProps({ type: 'inexistent' })).toThrow('No instances found');

  expect(screen.UNSAFE_queryByProps({ type: 'primary' })).toBe(primaryType);
  expect(screen.UNSAFE_queryByProps({ type: 'inexistent' })).toBeNull();
});

test('UNSAFE_getAllByProp, UNSAFE_queryAllByProps', async () => {
  await render(<Banana />);
  const primaryTypes = screen.UNSAFE_getAllByProps({ type: 'primary' });

  expect(primaryTypes).toHaveLength(1);
  expect(() => screen.UNSAFE_getAllByProps({ type: 'inexistent' })).toThrow('No instances found');

  expect(screen.UNSAFE_queryAllByProps({ type: 'primary' })).toEqual(primaryTypes);
  expect(screen.UNSAFE_queryAllByProps({ type: 'inexistent' })).toHaveLength(0);
});

test('update', async () => {
  const fn = jest.fn();
  await render(<Banana onUpdate={fn} />);

  await fireEvent.press(screen.getByText('Change freshness!'));

  await screen.update(<Banana onUpdate={fn} />);
  await screen.rerender(<Banana onUpdate={fn} />);

  expect(fn).toHaveBeenCalledTimes(3);
});

test('unmount', async () => {
  const fn = jest.fn();
  await render(<Banana onUnmount={fn} />);
  await screen.unmount();
  expect(fn).toHaveBeenCalled();
});

test('unmount should handle cleanup functions', async () => {
  const cleanup = jest.fn();
  const Component = () => {
    React.useEffect(() => cleanup);
    return null;
  };

  await render(<Component />);

  await screen.unmount();

  expect(cleanup).toHaveBeenCalledTimes(1);
});

test('toJSON renders host output', async () => {
  await render(<MyButton>press me</MyButton>);
  expect(screen.toJSON()).toMatchSnapshot();
});

test('renders options.wrapper around node', async () => {
  type WrapperComponentProps = { children: React.ReactNode };
  const WrapperComponent = ({ children }: WrapperComponentProps) => (
    <View testID="wrapper">{children}</View>
  );

  await render(<View testID="inner" />, {
    wrapper: WrapperComponent,
  });

  expect(screen.getByTestId('wrapper')).toBeTruthy();
  expect(screen.toJSON()).toMatchInlineSnapshot(`
    <View
      testID="wrapper"
    >
      <View
        testID="inner"
      />
    </View>
  `);
});

test('renders options.wrapper around updated node', async () => {
  type WrapperComponentProps = { children: React.ReactNode };
  const WrapperComponent = ({ children }: WrapperComponentProps) => (
    <View testID="wrapper">{children}</View>
  );

  await render(<View testID="inner" />, {
    wrapper: WrapperComponent,
  });

  await screen.rerender(<View testID="inner" accessibilityLabel="test" accessibilityHint="test" />);

  expect(screen.getByTestId('wrapper')).toBeTruthy();
  expect(screen.toJSON()).toMatchInlineSnapshot(`
    <View
      testID="wrapper"
    >
      <View
        accessibilityHint="test"
        accessibilityLabel="test"
        testID="inner"
      />
    </View>
  `);
});

test('returns host root', async () => {
  await render(<View testID="inner" />);

  expect(screen.root).toBeDefined();
  expect(screen.root.type).toBe('View');
  expect(screen.root.props.testID).toBe('inner');
});

test('returns composite UNSAFE_root', async () => {
  await render(<View testID="inner" />);

  expect(screen.UNSAFE_root).toBeDefined();
  expect(screen.UNSAFE_root.type).toBe(View);
  expect(screen.UNSAFE_root.props.testID).toBe('inner');
});

test('container displays deprecation', async () => {
  await render(<View testID="inner" />);

  expect(() => (screen as any).container).toThrowErrorMatchingInlineSnapshot(`
    "'container' property has been renamed to 'UNSAFE_root'.

    Consider using 'root' property which returns root host element."
  `);
});

test('RenderAPI type', async () => {
  (await render(<Banana />)) as RenderAPI;
  expect(true).toBeTruthy();
});

test('returned output can be spread using rest operator', async () => {
  // Next line should not throw
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { rerender, ...rest } = await render(<View testID="test" />);
  expect(rest).toBeTruthy();
});

test('supports legacy rendering', async () => {
  await render(<View testID="test" />, { concurrentRoot: false });
  expect(screen.root).toBeOnTheScreen();
});

test('supports concurrent rendering', async () => {
  await render(<View testID="test" />, { concurrentRoot: true });
  expect(screen.root).toBeOnTheScreen();
});

test('supports components which can suspend', async () => {
  function wait(delay: number) {
    return new Promise<void>((resolve) => setTimeout(() => resolve(), delay));
  }

  function Suspendable<T>({ promise }: { promise: Promise<T> }) {
    React.use(promise);
    return <View testID="test" />;
  }

  function Fallback() {
    return <View testID="fallback" />;
  }

  await render(
    <View>
      <React.Suspense fallback={<Fallback />}>
        <Suspendable promise={wait(10)} />
      </React.Suspense>
    </View>,
  );

  expect(screen.getByTestId('fallback')).toBeOnTheScreen();
  expect(await screen.findByTestId('test')).toBeOnTheScreen();
});
