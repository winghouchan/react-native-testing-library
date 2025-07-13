import * as React from 'react';
import {
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { fireEvent, render, screen } from '..';

type OnPressComponentProps = {
  onPress: () => void;
  text: string;
};
const OnPressComponent = ({ onPress, text }: OnPressComponentProps) => (
  <View>
    <TouchableOpacity onPress={onPress}>
      <Text>{text}</Text>
    </TouchableOpacity>
  </View>
);

type WithoutEventComponentProps = { onPress: () => void };
const WithoutEventComponent = (_props: WithoutEventComponentProps) => (
  <View>
    <Text>Without event</Text>
  </View>
);

type CustomEventComponentProps = {
  onCustomEvent: () => void;
};
const CustomEventComponent = ({ onCustomEvent }: CustomEventComponentProps) => (
  <TouchableOpacity onPress={onCustomEvent}>
    <Text>Custom event component</Text>
  </TouchableOpacity>
);

type MyCustomButtonProps = {
  handlePress: () => void;
  text: string;
};
const MyCustomButton = ({ handlePress, text }: MyCustomButtonProps) => (
  <OnPressComponent onPress={handlePress} text={text} />
);

type CustomEventComponentWithCustomNameProps = {
  handlePress: () => void;
};
const CustomEventComponentWithCustomName = ({
  handlePress,
}: CustomEventComponentWithCustomNameProps) => (
  <MyCustomButton handlePress={handlePress} text="Custom component" />
);

describe('fireEvent', () => {
  test('should invoke specified event', async () => {
    const onPressMock = jest.fn();
    await render(<OnPressComponent onPress={onPressMock} text="Press me" />);

    await fireEvent(screen.getByText('Press me'), 'press');

    expect(onPressMock).toHaveBeenCalled();
  });

  test('should invoke specified event on parent element', async () => {
    const onPressMock = jest.fn();
    const text = 'New press text';
    await render(<OnPressComponent onPress={onPressMock} text={text} />);

    await fireEvent(screen.getByText(text), 'press');
    expect(onPressMock).toHaveBeenCalled();
  });

  test('should not fire if the press handler is not passed to children', async () => {
    const onPressMock = jest.fn();
    await render(
      // TODO: this functionality is buggy, i.e. it will fail if we wrap this component with a View.
      <WithoutEventComponent onPress={onPressMock} />,
    );
    await fireEvent(screen.getByText('Without event'), 'press');
    expect(onPressMock).not.toHaveBeenCalled();
  });

  test('should invoke event with custom name', async () => {
    const handlerMock = jest.fn();
    const EVENT_DATA = 'event data';

    await render(
      <View>
        <CustomEventComponent onCustomEvent={handlerMock} />
      </View>,
    );

    await fireEvent(screen.getByText('Custom event component'), 'customEvent', EVENT_DATA);

    expect(handlerMock).toHaveBeenCalledWith(EVENT_DATA);
  });
});

test('fireEvent.press', async () => {
  const onPressMock = jest.fn();
  const text = 'Fireevent press';
  const eventData = {
    nativeEvent: {
      pageX: 20,
      pageY: 30,
    },
  };
  await render(<OnPressComponent onPress={onPressMock} text={text} />);

  await fireEvent.press(screen.getByText(text), eventData);

  expect(onPressMock).toHaveBeenCalledWith(eventData);
});

test('fireEvent.scroll', async () => {
  const onScrollMock = jest.fn();
  const eventData = {
    nativeEvent: {
      contentOffset: {
        y: 200,
      },
    },
  };

  await render(
    <ScrollView onScroll={onScrollMock}>
      <Text>XD</Text>
    </ScrollView>,
  );

  await fireEvent.scroll(screen.getByText('XD'), eventData);

  expect(onScrollMock).toHaveBeenCalledWith(eventData);
});

test('fireEvent.changeText', async () => {
  const onChangeTextMock = jest.fn();

  await render(
    <View>
      <TextInput placeholder="Customer placeholder" onChangeText={onChangeTextMock} />
    </View>,
  );

  const input = screen.getByPlaceholderText('Customer placeholder');
  await fireEvent.changeText(input, 'content');
  expect(onChangeTextMock).toHaveBeenCalledWith('content');
});

it('sets native state value for unmanaged text inputs', async () => {
  await render(<TextInput testID="input" />);

  const input = screen.getByTestId('input');
  expect(input).toHaveDisplayValue('');

  await fireEvent.changeText(input, 'abc');
  expect(input).toHaveDisplayValue('abc');
});

test('custom component with custom event name', async () => {
  const handlePress = jest.fn();

  await render(<CustomEventComponentWithCustomName handlePress={handlePress} />);

  await fireEvent(screen.getByText('Custom component'), 'handlePress');

  expect(handlePress).toHaveBeenCalled();
});

test('event with multiple handler parameters', async () => {
  const handlePress = jest.fn();

  await render(<CustomEventComponentWithCustomName handlePress={handlePress} />);

  await fireEvent(screen.getByText('Custom component'), 'handlePress', 'param1', 'param2');

  expect(handlePress).toHaveBeenCalledWith('param1', 'param2');
});

test('should not fire on disabled TouchableOpacity', async () => {
  const handlePress = jest.fn();
  await render(
    <View>
      <TouchableOpacity onPress={handlePress} disabled={true}>
        <Text>Trigger</Text>
      </TouchableOpacity>
    </View>,
  );

  await fireEvent.press(screen.getByText('Trigger'));
  expect(handlePress).not.toHaveBeenCalled();
});

test('should not fire on disabled Pressable', async () => {
  const handlePress = jest.fn();
  await render(
    <View>
      <Pressable onPress={handlePress} disabled={true}>
        <Text>Trigger</Text>
      </Pressable>
    </View>,
  );

  await fireEvent.press(screen.getByText('Trigger'));
  expect(handlePress).not.toHaveBeenCalled();
});

test('should not fire inside View with pointerEvents="none"', async () => {
  const onPress = jest.fn();
  await render(
    <View pointerEvents="none">
      <Pressable onPress={onPress}>
        <Text>Trigger</Text>
      </Pressable>
    </View>,
  );

  await fireEvent.press(screen.getByText('Trigger'));
  await fireEvent(screen.getByText('Trigger'), 'onPress');
  expect(onPress).not.toHaveBeenCalled();
});

test('should not fire inside View with pointerEvents="box-only"', async () => {
  const onPress = jest.fn();
  await render(
    <View pointerEvents="box-only">
      <Pressable onPress={onPress}>
        <Text>Trigger</Text>
      </Pressable>
    </View>,
  );

  await fireEvent.press(screen.getByText('Trigger'));
  await fireEvent(screen.getByText('Trigger'), 'onPress');
  expect(onPress).not.toHaveBeenCalled();
});

test('should fire inside View with pointerEvents="box-none"', async () => {
  const onPress = jest.fn();
  await render(
    <View pointerEvents="box-none">
      <Pressable onPress={onPress}>
        <Text>Trigger</Text>
      </Pressable>
    </View>,
  );

  await fireEvent.press(screen.getByText('Trigger'));
  await fireEvent(screen.getByText('Trigger'), 'onPress');
  expect(onPress).toHaveBeenCalledTimes(2);
});

test('should fire inside View with pointerEvents="auto"', async () => {
  const onPress = jest.fn();
  await render(
    <View pointerEvents="auto">
      <Pressable onPress={onPress}>
        <Text>Trigger</Text>
      </Pressable>
    </View>,
  );

  await fireEvent.press(screen.getByText('Trigger'));
  await fireEvent(screen.getByText('Trigger'), 'onPress');
  expect(onPress).toHaveBeenCalledTimes(2);
});

test('should not fire deeply inside View with pointerEvents="box-only"', async () => {
  const onPress = jest.fn();
  await render(
    <View pointerEvents="box-only">
      <View>
        <Pressable onPress={onPress}>
          <Text>Trigger</Text>
        </Pressable>
      </View>
    </View>,
  );

  await fireEvent.press(screen.getByText('Trigger'));
  await fireEvent(screen.getByText('Trigger'), 'onPress');
  expect(onPress).not.toHaveBeenCalled();
});

test('should fire non-pointer events inside View with pointerEvents="box-none"', async () => {
  const onTouchStart = jest.fn();
  await render(<View testID="view" pointerEvents="box-none" onTouchStart={onTouchStart} />);

  await fireEvent(screen.getByTestId('view'), 'touchStart');
  expect(onTouchStart).toHaveBeenCalled();
});

test('should fire non-touch events inside View with pointerEvents="box-none"', async () => {
  const onLayout = jest.fn();
  await render(<View testID="view" pointerEvents="box-none" onLayout={onLayout} />);

  await fireEvent(screen.getByTestId('view'), 'layout');
  expect(onLayout).toHaveBeenCalled();
});

// This test if pointerEvents="box-only" on composite `Pressable` is blocking
// the 'press' event on host View rendered by pressable.
test('should fire on Pressable with pointerEvents="box-only', async () => {
  const onPress = jest.fn();
  await render(<Pressable testID="pressable" pointerEvents="box-only" onPress={onPress} />);

  await fireEvent.press(screen.getByTestId('pressable'));
  expect(onPress).toHaveBeenCalled();
});

test('should pass event up on disabled TouchableOpacity', async () => {
  const handleInnerPress = jest.fn();
  const handleOuterPress = jest.fn();
  await render(
    <TouchableOpacity onPress={handleOuterPress}>
      <TouchableOpacity onPress={handleInnerPress} disabled={true}>
        <Text>Inner Trigger</Text>
      </TouchableOpacity>
    </TouchableOpacity>,
  );

  await fireEvent.press(screen.getByText('Inner Trigger'));
  expect(handleInnerPress).not.toHaveBeenCalled();
  expect(handleOuterPress).toHaveBeenCalledTimes(1);
});

test('should pass event up on disabled Pressable', async () => {
  const handleInnerPress = jest.fn();
  const handleOuterPress = jest.fn();
  await render(
    <Pressable onPress={handleOuterPress}>
      <Pressable onPress={handleInnerPress} disabled={true}>
        <Text>Inner Trigger</Text>
      </Pressable>
    </Pressable>,
  );

  await fireEvent.press(screen.getByText('Inner Trigger'));
  expect(handleInnerPress).not.toHaveBeenCalled();
  expect(handleOuterPress).toHaveBeenCalledTimes(1);
});

type TestComponentProps = {
  onPress: () => void;
  disabled?: boolean;
};
const TestComponent = ({ onPress }: TestComponentProps) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>Trigger Test</Text>
    </TouchableOpacity>
  );
};

