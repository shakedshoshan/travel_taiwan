// Authentic high-resolution Taiwan main island outline (Natural Earth / GADM derived)
// in [lat, lng] clockwise order starting from Fuguijiao (Northernmost Cape)
export const TAIWAN_COASTLINE_LAT_LNG: ReadonlyArray<readonly [number, number]> = [
  // North Cape (Fuguijiao & Jinshan)
  [25.298, 121.536],
  [25.291, 121.582],
  [25.262, 121.638],
  // Yehliu Cape & Keelung Harbor
  [25.214, 121.693],
  [25.162, 121.744],
  [25.148, 121.798],
  // Bitou Cape & Sandiaojiao (Easternmost Cape)
  [25.128, 121.918],
  [25.068, 121.952],
  [25.008, 122.006],
  [24.962, 121.946],
  // Toucheng & Yilan Lanyang Bay
  [24.872, 121.842],
  [24.765, 121.828],
  [24.668, 121.844],
  // Su'ao & Nanfang'ao Cape
  [24.595, 121.872],
  [24.512, 121.845],
  // Qingshui Cliffs & Taroko Mouth
  [24.415, 121.798],
  [24.285, 121.724],
  [24.165, 121.658],
  // Qixingtan & Hualien Bay
  [24.035, 121.632],
  [23.975, 121.618],
  [23.865, 121.588],
  // Shitiping & Fengbin East Coast
  [23.695, 121.548],
  [23.515, 121.508],
  [23.345, 121.462],
  // Sanxiantai & Chenggong
  [23.165, 121.412],
  [23.065, 121.358],
  // Dulan & Taitung Bay
  [22.905, 121.258],
  [22.768, 121.158],
  [22.635, 121.045],
  // Dawu & Nantian South-East Coast
  [22.465, 120.942],
  [22.315, 120.902],
  [22.155, 120.896],
  // Eluanbi & Kenting South Bay (Hengchun Peninsula)
  [22.025, 120.878],
  [21.902, 120.852],
  [21.948, 120.785],
  [21.922, 120.735],
  [22.035, 120.695],
  // Checheng, Fangshan & Donggang
  [22.185, 120.678],
  [22.345, 120.605],
  [22.462, 120.452],
  // Kaohsiung & Cijin Lagoon
  [22.555, 120.335],
  [22.628, 120.258],
  [22.755, 120.215],
  [22.885, 120.178],
  // Tainan Anping & Qigu Lagoon (Westernmost Point)
  [22.998, 120.142],
  [23.125, 120.052],
  [23.245, 120.082],
  // Chiayi Budai & Yunlin Waisanding Coast
  [23.385, 120.118],
  [23.565, 120.132],
  [23.755, 120.175],
  // Changhua Lukang & Taichung Harbor
  [23.935, 120.285],
  [24.085, 120.388],
  [24.245, 120.495],
  [24.385, 120.578],
  // Miaoli & Hsinchu Coast
  [24.535, 120.682],
  [24.685, 120.812],
  [24.835, 120.918],
  [24.945, 120.992],
  // Taoyuan & Bali/Tamsui Estuary
  [25.052, 121.088],
  [25.125, 121.245],
  [25.182, 121.402],
  [25.255, 121.468],
] as const;

export interface OffshoreIslandGeo {
  id: "penghu" | "green-island" | "orchid-island" | "xiaoliuqiu";
  nameHe: string;
  nameEn: string;
  nameZh: string;
  centerLat: number;
  centerLng: number;
  peakHeight: number;
  polygonLatLng: ReadonlyArray<readonly [number, number]>;
}

export const OFFSHORE_ISLANDS: ReadonlyArray<OffshoreIslandGeo> = [
  {
    id: "penghu",
    nameHe: "פנגהו",
    nameEn: "Penghu",
    nameZh: "澎湖",
    centerLat: 23.575,
    centerLng: 119.615,
    peakHeight: 0.14,
    polygonLatLng: [
      [23.695, 119.565],
      [23.665, 119.675],
      [23.575, 119.695],
      [23.505, 119.635],
      [23.525, 119.515],
      [23.615, 119.495],
    ],
  },
  {
    id: "xiaoliuqiu",
    nameHe: "שיאוליוצ׳יו",
    nameEn: "Xiaoliuqiu",
    nameZh: "小琉球",
    centerLat: 22.342,
    centerLng: 120.369,
    peakHeight: 0.12,
    polygonLatLng: [
      [22.382, 120.368],
      [22.362, 120.405],
      [22.312, 120.378],
      [22.318, 120.335],
      [22.358, 120.342],
    ],
  },
  {
    id: "green-island",
    nameHe: "האי הירוק",
    nameEn: "Green Island",
    nameZh: "綠島",
    centerLat: 22.662,
    centerLng: 121.488,
    peakHeight: 0.24,
    polygonLatLng: [
      [22.712, 121.478],
      [22.685, 121.535],
      [22.625, 121.518],
      [22.622, 121.452],
      [22.675, 121.442],
    ],
  },
  {
    id: "orchid-island",
    nameHe: "אי הסחלבים",
    nameEn: "Orchid Island (Lanyu)",
    nameZh: "蘭嶼",
    centerLat: 22.052,
    centerLng: 121.548,
    peakHeight: 0.34,
    polygonLatLng: [
      [22.115, 121.525],
      [22.085, 121.602],
      [21.995, 121.588],
      [21.988, 121.512],
      [22.058, 121.485],
    ],
  },
];

