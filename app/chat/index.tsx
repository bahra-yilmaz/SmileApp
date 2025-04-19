import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function ChatRedirectPage() {
  const router = useRouter();
  
  // Redirect to home page which now handles all chat functionality
  React.useEffect(() => {
    router.replace('/');
  }, []);
  
  return (
    <View style={styles.container}>
      {/* This page is just a redirect now */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 