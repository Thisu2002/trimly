// //Not Used
// import { ActivityIndicator, StyleSheet, View } from "react-native";
// import { WebView } from "react-native-webview";
// import { NativeStackScreenProps } from "@react-navigation/native-stack";
// import { RootStackParamList } from "../navigation/RootNavigator";
// import { colors } from "../theme/colors";
// import { useState } from "react";

// type Props = NativeStackScreenProps<RootStackParamList, "Payment">;

// export default function PaymentScreen({ route, navigation }: Props) {
//   const { paymentData, appointmentId } = route.params;
//   const [loading, setLoading] = useState(true);

//   // PayHere sandbox URL
//   const PAYHERE_URL = "https://sandbox.payhere.lk/pay/checkout";

//   const html = `
//     <html>
//       <body onload="document.forms[0].submit()">
//         <form method="post" action="${PAYHERE_URL}">
//           ${Object.entries(paymentData)
//             .map(
//               ([key, value]) =>
//                 `<input type="hidden" name="${key}" value="${value}" />`
//             )
//             .join("")}
//         </form>
//       </body>
//     </html>
//   `;

//   return (
//     <View style={{ flex: 1, backgroundColor: colors.background }}>
//       {loading && (
//         <ActivityIndicator
//           size="large"
//           color={colors.primaryLight}
//           style={{ position: "absolute", top: "50%", alignSelf: "center" }}
//         />
//       )}

//       <WebView
//         originWhitelist={["*"]}
//         source={{ html }}
//         onLoadEnd={() => setLoading(false)}
//         onNavigationStateChange={(navState) => {
//           if (navState.url.includes("payment-success")) {
//             navigation.replace("PaymentSuccess", { appointmentId });
//           }

//           if (navState.url.includes("payment-cancel")) {
//             navigation.goBack();
//           }
//         }}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({});