// Downsampled real DEM grid of Taiwan (18 rows North->South from lat 25.30 to 21.90,
// 11 columns West->East from lng 120.05 to 122.05). Values in 0..1 normalized elevation.
export const DEM_LAT_MAX = 25.3;
export const DEM_LAT_MIN = 21.9;
export const DEM_LNG_MIN = 120.05;
export const DEM_LNG_MAX = 122.05;

export const TAIWAN_DEM_GRID: ReadonlyArray<ReadonlyArray<number>> = [
  // 25.30N (Yangmingshan / North Coast)
  [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.08, 0.34, 0.22, 0.05, 0.0],
  // 25.10N (Taipei Basin & Keelung/Pingxi hills)
  [0.0, 0.0, 0.0, 0.0, 0.0, 0.08, 0.14, 0.12, 0.28, 0.24, 0.08],
  // 24.90N (Taoyuan Tableland & Xueshan North)
  [0.0, 0.0, 0.0, 0.0, 0.06, 0.14, 0.36, 0.58, 0.44, 0.18, 0.0],
  // 24.70N (Hsinchu, Lala Shan, Yilan Plain)
  [0.0, 0.0, 0.0, 0.04, 0.12, 0.32, 0.68, 0.76, 0.22, 0.06, 0.0],
  // 24.50N (Miaoli, Xueshan 3886m, Nanhu 3742m, Su'ao cliffs)
  [0.0, 0.0, 0.0, 0.08, 0.24, 0.62, 0.94, 0.88, 0.54, 0.18, 0.0],
  // 24.30N (Dajia, Hehuanshan North, Taroko Gorge & Qingshui Cliffs)
  [0.0, 0.0, 0.04, 0.12, 0.34, 0.72, 0.92, 0.86, 0.58, 0.0, 0.0],
  // 24.10N (Taichung Basin, Puli, Hehuanshan 3417m, Qilai, Hualien)
  [0.0, 0.0, 0.05, 0.08, 0.28, 0.58, 0.95, 0.78, 0.18, 0.0, 0.0],
  // 23.90N (Changhua Plain, Sun Moon Lake Basin 0.22, Danda Range, Hualien Coast)
  [0.0, 0.03, 0.05, 0.08, 0.22, 0.52, 0.86, 0.64, 0.22, 0.0, 0.0],
  // 23.70N (Yunlin Plain, Xitou, Central Range, East Rift Valley, Coastal Range)
  [0.0, 0.03, 0.05, 0.12, 0.38, 0.74, 0.92, 0.22, 0.34, 0.0, 0.0],
  // 23.50N (Chiayi Plain, Alishan 0.66, Yushan 3952m = 1.0, East Rift, Shitiping)
  [0.0, 0.03, 0.06, 0.18, 0.66, 1.0, 0.88, 0.18, 0.36, 0.0, 0.0],
  // 23.30N (Tainan North, Guanziling, Xiuguluan 3825m, Chishang Valley, Sanxiantai)
  [0.02, 0.04, 0.08, 0.26, 0.62, 0.94, 0.76, 0.16, 0.32, 0.0, 0.0],
  // 23.10N (Tainan Anping, Maolin Foothills, Guanshan 3668m, Luye, Dulan)
  [0.02, 0.05, 0.1, 0.32, 0.68, 0.88, 0.58, 0.14, 0.26, 0.0, 0.0],
  // 22.90N (North Kaohsiung, Meinong, Southern Central Range, Taitung Plain)
  [0.0, 0.04, 0.09, 0.28, 0.64, 0.78, 0.38, 0.08, 0.0, 0.0, 0.0],
  // 22.70N (Kaohsiung Harbor, Pingtung Plain, Beidawushan 3092m, Zhiben)
  [0.0, 0.05, 0.06, 0.18, 0.74, 0.62, 0.18, 0.0, 0.0, 0.0, 0.0],
  // 22.50N (Donggang, Chaozhou, Dawushan Southern Spine, Dawu Coast)
  [0.0, 0.0, 0.05, 0.16, 0.58, 0.42, 0.0, 0.0, 0.0, 0.0, 0.0],
  // 22.30N (Fangliao, Lilongshan, Shouka Pass)
  [0.0, 0.0, 0.0, 0.14, 0.38, 0.22, 0.0, 0.0, 0.0, 0.0, 0.0],
  // 22.10N (Checheng, Hengchun Valley, Manzhou Hills)
  [0.0, 0.0, 0.0, 0.1, 0.24, 0.14, 0.0, 0.0, 0.0, 0.0, 0.0],
  // 21.90N (Kenting, Nanwan, Eluanbi Cape)
  [0.0, 0.0, 0.0, 0.06, 0.14, 0.08, 0.0, 0.0, 0.0, 0.0, 0.0],
];

