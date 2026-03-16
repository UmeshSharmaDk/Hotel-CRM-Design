import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Colors from "@/constants/colors";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { FormField, DateField } from "@/components/shared/FormField";
import { api } from "@/utils/api";
const C = Colors.light;
interface Hotel { id: number; name: string; totalRooms: number; planStartDate: string; planEndDate: string }
export default function EditHotelScreen() {
  const { hotelId } = useLocalSearchParams<{ hotelId: string }>();
  const [form, setForm] = useState({ name: "", totalRooms: "", planStartDate: "", planEndDate: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api.get<Hotel[]>("/hotels").then((hotels) => {
      const h = hotels.find((x) => x.id === parseInt(hotelId));
      if (h) setForm({ name: h.name, totalRooms: h.totalRooms.toString(), planStartDate: h.planStartDate, planEndDate: h.planEndDate });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const handleSave = async () => {
    if (!form.name || !form.totalRooms || !form.planStartDate || !form.planEndDate) {
      Alert.alert("Error", "All fields are required"); return;
    }
    setSaving(true);
    try {
      await api.put(`/hotels/${hotelId}`, { ...form, totalRooms: parseInt(form.totalRooms) });
      router.back();
    } catch (err: any) { Alert.alert("Error", err.message); } finally { setSaving(false); }
  };
  if (loading) return <View style={{ flex: 1, backgroundColor: C.background }}><ScreenHeader title="Edit Hotel" /><ActivityIndicator color={C.primary} style={{ marginTop: 40 }} /></View>;
  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScreenHeader title="Edit Hotel" />
      <KeyboardAwareScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={24}>
        <FormField label="Hotel Name *" value={form.name} onChangeText={(v) => set("name", v)} placeholder="Grand Palace Hotel" />
        <FormField label="Total Rooms *" value={form.totalRooms} onChangeText={(v) => set("totalRooms", v)} keyboardType="number-pad" placeholder="100" />
        <DateField label="Plan Start Date *" value={form.planStartDate} onChange={(v) => set("planStartDate", v)} />
        <DateField label="Plan End Date *" value={form.planEndDate} onChange={(v) => set("planEndDate", v)} minimumDate={form.planStartDate ? new Date(form.planStartDate) : undefined} />
        <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update Hotel</Text>}
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  btn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