test('is not fooled by non-native disabled prop', async () => {
  const handlePress = jest.fn();
  await render(<TestComponent onPress={handlePress} disabled={true} />);

  await fireEvent.press(screen.getByText('Trigger Test'));
  expect(handlePress).toHaveBeenCalledTimes(1);
});

type TestChildTouchableComponentProps = {
  onPress: () => void;
  someProp: boolean;
};

function TestChildTouchableComponent({ onPress, someProp }: TestChildTouchableComponentProps) {
  return (
    <View>
      <TouchableOpacity onPress={onPress} disabled={someProp}>
        <Text>Trigger</Text>
      </TouchableOpacity>
    </View>
  );
}

test('is not fooled by non-responder wrapping host elements', async () => {
  const handlePress = jest.fn();

  await render(
    <View>
      <TestChildTouchableComponent onPress={handlePress} someProp={true} />
    </View>,
  );

  await fireEvent.press(screen.getByText('Trigger'));
  expect(handlePress).not.toHaveBeenCalled();
});

type TestDraggableComponentProps = { onDrag: () => void };

function TestDraggableComponent({ onDrag }: TestDraggableComponentProps) {
  const responderHandlers = PanResponder.create({
    onMoveShouldSetPanResponder: (_evt, _gestureState) => true,
    onPanResponderMove: onDrag,
  }).panHandlers;

  return (
    <View {...responderHandlers}>
      <Text>Trigger</Text>
    </View>
  );
}

