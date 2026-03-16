import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import Colors from "@/constants/colors";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { FormField, DateField, SelectField } from "@/components/shared/FormField";
import { api } from "@/utils/api";

const C = Colors.light;

const STATUS_OPTIONS = [
  { label: "Confirmed", value: "confirmed" },
  { label: "Pending", value: "pending" },
  { label: "Checked In", value: "checked-in" },
  { label: "Checked Out", value: "checked-out" },
  { label: "Cancelled", value: "cancelled" },
];

interface Agency { id: number; name: string }
interface RoomType { id: number; name: string; pricePerNight: string }

export default function AddBookingScreen() {
  const { hotelId } = useLocalSearchParams<{ hotelId: string }>();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [form, setForm] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    roomType: "",
    checkIn: "",
    checkOut: "",
    rooms: "1",
    status: "confirmed",
    agencyId: "",
    totalCost: "",
    dueBalance: "0",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ag, rt] = await Promise.all([
        api.get<Agency[]>(`/hotels/${hotelId}/agencies`),
        api.get<RoomType[]>(`/hotels/${hotelId}/room-types`),
      ]);
      setAgencies(ag);
      setRoomTypes(rt);
    } catch {}
  };

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.guestName || !form.roomType || !form.checkIn || !form.checkOut || !form.totalCost) {
      Alert.alert("Error", "Fill all required fields");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/hotels/${hotelId}/bookings`, {
        ...form,
        rooms: parseInt(form.rooms) || 1,
        agencyId: form.agencyId ? parseInt(form.agencyId) : null,
      });
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const roomTypeOptions = roomTypes.map((r) => ({ label: r.name, value: r.name }));
  const agencyOptions = [
    { label: "No Agency (Direct)", value: "" },
    ...agencies.map((a) => ({ label: a.name, value: a.id.toString() })),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScreenHeader title="Add Booking" />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        <Text style={styles.section}>Guest Details</Text>
        <FormField label="Guest Name *" value={form.guestName} onChangeText={(v) => set("guestName", v)} placeholder="Full name" />
        <FormField label="Email" value={form.guestEmail} onChangeText={(v) => set("guestEmail", v)} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" />
        <FormField label="Phone" value={form.guestPhone} onChangeText={(v) => set("guestPhone", v)} placeholder="+91 98765 43210" keyboardType="phone-pad" />

        <Text style={styles.section}>Booking Details</Text>
        <SelectField
          label="Room Type *"
          value={form.roomType}
          options={roomTypeOptions}
          onChange={(v) => set("roomType", v)}
          placeholder="Select room type"
        />
        <DateField label="Check-In Date *" value={form.checkIn} onChange={(v) => set("checkIn", v)} />
        <DateField label="Check-Out Date *" value={form.checkOut} onChange={(v) => set("checkOut", v)} minimumDate={form.checkIn ? new Date(form.checkIn) : undefined} />
        <FormField label="Number of Rooms *" value={form.rooms} onChangeText={(v) => set("rooms", v)} keyboardType="number-pad" />
        <SelectField
          label="Status *"
          value={form.status}
          options={STATUS_OPTIONS}
          onChange={(v) => set("status", v)}
        />
        <SelectField
          label="Agency"
          value={form.agencyId}
          options={agencyOptions}
          onChange={(v) => set("agencyId", v)}
        />

        <Text style={styles.section}>Financial</Text>
        <FormField label="Notes" value={form.notes} onChangeText={(v) => set("notes", v)} placeholder="Any special requests..." multiline numberOfLines={3} textAlignVertical="top" />
        <FormField label="Total Cost (₹) *" value={form.totalCost} onChangeText={(v) => set("totalCost", v)} keyboardType="decimal-pad" placeholder="0" />
        <FormField label="Due Balance (₹)" value={form.dueBalance} onChangeText={(v) => set("dueBalance", v)} keyboardType="decimal-pad" placeholder="0" />

        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Booking</Text>}
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  section: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 8, marginBottom: 12 },
  saveBtn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
