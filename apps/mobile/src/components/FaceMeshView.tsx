// /**
//  * FaceMeshView.tsx
//  * Renders a stylised 2-D face silhouette (derived from saved landmarks)
//  * with a switchable hair overlay using an inline WebView.
//  *
//  * Props:
//  *   landmarks  — flattened [x,y,z, x,y,z …] float array (468 × 3)
//  *   faceShape  — detected shape string
//  *   hairStyle  — HairStyle3D to overlay (or null for bare face)
//  *   hairColor  — hex color string chosen by user
//  */

// import { StyleSheet, View } from "react-native";
// import WebView from "react-native-webview";
// import { HairStyle3D } from "../ar/hairStyles3D";

// interface Props {
//   landmarks: number[];          // 468*3 floats
//   faceShape: string;
//   hairStyle: HairStyle3D | null;
//   hairColor?: string;
//   width?: number;
//   height?: number;
// }

// function buildHtml(
//   landmarks: number[],
//   hairStyle: HairStyle3D | null,
//   hairColor: string,
//   width: number,
//   height: number
// ): string {
//   // Build a representative face outline from key landmark indices
//   // We map normalised 0-1 coords → pixel space
//   const CANVAS_W = width;
//   const CANVAS_H = height;

//   // Key outline landmark indices (simplified face contour from MediaPipe)
//   const CONTOUR_IDX = [
//     10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
//     397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
//     172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10
//   ];

//   const pts = CONTOUR_IDX.map((i) => {
//     const lx = landmarks[i * 3]     ?? 0.5;
//     const ly = landmarks[i * 3 + 1] ?? 0.5;
//     return `${(lx * CANVAS_W).toFixed(1)},${(ly * CANVAS_H).toFixed(1)}`;
//   }).join(" ");

//   const hairSvg = hairStyle
//     ? `<path d="${hairStyle.svgPath}" fill="${hairColor}" opacity="0.88"
//          transform="scale(${CANVAS_W / 240}, ${CANVAS_H / 300}) translate(0, -10)"/>`
//     : "";

//   return `<!DOCTYPE html>
// <html>
// <head>
// <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
// <style>
//   * { margin: 0; padding: 0; box-sizing: border-box; }
//   body { background: #1a1a2e; display: flex; align-items: center; justify-content: center;
//          width: ${CANVAS_W}px; height: ${CANVAS_H}px; overflow: hidden; }
//   svg  { display: block; }
// </style>
// </head>
// <body>
// <svg width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}"
//      xmlns="http://www.w3.org/2000/svg">

//   <!-- Ambient glow -->
//   <defs>
//     <radialGradient id="glow" cx="50%" cy="40%" r="55%">
//       <stop offset="0%"   stop-color="#ffe0c8" stop-opacity="0.18"/>
//       <stop offset="100%" stop-color="#1a1a2e" stop-opacity="0"/>
//     </radialGradient>
//     <filter id="blur2">
//       <feGaussianBlur stdDeviation="2"/>
//     </filter>
//   </defs>
//   <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="url(#glow)"/>

//   <!-- Hair overlay (behind face) -->
//   ${hairSvg}

//   <!-- Face outline from landmarks -->
//   <polygon
//     points="${pts}"
//     fill="#f5c5a3"
//     stroke="#d4956a"
//     stroke-width="1.5"
//     opacity="0.92"
//   />

//   <!-- Eyes — use landmark 33 (L) and 263 (R) -->
//   <ellipse cx="${((landmarks[33*3] ?? 0.35) * CANVAS_W).toFixed(1)}"
//            cy="${((landmarks[33*3+1] ?? 0.42) * CANVAS_H).toFixed(1)}"
//            rx="8" ry="5" fill="#3d2b1f" opacity="0.85"/>
//   <ellipse cx="${((landmarks[263*3] ?? 0.65) * CANVAS_W).toFixed(1)}"
//            cy="${((landmarks[263*3+1] ?? 0.42) * CANVAS_H).toFixed(1)}"
//            rx="8" ry="5" fill="#3d2b1f" opacity="0.85"/>

//   <!-- Nose bridge — landmark 1 -->
//   <ellipse cx="${((landmarks[1*3] ?? 0.5) * CANVAS_W).toFixed(1)}"
//            cy="${((landmarks[1*3+1] ?? 0.55) * CANVAS_H).toFixed(1)}"
//            rx="4" ry="3" fill="#d4956a" opacity="0.5"/>

//   <!-- Lips — landmark 13 (upper) 14 (lower) -->
//   <ellipse cx="${((landmarks[13*3] ?? 0.5) * CANVAS_W).toFixed(1)}"
//            cy="${((landmarks[13*3+1] ?? 0.68) * CANVAS_H).toFixed(1)}"
//            rx="14" ry="6" fill="#c17878" opacity="0.75"/>
// </svg>
// </body>
// </html>`;
// }

// export default function FaceMeshView({
//   landmarks,
//   faceShape,
//   hairStyle,
//   hairColor = "#4a3728",
//   width = 280,
//   height = 340,
// }: Props) {
//   const html = buildHtml(landmarks, hairStyle, hairColor, width, height);

//   return (
//     <View style={[styles.container, { width, height }]}>
//       <WebView
//         source={{ html }}
//         style={styles.webview}
//         scrollEnabled={false}
//         showsHorizontalScrollIndicator={false}
//         showsVerticalScrollIndicator={false}
//         originWhitelist={["*"]}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { borderRadius: 20, overflow: "hidden" },
//   webview: { flex: 1, backgroundColor: "transparent" },
// });