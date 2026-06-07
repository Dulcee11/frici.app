import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import ChatScreen from './src/screens/ChatScreen';
import { colors } from './src/theme';
import { getUser } from './src/storage';

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

function MainApp({ user }) {
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
        <Tab.Screen name="Home" options={{ tabBarLabel: 'Inicio', tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }}>
          {props => <HomeScreen {...props} user={user} />}
        </Tab.Screen>
        <Tab.Screen name="CheckIn" options={{ tabBarLabel: 'Bienestar', tabBarIcon: ({ focused }) => <TabIcon emoji="💚" focused={focused} /> }}>
          {props => <CheckInScreen {...props} user={user} />}
        </Tab.Screen>
        <Tab.Screen name="Chat" options={{ tabBarLabel: 'FRICI IA', tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} /> }}>
          {props => <ChatScreen {...props} user={user} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = cargando

  useEffect(() => {
    getUser().then(u => setUser(u || null));
  }, []);

  // Splash / loading
  if (user === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.lilaDark} />
      </View>
    );
  }

  // No hay sesión → login/registro
  if (!user) {
    return <LoginScreen onLogin={u => setUser(u)} />;
  }

  // Sesión activa → app principal
  return <MainApp user={user} />;
}
