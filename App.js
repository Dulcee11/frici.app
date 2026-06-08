import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View, ActivityIndicator } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import ChatScreen from './src/screens/ChatScreen';
import StatsScreen from './src/screens/StatsScreen';
import HabitsEditScreen from './src/screens/HabitsEditScreen';
import { colors } from './src/theme';
import { getUser } from './src/storage';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

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

// Tab navigator (las 4 pestañas principales)
function MainTabs({ user, onLogout }) {
  return (
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
        {props => <HomeScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="CheckIn" options={{ tabBarLabel: 'Bienestar', tabBarIcon: ({ focused }) => <TabIcon emoji="💚" focused={focused} /> }}>
        {props => <CheckInScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Stats" options={{ tabBarLabel: 'Progreso', tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} /> }}>
        {props => <StatsScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Chat" options={{ tabBarLabel: 'FRICI IA', tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} /> }}>
        {props => <ChatScreen {...props} user={user} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Stack con tabs + pantallas modales (editar hábitos)
function MainApp({ user, onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs">
        {props => <MainTabs {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="HabitsEdit" component={HabitsEditScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    getUser().then(u => setUser(u || null));
  }, []);

  if (user === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.lilaDark} />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={u => setUser(u)} />;
  }

  return (
    <NavigationContainer>
      <MainApp user={user} onLogout={() => setUser(null)} />
    </NavigationContainer>
  );
}
