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
                  onLogout={onLogout}
                  onBrowseSalons={() => navigation.navigate("SalonList")}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="SalonList" component={SalonListScreen} />
            <Stack.Screen name="SalonDetail" component={SalonDetailScreen} />
            <Stack.Screen name="BookingServices" component={BookingServicesScreen} />
            <Stack.Screen name="BookingDateTime" component={BookingDateTimeScreen} />
            <Stack.Screen name="BookingStylist" component={BookingStylistScreen} />
            <Stack.Screen name="BookingSummary">
              {(props) => <BookingSummaryScreen {...props} idToken={idToken!} />}
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