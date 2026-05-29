// D:\trimly\apps\mobile\src\navigation\RootNavigator.tsx
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import SalonListScreen from "../screens/SalonListScreen";
import SalonDetailScreen from "../screens/SalonDetailsScreen";
import BookingServicesScreen from "../screens/BookingServicesScreen";
import BookingDateTimeScreen from "../screens/BookingDateTimeScreen";
import BookingStylistScreen from "../screens/BookingStylistScreen";
import BookingSummaryScreen from "../screens/BookingSummaryScreen";
import PaymentSuccessScreen from "../screens/PaymentSuccessScreen";
import AppointmentHistoryScreen from "../screens/AppointmentHistoryScreen";
import StyleRecommendationScreen from "../screens/StyleRecommendationScreen";
import MirrorScreen from "../screens/MirrorScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ProfileSetupScreen from "../screens/ProfileSetupScreen";
import { AuthUser } from "../types/auth";
import { ServiceItem, StylistItem } from "../types/salon";
import VirtualTryOnScreen from "../screens/VirtualTryOnScreen";
import FaceScanScreen from "../screens/FaceScanScreen";
import LoyaltyScreen from "../screens/LoyaltyScreen";
import { colors } from "../theme/colors";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useRef, RefObject } from "react";

// ─── Param lists ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  AuthGate: undefined;
  Login: undefined;
  ProfileSetup: undefined;
  MainTabs: undefined;
  SalonList: undefined;
  SalonDetail: { salonId: string };
  BookingServices: { salonId: string };
  BookingDateTime: {
    salonId: string;
    salonName: string;
    selectedServices: ServiceItem[];
  };
  BookingStylist: {
    salonId: string;
    salonName: string;
    date: string;
    startTime: string;
    selectedServices: ServiceItem[];
  };
  BookingSummary: {
    salonId: string;
    salonName: string;
    date: string;
    startTime: string;
    selectedServices: ServiceItem[];
    selectedStylists: Record<string, StylistItem>;
    idToken: string;
  };
  Appointments: undefined;
  PaymentSuccess: { appointmentId: string };
  StyleRecommendation: undefined;
  Mirror: { detectedFaceShape?: string; landmarks?: number[] };
  FaceScan: undefined;
  VirtualTryOn: {
    faceShape: string;
    landmarks: number[];
    photos: { front: string; left: string; right: string };
    existingGenerated?: Record<
      string,
      { front?: string; left?: string; right?: string }
    >;
    userSub?: string;
    idToken?: string;
  };
  Loyalty: { salonId?: string } | undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  SalonList: undefined;
  SalonDetail: { salonId: string };
  BookingServices: { salonId: string };
  BookingDateTime: {
    salonId: string;
    salonName: string;
    selectedServices: ServiceItem[];
  };
  BookingStylist: {
    salonId: string;
    salonName: string;
    date: string;
    startTime: string;
    selectedServices: ServiceItem[];
  };
  BookingSummary: {
    salonId: string;
    salonName: string;
    date: string;
    startTime: string;
    selectedServices: ServiceItem[];
    selectedStylists: Record<string, StylistItem>;
    idToken: string;
  };
  Appointments: undefined;
  PaymentSuccess: { appointmentId: string };
  StyleRecommendation: undefined;
  Mirror: { detectedFaceShape?: string; landmarks?: number[] };
  FaceScan: undefined;
  VirtualTryOn: {
    faceShape: string;
    landmarks: number[];
    photos: { front: string; left: string; right: string };
    existingGenerated?: Record<
      string,
      { front?: string; left?: string; right?: string }
    >;
    userSub?: string;
    idToken?: string;
  };
  Loyalty: { salonId?: string } | undefined;
};