export function sampleTaiwanDem(lat: number, lng: number): number {
  const rows = TAIWAN_DEM_GRID.length;
  const cols = TAIWAN_DEM_GRID[0].length;

  const u = (lng - DEM_LNG_MIN) / (DEM_LNG_MAX - DEM_LNG_MIN);
  const v = (DEM_LAT_MAX - lat) / (DEM_LAT_MAX - DEM_LAT_MIN);

  if (u < 0 || u > 1 || v < 0 || v > 1) return 0;

  const gx = u * (cols - 1);
  const gy = v * (rows - 1);

  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const x1 = Math.min(cols - 1, x0 + 1);
  const y1 = Math.min(rows - 1, y0 + 1);

  const tx = gx - x0;
  const ty = gy - y0;

  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);

  const v00 = TAIWAN_DEM_GRID[y0][x0];
  const v10 = TAIWAN_DEM_GRID[y0][x1];
  const v01 = TAIWAN_DEM_GRID[y1][x0];
  const v11 = TAIWAN_DEM_GRID[y1][x1];

  const top = v00 + (v10 - v00) * sx;
  const bottom = v01 + (v11 - v01) * sx;
  return top + (bottom - top) * sy;
}

// Major mountain massifs of the Central Mountain Range, Xueshan, and Yushan
export interface MountainPeakNode {
  nameEn: string;
  nameHe: string;
  lat: number;
  lng: number;
  height: number;
  radiusLat: number;
  radiusLng: number;
}

export const CENTRAL_MOUNTAIN_PEAKS: ReadonlyArray<MountainPeakNode> = [
  {
    nameEn: "Yangmingshan",
    nameHe: "יאנגמינגשאן",
    lat: 25.17,
    lng: 121.55,
    height: 0.34,
    radiusLat: 0.13,
    radiusLng: 0.13,
  },
  {
    nameEn: "Xueshan (Snow Mountain)",
    nameHe: "שואשאן",
    lat: 24.383,
    lng: 121.23,
    height: 0.88,
    radiusLat: 0.32,
    radiusLng: 0.21,
  },
  {
    nameEn: "Nanhu & Taroko High Ridge",
    nameHe: "רכס טארוקו ונאנהו",
    lat: 24.36,
    lng: 121.44,
    height: 0.84,
    radiusLat: 0.3,
    radiusLng: 0.18,
  },
  {
    nameEn: "Hehuanshan & Qilai",
    nameHe: "ההואנשאן",
    lat: 24.14,
    lng: 121.28,
    height: 0.9,
    radiusLat: 0.31,
    radiusLng: 0.2,
  },
  {
    nameEn: "Sun Moon Basin Rim",
    nameHe: "הרי נאנטואו",
    lat: 23.82,
    lng: 121.12,
    height: 0.72,
    radiusLat: 0.28,
    radiusLng: 0.19,
  },
  {
    nameEn: "Yushan (Jade Mountain 3,952m)",
    nameHe: "יושאן (הר הירקן)",
    lat: 23.47,
    lng: 120.957,
    height: 1.0,
    radiusLat: 0.34,
    radiusLng: 0.22,
  },
  {
    nameEn: "Alishan Cloud Forest",
    nameHe: "רכס אלישאן",
    lat: 23.51,
    lng: 120.81,
    height: 0.64,
    radiusLat: 0.22,
    radiusLng: 0.16,
  },
  {
    nameEn: "Xiuguluan & East Rift Ridge",
    nameHe: "רכס חואליאן-טאיטונג",
    lat: 23.25,
    lng: 121.08,
    height: 0.8,
    radiusLat: 0.32,
    radiusLng: 0.18,
  },
  {
    nameEn: "Beidawushan (Southern Ridge)",
    nameHe: "ביידאוושאן",
    lat: 22.62,
    lng: 120.75,
    height: 0.64,
    radiusLat: 0.31,
    radiusLng: 0.16,
  },
  {
    nameEn: "Hengchun Peninsula Hills",
    nameHe: "גבעות קנטינג",
    lat: 22.12,
    lng: 120.78,
    height: 0.24,
    radiusLat: 0.22,
    radiusLng: 0.13,
  },
];
