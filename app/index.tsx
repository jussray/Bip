import React from 'react';
import {
  View,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/images/EB3C14B2-2137-43DB-A092-12C175F9F98C.png')}
        style={styles.background}
        resizeMode="contain"
      >
        {/* Tap zone over the glowing "Se'kret Bip ♡" pill button */}
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.7}
          onPress={() => router.push('/home')}
        />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060010',
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  // Sits over the glowing "Se'kret Bip ♡" pill ~78-88% down the image
  button: {
    position: 'absolute',
    bottom: '14%',
    alignSelf: 'center',
    width: '75%',
    height: 70,
    backgroundColor: 'transparent',
  },
});
