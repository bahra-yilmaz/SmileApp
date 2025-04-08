import React, { useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Animated, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Theme } from '../../constants/Theme';
import { ThemedText } from '../../components/ThemedText';
import { LANGUAGES } from '../i18n';
import { useFonts } from 'expo-font';
import { GlassmorphicCard } from '../../components/ui/GlassmorphicCard';

const { width } = Dimensions.get('window');

export default function LanguageSelectScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load fonts
  const [fontsLoaded] = useFonts({
    'Quicksand-Bold': require('../../assets/fonts/Quicksand-Bold.ttf'),
    'Quicksand-Medium': require('../../assets/fonts/Quicksand-Medium.ttf'),
  });

  const handleLanguageSelect = useCallback(async (langCode: string) => {
    // First change the language
    await i18n.changeLanguage(langCode);
    
    // Fade out this screen
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Then navigate when animation completes
      router.replace('/onboarding/signup');
    });
  }, [i18n, router, fadeAnim]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // If fonts aren't loaded yet, we'll still render but with system fonts as fallback
  const fontFamilyTitle = fontsLoaded ? 'Quicksand-Bold' : 'System';

  return (
    <Animated.View style={[
      styles.container, 
      { opacity: fadeAnim, position: 'absolute', width: '100%', height: '100%' }
    ]}>
      <View style={styles.contentContainer}>
        <View style={styles.titleContainer}>
          <ThemedText style={[styles.title, { fontFamily: fontFamilyTitle }]}>
            Choose Your{'\n'}Language
          </ThemedText>
        </View>

        <View style={styles.languageList}>
          {LANGUAGES.map((lang, index) => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => handleLanguageSelect(lang.code)}
              style={[
                styles.languageButton,
                { marginTop: index === 0 ? 0 : Theme.spacing.md }
              ]}
            >
              <GlassmorphicCard
                intensity={25}
                borderRadius="lg"
                shadow="sm"
                width={width * 0.9}
                style={[
                  styles.buttonContent,
                  { backgroundColor: 'rgba(0, 0, 0, 0.2)' }
                ]}
              >
                <View style={styles.languageRow}>
                  <Text style={styles.flagText}>{lang.flag}</Text>
                  <ThemedText style={styles.languageText}>
                    {t(`languages.${lang.code}`)}
                  </ThemedText>
                </View>
              </GlassmorphicCard>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    margin: 0,
    overflow: 'hidden',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    paddingBottom: 100,
  },
  titleContainer: {
    position: 'absolute',
    top: 190,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 40,
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'white',
    lineHeight: 48,
  },
  languageList: {
    width: '100%',
    paddingHorizontal: Theme.spacing.lg,
  },
  languageButton: {
    width: '100%',
    alignItems: 'center',
  },
  buttonContent: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagText: {
    fontSize: 24,
    marginRight: Theme.spacing.md,
  },
  languageText: {
    fontSize: Theme.typography.sizes.lg,
    color: 'white',
  },
}); 