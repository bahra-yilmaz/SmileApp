import React, { RefObject } from 'react';
import { View, StyleSheet, Modal, Pressable, Text, FlatList, ListRenderItem, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface BottomSheetModalProps<T> {
  visible: boolean;
  onClose: () => void;
  title: string;
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T) => string;
  listRef?: RefObject<FlatList<T>>;
}

export default function BottomSheetModal<T>({
  visible,
  onClose,
  title,
  data,
  renderItem,
  keyExtractor,
  listRef,
}: BottomSheetModalProps<T>) {
  const insets = useSafeAreaInsets();

  const headerTopPadding = Math.max(insets.top - 30, 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <Image 
            source={require('../../assets/images/meshgradient-light-default.png')}
            style={styles.backgroundImage}
            contentFit="cover"
            cachePolicy="disk"
          />
          
          <View style={[styles.header, { paddingTop: headerTopPadding }] }>
            <View style={styles.closeButton} />
            <Text style={styles.title}>
              {title}
            </Text>
            <Pressable 
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="chevron-down" size={28} color="white" />
            </Pressable>
          </View>
          
          <FlatList
            ref={listRef}
            data={data}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            removeClippedSubviews={false}
            keyboardShouldPersistTaps="handled"
            bounces={true}
            alwaysBounceVertical={false}
            scrollEnabled={true}
            scrollEventThrottle={16}
          />
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    left: 0,
    top: 0,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginBottom: 5,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    color: 'white',
    fontFamily: 'Quicksand-Bold',
    textAlign: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    backgroundColor: 'transparent',
    flexGrow: 1,
  },
}); 