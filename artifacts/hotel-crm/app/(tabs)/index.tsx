import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

interface ForecastDay {
  date: string;
  checkIns: number;
  checkOuts: number;
  occupied: number;
}

interface ForecastData {
  todayOccupancy: number;
  totalRooms: number;
  occupiedRooms: number;
  days: ForecastDay[];
}

interface Booking {
  id: number;
  guestName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  status: string;
  agencyName?: string;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatHeaderDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTableDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function DashboardScreen() {
  const { user, planExpired, logout } = useAuth();
  const { hotels, selectedHotel, selectedHotelId, selectHotel, loading } = useHotelContext();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (selectedHotelId) loadAll();
    }, [selectedHotelId])
  );

  const loadAll = async () => {
    if (!selectedHotelId) return;
    setDataLoading(true);
    try {
      const [forecastData, bookingData] = await Promise.all([
        api.get<ForecastData>(`/hotels/${selectedHotelId}/forecast`),
        api.get<Booking[]>(`/hotels/${selectedHotelId}/bookings`),
      ]);
      setForecast(forecastData);
      setBookings(bookingData);
    } catch {
      setForecast(null);
    } finally {
      setDataLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const today = todayStr();
  const checkInsToday = bookings.filter(
    (b) => b.checkIn === today && b.status !== "cancelled"
  );
  const checkOutsToday = bookings.filter(
    (b) => b.checkOut === today && b.status !== "cancelled"
  );

  const totalRooms = forecast?.totalRooms ?? selectedHotel?.totalRooms ?? 0;
  const occupiedRooms = forecast?.occupiedRooms ?? 0;
  const vacantRooms = totalRooms - occupiedRooms;

  const hotelOptions = hotels.map((h) => ({ label: h.name, value: h.id.toString() }));

  if (planExpired) {
    return (
      <View style={[styles.expiredContainer, { paddingTop: topPad + 20 }]}>
        <View style={styles.expiredCard}>
          <View style={styles.expiredIcon}>
            <Feather name="alert-circle" size={40} color={C.danger} />
          </View>
          <Text style={styles.expiredTitle}>Plan Expired</Text>
          <Text style={styles.expiredText}>
            Your plan is expired. Contact the Support team to renew your subscription.
          </Text>
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: topPad, paddingBottom: insets.bottom + 90 },
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hotelTitle}>
            {selectedHotel ? `Hotel ${selectedHotel.name}` : "Dashboard"}
          </Text>
          <Text style={styles.headerDate}>{formatHeaderDate()}</Text>
        </View>
        {selectedHotelId ? (
          <Pressable
            style={styles.newBookingBtn}
            onPress={() => router.push({ pathname: "/booking/add", params: { hotelId: selectedHotelId } })}
          >
            <Feather name="plus" size={14} color="#fff" />
            <Text style={styles.newBookingText}>New Booking</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Admin hotel selector */}
      {user?.role === "admin" && hotels.length > 0 && (
        <View style={styles.hotelSelector}>
          <SelectField
            label=""
            value={selectedHotelId?.toString() || ""}
            options={hotelOptions}
            onChange={(v) => selectHotel(parseInt(v))}
            placeholder="Select a hotel"
          />
        </View>
      )}

      {/* No hotel state */}
      {!selectedHotel && !loading && (
        <View style={styles.emptyState}>
          <Feather name="home" size={40} color={C.textMuted} />
          <Text style={styles.emptyText}>
            {hotels.length === 0 ? "No hotels configured yet" : "Select a hotel to view dashboard"}
          </Text>
          {user?.role === "admin" && (
            <Pressable style={styles.ctaBtn} onPress={() => router.push("/hotel/add")}>
              <Text style={styles.ctaBtnText}>Add Hotel</Text>
            </Pressable>
          )}
        </View>
      )}

      {dataLoading && <ActivityIndicator color={C.primary} style={{ marginVertical: 32 }} />}

      {!dataLoading && selectedHotel && (
        <>
          {/* 4 Stat Cards */}
          <View style={styles.statsGrid}>
            <StatCard
              label="Today's Check-ins"
              value={checkInsToday.length}
              borderColor="#22C55E"
              icon={<Feather name="log-in" size={22} color="#22C55E" />}
            />
            <StatCard
              label="Today's Check-outs"
              value={checkOutsToday.length}
              borderColor="#F97316"
              icon={<Feather name="log-out" size={22} color="#F97316" />}
            />
            <StatCard
              label="Today's Occupied"
              value={occupiedRooms}
              borderColor={C.primary}
              icon={<MaterialCommunityIcons name="bed" size={22} color={C.primary} />}
            />
            <StatCard
              label="Today's Vacant"
              value={vacantRooms}
              borderColor="#8B5CF6"
              icon={<MaterialCommunityIcons name="office-building-outline" size={22} color="#8B5CF6" />}
            />
          </View>

          {/* Checking In Today */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.dot, { backgroundColor: "#22C55E" }]} />
              <Text style={styles.sectionTitle}>Checking In Today</Text>
            </View>
            <View style={styles.guestListCard}>
              {checkInsToday.length === 0 ? (
                <Text style={styles.noGuestsText}>No check-ins today.</Text>
              ) : (
                checkInsToday.map((b) => (
                  <View key={b.id} style={styles.guestRow}>
                    <View style={[styles.guestDot, { backgroundColor: "#22C55E" }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.guestName}>{b.guestName}</Text>
                      <Text style={styles.guestSub}>{b.roomType}{b.agencyName ? ` · ${b.agencyName}` : ""}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Checking Out Today */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.dot, { backgroundColor: "#F97316" }]} />
              <Text style={styles.sectionTitle}>Checking Out Today</Text>
            </View>
            <View style={styles.guestListCard}>
              {checkOutsToday.length === 0 ? (
                <Text style={styles.noGuestsText}>No check-outs today.</Text>
              ) : (
                checkOutsToday.map((b) => (
                  <View key={b.id} style={styles.guestRow}>
                    <View style={[styles.guestDot, { backgroundColor: "#F97316" }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.guestName}>{b.guestName}</Text>
                      <Text style={styles.guestSub}>{b.roomType}{b.agencyName ? ` · ${b.agencyName}` : ""}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* 7-Day Forecast Table */}
          {forecast && forecast.days.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="calendar" size={16} color={C.text} />
                <Text style={styles.sectionTitle}>7-Day Occupancy Forecast</Text>
              </View>
              <View style={styles.tableCard}>
                {/* Table header */}
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  <Text style={[styles.tableCell, styles.tableHeader, { flex: 2 }]}>Date</Text>
                  <Text style={[styles.tableCell, styles.tableHeader]}>Occupied</Text>
                  <Text style={[styles.tableCell, styles.tableHeader]}>Vacant</Text>
                  <Text style={[styles.tableCell, styles.tableHeader]}>Check-ins</Text>
                </View>
                {forecast.days.map((day, idx) => {
                  const vacant = totalRooms - day.occupied;
                  const isToday = idx === 0;
                  return (
                    <View
                      key={day.date}
                      style={[styles.tableRow, idx < forecast.days.length - 1 && styles.tableRowBorder, isToday && styles.tableRowToday]}
                    >
                      <Text style={[styles.tableCell, styles.tableDateCell, { flex: 2 }, isToday && { color: C.primary, fontFamily: "Inter_600SemiBold" }]}>
                        {formatTableDate(day.date)}
                      </Text>
                      <Text style={[styles.tableCell, styles.tableValue]}>{day.occupied}</Text>
                      <Text style={[styles.tableCell, styles.tableValue]}>{vacant}</Text>
                      <Text style={[styles.tableCell, styles.tableValue]}>{day.checkIns}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  borderColor,
  icon,
}: {
  label: string;
  value: number;
  borderColor: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: borderColor }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, { color: borderColor }]}>{value}</Text>
      </View>
      <View style={styles.statIcon}>{icon}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.background },
  container: { paddingHorizontal: 16 },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 16,
    gap: 12,
  },
  hotelTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text },
  headerDate: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  newBookingBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  newBookingText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },

  hotelSelector: { marginBottom: 8 },

  statsGrid: { gap: 10, marginBottom: 20 },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 4,
  },
  statLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, marginBottom: 6 },
  statValue: { fontSize: 28, fontFamily: "Inter_700Bold" },
  statIcon: { opacity: 0.8 },

  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },

  guestListCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  noGuestsText: {
    textAlign: "center",
    color: C.textMuted,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    paddingVertical: 18,
  },
  guestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  guestDot: { width: 8, height: 8, borderRadius: 4 },
  guestName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  guestSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },

  tableCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  tableRowToday: { backgroundColor: "#F0F7FF" },
  tableHeaderRow: {
    backgroundColor: C.background,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableCell: { flex: 1, textAlign: "center" },
  tableHeader: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  tableDateCell: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.text, textAlign: "left" },
  tableValue: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.text },

  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center" },
  ctaBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  ctaBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },

  expiredContainer: { flex: 1, backgroundColor: C.background, alignItems: "center", justifyContent: "center", padding: 20 },
  expiredCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    width: "100%",
  },
  expiredIcon: { marginBottom: 16 },
  expiredTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 12 },
  expiredText: { fontSize: 15, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center", marginBottom: 24, lineHeight: 22 },
  logoutBtn: { backgroundColor: C.danger, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  logoutBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
