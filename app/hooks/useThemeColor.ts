import { useColorScheme } from 'react-native';
import Theme from '../../constants/Theme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Theme.colors.light & keyof typeof Theme.colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }
  
  return Theme.colors[theme][colorName];
} 