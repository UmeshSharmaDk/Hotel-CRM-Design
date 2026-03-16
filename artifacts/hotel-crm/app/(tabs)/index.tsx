import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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

export default function DashboardScreen() {
  const { user, planExpired, logout } = useAuth();
  const { hotels, selectedHotel, selectedHotelId, selectHotel, loading } = useHotelContext();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (selectedHotelId) loadForecast();
    }, [selectedHotelId])
  );

  const loadForecast = async () => {
    if (!selectedHotelId) return;
    setForecastLoading(true);
    try {
      const data = await api.get<ForecastData>(`/hotels/${selectedHotelId}/forecast`);
      setForecast(data);
    } catch {
      setForecast(null);
    } finally {
      setForecastLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadForecast();
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

  const occupancyColor =
    (forecast?.todayOccupancy || 0) >= 90
      ? C.success
      : (forecast?.todayOccupancy || 0) >= 50
      ? C.warning
      : C.danger;

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
        { paddingTop: topPad + 16, paddingBottom: insets.bottom + 90 },
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Good morning 👋</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userRole}>{user?.role?.replace("_", " ").toUpperCase()}</Text>
        </View>
        <Pressable onPress={handleLogout} style={styles.logoutIcon}>
          <Feather name="log-out" size={20} color={C.textSecondary} />
        </Pressable>
      </View>

      {user?.role === "admin" && hotels.length > 0 && (
        <View style={styles.hotelSelector}>
          <SelectField
            label="Viewing Hotel"
            value={selectedHotelId?.toString() || ""}
            options={hotelOptions}
            onChange={(v) => selectHotel(parseInt(v))}
            placeholder="Select a hotel"
          />
        </View>
      )}

      {selectedHotel && (
        <View style={styles.hotelCard}>
          <View style={styles.hotelCardHeader}>
            <MaterialCommunityIcons name="office-building" size={20} color={C.primary} />
            <Text style={styles.hotelName}>{selectedHotel.name}</Text>
          </View>
          <Text style={styles.hotelRooms}>{selectedHotel.totalRooms} total rooms</Text>
        </View>
      )}

      {forecastLoading ? (
        <ActivityIndicator color={C.primary} style={{ marginVertical: 32 }} />
      ) : forecast ? (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Occupancy</Text>
            <View style={styles.occupancyCard}>
              <View style={styles.occupancyRow}>
                <Text style={styles.occupancyNumber}>{forecast.occupiedRooms}</Text>
                <Text style={styles.occupancySlash}>/</Text>
                <Text style={styles.occupancyTotal}>{forecast.totalRooms} rooms</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(forecast.todayOccupancy, 100)}%` as any,
                      backgroundColor: occupancyColor,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.occupancyPct, { color: occupancyColor }]}>
                {forecast.todayOccupancy.toFixed(1)}% occupied
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7-Day Forecast</Text>
            {forecast.days.map((day, idx) => {
              const isToday = idx === 0;
              const date = new Date(day.date);
              const dayName = isToday
                ? "Today"
                : date.toLocaleDateString("en-IN", { weekday: "short" });
              const dayNum = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

              return (
                <View key={day.date} style={[styles.forecastRow, isToday && styles.forecastRowToday]}>
                  <View style={styles.forecastDate}>
                    <Text style={[styles.forecastDayName, isToday && { color: C.primary }]}>
                      {dayName}
                    </Text>
                    <Text style={styles.forecastDayNum}>{dayNum}</Text>
                  </View>
                  <View style={styles.forecastStats}>
                    <View style={styles.forecastStat}>
                      <Feather name="log-in" size={14} color={C.success} />
                      <Text style={styles.forecastStatText}>{day.checkIns} in</Text>
                    </View>
                    <View style={styles.forecastStat}>
                      <Feather name="log-out" size={14} color={C.danger} />
                      <Text style={styles.forecastStatText}>{day.checkOuts} out</Text>
                    </View>
                    <View style={styles.forecastStat}>
                      <MaterialCommunityIcons name="bed" size={14} color={C.primary} />
                      <Text style={styles.forecastStatText}>{day.occupied} occ.</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      ) : (
        !loading && (
          <View style={styles.emptyState}>
            <Feather name="home" size={40} color={C.textMuted} />
            <Text style={styles.emptyText}>
              {hotels.length === 0 ? "No hotels configured yet" : "Select a hotel to view dashboard"}
            </Text>
            {user?.role === "admin" && (
              <Pressable
                style={styles.ctaBtn}
                onPress={() => router.push("/hotel/add")}
              >
                <Text style={styles.ctaBtnText}>Add Hotel</Text>
              </Pressable>
            )}
          </View>
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.background },
  container: { paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  userName: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text, marginTop: 2 },
  userRole: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: C.primary,
    backgroundColor: C.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  logoutIcon: { padding: 8 },
  hotelSelector: { marginBottom: 8 },
  hotelCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  hotelCardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  hotelName: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: C.text },
  hotelRooms: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, marginLeft: 28 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 12 },
  occupancyCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  occupancyRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 12, gap: 4 },
  occupancyNumber: { fontSize: 36, fontFamily: "Inter_700Bold", color: C.text },
  occupancySlash: { fontSize: 20, color: C.textMuted, fontFamily: "Inter_400Regular" },
  occupancyTotal: { fontSize: 16, fontFamily: "Inter_400Regular", color: C.textSecondary },
  progressBar: {
    height: 10,
    backgroundColor: C.borderLight,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: "100%", borderRadius: 10 },
  occupancyPct: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  forecastRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: C.card,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  forecastRowToday: { borderColor: C.primary, borderWidth: 1.5 },
  forecastDate: { width: 70 },
  forecastDayName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  forecastDayNum: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  forecastStats: { flex: 1, flexDirection: "row", justifyContent: "flex-end", gap: 16 },
  forecastStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  forecastStatText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.text },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  expiredIcon: { marginBottom: 16 },
  expiredTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 12 },
  expiredText: { fontSize: 15, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center", marginBottom: 24, lineHeight: 22 },
  logoutBtn: { backgroundColor: C.danger, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  logoutBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
