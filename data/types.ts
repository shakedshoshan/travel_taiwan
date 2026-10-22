export type CityId = 'taipei'|'new-taipei'|'keelung'|'yilan'|'taoyuan'|'hsinchu'|'miaoli'|'taichung'|'changhua'|'nantou'|'sun-moon-lake'|'chiayi'|'alishan'|'tainan'|'kaohsiung'|'pingtung'|'hualien'|'taitung';
interface Located { cityId: CityId; city: string; lat: number; lng: number; approxLocation: boolean; }
export interface City { id: CityId; nameHe: string; nameEn: string; lat: number; lng: number; onRoute: boolean; routeOrder: number[] | null; dates: string[]; days: number; }
export interface Attraction extends Located { id: string; name: string; nameZh: string | null; description: string; importance: number; isNature: boolean; }
export type FoodType = 'market'|'cheap'|'michelin-bib'|'hidden-local';
export interface Food extends Located { id: string; name: string; nameZh: string | null; typeHe: string; type: FoodType; description: string; hours: string | null; importance: number; priceText: string | null; priceMin: number | null; priceMax: number | null; priceUnit: 'NT$ per person'; hoursVerified: boolean; priceVerified: boolean; verified: boolean; }
export type HotelTier = 'cheap'|'quality'|'splurge';
export interface Hotel extends Located { id: string; name: string; nameZh: string | null; tierHe: string; tier: HotelTier; priceText: string; priceMin: number | null; priceMax: number | null; priceUnit: 'NT$ per night'; description: string; source: string | null; verified: boolean; }
export interface RouteLeg { order: number; id: string; focus: string; cityId: CityId; days: number; dates: string; anchor: string; notes: string | null; }
export interface AuditNote { topic: string; status: string; finding: string; }
export interface RouteData { legs: RouteLeg[]; audit: AuditNote[]; }
