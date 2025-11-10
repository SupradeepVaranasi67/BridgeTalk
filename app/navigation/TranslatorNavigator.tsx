
import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import TranslationHistoryScreen from '../history';
import FavoritesScreen from '../favorites';
import { useTheme } from '@react-navigation/native';

const Tab = createMaterialTopTabNavigator();

export default function TranslatorNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarIndicatorStyle: { backgroundColor: colors.primary },
        tabBarStyle: { backgroundColor: colors.card },
      }}
    >
      <Tab.Screen name="History" component={TranslationHistoryScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
    </Tab.Navigator>
  );
}
