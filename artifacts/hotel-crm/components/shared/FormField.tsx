import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";

const C = Colors.light;

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function FormField({ label, error, ...props }: FormFieldProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={C.textMuted}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  minimumDate?: Date;
  error?: string;
}

export function DateField({ label, value, onChange, minimumDate, error }: DateFieldProps) {
  const [show, setShow] = useState(false);
  const dateValue = value ? new Date(value) : new Date();

  const handleChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShow(false);
    if (selectedDate) {
      const iso = selectedDate.toISOString().split("T")[0];
      onChange(iso);
      if (Platform.OS === "ios") setShow(false);
    } else {
      setShow(false);
    }
  };

  const displayDate = value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Select date";

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.input, styles.dateInput, error && styles.inputError]}
        onPress={() => setShow(true)}
      >
        <Feather name="calendar" size={16} color={value ? C.text : C.textMuted} />
        <Text style={[styles.dateText, !value && { color: C.textMuted }]}>{displayDate}</Text>
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
      {show && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

export function SelectField({ label, value, options, onChange, error, placeholder }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.input, styles.dateInput, error && styles.inputError]}
        onPress={() => setOpen(!open)}
      >
        <Text style={[styles.dateText, !selected && { color: C.textMuted }]}>
          {selected?.label || placeholder || "Select..."}
        </Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={16} color={C.textMuted} />
      </Pressable>
      {open && (
        <View style={styles.dropdown}>
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.option, opt.value === value && styles.optionSelected]}
              onPress={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              <Text
                style={[styles.optionText, opt.value === value && styles.optionTextSelected]}
              >
                {opt.label}
              </Text>
              {opt.value === value && <Feather name="check" size={16} color={C.primary} />}
            </Pressable>
          ))}
        </View>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
  inputError: {
    borderColor: C.danger,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
  dropdown: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    marginTop: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 999,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  optionSelected: {
    backgroundColor: C.primaryLight,
  },
  optionText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
  optionTextSelected: {
    fontFamily: "Inter_600SemiBold",
    color: C.primary,
  },
  error: {
    fontSize: 12,
    color: C.danger,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
});
