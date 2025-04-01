import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/ui/PrimaryButton';
import InputField from '../../components/ui/InputField';
import { Colors } from '../../constants/Colors';

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const handleSignup = () => {
    router.push('/onboarding');
  };
  
  const handleContinue = () => {
    router.push('/onboarding');
  };
  
  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/images/meshgradient-light-default.png')}
        style={styles.backgroundImage}
      />
      
      {/* Header with smile text */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.headerText}>smile</Text>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Create a</Text>
          <Text style={styles.title}>new account</Text>
        </View>
        
        <InputField 
          placeholder="Username"
          autoCapitalize="none"
        />
        
        <InputField 
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <PrimaryButton 
          label="Start the journey"
          onPress={handleSignup}
          variant="glass"
          useDisplayFont={true}
        />
        
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>
        
        <PrimaryButton 
          label="Continue as guest"
          onPress={handleContinue}
          variant="filled"
        />
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
    top: -15,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  headerText: {
    fontSize: 32,
    fontFamily: 'Merienda-Medium',
    color: 'white',
    letterSpacing: 1.6,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  titleContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontFamily: 'Quicksand-Bold',
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
    fontFamily: 'Quicksand-Medium',
  },
});
