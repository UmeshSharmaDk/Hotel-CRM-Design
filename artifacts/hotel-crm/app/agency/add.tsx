import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Colors from "@/constants/colors";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { FormField } from "@/components/shared/FormField";
import { api } from "@/utils/api";
const C = Colors.light;
export default function AddAgencyScreen() {
  const { hotelId } = useLocalSearchParams<{ hotelId: string }>();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Error", "Agency name required"); return; }
    setSaving(true);
    try { await api.post(`/hotels/${hotelId}/agencies`, { name }); router.back(); }
    catch (err: any) { Alert.alert("Error", err.message); } finally { setSaving(false); }
  };
  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScreenHeader title="Add Agency" />
      <KeyboardAwareScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={24}>
        <FormField label="Agency Name *" value={name} onChangeText={setName} placeholder="Travel Co." />
        <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Agency</Text>}
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}
const styles = StyleSheet.create({ content: { padding: 16, paddingBottom: 40 }, btn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8 }, btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" } });
