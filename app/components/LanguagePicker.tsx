import React from "react";
import { View } from "react-native";
import { Picker } from "@react-native-picker/picker";

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: { language: string; name: string }[];
}

import { useThemeColor } from "../hooks/use-theme-color";

export default function LanguagePicker({ value, onChange, options }: Props) {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={{ borderWidth: 1, borderRadius: 6, borderColor: borderColor, marginBottom: 12, backgroundColor: backgroundColor }}>
      <Picker
        selectedValue={value}
        onValueChange={(itemValue: string) => onChange(itemValue)}
        style={{ color: textColor, backgroundColor: backgroundColor }}
        dropdownIconColor={textColor}
      >
        {options.map((lang) => (
          <Picker.Item key={lang.language} label={lang.name} value={lang.language} color={textColor} style={{ backgroundColor: backgroundColor }} />
        ))}
      </Picker>
    </View>
  );
}
