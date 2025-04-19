import React, { useState } from 'react';
import { Redirect } from 'expo-router';
import ChatButton from '../components/home/ChatButton';
import ChatOverlay from '../components/home/ChatOverlay';
import { View, StyleSheet } from 'react-native';

export default function RootScreen() {
  const [showChatOverlay, setShowChatOverlay] = useState(false);
  
  const toggleChatOverlay = () => {
    setShowChatOverlay(!showChatOverlay);
  };
  
  return (
    <View style={styles.container}>
      <Redirect href="/onboarding/language-select" />
      
      <ChatButton 
        hasUnreadMessages={true} 
        onPress={toggleChatOverlay}
      />
      
      <ChatOverlay
        isVisible={showChatOverlay}
        onClose={() => setShowChatOverlay(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 