test('has only onMove', async () => {
  const handleDrag = jest.fn();

  await render(<TestDraggableComponent onDrag={handleDrag} />);

  await fireEvent(screen.getByText('Trigger'), 'responderMove', {
    touchHistory: { mostRecentTimeStamp: '2', touchBank: [] },
  });
  expect(handleDrag).toHaveBeenCalled();
});

// Those events ideally should be triggered through `fireEvent.scroll`, but they are handled at the
// native level, so we need to support manually triggering them
describe('native events', () => {
  test('triggers onScrollBeginDrag', async () => {
    const onScrollBeginDragSpy = jest.fn();
    await render(<ScrollView testID="test-id" onScrollBeginDrag={onScrollBeginDragSpy} />);

    await fireEvent(screen.getByTestId('test-id'), 'onScrollBeginDrag');
    expect(onScrollBeginDragSpy).toHaveBeenCalled();
  });

  test('triggers onScrollEndDrag', async () => {
    const onScrollEndDragSpy = jest.fn();
    await render(<ScrollView testID="test-id" onScrollEndDrag={onScrollEndDragSpy} />);

    await fireEvent(screen.getByTestId('test-id'), 'onScrollEndDrag');
    expect(onScrollEndDragSpy).toHaveBeenCalled();
  });

  test('triggers onMomentumScrollBegin', async () => {
    const onMomentumScrollBeginSpy = jest.fn();
    await render(<ScrollView testID="test-id" onMomentumScrollBegin={onMomentumScrollBeginSpy} />);

    await fireEvent(screen.getByTestId('test-id'), 'onMomentumScrollBegin');
    expect(onMomentumScrollBeginSpy).toHaveBeenCalled();
  });

  test('triggers onMomentumScrollEnd', async () => {
    const onMomentumScrollEndSpy = jest.fn();
    await render(<ScrollView testID="test-id" onMomentumScrollEnd={onMomentumScrollEndSpy} />);

    await fireEvent(screen.getByTestId('test-id'), 'onMomentumScrollEnd');
    expect(onMomentumScrollEndSpy).toHaveBeenCalled();
  });
});
