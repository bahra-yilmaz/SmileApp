import React, { useCallback, useRef, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Text, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Theme } from '../../constants/Theme';
import ThemedText from '../../components/ThemedText';
import { LANGUAGES, LanguageItem } from '../../services/languageConfig';
import { useFonts } from 'expo-font';
import { GlassmorphicCard } from '../../components/ui/GlassmorphicCard';
import PrimaryButton from '../../components/ui/PrimaryButton';
import * as Haptics from 'expo-haptics';
import { OnboardingService } from '../../services/OnboardingService';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - (Theme.spacing.lg * 2) - Theme.spacing.md) / 2;

export default function LanguageSelectScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Load fonts
  const [fontsLoaded] = useFonts({
    'Quicksand-Bold': require('../../assets/fonts/Quicksand-Bold.ttf'),
    'Quicksand-Medium': require('../../assets/fonts/Quicksand-Medium.ttf'),
  });

  const handleLanguageSelect = useCallback(async (langCode: string) => {
    // Change the language
    await i18n.changeLanguage(langCode);
    // Update selected language
    setSelectedLanguage(langCode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [i18n]);

  const handleContinue = useCallback(async () => {
    if (isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      // Save user language preference
      if (user?.id && selectedLanguage) {
        await OnboardingService.setUserLanguage(user.id, selectedLanguage);
      }

      // The preloading logic is now handled globally in _layout.tsx.
      // We can add a small artificial delay if the transition feels too fast.
      await new Promise(r => setTimeout(r, 400));

      // Navigate to the Home screen
      router.replace('/(home)');

    } catch (err) {
      console.error('Failed during language selection continuation:', err);
      // In case of an error, allow the user to try again.
      setIsLoading(false);
    }
  }, [user, selectedLanguage, isLoading]);

  // If fonts aren't loaded yet, we'll still render but with system fonts as fallback
  const fontFamilyTitle = fontsLoaded ? 'Quicksand-Bold' : 'System';

  const renderLanguageItem = ({ item: lang }: { item: LanguageItem }) => (
    <TouchableOpacity
      key={lang.code}
      onPress={() => handleLanguageSelect(lang.code)}
      style={styles.languageButton}
    >
      <GlassmorphicCard
        intensity={25}
        borderRadius="lg"
        shadow="sm"
        width={ITEM_WIDTH}
        style={[
          styles.buttonContent,
          { 
            backgroundColor: selectedLanguage === lang.code 
              ? 'rgba(0, 100, 255, 0.3)' 
              : 'rgba(0, 0, 0, 0.2)' 
          }
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
  );

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.titleContainer}>
          <ThemedText style={[styles.title, { fontFamily: fontFamilyTitle }]}>
            {t('onboarding.languageSelectScreen.title')}
          </ThemedText>
        </View>

        <View style={styles.languageGrid}>
          <FlatList
            data={LANGUAGES}
            renderItem={renderLanguageItem}
            keyExtractor={(item) => item.code}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.flatListContent}
          />
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            label={t('common.Continue')}
            onPress={handleContinue}
            disabled={!selectedLanguage || isLoading}
            isLoading={isLoading}
            width={width * 0.85}
            useDisplayFont={true}
          />
        </View>
      </View>
    </View>
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
    paddingBottom: 40,
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
  languageGrid: {
    width: '100%',
    paddingHorizontal: Theme.spacing.lg,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  languageButton: {
    marginBottom: Theme.spacing.md,
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
    fontSize: Theme.typography.sizes.md,
    color: 'white',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
}); 