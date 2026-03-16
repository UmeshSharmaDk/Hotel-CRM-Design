import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
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
export default function AddUserScreen() {
  const { hotelId } = useLocalSearchParams<{ hotelId: string }>();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "hotel_manager" });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const handleSave = async () => {
    if (!form.name || !form.email || !form.password) { Alert.alert("Error", "All fields required"); return; }
    setSaving(true);
    try { await api.post(`/hotels/${hotelId}/users`, form); router.back(); }
    catch (err: any) { Alert.alert("Error", err.message); } finally { setSaving(false); }
  };
  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScreenHeader title="Add User" />
      <KeyboardAwareScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" bottomOffset={24}>
        <FormField label="Full Name *" value={form.name} onChangeText={(v) => set("name", v)} placeholder="John Doe" />
        <FormField label="Email *" value={form.email} onChangeText={(v) => set("email", v)} placeholder="john@hotel.com" keyboardType="email-address" autoCapitalize="none" />
        <FormField label="Password *" value={form.password} onChangeText={(v) => set("password", v)} placeholder="Minimum 8 characters" secureTextEntry />
        <SelectField label="Role *" value={form.role} options={ROLE_OPTIONS} onChange={(v) => set("role", v)} />
        <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Add User</Text>}
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}
const styles = StyleSheet.create({ btn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8 }, btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" } });
