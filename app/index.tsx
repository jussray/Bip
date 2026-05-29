import React from 'react';
import {
  View,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function HomeScreen() {
  return (
    <ImageBackground
      source={require('../assets/images/EB3C14B2-2137-43DB-A092-12C175F9F98C.png')}
      style={styles.background}
      resizeMode="contain"
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            alert("Next Screen Coming Soon 💜");
          }}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: 250,
    height: 120,
    backgroundColor: 'transparent',
  },
});