import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Colors from "@/constants/colors";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { FormField, SelectField } from "@/components/shared/FormField";
import { api } from "@/utils/api";
const C = Colors.light;
const ROLE_OPTIONS = [
  { label: "Hotel Owner", value: "hotel_owner" },
  { label: "Hotel Manager", value: "hotel_manager" },
];
interface UserProfile { id: number; name: string; email: string; role: string; hotelId: number | null }
export default function EditUserScreen() {
  const { userId, hotelId } = useLocalSearchParams<{ userId: string; hotelId: string }>();
  const [form, setForm] = useState({ name: "", email: "", role: "hotel_manager", password: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api.get<UserProfile[]>(`/hotels/${hotelId}/users`).then((users) => {
      const u = users.find((x) => x.id === parseInt(userId));
      if (u) setForm({ name: u.name, email: u.email, role: u.role, password: "" });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const handleSave = async () => {
    if (!form.name || !form.email) { Alert.alert("Error", "Name and email required"); return; }
    setSaving(true);
    try {
      await api.put(`/hotels/${hotelId}/users/${userId}`, {
        name: form.name, email: form.email, role: form.role,
        ...(form.password ? { password: form.password } : {}),
      });
      router.back();
    } catch (err: any) { Alert.alert("Error", err.message); } finally { setSaving(false); }
  };
  if (loading) return <View style={{ flex: 1, backgroundColor: C.background }}><ScreenHeader title="Edit User" /><ActivityIndicator color={C.primary} style={{ marginTop: 40 }} /></View>;
  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScreenHeader title="Edit User" />
      <KeyboardAwareScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" bottomOffset={24}>
        <FormField label="Full Name *" value={form.name} onChangeText={(v) => set("name", v)} placeholder="John Doe" />
        <FormField label="Email *" value={form.email} onChangeText={(v) => set("email", v)} placeholder="john@hotel.com" keyboardType="email-address" autoCapitalize="none" />
        <SelectField label="Role *" value={form.role} options={ROLE_OPTIONS} onChange={(v) => set("role", v)} />
        <FormField label="New Password (optional)" value={form.password} onChangeText={(v) => set("password", v)} placeholder="Leave blank to keep unchanged" secureTextEntry />
        <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update User</Text>}
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}
const styles = StyleSheet.create({ btn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8 }, btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" } });
