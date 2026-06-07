import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import ChatScreen from './src/screens/ChatScreen';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }) {
  return (
    <View style={{
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: focused ? colors.lilaLight : 'transparent',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.blanco,
            borderTopColor: 'rgba(0,0,0,0.06)',
            height: 70,
            paddingBottom: 10,
          },
          tabBarActiveTintColor: colors.lilaDark,
          tabBarInactiveTintColor: colors.textoSuave,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Inicio',
            tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="CheckIn"
          component={CheckInScreen}
          options={{
            tabBarLabel: 'Bienestar',
            tabBarIcon: ({ focused }) => <TabIcon emoji="💚" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            tabBarLabel: 'FRICI IA',
            tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
