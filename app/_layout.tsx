
import { Stack } from "expo-router";
import { ThemeProvider as NavThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { Colors } from "./constants/theme";

function RootLayoutNav() {
  const { colorScheme } = useTheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <NavThemeProvider value={theme}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors[colorScheme].background,
          },
          headerTintColor: Colors[colorScheme].text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: "BridgeTalk" }} />
        <Stack.Screen name="text" options={{ title: "Text Translator" }} />
        <Stack.Screen name="speech" options={{ title: "Speech Translator" }} />
        <Stack.Screen name="ocr" options={{ title: "Image Translator" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="translator" options={{ title: "My Translations" }} />
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}
