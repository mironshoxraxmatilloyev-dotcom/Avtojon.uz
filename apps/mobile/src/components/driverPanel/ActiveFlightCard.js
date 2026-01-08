import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS } from '../../constants/theme';
import { formatMoney, EXPENSE_TYPES } from './constants';

export default function ActiveFlightCard({ flight, onConfirmExpense, t }) {
  if (!flight) return null;

  const balance = flight.finalBalance || 0;
  const unconfirmedCount = flight?.expenses?.filter(e => !e.confirmedByDriver).length || 0;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrap}>
            <Icon name="navigation" size={20} color={COLORS.white} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.title} numberOfLines={1}>
              {flight.name || 'Faol marshrut'}
            </Text>
            <View style={styles.typeRow}>
              <Icon
                name={flight.flightType === 'international' ? 'globe' : 'flag'}
                size={12}
                color="rgba(255,255,255,0.8)"
              />
              <Text style={styles.typeText}>
                {flight.flightType === 'international' ? t.international : t.local}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>FAOL</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Road Money */}
        {(flight.roadMoney > 0 || flight.totalGivenBudget > 0) && (
          <View style={styles.roadMoneyBox}>
            <View style={styles.roadMoneyIcon}>
              <Icon name="credit-card" size={18} color={COLORS.white} />
            </View>
            <View>
              <Text style={styles.roadMoneyLabel}>{t.roadMoney}</Text>
              <Text style={styles.roadMoneyValue}>
                {formatMoney(flight.roadMoney || flight.totalGivenBudget)} {t.sum}
              </Text>
            </View>
          </View>
        )}

        {/* Legs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Icon name="package" size={14} color={COLORS.blue500} />
              <Text style={styles.sectionTitle}>{t.orders}</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{flight.legs?.length || 0} {t.count}</Text>
            </View>
          </View>

          {flight.legs?.map((leg, idx) => (
            <View
              key={leg._id || idx}
              style={[
                styles.legItem,
                leg.status === 'in_progress' && styles.legInProgress,
                leg.status === 'completed' && styles.legCompleted,
              ]}
            >
              <View
                style={[
                  styles.legNumber,
                  leg.status === 'completed' && styles.legNumberCompleted,
                  leg.status === 'in_progress' && styles.legNumberInProgress,
                ]}
              >
                {leg.status === 'completed' ? (
                  <Icon name="check" size={12} color={COLORS.white} />
                ) : (
                  <Text style={styles.legNumberText}>{idx + 1}</Text>
                )}
              </View>
              <View style={styles.legInfo}>
                <Text style={styles.legRoute} numberOfLines={1}>
                  {leg.fromCity} → {leg.toCity}
                </Text>
                <Text style={styles.legPayment}>
                  {formatMoney(leg.payment || 0)} {t.sum}
                </Text>
              </View>
              {leg.status === 'in_progress' && (
                <View style={styles.onWayBadge}>
                  <Text style={styles.onWayText}>{t.onTheWay}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Balance */}
        <View style={[styles.balanceBox, balance >= 0 ? styles.balancePositive : styles.balanceNegative]}>
          <Text style={styles.balanceLabel}>{t.balance}:</Text>
          <Text style={[styles.balanceValue, balance >= 0 ? styles.balanceValuePositive : styles.balanceValueNegative]}>
            {formatMoney(Math.abs(balance))} {t.sum}
          </Text>
        </View>

        {/* Expenses */}
        {flight.expenses?.length > 0 && (
          <View style={styles.expensesBox}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Icon name="file-text" size={14} color={COLORS.amber500} />
                <Text style={styles.sectionTitle}>{t.expenses}</Text>
              </View>
              <View style={styles.expensesBadges}>
                {unconfirmedCount > 0 && (
                  <View style={styles.unconfirmedBadge}>
                    <Text style={styles.unconfirmedText}>
                      {unconfirmedCount} {t.unconfirmed}
                    </Text>
                  </View>
                )}
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{flight.expenses.length} {t.count}</Text>
                </View>
              </View>
            </View>

            <View style={styles.expensesList}>
              {flight.expenses.map((exp, idx) => {
                const info = EXPENSE_TYPES[exp.type] || EXPENSE_TYPES.other;
                const isConfirmed = exp.confirmedByDriver;

                return (
                  <View
                    key={exp._id || idx}
                    style={[styles.expenseItem, isConfirmed && styles.expenseConfirmed]}
                  >
                    <View style={styles.expenseLeft}>
                      <Icon name={info.icon} size={16} color={info.color} />
                      <View style={styles.expenseInfo}>
                        <Text style={styles.expenseLabel}>{info.label}</Text>
                        {exp.description && (
                          <Text style={styles.expenseDesc} numberOfLines={1}>
                            {exp.description}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.expenseRight}>
                      <Text style={styles.expenseAmount}>
                        -{formatMoney(exp.amount)}
                      </Text>
                      <TouchableOpacity
                        style={[styles.checkBox, isConfirmed && styles.checkBoxConfirmed]}
                        onPress={() => !isConfirmed && onConfirmExpense(flight._id, exp._id)}
                        disabled={isConfirmed}
                      >
                        {isConfirmed && (
                          <Icon name="check" size={14} color={COLORS.white} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Status */}
        <View style={styles.statusBox}>
          <Icon name="navigation" size={16} color={COLORS.blue600} />
          <Text style={styles.statusText}>{t.routeActive}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.blue600,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  typeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.emerald500,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    padding: 14,
    gap: 12,
  },
  roadMoneyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blue50,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  roadMoneyIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.blue500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roadMoneyLabel: {
    color: COLORS.blue600,
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  roadMoneyValue: {
    color: COLORS.slate800,
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: COLORS.slate700,
    fontSize: 12,
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: COLORS.blue100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countText: {
    color: COLORS.blue600,
    fontSize: 10,
    fontWeight: '700',
  },
  legItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    gap: 10,
  },
  legInProgress: {
    backgroundColor: COLORS.amber50,
    borderColor: COLORS.amber400,
    borderWidth: 2,
  },
  legCompleted: {
    backgroundColor: COLORS.emerald50,
    borderColor: COLORS.emerald200,
  },
  legNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.slate300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legNumberCompleted: {
    backgroundColor: COLORS.emerald500,
  },
  legNumberInProgress: {
    backgroundColor: COLORS.amber500,
  },
  legNumberText: {
    color: COLORS.slate600,
    fontSize: 12,
    fontWeight: '700',
  },
  legInfo: {
    flex: 1,
  },
  legRoute: {
    color: COLORS.slate800,
    fontSize: 13,
    fontWeight: '500',
  },
  legPayment: {
    color: COLORS.slate500,
    fontSize: 11,
    marginTop: 1,
  },
  onWayBadge: {
    backgroundColor: COLORS.amber500,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  onWayText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  balanceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  balancePositive: {
    backgroundColor: COLORS.emerald50,
    borderColor: COLORS.emerald200,
  },
  balanceNegative: {
    backgroundColor: COLORS.red50,
    borderColor: COLORS.red200,
  },
  balanceLabel: {
    color: COLORS.slate600,
    fontSize: 14,
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  balanceValuePositive: {
    color: COLORS.emerald600,
  },
  balanceValueNegative: {
    color: COLORS.red600,
  },
  expensesBox: {
    backgroundColor: COLORS.slate50,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  expensesBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  unconfirmedBadge: {
    backgroundColor: COLORS.amber100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unconfirmedText: {
    color: COLORS.amber600,
    fontSize: 10,
    fontWeight: '700',
  },
  expensesList: {
    gap: 6,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.slate100,
  },
  expenseConfirmed: {
    backgroundColor: COLORS.emerald50,
    borderColor: COLORS.emerald200,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseLabel: {
    color: COLORS.slate700,
    fontSize: 12,
    fontWeight: '500',
  },
  expenseDesc: {
    color: COLORS.slate400,
    fontSize: 10,
    marginTop: 1,
  },
  expenseRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  expenseAmount: {
    color: COLORS.red500,
    fontSize: 12,
    fontWeight: '700',
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.slate300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBoxConfirmed: {
    backgroundColor: COLORS.emerald500,
    borderColor: COLORS.emerald500,
  },
  statusBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.blue50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.blue200,
    gap: 8,
  },
  statusText: {
    color: COLORS.blue600,
    fontSize: 14,
    fontWeight: '500',
  },
});