export type SalonsStackParamList = {
  SalonListMain: undefined;
  SalonDetail: { salonId: string };
  BookingServices: { salonId: string };
  BookingDateTime: {
    salonId: string;
    salonName: string;
    selectedServices: ServiceItem[];
  };
  BookingStylist: {
    salonId: string;
    salonName: string;
    date: string;
    startTime: string;
    selectedServices: ServiceItem[];
  };
  BookingSummary: {
    salonId: string;
    salonName: string;
    date: string;
    startTime: string;
    selectedServices: ServiceItem[];
    selectedStylists: Record<string, StylistItem>;
    idToken: string;
  };
  PaymentSuccess: { appointmentId: string };
};

export type TabParamList = {
  HomeTab: undefined;
  SalonsTab: undefined;
  AppointmentsTab: undefined;
  ProfileTab: undefined;
};

// ─── Navigators ───────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SalonsStack = createNativeStackNavigator<SalonsStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

type Props = {
  user: AuthUser | null;
  idToken: string | null;
  isNewUserRef: React.RefObject<boolean>;
  onLoginSuccess: (user: AuthUser, idToken: string, isNewUser: boolean) => void;
  onRefreshUser: () => Promise<void>;
  onLogout: () => void;
};

// ─── Tab bar background ───────────────────────────────────────────────────────

function TabBarBackground() {
  return <View style={tabStyles.tabBarBg} />;
}

// ─── Home stack navigator ─────────────────────────────────────────────────────

