import React from 'react';
import { View, StyleSheet, Modal, Pressable, Text, FlatList, ListRenderItem } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

interface BottomSheetModalProps<T> {
  visible: boolean;
  onClose: () => void;
  title: string;
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T) => string;
}

export default function BottomSheetModal<T>({
  visible,
  onClose,
  title,
  data,
  renderItem,
  keyExtractor,
}: BottomSheetModalProps<T>) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Image 
          source={require('../../assets/images/meshgradient-light-default.png')}
          style={styles.backgroundImage}
          contentFit="cover"
          cachePolicy="disk"
        />
        
        <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
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
          data={data}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
    paddingBottom: 40,
    backgroundColor: 'transparent',
  },
}); 