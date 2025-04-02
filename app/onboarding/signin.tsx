import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Animated, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/ui/PrimaryButton';
import InputField from '../../components/ui/InputField';
import SecondaryButton from '../../components/ui/SecondaryButton';
import { useFonts } from 'expo-font';

export default function SigninScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const contentTranslateY = useRef(new Animated.Value(0)).current;
  
  // Check font loading status
  const [fontsLoaded] = useFonts({
    'Merienda-Medium': require('../../assets/fonts/Merienda-Medium.ttf'),
    'Quicksand-Bold': require('../../assets/fonts/Quicksand-Bold.ttf'),
    'Quicksand-Medium': require('../../assets/fonts/Quicksand-Medium.ttf'),
  });

  const handleSignin = () => {
    setIsSubmitting(true);
    // Simulate network request
    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/onboarding');
    }, 500);
  };
  
  const handleContinue = () => {
    setIsGuestLoading(true);
    // Simulate network request
    setTimeout(() => {
      setIsGuestLoading(false);
      router.push('/onboarding');
    }, 500);
  };
  
  const handleInputFocus = () => {
    setIsInputFocused(true);
    Animated.timing(contentTranslateY, {
      toValue: -55,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  const handleInputBlur = () => {
    setIsInputFocused(false);
    Animated.timing(contentTranslateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  // If fonts aren't loaded yet, we'll still render but with system fonts as fallback
  const fontFamilyHeader = fontsLoaded ? 'Merienda-Medium' : 'System';
  const fontFamilyTitle = fontsLoaded ? 'Quicksand-Bold' : 'System';
  const fontFamilyText = fontsLoaded ? 'Quicksand-Medium' : 'System';
  
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Image 
          source={require('../../assets/images/meshgradient-light-default.png')}
          style={styles.backgroundImage}
        />
        
        {/* Header with smile text */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Text style={[styles.headerText, { fontFamily: fontFamilyHeader }]}>smile</Text>
        </View>
        
        <Animated.View 
          style={[
            styles.contentContainer, 
            { transform: [{ translateY: contentTranslateY }] }
          ]}
        >
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { fontFamily: fontFamilyTitle }]}>Welcome Back</Text>
          </View>
          
          <InputField 
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
          
          <InputField 
            placeholder="Password"
            secureTextEntry
            autoCapitalize="none"
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
          
          <PrimaryButton 
            label="Sign in"
            onPress={handleSignin}
            useDisplayFont={true}
            isLoading={isSubmitting}
          />
          
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={[styles.dividerText, { fontFamily: fontFamilyText }]}>or</Text>
            <View style={styles.divider} />
          </View>
          
          <SecondaryButton 
            label="Continue as guest"
            onPress={handleContinue}
            isLoading={isGuestLoading}
          />
        </Animated.View>
        
        <View style={[styles.signUpContainer, { marginBottom: insets.bottom + 20 }]}>
          <Text style={[styles.signUpText, { fontFamily: fontFamilyText }]}>
            Don't have an account?{' '}
            <Text 
              style={[styles.signUpLink, { fontFamily: fontFamilyHeader }]} 
              onPress={() => router.push('/onboarding/signup')}
            >
              Sign-up
            </Text>
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    margin: 0,
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height,
    resizeMode: 'cover',
    left: 0,
    top: 0,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerText: {
    fontSize: 32,
    color: 'white',
    letterSpacing: 1.6,
    textAlign: 'center',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingTop: 80,
  },
  titleContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'white',
    lineHeight: 48,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    marginVertical: 24,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    width: '30%',
  },
  dividerText: {
    color: 'white',
    paddingHorizontal: 12,
    fontSize: 16,
  },
  signUpContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  signUpText: {
    color: 'white',
    fontSize: 16,
  },
  signUpLink: {
    color: '#4A5568',
    fontWeight: 'bold',
  },
}); 