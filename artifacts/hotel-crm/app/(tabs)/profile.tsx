import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { FormField } from "@/components/shared/FormField";
import { api } from "@/utils/api";

const C = Colors.light;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user, logout, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (newPassword && !currentPassword) {
      Alert.alert("Error", "Enter your current password");
      return;
    }
    setSaving(true);
    try {
      await api.put("/auth/update-profile", {
        name: name.trim(),
        ...(newPassword ? { currentPassword, newPassword } : {}),
      });
      await refreshUser();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Success", "Profile updated");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = user?.role?.replace("_", " ").toUpperCase() || "";

  return (
    <KeyboardAwareScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: topPad + 16, paddingBottom: insets.bottom + 90 },
      ]}
      keyboardShouldPersistTaps="handled"
      bottomOffset={24}
    >
      <Text style={styles.pageTitle}>Profile</Text>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{roleLabel}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Info</Text>
        <FormField
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
        />
        <View style={styles.readOnlyField}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.readOnlyValue}>
            <Feather name="mail" size={14} color={C.textMuted} />
            <Text style={styles.readOnlyText}>{user?.email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Change Password</Text>
        <FormField
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter current password"
          secureTextEntry
        />
        <FormField
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter new password"
          secureTextEntry
        />
        <FormField
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          secureTextEntry
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Save Changes</Text>
        )}
      </Pressable>

      {(user?.role === "hotel_owner" || user?.role === "admin") && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hotel Management</Text>
          <Pressable
            style={styles.manageBtn}
            onPress={() => router.push("/(tabs)/manage")}
          >
            <Feather name="users" size={18} color={C.primary} />
            <Text style={styles.manageBtnText}>Manage Hotel Users</Text>
            <Feather name="chevron-right" size={16} color={C.textMuted} />
          </Pressable>
        </View>
      )}

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Feather name="log-out" size={18} color={C.danger} />
        <Text style={styles.logoutBtnText}>Logout</Text>
      </Pressable>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.background },
  container: { paddingHorizontal: 16 },
  pageTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 20 },
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#fff" },
  userName: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  userEmail: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  roleBadge: {
    backgroundColor: C.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  roleBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.primary },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 16 },
  readOnlyField: { marginBottom: 8 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 8 },
  readOnlyValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  readOnlyText: { fontSize: 15, fontFamily: "Inter_400Regular", color: C.textSecondary },
  saveBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  manageBtnText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", color: C.text },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.dangerLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.danger,
    marginBottom: 16,
  },
  logoutBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.danger },
});
