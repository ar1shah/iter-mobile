// First screen you see when logged out. Dark theme, on purpose - it's the
// only screen in the app that isn't the cream/gold look, just like in the
// Figma file.

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Image,Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import type { AuthStackParamList } from '../../navigation/types';
require('../../../assets/images/logo.png')
type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Image
          source={require('../../../assets/images/logo.png')}
          style={styles.logoLarge}
          resizeMode="contain"
        />
        <Text style={styles.wordmark}>iter</Text>

        <View style={styles.divider} />

        <Text style={styles.headline}>Track every mile.</Text>
        <Text style={styles.subhead}>
          Your runs, your pace, your progress — all in one place.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => navigation.navigate('SignIn')}
          style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}
        >
          <Text style={styles.loginLabel}>Log In</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('SignUp')}
          style={({ pressed }) => [styles.signUpButton, pressed && styles.pressed]}
        >
          <Text style={styles.signUpLabel}>Sign Up</Text>
        </Pressable>

        <Text style={styles.terms}>
          By continuing you agree to our <Text style={styles.termsLink}>Terms</Text> &{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.creamBg,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  logo: {
    width: 48,
    height: 48,
  },
  logoLarge: {
  width: 120,
  height: 120,
  marginBottom: 20,
},
  wordmark: {
    color: colors.gold,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1.5,
    marginTop: 20,
  },
  divider: {
    width: 40,
    height: 1.5,
    backgroundColor: 'rgba(213,160,33,0.5)',
    borderRadius: 2,
    marginVertical: 40,
  },
  headline: {
    color: colors.gold,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subhead: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 240,
    marginTop: 8,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  loginButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  loginLabel: {
    color: '#1A1714',
    fontSize: 16,
    fontWeight: '700',
  },
  signUpButton: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.gold,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpLabel: {
    color: colors.nearBlack,
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
  terms: {
    color: '#6E6458',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
  },
  termsLink: {
    color: colors.gold,
  },
});
