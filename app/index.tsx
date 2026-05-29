import React from 'react';
import {
  View,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/images/EB3C14B2-2137-43DB-A092-12C175F9F98C.png')}
        style={styles.background}
        resizeMode="contain"
      >
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            router.push('/home');
          }}
        />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#160028',
    justifyContent: 'center',
    alignItems: 'center',
  },

  background: {
    width: '70%',
    height: '90%',
  },

  button: {
    position: 'absolute',
    top: '20%',
    alignSelf: 'center',
    width: 320,
    height: 180,
    backgroundColor: 'transparent',
  },
});