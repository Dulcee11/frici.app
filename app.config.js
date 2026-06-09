// app.config.js — configuración dinámica de Expo
// La URL del servidor se cambia aquí cuando despliegues en Railway.

const SERVER_URL = process.env.FRICI_SERVER_URL || 'https://friciapp-production.up.railway.app';

module.exports = {
  expo: {
    name: "FRICI",
    slug: "frici-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#EDE9FE"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.frici.app"
    },
    android: {
      package: "com.frici.app",
      adaptiveIcon: {
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
        backgroundColor: "#EDE9FE"
      },
      permissions: ["READ_CALENDAR"]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      ["expo-calendar", { calendarPermission: "FRICI necesita acceder a tu calendario para detectar tu carga digital." }]
    ],
    extra: {
      // 👇 Reemplaza esta URL después de desplegar en Railway
      serverUrl: SERVER_URL,
    }
  }
};
