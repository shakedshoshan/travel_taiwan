// Authentic Taiwan main island outline in [lat, lng] clockwise order starting from the northern tip (Fuguijiao)
export const TAIWAN_COASTLINE_LAT_LNG: ReadonlyArray<readonly [number, number]> = [
  // North tip & Keelung coast
  [25.298, 121.536],
  [25.285, 121.615],
  [25.212, 121.692],
  [25.155, 121.775],
  [25.128, 121.918],
  // Northeast Cape (Sandiaojiao)
  [25.008, 122.006],
  [24.945, 121.925],
  // Yilan Bay (Lanyang Plain)
  [24.842, 121.838],
  [24.702, 121.842],
  [24.595, 121.868],
  // Su'ao & Qingshui Cliffs
  [24.455, 121.815],
  [24.265, 121.702],
  [24.122, 121.648],
  // Hualien coast
  [23.975, 121.622],
  [23.815, 121.568],
  [23.605, 121.525],
  [23.455, 121.498],
  // Chenggong / Sanxiantai / Dulan
  [23.225, 121.418],
  [23.095, 121.375],
  [22.905, 121.258],
  // Taitung & South-East coast
  [22.748, 121.158],
  [22.585, 121.022],
  [22.395, 120.912],
  [22.215, 120.895],
  // Kenting / Eluanbi (Southernmost Cape)
  [22.045, 120.885],
  [21.902, 120.852],
  [21.925, 120.742],
  [22.055, 120.695],
  // Fangliao / Donggang / Pingtung coast
  [22.265, 120.642],
  [22.435, 120.478],
  [22.525, 120.382],
  // Kaohsiung & Tainan coast
  [22.625, 120.258],
  [22.795, 120.195],
  [22.995, 120.135],
  [23.145, 120.078],
  // Chiayi & Yunlin coast (Waisanding Sandbar area)
  [23.365, 120.118],
  [23.545, 120.135],
  [23.765, 120.175],
  // Changhua & Taichung coast
  [23.965, 120.295],
  [24.135, 120.422],
  [24.285, 120.512],
  [24.435, 120.608],
  // Miaoli & Hsinchu coast
  [24.615, 120.735],
  [24.795, 120.895],
  [24.915, 120.968],
  // Taoyuan & Danshui (Northwest coast)
  [25.048, 121.078],
  [25.125, 121.245],
  [25.195, 121.405],
  [25.272, 121.475],
] as const;

// Major mountain massifs of the Central Mountain Range (Chungyang Shanmo), Xueshan, and Yushan
export interface MountainPeakNode {
  nameEn: string;
  nameHe: string;
  lat: number;
  lng: number;
  height: number; // Normalized 0..1 peak weight
  radiusLat: number;
  radiusLng: number;
}

export const CENTRAL_MOUNTAIN_PEAKS: ReadonlyArray<MountainPeakNode> = [
  {
    nameEn: "Yangmingshan",
    nameHe: "יאנגמינגשאן",
    lat: 25.17,
    lng: 121.55,
    height: 0.36,
    radiusLat: 0.14,
    radiusLng: 0.14,
  },
  {
    nameEn: "Xueshan (Snow Mountain)",
    nameHe: "שואשאן",
    lat: 24.383,
    lng: 121.23,
    height: 0.88,
    radiusLat: 0.36,
    radiusLng: 0.24,
  },
  {
    nameEn: "Nanhu & Taroko High Ridge",
    nameHe: "רכס טארוקו ונאנהו",
    lat: 24.36,
    lng: 121.44,
    height: 0.84,
    radiusLat: 0.34,
    radiusLng: 0.2,
  },
  {
    nameEn: "Hehuanshan & Qilai",
    nameHe: "ההואנשאן",
    lat: 24.14,
    lng: 121.28,
    height: 0.92,
    radiusLat: 0.35,
    radiusLng: 0.22,
  },
  {
    nameEn: "Sun Moon Basin Rim",
    nameHe: "הרי נאנטואו",
    lat: 23.82,
    lng: 121.12,
    height: 0.78,
    radiusLat: 0.32,
    radiusLng: 0.22,
  },
  {
    nameEn: "Yushan (Jade Mountain 3,952m)",
    nameHe: "יושאן (הר הירקן)",
    lat: 23.47,
    lng: 120.957,
    height: 1.0,
    radiusLat: 0.38,
    radiusLng: 0.25,
  },
  {
    nameEn: "Alishan Cloud Forest",
    nameHe: "רכס אלישאן",
    lat: 23.51,
    lng: 120.81,
    height: 0.68,
    radiusLat: 0.24,
    radiusLng: 0.18,
  },
  {
    nameEn: "Xiuguluan & East Rift Ridge",
    nameHe: "רכס חואליאן-טאיטונג",
    lat: 23.25,
    lng: 121.08,
    height: 0.82,
    radiusLat: 0.36,
    radiusLng: 0.2,
  },
  {
    nameEn: "Beidawushan (Southern Ridge)",
    nameHe: "ביידאוושאן",
    lat: 22.62,
    lng: 120.75,
    height: 0.66,
    radiusLat: 0.35,
    radiusLng: 0.18,
  },
  {
    nameEn: "Hengchun Peninsula Hills",
    nameHe: "גבעות קנטינג",
    lat: 22.12,
    lng: 120.78,
    height: 0.28,
    radiusLat: 0.24,
    radiusLng: 0.14,
  },
];
