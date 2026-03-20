import { Feather } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useHotelContext } from "@/hooks/useHotelContext";
import { api } from "@/utils/api";
import { SelectField } from "@/components/shared/FormField";
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

interface Agency {
  id: number;
  name: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: "#ECFDF5", text: C.success },
  pending: { bg: "#FFF8F1", text: C.warning },
  cancelled: { bg: "#FDF2F2", text: C.danger },
  "checked-in": { bg: "#EBF5FF", text: C.primary },
  "checked-out": { bg: "#F3F4F6", text: C.textSecondary },
};

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
const YEARS = [
  { label: "All Years", value: "" },
  ...[-1, 0, 1, 2].map((offset) => {
    const y = (currentYear + offset).toString();
    return { label: y, value: y };
  }),
];

const SORT_OPTIONS = [
  { label: "Check-in Newest", value: "checkin_desc" },
  { label: "Check-in Oldest", value: "checkin_asc" },
  { label: "Check-out Newest", value: "checkout_desc" },
  { label: "Check-out Oldest", value: "checkout_asc" },
];

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function BookingCard({
  booking,
  onEdit,
  onDelete,
}: {
  booking: Booking;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const statusStyle =
    STATUS_COLORS[booking.status] || STATUS_COLORS["confirmed"];
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
          <Text style={styles.totalCost}>
            ₹{parseFloat(booking.totalCost).toLocaleString("en-IN")}
          </Text>
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

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { selectedHotelId } = useHotelContext();
  const params = useLocalSearchParams<{
    filterDate?: string;
    filterType?: string;
  }>();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterAgency, setFilterAgency] = useState("");
  const [sortBy, setSortBy] = useState("checkin_desc");
  const [showFilters, setShowFilters] = useState(false);
  const navigation = useNavigation();

  // 3. Define a comprehensive reset function
  const resetAllFilters = useCallback(() => {
    setSearch("");
    setFilterMonth("");
    setFilterYear("");
    setFilterAgency("");
    setSortBy("checkin_desc");
    setShowFilters(false);
    router.setParams({ filterDate: "", filterType: "" });
  }, []);

  // 4. Add the tab press listener
  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", () => {
      resetAllFilters();
    });

    return unsubscribe;
  }, [navigation, resetAllFilters]);

  useEffect(() => {
    if (params.filterDate) {
      const d = new Date(params.filterDate);
      setFilterMonth((d.getMonth() + 1).toString());
      setFilterYear(d.getFullYear().toString());
      //setShowFilters(true);
    }
  }, [params.filterDate, params.filterType]);

  useFocusEffect(
    useCallback(() => {
      if (selectedHotelId) {
        loadBookings();
        loadAgencies();
      }
    }, [selectedHotelId]),
  );
  //const handleClearFiltersPress = () => {
  //resetAll();
  //};
  const loadBookings = async () => {
    if (!selectedHotelId) return;
    setLoading(true);
    try {
      const data = await api.get<Booking[]>(
        `/hotels/${selectedHotelId}/bookings`,
      );
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAgencies = async () => {
    if (!selectedHotelId) return;
    try {
      const data = await api.get<Agency[]>(
        `/hotels/${selectedHotelId}/agencies`,
      );
      setAgencies(data);
    } catch {}
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadBookings(), loadAgencies()]);
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

  const clearFilters = () => {
    setFilterMonth("");
    setFilterYear("");
    setFilterAgency("");
    setSortBy("checkin_desc");
  };

  const agencyOptions = [
    { label: "All Agencies", value: "" },
    ...agencies.map((a) => ({ label: a.name, value: a.id.toString() })),
  ];

  const activeFilterCount = [filterMonth, filterYear, filterAgency].filter(
    Boolean,
  ).length;

  // Filter + sort
  let filtered = bookings.filter((b) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !b.guestName.toLowerCase().includes(q) &&
        !b.roomType.toLowerCase().includes(q) &&
        !(b.agencyName || "").toLowerCase().includes(q)
      )
        return false;
    }

    // Dashboard navigation filters
    if (params.filterDate) {
      if (params.filterType === "checkin") {
        if (b.checkIn !== params.filterDate) return false;
      } else if (params.filterType === "checkout") {
        if (b.checkOut !== params.filterDate) return false;
      } else {
        /** * Forecast Logic:
         * Show bookings where the guest is present on the selected date.
         * This includes check-ins, check-outs, and multi-day stays.
         */
        if (params.filterDate < b.checkIn || params.filterDate > b.checkOut) {
          return false;
        }
      }
    }

    if (filterMonth || filterYear) {
      const d = new Date(b.checkIn);
      if (filterMonth && (d.getMonth() + 1).toString() !== filterMonth)
        return false;
      if (filterYear && d.getFullYear().toString() !== filterYear) return false;
    }
    if (filterAgency && b.agencyId?.toString() !== filterAgency) return false;
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "checkin_desc":
        return new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime();
      case "checkin_asc":
        return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
      case "checkout_desc":
        return new Date(b.checkOut).getTime() - new Date(a.checkOut).getTime();
      case "checkout_asc":
        return new Date(a.checkOut).getTime() - new Date(b.checkOut).getTime();
      default:
        return 0;
    }
  });

  if (!selectedHotelId) {
    return (
      <View style={[styles.center, { paddingTop: topPad }]}>
        <Text style={styles.emptyText}>No hotel selected</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bookings</Text>
          {params.filterDate && (
            <Text style={styles.filterHint}>
              {params.filterType === "checkin"
                ? "Check-ins"
                : params.filterType === "checkout"
                  ? "Check-outs"
                  : "Occupancy/Stay"}{" "}
              for {formatDate(params.filterDate)}
              {"  "}
              <Text
                style={{ color: C.primary }}
                onPress={() =>
                  router.setParams({ filterDate: "", filterType: "" })
                }
              >
                Clear
              </Text>
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={[
              styles.filterToggleBtn,
              showFilters && styles.filterToggleBtnActive,
            ]}
            onPress={() => setShowFilters((v) => !v)}
          >
            <Feather
              name="sliders"
              size={16}
              color={showFilters ? C.primary : C.textSecondary}
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
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
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={C.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by guest, room type, agency..."
          placeholderTextColor={C.textMuted}
        />
        {search ? (
          <Pressable onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={C.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <View style={styles.filterRow}>
            <View style={{ flex: 1 }}>
              <SelectField
                label="Month"
                value={filterMonth}
                options={MONTHS}
                onChange={setFilterMonth}
              />
            </View>
            <View style={{ flex: 1 }}>
              <SelectField
                label="Year"
                value={filterYear}
                options={YEARS}
                onChange={setFilterYear}
              />
            </View>
          </View>
          <SelectField
            label="Agency"
            value={filterAgency}
            options={agencyOptions}
            onChange={setFilterAgency}
          />

          {activeFilterCount > 0 && (
            <Pressable style={styles.clearFiltersBtn} onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filtered.length} booking{filtered.length !== 1 ? "s" : ""}
        </Text>
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={C.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="calendar" size={40} color={C.textMuted} />
              <Text style={styles.emptyText}>No bookings found</Text>
              <Pressable
                style={styles.addFirstBtn}
                onPress={() =>
                  router.push({
                    pathname: "/booking/add",
                    params: { hotelId: selectedHotelId },
                  })
                }
              >
                <Text style={styles.addFirstBtnText}>Add Booking</Text>
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
  center: {
    flex: 1,
    backgroundColor: C.background,
    alignItems: "center",
    justifyContent: "center",
  },
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
  filterHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginTop: 2,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterToggleBtnActive: {
    backgroundColor: C.primaryLight,
    borderColor: C.primary,
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: C.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },
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
    marginTop: 10,
    marginBottom: 4,
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
  filterPanel: {
    backgroundColor: C.card,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  filterRow: { flexDirection: "row", gap: 10 },
  filterLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    marginBottom: 8,
    marginTop: 4,
  },
  sortChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
  },
  sortChipActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  sortChipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: C.textSecondary,
  },
  sortChipTextActive: { color: C.primary, fontFamily: "Inter_600SemiBold" },
  clearFiltersBtn: { marginTop: 10, alignItems: "center", paddingVertical: 8 },
  clearFiltersText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: C.danger,
  },
  countRow: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  countText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  guestName: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text },
  roomType: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginTop: 2,
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
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
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  addFirstBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  addFirstBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
