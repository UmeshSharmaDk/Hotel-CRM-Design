import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useHotelContext, Hotel } from "@/hooks/useHotelContext";
import { api } from "@/utils/api";
import { SelectField } from "@/components/shared/FormField";

const C = Colors.light;

interface Agency { id: number; name: string; hotelId: number }
interface RoomType { id: number; name: string; hotelId: number; pricePerNight: string }
interface UserProfile { id: number; name: string; email: string; role: string; hotelId: number | null }

export default function ManageScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user } = useAuth();
  const { hotels, selectedHotel, selectedHotelId, selectHotel, reload } = useHotelContext();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"hotels" | "agencies" | "rooms" | "users">(
    user?.role === "admin" ? "hotels" : "agencies"
  );

  const hotelOptions = hotels.map((h) => ({ label: h.name, value: h.id.toString() }));

  useFocusEffect(
    useCallback(() => {
      reload();
      if (selectedHotelId) loadData();
    }, [selectedHotelId])
  );

  const loadData = async () => {
    if (!selectedHotelId) return;
    setLoading(true);
    try {
      const [agData, rtData, uData] = await Promise.all([
        api.get<Agency[]>(`/hotels/${selectedHotelId}/agencies`),
        api.get<RoomType[]>(`/hotels/${selectedHotelId}/room-types`),
        api.get<UserProfile[]>(`/hotels/${selectedHotelId}/users`),
      ]);
      setAgencies(agData);
      setRoomTypes(rtData);
      setUsers(uData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([reload(), loadData()]);
    setRefreshing(false);
  };

  const deleteHotel = (id: number) => {
    Alert.alert("Delete Hotel", "This will delete all data for this hotel.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/hotels/${id}`);
            reload();
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  const deleteAgency = async (id: number) => {
    Alert.alert("Delete Agency", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.delete(`/hotels/${selectedHotelId}/agencies/${id}`);
          setAgencies((prev) => prev.filter((a) => a.id !== id));
        },
      },
    ]);
  };

  const deleteRoomType = async (id: number) => {
    Alert.alert("Delete Room Type", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.delete(`/hotels/${selectedHotelId}/room-types/${id}`);
          setRoomTypes((prev) => prev.filter((r) => r.id !== id));
        },
      },
    ]);
  };

  const deleteUser = async (id: number) => {
    Alert.alert("Delete User", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.delete(`/hotels/${selectedHotelId}/users/${id}`);
          setUsers((prev) => prev.filter((u) => u.id !== id));
        },
      },
    ]);
  };

  const tabs: { key: typeof activeTab; label: string; icon: string }[] = [
    ...(user?.role === "admin" ? [{ key: "hotels" as const, label: "Hotels", icon: "building" }] : []),
    { key: "agencies" as const, label: "Agencies", icon: "briefcase" },
    { key: "rooms" as const, label: "Rooms", icon: "grid" },
    { key: "users" as const, label: "Users", icon: "users" },
  ];

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage</Text>
      </View>

      {user?.role === "admin" && hotels.length > 0 && activeTab !== "hotels" && (
        <View style={styles.hotelSelector}>
          <SelectField
            label=""
            value={selectedHotelId?.toString() || ""}
            options={hotelOptions}
            onChange={(v) => selectHotel(parseInt(v))}
            placeholder="Select hotel"
          />
        </View>
      )}

      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Feather
              name={tab.icon as any}
              size={15}
              color={activeTab === tab.key ? C.primary : C.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading && <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />}

      {!loading && activeTab === "hotels" && user?.role === "admin" && (
        <FlatList
          data={hotels}
          keyExtractor={(h) => h.id.toString()}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemSub}>{item.totalRooms} rooms</Text>
                <Text style={styles.itemSub}>Plan: {item.planStartDate} → {item.planEndDate}</Text>
              </View>
              <View style={styles.itemActions}>
                <Pressable
                  style={styles.editBtn}
                  onPress={() => router.push({ pathname: "/hotel/edit", params: { hotelId: item.id } })}
                >
                  <Feather name="edit-2" size={15} color={C.primary} />
                </Pressable>
                <Pressable style={styles.deleteSmBtn} onPress={() => deleteHotel(item.id)}>
                  <Feather name="trash-2" size={15} color={C.danger} />
                </Pressable>
              </View>
            </View>
          )}
          ListHeaderComponent={
            <Pressable style={styles.addRowBtn} onPress={() => router.push("/hotel/add")}>
              <Feather name="plus" size={16} color={C.primary} />
              <Text style={styles.addRowBtnText}>Add Hotel</Text>
            </Pressable>
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No hotels</Text>}
        />
      )}

      {!loading && activeTab === "agencies" && (
        <FlatList
          data={agencies}
          keyExtractor={(a) => a.id.toString()}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <Feather name="briefcase" size={18} color={C.primary} style={{ marginRight: 12 }} />
              <Text style={[styles.itemTitle, { flex: 1 }]}>{item.name}</Text>
              <View style={styles.itemActions}>
                <Pressable
                  style={styles.editBtn}
                  onPress={() => router.push({ pathname: "/agency/edit", params: { agencyId: item.id, hotelId: selectedHotelId } })}
                >
                  <Feather name="edit-2" size={15} color={C.primary} />
                </Pressable>
                <Pressable style={styles.deleteSmBtn} onPress={() => deleteAgency(item.id)}>
                  <Feather name="trash-2" size={15} color={C.danger} />
                </Pressable>
              </View>
            </View>
          )}
          ListHeaderComponent={
            selectedHotelId ? (
              <Pressable
                style={styles.addRowBtn}
                onPress={() => router.push({ pathname: "/agency/add", params: { hotelId: selectedHotelId } })}
              >
                <Feather name="plus" size={16} color={C.primary} />
                <Text style={styles.addRowBtnText}>Add Agency</Text>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No agencies</Text>}
        />
      )}

      {!loading && activeTab === "rooms" && (
        <FlatList
          data={roomTypes}
          keyExtractor={(r) => r.id.toString()}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemSub}>₹{parseFloat(item.pricePerNight).toLocaleString("en-IN")} / night</Text>
              </View>
              <View style={styles.itemActions}>
                <Pressable
                  style={styles.editBtn}
                  onPress={() => router.push({ pathname: "/roomtype/edit", params: { roomTypeId: item.id, hotelId: selectedHotelId } })}
                >
                  <Feather name="edit-2" size={15} color={C.primary} />
                </Pressable>
                <Pressable style={styles.deleteSmBtn} onPress={() => deleteRoomType(item.id)}>
                  <Feather name="trash-2" size={15} color={C.danger} />
                </Pressable>
              </View>
            </View>
          )}
          ListHeaderComponent={
            selectedHotelId ? (
              <Pressable
                style={styles.addRowBtn}
                onPress={() => router.push({ pathname: "/roomtype/add", params: { hotelId: selectedHotelId } })}
              >
                <Feather name="plus" size={16} color={C.primary} />
                <Text style={styles.addRowBtnText}>Add Room Type</Text>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No room types</Text>}
        />
      )}

      {!loading && activeTab === "users" && (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id.toString()}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemSub}>{item.email}</Text>
                <Text style={styles.roleBadge}>{item.role.replace("_", " ")}</Text>
              </View>
              <View style={styles.itemActions}>
                <Pressable
                  style={styles.editBtn}
                  onPress={() => router.push({ pathname: "/user/edit", params: { userId: item.id, hotelId: selectedHotelId } })}
                >
                  <Feather name="edit-2" size={15} color={C.primary} />
                </Pressable>
                <Pressable style={styles.deleteSmBtn} onPress={() => deleteUser(item.id)}>
                  <Feather name="trash-2" size={15} color={C.danger} />
                </Pressable>
              </View>
            </View>
          )}
          ListHeaderComponent={
            selectedHotelId ? (
              <Pressable
                style={styles.addRowBtn}
                onPress={() => router.push({ pathname: "/user/add", params: { hotelId: selectedHotelId } })}
              >
                <Feather name="plus" size={16} color={C.primary} />
                <Text style={styles.addRowBtnText}>Add User</Text>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No users</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  hotelSelector: { paddingHorizontal: 16, paddingTop: 10 },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.background,
  },
  tabActive: { backgroundColor: C.primaryLight },
  tabText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.textSecondary },
  tabTextActive: { color: C.primary, fontFamily: "Inter_600SemiBold" },
  listContent: { paddingHorizontal: 16, paddingTop: 12 },
  addRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.primaryLight,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.primary,
    borderStyle: "dashed",
  },
  addRowBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.primary },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  itemTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  itemSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  itemActions: { flexDirection: "row", gap: 6 },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteSmBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userAvatarText: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.primary },
  roleBadge: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: C.primary,
    textTransform: "capitalize",
    marginTop: 2,
  },
  emptyText: { textAlign: "center", color: C.textMuted, fontFamily: "Inter_400Regular", paddingVertical: 32 },
});
