import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, TextStyle } from 'react-native';
import ThemedText from '../ThemedText';

interface CountUpTextProps {
  /** Final numeric value to count up to */
  value: number;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Optional prefix (e.g. '+') */
  prefix?: string;
  /** Optional suffix (e.g. '%') */
  suffix?: string;
  /** Styles passed to underlying ThemedText */
  style?: TextStyle | TextStyle[];
  /** Custom formatter for intermediate values */
  formatter?: (val: number) => string;
}

const CountUpText: React.FC<CountUpTextProps> = ({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  style,
  formatter,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const id = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(v);
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, // number animations require native driver disabled
    }).start(() => {
      animatedValue.removeListener(id);
      setDisplayValue(value); // ensure we end exactly on the target value
    });

    return () => {
      animatedValue.removeListener(id);
    };
  }, [value, duration, animatedValue]);

  const formatted = formatter
    ? formatter(displayValue)
    : Math.round(displayValue).toString();

  return (
    <ThemedText style={style}>{`${prefix}${formatted}${suffix}`}</ThemedText>
  );
};

export default CountUpText; 