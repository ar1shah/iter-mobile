// Live run tracking screen. Watches the device's real GPS position while
// you run and draws the traveled route in gold over the planned route
// (shown in gray) so you can see how you're tracking against it.

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LeafletMap, type LeafletMarker, type LeafletPolyline } from '../../components/LeafletMap';
import type { AppStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { formatDuration, formatPace, totalDistanceMiles, type LatLng } from '../../utils/geo';
import {useAudioPlayer } from 'expo-audio';

type Props = NativeStackScreenProps<AppStackParamList, 'RunInProgress'>;

function getPaceColor(
  currentPaceSeconds: number | null,
  targetPaceSeconds: number,
) {
  if (
    currentPaceSeconds === null ||
    !Number.isFinite(currentPaceSeconds) ||
    !Number.isFinite(targetPaceSeconds)
  ) {
    return colors.muted;
  }

  const difference = currentPaceSeconds - targetPaceSeconds;

  if(targetPaceSeconds == 0){
    return colors.nearBlack
  }

  // Within one minute of target pace
  // if (absoluteDifference <= 60) {
  //   return colors.success;
  // }

  // Between one and two minutes away
  if (difference <= 0 ) {
    return colors.gold;
  }

  // More than two minutes slower than target
  if (difference > 10) {
    return colors.danger;
  }

  // More than two minutes faster than target
  return colors.success;
}

  const EARTH_RADIUS_MILES = 3958.8;

  function degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  function distanceBetweenPointsMiles(
    first: LatLng,
    second: LatLng,
  ): number {
    const latitudeDifference = degreesToRadians(
      second.latitude - first.latitude,
    );

    const longitudeDifference = degreesToRadians(
      second.longitude - first.longitude,
    );

    const firstLatitude = degreesToRadians(first.latitude);
    const secondLatitude = degreesToRadians(second.latitude);

    const a =
      Math.sin(latitudeDifference / 2) ** 2 +
      Math.cos(firstLatitude) *
        Math.cos(secondLatitude) *
        Math.sin(longitudeDifference / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_MILES * c;
  }

  function getPointAtDistance(
    route: LatLng[],
    targetDistanceMiles: number,
  ): LatLng | null {
    if (route.length === 0) {
      return null;
    }

    if (route.length === 1 || targetDistanceMiles <= 0) {
      return route[0];
    }

    let distanceCovered = 0;

    for (let index = 1; index < route.length; index += 1) {
      const segmentStart = route[index - 1];
      const segmentEnd = route[index];

      const segmentDistance = distanceBetweenPointsMiles(
        segmentStart,
        segmentEnd,
      );

      if (distanceCovered + segmentDistance >= targetDistanceMiles) {
        const distanceIntoSegment =
          targetDistanceMiles - distanceCovered;

        const segmentProgress =
          segmentDistance > 0
            ? distanceIntoSegment / segmentDistance
            : 0;

        return {
          latitude:
            segmentStart.latitude +
            (segmentEnd.latitude - segmentStart.latitude) *
              segmentProgress,

          longitude:
            segmentStart.longitude +
            (segmentEnd.longitude - segmentStart.longitude) *
              segmentProgress,
        };
      }

      distanceCovered += segmentDistance;
    }

    // The target runner has completed the route.
    return route[route.length - 1];
  }

export function RunInProgressScreen({ navigation, route }: Props) {
  const { path, targetPaceSeconds } = route.params;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [traveledRoute, setTraveledRoute] = useState<LatLng[]>([]);
  const [initialCenter, setInitialCenter] = useState<LatLng | null>(null);
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);
  const [isStopped, setIsStopped] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);


  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Start watching GPS position as soon as the screen mounts, stop as soon
  // as it unmounts (either via Stop button or navigating away some other way).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;

      const startingPoint = path.points[0];
      if (startingPoint) {
        setInitialCenter(startingPoint);
      }

      watchSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 3 },
        (position) => {
          if (cancelled) return;
          const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          setTraveledRoute((prev) => [...prev, point]);
          setInitialCenter((prev) => prev ?? point);
        },
      );
    })();

    return () => {
      cancelled = true;
      watchSubscription.current?.remove();
    };
    // path only changes if this screen gets a totally new route param, which
    // doesn't happen mid-run - fine to only depend on identity here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const targetDistanceMiles =
    targetPaceSeconds > 0
      ? Math.min(
          elapsedSeconds / targetPaceSeconds,
          path.distanceMiles,
        )
      : 0;

  const targetPosition =
    targetPaceSeconds > 0
      ? getPointAtDistance(path.points, targetDistanceMiles)
      : null;

  const distanceMiles = totalDistanceMiles(traveledRoute);
  const plannedMiles = Math.max(path.distanceMiles, 0.01);
  const progress = Math.min(distanceMiles / plannedMiles, 1);
  const currentPosition = traveledRoute[traveledRoute.length - 1] ?? path.points[0];
  const currentPaceSeconds =
    distanceMiles >= 0.02
      ? elapsedSeconds / distanceMiles
      : null;
  const paceColor = getPaceColor(
    currentPaceSeconds,
    targetPaceSeconds,
  );
  const stopSound = useAudioPlayer(
    require ('../../../assets/sounds/finish-run.mp3')
  );

  const handleStop = async () => {
    // Prevent the Stop button from running more than once.
    if (isStopped) return;

    setIsStopped(true);

    // Freeze elapsed time.
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Freeze GPS distance and route.
    watchSubscription.current?.remove();
    watchSubscription.current = null;

    // These values are now frozen because their state is no longer updating.
    const finalElapsedSeconds = elapsedSeconds;
    const finalDistanceMiles = distanceMiles;
    const finalRoute = [...traveledRoute];

    stopSound.volume = 0.5;
    await stopSound.seekTo(0);
    stopSound.play();

    setTimeout(() => {
      navigation.replace('RunComplete', {
        stats: {
          elapsedSeconds: finalElapsedSeconds,
          distanceMiles: finalDistanceMiles,
          route: finalRoute,
          path,
          targetPaceSeconds,
        },
      });
    }, 7000);
  };

  if (!initialCenter) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Getting a GPS fix…</Text>
      </View>
    );
  }

  // Gray line for the planned route, gold for what you've actually covered
  // so far, plus a start marker and a glowing "you are here" dot.
  const polylines: LeafletPolyline[] = [
    ...(path.points.length > 1 ? [{ coordinates: path.points, color: '#C0B8AE', weight: 4 }] : []),
    ...(traveledRoute.length > 1 ? [{ coordinates: traveledRoute, color: colors.gold, weight: 5 }] : []),
  ];

  const markers: LeafletMarker[] = [
    ...(path.points[0]
      ? [
          {
            coordinate: path.points[0],
            color: colors.gold,
            strokeColor: '#fff',
            radius: 7,
          },
        ]
      : []),

    ...(targetPosition
    ? [
        {
          coordinate: targetPosition,
          glow: true,
          color: colors.target,
          strokeColor: '#fff',
          radius: 8,
        },
      ]
    : []),

    ...(currentPosition
      ? [
          {
            coordinate: currentPosition,
            glow: true,
            color: colors.blue,
          },
        ]
      : []),
  ];

  return (
    <View style={styles.container}>
      <LeafletMap center={initialCenter} zoom={16} polylines={polylines} markers={markers} />

      <SafeAreaView edges={['top']} style={styles.overlayTop} pointerEvents="box-none">
        <View style={styles.routeNamePill}>
          <View style={styles.recordingDot} />
          <Text style={styles.routeName}>{path.name}</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{formatDuration(elapsedSeconds)}</Text>
          </View>
          <View style={[styles.statColumn, styles.statColumnBordered]}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{distanceMiles.toFixed(2)}</Text>
            <Text style={styles.statUnit}>mi</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Pace</Text>
            <Text style={[styles.statValue, { color: paceColor }]}>
              {formatPace(elapsedSeconds, distanceMiles)}
            </Text>
            <Text style={styles.statUnit}>/mi</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </SafeAreaView>

      <View style={styles.stopWrap}>
        <Pressable
          disabled={isStopped}
          onPress={handleStop}
          style={({ pressed }) => [
            styles.stopButton,
            pressed && styles.stopButtonPressed,
            isStopped && styles.stopButtonDisabled,
          ]}
        >
          <View style={styles.stopSquare} />
        </Pressable>
        <Text style={styles.stopLabel}>Stop</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d4d0ca',
  },
  loadingText: {
    color: colors.charcoal,
    fontSize: 14,
    fontWeight: '500',
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
  },
  routeNamePill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(245,240,232,0.94)',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(110,100,88,0.18)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E53935',
  },
  routeName: {
    color: colors.nearBlack,
    fontSize: 13,
    fontWeight: '700',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245,240,232,0.96)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(110,100,88,0.15)',
    paddingVertical: 16,
    marginBottom: 8,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statColumnBordered: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(110,100,88,0.12)',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  statValue: {
    color: colors.nearBlack,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statUnit: {
    color: colors.charcoal,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(245,240,232,0.5)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 2,
  },
  stopWrap: {
    position: 'absolute',
    bottom: 44,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 10,
  },
  stopButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 6,
  },
  stopButtonPressed: {
    opacity: 0.85,
  },
  stopSquare: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  stopLabel: {
    color: 'rgba(245,240,232,0.9)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  stopButtonDisabled: {
    opacity: 0.6,
  },
});
