import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
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

export type RootStackParamList = {
  Login: undefined;
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
  Mirror: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type Props = {
  user: AuthUser | null;
  idToken: string | null;
  onLoginSuccess: (user: AuthUser, idToken: string) => void;
  onLogout: () => void;
};

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
            <Stack.Screen name="Home">
              {({ navigation }) => (
                <HomeScreen
                  user={user}
                  idToken={idToken}
                  onLogout={onLogout}
                  onBrowseSalons={() => navigation.navigate("SalonList")}
                  onBrowseAppointments={() =>
                    navigation.navigate("Appointments")
                  }
                />
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
