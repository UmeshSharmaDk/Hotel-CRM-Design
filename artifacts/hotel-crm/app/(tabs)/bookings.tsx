import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useHotelContext } from "@/hooks/useHotelContext";
import { api } from "@/utils/api";

const C = Colors.light;

export interface Booking {
  id: number;
  hotelId: number;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  status: string;
  agencyId?: number;
  agencyName?: string;
  totalCost: string;
  dueBalance: string;
  notes?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: "#ECFDF5", text: C.success },
  pending: { bg: "#FFF8F1", text: C.warning },
  cancelled: { bg: "#FDF2F2", text: C.danger },
  "checked-in": { bg: "#EBF5FF", text: C.primary },
  "checked-out": { bg: "#F3F4F6", text: C.textSecondary },
};

function BookingCard({
  booking,
  onEdit,
  onDelete,
}: {
  booking: Booking;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const statusStyle = STATUS_COLORS[booking.status] || STATUS_COLORS["confirmed"];

  return (
    <Pressable style={styles.card} onPress={onEdit}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.guestName}>{booking.guestName}</Text>
          <Text style={styles.roomType}>{booking.roomType}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {booking.status}
          </Text>
        </View>
      </View>

      <View style={styles.cardDates}>
        <View style={styles.dateRow}>
          <Feather name="log-in" size={13} color={C.success} />
          <Text style={styles.dateText}>{formatDate(booking.checkIn)}</Text>
        </View>
        <Feather name="arrow-right" size={14} color={C.textMuted} />
        <View style={styles.dateRow}>
          <Feather name="log-out" size={13} color={C.danger} />
          <Text style={styles.dateText}>{formatDate(booking.checkOut)}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        {booking.agencyName && (
          <View style={styles.agencyBadge}>
            <Feather name="briefcase" size={12} color={C.primary} />
            <Text style={styles.agencyText}>{booking.agencyName}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <View style={styles.costSection}>
          <Text style={styles.totalCost}>₹{parseFloat(booking.totalCost).toLocaleString("en-IN")}</Text>
          {parseFloat(booking.dueBalance) > 0 && (
            <Text style={styles.dueBalance}>
              Due: ₹{parseFloat(booking.dueBalance).toLocaleString("en-IN")}
            </Text>
          )}
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={styles.deleteBtn}
        >
          <Feather name="trash-2" size={16} color={C.danger} />
        </Pressable>
      </View>
    </Pressable>
  );
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user } = useAuth();
  const { selectedHotelId, hotels } = useHotelContext();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (selectedHotelId) loadBookings();
  }, [selectedHotelId]);

  const loadBookings = async () => {
    if (!selectedHotelId) return;
    setLoading(true);
    try {
      const data = await api.get<Booking[]>(`/hotels/${selectedHotelId}/bookings`);
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const handleDelete = (id: number) => {
    Alert.alert("Delete Booking", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/hotels/${selectedHotelId}/bookings/${id}`);
            setBookings((prev) => prev.filter((b) => b.id !== id));
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  const filtered = bookings.filter(
    (b) =>
      b.guestName.toLowerCase().includes(search.toLowerCase()) ||
      b.roomType.toLowerCase().includes(search.toLowerCase()) ||
      (b.agencyName || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!selectedHotelId) {
    return (
      <View style={[styles.center, { paddingTop: topPad }]}>
        <Text style={styles.emptyText}>No hotel selected</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookings</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() =>
            router.push({
              pathname: "/booking/add",
              params: { hotelId: selectedHotelId },
            })
          }
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={C.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search bookings..."
          placeholderTextColor={C.textMuted}
        />
        {search ? (
          <Pressable onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={C.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 90 },
          ]}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onEdit={() =>
                router.push({
                  pathname: "/booking/edit",
                  params: { bookingId: item.id, hotelId: selectedHotelId },
                })
              }
              onDelete={() => handleDelete(item.id)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="calendar" size={40} color={C.textMuted} />
              <Text style={styles.emptyText}>No bookings yet</Text>
              <Pressable
                style={styles.addFirstBtn}
                onPress={() =>
                  router.push({
                    pathname: "/booking/add",
                    params: { hotelId: selectedHotelId },
                  })
                }
              >
                <Text style={styles.addFirstBtnText}>Add First Booking</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, backgroundColor: C.background, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  addBtn: {
    backgroundColor: C.primary,
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  guestName: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text },
  roomType: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  cardDates: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dateText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.text },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 8 },
  agencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  agencyText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.primary },
  costSection: { alignItems: "flex-end" },
  totalCost: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.text },
  dueBalance: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.danger },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", color: C.textSecondary },
  addFirstBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  addFirstBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
