
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogoMark } from '../../components/icons';
import { NavRow } from '../../components/NavRow';
import { PaceInput } from '../../components/PaceInput';
import { RouteThumbnail } from '../../components/RouteThumbnail';
import { useRunData } from '../../context/RunDataContext';
import type { AppStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'StartRun'>;

export function StartRunScreen({ navigation }: Props) {
  const { savedPaths } = useRunData();
  const [isStarting, setIsStarting] = useState(false);

  const startSound = useAudioPlayer(
    require('../../../assets/sounds/Start.mp3'),
  );

  const [targetPace, setTargetPace] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');

  const filteredPaths = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return savedPaths;
    }

    return savedPaths.filter((path) =>
      path.name.toLowerCase().includes(query),
    );
  }, [savedPaths, searchText]);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
    }).catch((error) => {
      console.error('Failed to configure audio:', error);
    });
  }, []);

  async function handleStartRun(path: (typeof savedPaths)[number]) {
    if (targetPace === null || isStarting) {
      return;
    }

    setIsStarting(true);

    try {
      await startSound.seekTo(0);
      startSound.play();

      const durationSeconds = startSound.duration;

      if (durationSeconds > 0) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, durationSeconds * 1000);
        });
      }

      navigation.navigate('RunInProgress', {
        path,
        targetPaceSeconds: targetPace,
      });
    } catch (error) {
      console.error('Failed to start run:', error);
      setIsStarting(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'bottom']}
    >
      <NavRow onBack={() => navigation.goBack()} />

      <View style={styles.header}>
        <Text style={styles.title}>Choose a path to run</Text>
        <Text style={styles.subtitle}>
          Pick a saved route and hit Start.
        </Text>
      </View>

      <View style={styles.paceSection}>
        <Text style={styles.paceTitle}>Set your target pace</Text>

        <View style={styles.paceLabels}>
          <Text style={styles.paceLabel}>Minutes</Text>
          <Text style={styles.paceLabel}>Seconds</Text>
        </View>

        <PaceInput
          value={targetPace ?? undefined}
          onChange={setTargetPace}
        />

        <Text style={styles.paceUnit}>minutes per mile</Text>
      </View>

      {savedPaths.length > 0 && (
        <View style={styles.searchContainer}>
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search saved paths"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
            style={styles.searchInput}
          />
        </View>
      )}

      {savedPaths.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            No saved paths yet
          </Text>

          <Text style={styles.emptyBody}>
            Head over to "Create a Path" on the Home tab to draw
            your first route before starting a run.
          </Text>
        </View>
      ) : filteredPaths.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            No matching paths
          </Text>

          <Text style={styles.emptyBody}>
            No saved paths matched "{searchText.trim()}".
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPaths}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={styles.pathRow}>
              <RouteThumbnail points={item.points} />

              <View style={styles.pathDetails}>
                <Text
                  style={styles.pathName}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>

                <View style={styles.pathMetaRow}>
                  <Text style={styles.pathDistance}>
                    {item.distanceMiles.toFixed(1)} mi
                  </Text>
                </View>
              </View>

              <Pressable
                disabled={targetPace === null || isStarting}
                onPress={() => handleStartRun(item)}
                style={({ pressed }) => [
                  styles.startButton,
                  (targetPace === null || isStarting) &&
                    styles.startButtonDisabled,
                  pressed &&
                    targetPace !== null &&
                    !isStarting &&
                    styles.pressed,
                ]}
              >
                <LogoMark size={11} color="#1A1714" />

                <Text style={styles.startLabel}>
                  {isStarting ? 'Starting...' : 'Start'}
                </Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.creamBg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: {
    color: colors.nearBlack,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 16,
  },
  paceSection: {
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.fieldBg,
    borderWidth: 1.5,
    borderColor: 'rgba(110,100,88,0.14)',
    alignItems: 'center',
  },
  paceTitle: {
    color: colors.nearBlack,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  paceLabels: {
    width: 218,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    marginBottom: 6,
  },
  paceLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  paceUnit: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  searchInput: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(110,100,88,0.18)',
    backgroundColor: colors.fieldBg,
    color: colors.nearBlack,
    fontSize: 15,
  },
  emptyState: {
    paddingHorizontal: 32,
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    color: colors.nearBlack,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 28,
  },
  pathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.fieldBg,
    borderWidth: 1.5,
    borderColor: 'rgba(110,100,88,0.14)',
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  pathDetails: {
    flex: 1,
    minWidth: 0,
  },
  pathName: {
    color: colors.nearBlack,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  pathMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pathDistance: {
    color: colors.nearBlack,
    fontSize: 14,
    fontWeight: '800',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 99,
    backgroundColor: colors.gold,
  },
  startButtonDisabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
  },
  startLabel: {
    color: '#1A1714',
    fontSize: 13,
    fontWeight: '700',
  },
});

