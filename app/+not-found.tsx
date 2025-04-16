import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import ThemedText from '../components/ThemedText';
import GlassmorphicCard from '../components/ui/GlassmorphicCard';
import { useTheme } from '../components/ThemeProvider';

export default function NotFoundScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Oops!' }} />
      
      <GlassmorphicCard style={styles.card}>
        <ThemedText 
          variant="title" 
          style={styles.title}
          useDisplayFont
          weight="medium"
        >
          Not Found
        </ThemedText>
        <ThemedText variant="body" style={styles.message}>
          The page you're looking for doesn't exist.
        </ThemedText>
        
        <Pressable 
          style={styles.button} 
          onPress={() => router.replace('/')}
        >
          <ThemedText style={styles.buttonText} weight="medium">
            Go to Home
          </ThemedText>
        </Pressable>
      </GlassmorphicCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 24,
    width: '100%',
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#0095E6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  }
}); 