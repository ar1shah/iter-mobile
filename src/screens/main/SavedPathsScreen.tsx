import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRightIcon, LogoMark, PlusIcon, TrashIcon } from '../../components/icons';
import { RouteThumbnail } from '../../components/RouteThumbnail';
import { useRunData } from '../../context/RunDataContext';
import type { AppStackParamList, MainTabParamList } from '../../navigation/types';
import type { SavedPath } from '../../api/pathsApi';
import { colors } from '../../theme/colors';
import { formatLongDate } from '../../utils/date';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Paths'>,
  NativeStackScreenProps<AppStackParamList>
>;

export function SavedPathsScreen({ navigation }: Props) {
  const { savedPaths, deletePath } = useRunData();
  const [selectedPath, setSelectedPath] = useState<SavedPath | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = (path: SavedPath) => {
    Alert.alert('Delete path?', `"${path.name}" will be removed permanently.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deletePath(path.id);
            setSelectedPath(null);
          } catch (err) {
            Alert.alert('Could not delete path', err instanceof Error ? err.message : 'Try again.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Saved Paths</Text>
          {savedPaths.length > 0 && (
            <Text style={styles.count}>{savedPaths.length} routes</Text>
          )}
        </View>
        {savedPaths.length > 0 && <Text style={styles.subtitle}>Tap a route to preview.</Text>}
      </View>

      {savedPaths.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBadge}>
            <LogoMark size={36} />
          </View>
          <Text style={styles.emptyTitle}>No saved paths yet</Text>
          <Text style={styles.emptyBody}>
            Build your first route on the map and save it here to run it again anytime.
          </Text>
          <Pressable
            onPress={() => navigation.navigate('PathBuilder')}
            style={({ pressed }) => [styles.emptyCta, pressed && styles.pressed]}
          >
            <PlusIcon color="#1A1714" />
            <Text style={styles.emptyCtaLabel}>Create your first path</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={savedPaths}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            <Pressable
              onPress={() => navigation.navigate('PathBuilder')}
              style={({ pressed }) => [styles.newPathButton, pressed && styles.pressed]}
            >
              <PlusIcon color={colors.gold} size={15} />
              <Text style={styles.newPathLabel}>New path</Text>
            </Pressable>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelectedPath(item)}
              style={({ pressed }) => [styles.pathCard, pressed && styles.pathCardPressed]}
            >
              <RouteThumbnail points={item.points} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.pathName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.pathMetaRow}>
                  <Text style={styles.pathDistance}>{item.distanceMiles.toFixed(1)} mi</Text>
                  {/* <View style={styles.dot} />
                  <Text style={styles.pathPoints}>{item.points.length} pts</Text> */}
                </View>
              </View>
              <View style={styles.chevronBadge}>
                <ChevronRightIcon />
              </View>
            </Pressable>
          )}
        />
      )}

      <Modal
        visible={selectedPath !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPath(null)}
      >
        <Pressable style={styles.scrim} onPress={() => setSelectedPath(null)} />
        {selectedPath && (
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetThumbnailWrap}>
              <RouteThumbnail points={selectedPath.points} width={311} height={140} />
            </View>
            <Text style={styles.sheetTitle}>{selectedPath.name}</Text>
            <View style={styles.sheetStatsRow}>
              <View style={styles.sheetStat}>
                <Text style={styles.sheetStatLabel}>Distance</Text>
                <Text style={styles.sheetStatValue}>{selectedPath.distanceMiles.toFixed(1)} mi</Text>
              </View>
              {/* <View style={styles.sheetStat}>
                <Text style={styles.sheetStatLabel}>Points</Text>
                <Text style={styles.sheetStatValue}>{selectedPath.points.length}</Text>
              </View> */}
              <View style={styles.sheetStat}>
                <Text style={styles.sheetStatLabel}>Saved</Text>
              </View>
            </View>
            <View style={styles.sheetActions}>
              <Pressable
                onPress={() => handleDelete(selectedPath)}
                disabled={deleting}
                style={({ pressed }) => [styles.sheetDeleteButton, pressed && styles.pressed]}
              >
                <TrashIcon size={17} color={colors.danger} />
              </Pressable>
              <Pressable
                onPress={() => setSelectedPath(null)}
                style={({ pressed }) => [styles.sheetCloseButton, pressed && styles.pressed]}
              >
                <Text style={styles.sheetCloseLabel}>Close</Text>
              </Pressable>
              {/* <Pressable
                onPress={() => {
                  const path = selectedPath;
                  setSelectedPath(null);
                  navigation.navigate('RunInProgress', { path });
                }}
                style={({ pressed }) => [styles.sheetStartButton, pressed && styles.pressed]}
              >
                <LogoMark size={14} color="#1A1714" />
                <Text style={styles.sheetStartLabel}>Start Run</Text>
              </Pressable> */}
            </View>
          </View>
        )}
      </Modal>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  title: {
    color: colors.nearBlack,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  count: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyIconBadge: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: colors.fieldBg,
    borderWidth: 1.5,
    borderColor: 'rgba(110,100,88,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    color: colors.nearBlack,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: 28,
    borderRadius: 14,
    backgroundColor: colors.gold,
  },
  emptyCtaLabel: {
    color: '#1A1714',
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  pathCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.fieldBg,
    borderWidth: 1.5,
    borderColor: 'rgba(110,100,88,0.14)',
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  pathCardPressed: {
    borderColor: colors.gold,
  },
  pathName: {
    color: colors.nearBlack,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  pathMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  pathDistance: {
    color: colors.nearBlack,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.muted,
  },
  pathPoints: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  pathDate: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  chevronBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(110,100,88,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newPathButton: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(213,160,33,0.45)',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 4,
  },
  newPathLabel: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(26,23,20,0.4)',
  },
  sheet: {
    backgroundColor: colors.fieldBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    paddingHorizontal: 22,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(110,100,88,0.22)',
    marginVertical: 12,
  },
  sheetThumbnailWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 18,
  },
  sheetTitle: {
    color: colors.nearBlack,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  sheetStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  sheetStat: {
    flex: 1,
    backgroundColor: colors.creamBg,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(110,100,88,0.12)',
  },
  sheetStatLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  sheetStatValue: {
    color: colors.nearBlack,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
  },
  sheetDeleteButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(192,57,43,0.3)',
    backgroundColor: 'rgba(192,57,43,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(110,100,88,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseLabel: {
    color: colors.nearBlack,
    fontSize: 15,
    fontWeight: '600',
  },
  sheetStartButton: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  sheetStartLabel: {
    color: '#1A1714',
    fontSize: 15,
    fontWeight: '700',
  },
});
