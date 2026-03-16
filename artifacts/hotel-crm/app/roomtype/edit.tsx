import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Colors from "@/constants/colors";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { FormField } from "@/components/shared/FormField";
import { api } from "@/utils/api";
const C = Colors.light;
interface RoomType { id: number; name: string; pricePerNight: string }
export default function EditRoomTypeScreen() {
  const { roomTypeId, hotelId } = useLocalSearchParams<{ roomTypeId: string; hotelId: string }>();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api.get<RoomType[]>(`/hotels/${hotelId}/room-types`).then((rts) => {
      const rt = rts.find((x) => x.id === parseInt(roomTypeId));
      if (rt) { setName(rt.name); setPrice(rt.pricePerNight); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  const handleSave = async () => {
    if (!name.trim() || !price.trim()) { Alert.alert("Error", "All fields required"); return; }
    setSaving(true);
    try { await api.put(`/hotels/${hotelId}/room-types/${roomTypeId}`, { name, pricePerNight: price }); router.back(); }
    catch (err: any) { Alert.alert("Error", err.message); } finally { setSaving(false); }
  };
  if (loading) return <View style={{ flex: 1, backgroundColor: C.background }}><ScreenHeader title="Edit Room Type" /><ActivityIndicator color={C.primary} style={{ marginTop: 40 }} /></View>;
  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScreenHeader title="Edit Room Type" />
      <KeyboardAwareScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" bottomOffset={24}>
        <FormField label="Room Type Name *" value={name} onChangeText={setName} placeholder="Deluxe Room" />
        <FormField label="Price Per Night (₹) *" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="2500" />
        <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update Room Type</Text>}
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}
const styles = StyleSheet.create({ btn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8 }, btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" } });
