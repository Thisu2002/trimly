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
//import PaymentScreen from "../screens/PaymentScreen";
import PaymentSuccessScreen from "../screens/PaymentSuccessScreen";
import AppointmentHistoryScreen from "../screens/AppointmentHistoryScreen";
import StyleRecommendationScreen from "../screens/StyleRecommendationScreen";
import MirrorScreen from "../screens/MirrorScreen";
import { AuthUser } from "../types/auth";
import { ServiceItem, StylistItem } from "../types/salon";
import VirtualTryOnScreen from "../screens/VirtualTryOnScreen";
import FaceScanScreen from "../screens/FaceScanScreen";
import LoyaltyScreen from "../screens/LoyaltyScreen";
import { colors } from "../theme/colors";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
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
  // Payment: {
  //   paymentData: any;
  //   appointmentId: string;
  // };
  PaymentSuccess: {
    appointmentId: string;
  };
  StyleRecommendation: undefined;
  Mirror: { detectedFaceShape?: string; landmarks?: number[] };
  FaceScan: undefined;
  VirtualTryOn: {
    faceShape: string;
    landmarks: number[];
    photos: {
      front: string;
      left: string;
      right: string;
    };
    existingGenerated?: Record<string, { front?: string; left?: string; right?: string }>;
    userSub?: string;
    idToken?: string;
  };
  Loyalty: { salonId?: string } | undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  SalonsTab: undefined;
  AppointmentsTab: undefined;
  StyleTab: undefined;
  MirrorTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

type Props = {
  user: AuthUser | null;
  idToken: string | null;
  onLoginSuccess: (user: AuthUser, idToken: string) => void;
  onLogout: () => void;
};

// Custom tab bar background with glass effect
function TabBarBackground() {
  return (
    <View style={tabStyles.tabBarBg} />
  );
}

function MainTabs({
  user,
  idToken,
  onLogout,
}: {
  user: AuthUser;
  idToken: string | null;
  onLogout: () => void;
}) {
  const insets = useSafeAreaInsets();
  // Extra breathing room above the Android gesture bar / nav buttons
  const tabBarHeight = 62 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarBackground: () => <TabBarBackground />,
        tabBarStyle: [tabStyles.tabBar, { height: tabBarHeight, paddingBottom: insets.bottom + 6 }],
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
          } else if (route.name === "StyleTab") {
            iconName = focused ? "sparkles" : "sparkles-outline";
          } else {
            iconName = focused ? "camera" : "camera-outline";
          }

          return (
            <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
              <Ionicons name={iconName} size={iconSize} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        options={{ tabBarLabel: "Home" }}
      >
        {({ navigation }) => (
          <HomeScreen
            user={user}
            idToken={idToken}
            onLogout={onLogout}
            onBrowseSalons={() => navigation.getParent()?.navigate("SalonList")}
            onBrowseAppointments={() =>
              navigation.getParent()?.navigate("Appointments")
            }
            onOpenLoyalty={() => navigation.getParent()?.navigate("Loyalty", {})}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="SalonsTab"
        options={{ tabBarLabel: "Salons" }}
      >
        {() => <SalonListScreen />}
      </Tab.Screen>

      <Tab.Screen
        name="AppointmentsTab"
        options={{ tabBarLabel: "Bookings" }}
      >
        {(props) => <AppointmentHistoryScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name="StyleTab"
        options={{ tabBarLabel: "Style" }}
      >
        {() => <StyleRecommendationScreen userSub={user?.sub} />}
      </Tab.Screen>

      <Tab.Screen
        name="MirrorTab"
        options={{ tabBarLabel: "Mirror" }}
      >
        {() => (
          <MirrorScreen
            idToken={idToken!}
            userSub={user?.sub}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

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
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  iconWrap: {
    width: 36,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  iconWrapActive: {
    backgroundColor: "rgba(171, 213, 255, 0.12)",
  },
});

export default function RootNavigator({
  user,
  idToken,
  onLoginSuccess,
  onLogout,
}: Props) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="MainTabs">
              {() => (
                <MainTabs user={user} idToken={idToken} onLogout={onLogout} />
              )}
            </Stack.Screen>
            <Stack.Screen name="SalonList" component={SalonListScreen} />
            <Stack.Screen name="SalonDetail" component={SalonDetailScreen} />
            <Stack.Screen
              name="BookingServices"
              component={BookingServicesScreen}
            />
            <Stack.Screen
              name="BookingDateTime"
              component={BookingDateTimeScreen}
            />
            <Stack.Screen
              name="BookingStylist"
              component={BookingStylistScreen}
            />
            <Stack.Screen name="BookingSummary">
              {(props) => (
                <BookingSummaryScreen {...props} idToken={idToken!} />
              )}
            </Stack.Screen>
            {/* <Stack.Screen name="Payment" component={PaymentScreen} /> */}
            <Stack.Screen
              name="PaymentSuccess"
              component={PaymentSuccessScreen}
            />
            <Stack.Screen name="Appointments">
              {(props) => <AppointmentHistoryScreen {...props} user={user} />}
            </Stack.Screen>
            <Stack.Screen name="StyleRecommendation">
              {(props) => (
                <StyleRecommendationScreen {...props} userSub={user?.sub} />
              )}
            </Stack.Screen>
            <Stack.Screen name="Mirror">
              {(props) => (
                <MirrorScreen
                  {...props}
                  idToken={idToken!}
                  userSub={user?.sub}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="FaceScan">
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
  </Stack.Screen>
            <Stack.Screen name="VirtualTryOn">
              {(props) => (
                <VirtualTryOnScreen
                  {...props}
                  faceShape={props.route.params.faceShape}
                  landmarks={props.route.params.landmarks}
                  photos={props.route.params.photos}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Loyalty">
  {(props) => (
    <LoyaltyScreen
      {...props}
      idToken={idToken!}
      // Note: route.params might be undefined if you click from Home
      salonId={props.route?.params?.salonId} 
    />
  )}
</Stack.Screen>
          </>
        ) : (
          <Stack.Screen name="Login">
            {() => <LoginScreen onLoginSuccess={onLoginSuccess} />}
          </Stack.Screen>
        
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}