import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Colors from "@/constants/colors";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { FormField } from "@/components/shared/FormField";
import { api } from "@/utils/api";
const C = Colors.light;
interface Agency { id: number; name: string; hotelId: number }
export default function EditAgencyScreen() {
  const { agencyId, hotelId } = useLocalSearchParams<{ agencyId: string; hotelId: string }>();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api.get<Agency[]>(`/hotels/${hotelId}/agencies`).then((agencies) => {
      const a = agencies.find((x) => x.id === parseInt(agencyId));
      if (a) setName(a.name);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Error", "Agency name required"); return; }
    setSaving(true);
    try { await api.put(`/hotels/${hotelId}/agencies/${agencyId}`, { name }); router.back(); }
    catch (err: any) { Alert.alert("Error", err.message); } finally { setSaving(false); }
  };
  if (loading) return <View style={{ flex: 1, backgroundColor: C.background }}><ScreenHeader title="Edit Agency" /><ActivityIndicator color={C.primary} style={{ marginTop: 40 }} /></View>;
  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScreenHeader title="Edit Agency" />
      <KeyboardAwareScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" bottomOffset={24}>
        <FormField label="Agency Name *" value={name} onChangeText={setName} placeholder="Travel Co." />
        <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update Agency</Text>}
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}
const styles = StyleSheet.create({ btn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8 }, btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" } });
