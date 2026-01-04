import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, SHADOWS, fmt } from '../constants/theme';

const FUEL_LABELS = {
  diesel: 'Dizel',
  petrol: 'Benzin',
  gas: 'Gaz',
  metan: 'Metan',
};

const STATUS_CONFIG = {
  excellent: { label: 'A\'lo', color: 'emerald' },
  normal: { label: 'Yaxshi', color: 'blue' },
  attention: { label: 'Diqqat', color: 'amber' },
  critical: { label: 'Kritik', color: 'red' },
};

export default function VehicleCard({ vehicle, onPress, onDelete }) {
  const status = STATUS_CONFIG[vehicle.status] || STATUS_CONFIG.normal;
  const isWarning = vehicle.status === 'attention' || vehicle.status === 'critical';
  const isCritical = vehicle.status === 'critical';

  const getBorderColor = () => {
    if (isCritical) return COLORS.red200;
    if (isWarning) return COLORS.amber200;
    return COLORS.slate200;
  };

  return (
    <TouchableOpacity
      style={[styles.container, { borderColor: getBorderColor() }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Warning line */}
      {isWarning && (
        <View
          style={[
            styles.warningLine,
            { backgroundColor: isCritical ? COLORS.red500 : COLORS.amber500 },
          ]}
        />
      )}

      <View style={styles.content}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isCritical
                ? COLORS.red100
                : isWarning
                ? COLORS.amber100
                : COLORS.indigo100,
            },
          ]}
        >
          <Icon
            name="truck"
            size={22}
            color={
              isCritical
                ? COLORS.red600
                : isWarning
                ? COLORS.amber600
                : COLORS.indigo600
            }
          />
          {isWarning && (
            <View
              style={[
                styles.warningBadge,
                { backgroundColor: isCritical ? COLORS.red500 : COLORS.amber500 },
              ]}
            >
              <Icon name="alert-triangle" size={10} color={COLORS.white} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.plateNumber}>{vehicle.plateNumber}</Text>
          </View>
          <Text style={styles.brand}>
            {vehicle.brand} {vehicle.year ? `• ${vehicle.year}` : ''}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Icon name="activity" size={11} color={COLORS.slate400} />
              <Text style={styles.statText}>{fmt(vehicle.currentOdometer)} km</Text>
            </View>
            <View style={styles.stat}>
              <Icon name="droplet" size={11} color={COLORS.slate400} />
              <Text style={styles.statText}>
                {FUEL_LABELS[vehicle.fuelType] || '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Arrow */}
        <View
          style={[
            styles.arrowContainer,
            {
              backgroundColor: isWarning
                ? isCritical
                  ? COLORS.red100
                  : COLORS.amber100
                : COLORS.slate100,
            },
          ]}
        >
          <Icon
            name="chevron-right"
            size={18}
            color={
              isWarning
                ? isCritical
                  ? COLORS.red500
                  : COLORS.amber500
                : COLORS.slate400
            }
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  warningLine: {
    height: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  warningBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plateNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate900,
  },
  brand: {
    fontSize: 12,
    color: COLORS.slate500,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: COLORS.slate400,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
