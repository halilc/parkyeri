export default {
  expo: {
    name: "parkyeri",
    slug: "parkyeri",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.parkyeri.app",
      config: {
        googleMapsApiKey: "YOUR_IOS_API_KEY"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.parkyeri.app",
      config: {
        googleMaps: {
          apiKey: "YOUR_ANDROID_API_KEY"
        }
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      googleMapsApiKey: "YOUR_WEB_API_KEY"
    }
  }
} 