function HomeStackNavigator({
  user,
  idToken,
  onLogout,
  onRefreshUser,
}: {
  user: AuthUser;
  idToken: string | null;
  onLogout: () => void;
  onRefreshUser: () => Promise<void>;
}) {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home">
        {({ navigation }) => (
          <HomeScreen
            user={user}
            idToken={idToken}
            onLogout={onLogout}
            onRefreshUser={onRefreshUser}
          />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name="SalonList" component={SalonListScreen} />
      <HomeStack.Screen name="SalonDetail" component={SalonDetailScreen} />
      <HomeStack.Screen
        name="BookingServices"
        component={BookingServicesScreen}
      />
      <HomeStack.Screen
        name="BookingDateTime"
        component={BookingDateTimeScreen}
      />
      <HomeStack.Screen
        name="BookingStylist"
        component={BookingStylistScreen}
      />
      <HomeStack.Screen name="BookingSummary">
        {(props) => (
          <BookingSummaryScreen {...props} idToken={idToken!} />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="PaymentSuccess"
        component={PaymentSuccessScreen}
      />
      <HomeStack.Screen name="Appointments">
        {(props) => <AppointmentHistoryScreen {...props} user={user} />}
      </HomeStack.Screen>
      <HomeStack.Screen name="StyleRecommendation">
        {(props) => (
          <StyleRecommendationScreen {...props} userSub={user?.sub} />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name="Mirror">
        {(props) => (
          <MirrorScreen {...props} idToken={idToken!} userSub={user?.sub} />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name="FaceScan">
        {(props) => (
          <FaceScanScreen
            {...props}
            idToken={idToken!}
            userSub={user?.sub}
            onScanComplete={(faceShape, landmarks, photos) => {
              props.navigation.navigate("VirtualTryOn", {
                faceShape,
                landmarks,
                photos,
                userSub: user?.sub,
                idToken: idToken!,
              });
            }}
          />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name="VirtualTryOn">
        {(props) => (
          <VirtualTryOnScreen
            {...props}
            faceShape={props.route.params.faceShape}
            landmarks={props.route.params.landmarks}
            photos={props.route.params.photos}
          />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name="Loyalty">
        {(props) => (
          <LoyaltyScreen
            {...props}
            idToken={idToken!}
            salonId={props.route?.params?.salonId}
          />
        )}
      </HomeStack.Screen>
    </HomeStack.Navigator>
  );
}

// ─── Salons stack navigator ───────────────────────────────────────────────────

function SalonsStackNavigator({
  idToken,
}: {
  idToken: string | null;
}) {
  return (
    <SalonsStack.Navigator screenOptions={{ headerShown: false }}>
      <SalonsStack.Screen name="SalonListMain" component={SalonListScreen} />
      <SalonsStack.Screen name="SalonDetail" component={SalonDetailScreen} />
      <SalonsStack.Screen
        name="BookingServices"
        component={BookingServicesScreen}
      />
      <SalonsStack.Screen
        name="BookingDateTime"
        component={BookingDateTimeScreen}
      />
      <SalonsStack.Screen
        name="BookingStylist"
        component={BookingStylistScreen}
      />
      <SalonsStack.Screen name="BookingSummary">
        {(props) => (
          <BookingSummaryScreen {...props} idToken={idToken!} />
        )}
      </SalonsStack.Screen>
      <SalonsStack.Screen
        name="PaymentSuccess"
        component={PaymentSuccessScreen}
      />
    </SalonsStack.Navigator>
  );
}

// ─── Main tab navigator ───────────────────────────────────────────────────────

function MainTabs({
  user,
  idToken,
  onLogout,
  onRefreshUser,
}: {
  user: AuthUser;
  idToken: string | null;
  onLogout: () => void;
  onRefreshUser: () => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 62 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarBackground: () => <TabBarBackground />,
        tabBarStyle: [
          tabStyles.tabBar,
          { height: tabBarHeight, paddingBottom: insets.bottom + 6 },
        ],
        tabBarActiveTintColor: colors.primaryLight,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: tabStyles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          const iconSize = focused ? size + 2 : size;

          if (route.name === "HomeTab") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "SalonsTab") {
            iconName = focused ? "cut" : "cut-outline";
          } else if (route.name === "AppointmentsTab") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else {
            iconName = focused ? "person" : "person-outline";
          }

          return (
            <View
              style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}
            >
              <Ionicons name={iconName} size={iconSize} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab" options={{ tabBarLabel: "Home" }}>
        {() => (
          <HomeStackNavigator
            user={user}
            idToken={idToken}
            onLogout={onLogout}
            onRefreshUser={onRefreshUser}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="SalonsTab" options={{ tabBarLabel: "Salons" }}>
        {() => <SalonsStackNavigator idToken={idToken} />}
      </Tab.Screen>

      <Tab.Screen name="AppointmentsTab" options={{ tabBarLabel: "Bookings" }}>
        {(props) => <AppointmentHistoryScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen name="ProfileTab" options={{ tabBarLabel: "Profile" }}>
        {() => (
          <ProfileScreen user={user} idToken={idToken} onLogout={onLogout} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ─── Root navigator ───────────────────────────────────────────────────────────

export default function RootNavigator({
  user,
  idToken,
  isNewUserRef,
  onLoginSuccess,
  onRefreshUser,
  onLogout,
}: Props) {
  function AuthGate({
    isNewUserRef,
    navigation,
    onRefreshUser,
  }: {
    isNewUserRef: React.RefObject<boolean>;
    navigation: any;
    onRefreshUser: () => Promise<void>;
  }) {
    useEffect(() => {
      if (isNewUserRef.current) {
        navigation.replace("ProfileSetup");
      } else {
        navigation.replace("MainTabs");
      }
    }, []);

    return null;
  }

  return (
    <NavigationContainer>
      {user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AuthGate">
            {({ navigation }) => (
              <AuthGate
                isNewUserRef={isNewUserRef}
                navigation={navigation}
                onRefreshUser={onRefreshUser}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="ProfileSetup">
            {({ navigation }) => (
              <ProfileSetupScreen
                user={user}
                idToken={idToken}
                onComplete={() => navigation.replace("MainTabs")}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="MainTabs">
            {() => (
              <MainTabs
                user={user}
                idToken={idToken}
                onLogout={onLogout}
                onRefreshUser={onRefreshUser}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {() => <LoginScreen onLoginSuccess={onLoginSuccess} />}
          </Stack.Screen>
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

// ─── Tab bar styles ───────────────────────────────────────────────────────────

const tabStyles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    borderTopWidth: 0,
    elevation: 0,
    paddingTop: 6,
    backgroundColor: "transparent",
  },
  tabBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgb(8, 14, 26)",
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  tabLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.3 },
  iconWrap: {
    width: 36,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  iconWrapActive: { backgroundColor: "rgba(171, 213, 255, 0.12)" },
});