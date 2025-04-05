import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Animated, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/ui/PrimaryButton';
import InputField from '../../components/ui/InputField';
import { Colors } from '../../constants/Colors';
import SecondaryButton from '../../components/ui/SecondaryButton';
import { useFonts } from 'expo-font';
import { SvgXml } from 'react-native-svg';

const googleIcon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M19.6 10.2273C19.6 9.51818 19.5364 8.83636 19.4182 8.18182H10V12.05H15.3818C15.15 13.3 14.4455 14.3591 13.3864 15.0682V17.5773H16.6182C18.5091 15.8364 19.6 13.2727 19.6 10.2273Z" fill="#4285F4"/>
<path d="M10 20C12.7 20 14.9636 19.1045 16.6181 17.5773L13.3863 15.0682C12.4909 15.6682 11.3454 16.0227 10 16.0227C7.39545 16.0227 5.19091 14.2636 4.40455 11.9H1.06364V14.4909C2.70909 17.7591 6.09091 20 10 20Z" fill="#34A853"/>
<path d="M4.40455 11.9C4.20455 11.3 4.09091 10.6591 4.09091 10C4.09091 9.34091 4.20455 8.7 4.40455 8.1V5.50909H1.06364C0.386364 6.85909 0 8.38636 0 10C0 11.6136 0.386364 13.1409 1.06364 14.4909L4.40455 11.9Z" fill="#FBBC04"/>
<path d="M10 3.97727C11.4681 3.97727 12.7863 4.48182 13.8227 5.47273L16.6909 2.60455C14.9591 0.990909 12.6954 0 10 0C6.09091 0 2.70909 2.24091 1.06364 5.50909L4.40455 8.1C5.19091 5.73636 7.39545 3.97727 10 3.97727Z" fill="#E94235"/>
</svg>`;

export default function SigninScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const contentTranslateY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
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
  
  // Add keyboard dismiss when tapping outside
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        handleInputBlur();
      }
    );

    return () => {
      keyboardDidHideListener.remove();
    };
  }, []);
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);
  
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Image 
          source={require('../../assets/images/meshgradient-light-default.png')}
          style={styles.backgroundImage}
        />
        
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Text style={[styles.headerText, { fontFamily: fontFamilyHeader }]}>smile</Text>
        </View>
        
        <Animated.View 
          style={[
            styles.contentContainer, 
            { 
              transform: [
                { translateY: contentTranslateY },
                { 
                  translateX: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }
              ],
              opacity: fadeAnim 
            }
          ]}
        >
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { fontFamily: fontFamilyTitle }]}>
              Welcome to{'\n'}your account
            </Text>
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
          
          <Image
            source={require('../../assets/mascot/nubo-brushing-1.png')}
            style={styles.mascotImage}
          />
          
          <PrimaryButton 
            label="Step Inside"
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
            label="Sign-in with Google"
            onPress={handleContinue}
            isLoading={isGuestLoading}
            icon={<SvgXml xml={googleIcon} width={20} height={20} />}
          />
        </Animated.View>
        
        <View style={[styles.signInContainer, { marginBottom: insets.bottom + 20 }]}>
          <Text style={[styles.signInText, { fontFamily: fontFamilyText }]}>
            Don't have an account?{' '}
            <Text 
              style={[styles.signInLink, { fontFamily: fontFamilyHeader }]} 
              onPress={() => router.push('/onboarding/signup')}
            >
              Sign-up
            </Text>
          </Text>
        </View>
      </Animated.View>
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
    justifyContent: 'flex-end',
    flex: 1,
    paddingBottom: 160,
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
  signInContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 40,
  },
  signInText: {
    color: 'white',
    fontSize: 16,
  },
  signInLink: {
    color: Colors.primary[600],
    fontWeight: 'bold',
  },
  mascotImage: {
    position: 'absolute',
    width: 160,
    height: 160,
    right: 10,
    bottom: 380,
    zIndex: 1,
    resizeMode: 'contain',
  },
}); 