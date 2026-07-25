// Back button + small "iter" wordmark, sits at the top of every auth screen.
// Mirrors the nav bar from the Figma prototype instead of using the default
// react-navigation header, so we can keep the exact look or (custom radius,
// spacing etc).

import React from 'react';
import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { colors } from '../theme/colors';
import { BackArrowIcon, LogoMark } from './icons';

export function NavRow({ onBack, dark = false }: { onBack: () => void; dark?: boolean }) {
  const buttonBg = dark ? 'rgba(216,208,192,0.1)' : 'rgba(110,100,88,0.1)';
  const arrowColor = dark ? '#D8D0C0' : colors.nearBlack;
  const wordmarkColor = dark ? '#D8D0C0' : colors.nearBlack;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, { backgroundColor: buttonBg }, pressed && styles.pressed]}
      >
        <BackArrowIcon color={arrowColor} />
      </Pressable>

      <View style={styles.wordmark}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logoLarge} resizeMode="contain" />
        <Text style={[styles.wordmarkText, { color: wordmarkColor }]}>iter</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  logoLarge: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  wordmarkText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
