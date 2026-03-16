import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useHotelContext } from "@/hooks/useHotelContext";
import { SelectField } from "@/components/shared/FormField";
import { api } from "@/utils/api";

const C = Colors.light;

interface Analytics {
  totalBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  occupancyRate: number;
  avgStayDuration: number;
  bookingsByStatus: Record<string, number>;
  bookingsByAgency: { agencyName: string; count: number; revenue: number }[];
}

interface Agency { id: number; name: string }

const MONTHS = [
  { label: "All Months", value: "" },
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => ({
  label: (currentYear - 2 + i).toString(),
  value: (currentYear - 2 + i).toString(),
}));

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user } = useAuth();
  const { selectedHotel, selectedHotelId, hotels, selectHotel } = useHotelContext();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedAgency, setSelectedAgency] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const hotelOptions = hotels.map((h) => ({ label: h.name, value: h.id.toString() }));

  useEffect(() => {
    if (selectedHotelId) {
      loadAgencies();
      loadAnalytics();
    }
  }, [selectedHotelId]);

  useEffect(() => {
    if (selectedHotelId) loadAnalytics();
  }, [selectedMonth, selectedYear, selectedAgency]);

  const loadAgencies = async () => {
    if (!selectedHotelId) return;
    try {
      const data = await api.get<Agency[]>(`/hotels/${selectedHotelId}/agencies`);
      setAgencies(data);
    } catch {}
  };

  const loadAnalytics = async () => {
    if (!selectedHotelId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.set("month", selectedMonth);
      if (selectedYear) params.set("year", selectedYear);
      if (selectedAgency) params.set("agencyId", selectedAgency);
      const data = await api.get<Analytics>(
        `/hotels/${selectedHotelId}/analytics?${params.toString()}`
      );
      setAnalytics(data);
    } catch {
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const agencyOptions = [
    { label: "All Agencies", value: "" },
    ...agencies.map((a) => ({ label: a.name, value: a.id.toString() })),
  ];

  const occupancyColor =
    (analytics?.occupancyRate || 0) >= 90
      ? C.success
      : (analytics?.occupancyRate || 0) >= 50
      ? C.warning
      : C.danger;

  const maxAgencyRevenue = Math.max(
    ...((analytics?.bookingsByAgency || []).map((a) => a.revenue)),
    1
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: topPad + 16, paddingBottom: insets.bottom + 90 },
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />}
    >
      <Text style={styles.pageTitle}>Analytics</Text>

      {user?.role === "admin" && (
        <SelectField
          label="Hotel"
          value={selectedHotelId?.toString() || ""}
          options={hotelOptions}
          onChange={(v) => selectHotel(parseInt(v))}
          placeholder="Select hotel"
        />
      )}

      <View style={styles.filtersRow}>
        <View style={{ flex: 1 }}>
          <SelectField
            label="Month"
            value={selectedMonth}
            options={MONTHS}
            onChange={setSelectedMonth}
          />
        </View>
        <View style={{ flex: 1 }}>
          <SelectField
            label="Year"
            value={selectedYear}
            options={YEARS}
            onChange={setSelectedYear}
          />
        </View>
      </View>

      <SelectField
        label="Agency"
        value={selectedAgency}
        options={agencyOptions}
        onChange={setSelectedAgency}
      />

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : analytics ? (
        <>
          <View style={styles.statsGrid}>
            <StatCard
              label="Total Bookings"
              value={analytics.totalBookings.toString()}
              icon="calendar"
              color={C.primary}
              bg={C.primaryLight}
            />
            <StatCard
              label="Monthly Revenue"
              value={`₹${analytics.monthlyRevenue.toLocaleString("en-IN")}`}
              icon="trending-up"
              color={C.success}
              bg={C.successLight}
            />
            <StatCard
              label="Avg Stay"
              value={`${analytics.avgStayDuration.toFixed(1)} days`}
              icon="clock"
              color={C.warning}
              bg={C.warningLight}
            />
            <StatCard
              label="Total Revenue"
              value={`₹${analytics.totalRevenue.toLocaleString("en-IN")}`}
              icon="dollar-sign"
              color={C.primaryDark}
              bg={C.primaryLight}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Occupancy Rate</Text>
            <View style={styles.occupancyCard}>
              <View style={styles.occupancyRow}>
                <Text style={[styles.occupancyPct, { color: occupancyColor }]}>
                  {analytics.occupancyRate.toFixed(1)}%
                </Text>
                <Text style={styles.occupancyLabel}>occupied this period</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(analytics.occupancyRate, 100)}%` as any, backgroundColor: occupancyColor },
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bookings by Status</Text>
            <View style={styles.statusList}>
              {Object.entries(analytics.bookingsByStatus).map(([status, count]) => (
                <View key={status} style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                  <Text style={styles.statusLabel}>{status.replace("-", " ")}</Text>
                  <Text style={styles.statusCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>

          {analytics.bookingsByAgency.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Revenue by Agency</Text>
              {analytics.bookingsByAgency.map((ag) => (
                <View key={ag.agencyName} style={styles.agencyRow}>
                  <View style={styles.agencyInfo}>
                    <Text style={styles.agencyName}>{ag.agencyName}</Text>
                    <Text style={styles.agencyCount}>{ag.count} bookings</Text>
                  </View>
                  <View style={styles.agencyBarWrap}>
                    <View
                      style={[
                        styles.agencyBar,
                        { width: `${(ag.revenue / maxAgencyRevenue) * 100}%` as any },
                      ]}
                    />
                  </View>
                  <Text style={styles.agencyRevenue}>
                    ₹{ag.revenue.toLocaleString("en-IN")}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Feather name="bar-chart-2" size={40} color={C.textMuted} />
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({ label, value, icon, color, bg }: {
  label: string; value: string; icon: string; color: string; bg: string
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function getStatusColor(status: string) {
  const map: Record<string, string> = {
    confirmed: C.success,
    pending: C.warning,
    cancelled: C.danger,
    "checked-in": C.primary,
    "checked-out": C.textSecondary,
  };
  return map[status] || C.textSecondary;
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.background },
  container: { paddingHorizontal: 16 },
  pageTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 20 },
  filtersRow: { flexDirection: "row", gap: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 2 },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 12 },
  occupancyCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  occupancyRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 10 },
  occupancyPct: { fontSize: 32, fontFamily: "Inter_700Bold" },
  occupancyLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  progressBar: {
    height: 10,
    backgroundColor: C.borderLight,
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 10 },
  statusList: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  statusLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: C.text, textTransform: "capitalize" },
  statusCount: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  agencyRow: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  agencyInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  agencyName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  agencyCount: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  agencyBarWrap: { height: 6, backgroundColor: C.borderLight, borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  agencyBar: { height: "100%", backgroundColor: C.primary, borderRadius: 3 },
  agencyRevenue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.success, textAlign: "right" },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", color: C.textSecondary },
});
