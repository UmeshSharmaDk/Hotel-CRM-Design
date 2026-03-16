import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { View } from "react-native";
import Colors from "@/constants/colors";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
const C = Colors.light;
export default function BookingDetailScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScreenHeader title="Booking Detail" />
    </View>
  );
}
