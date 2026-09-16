export type ViewMode='2d'|'3d'
export type MapStyle='streets'|'light'|'dark'|'satellite'|'terrain'
export type ScenarioType='waste-surge'|'overflow-risk'|'truck-breakdown'|'road-closure'|'traffic-slowdown'|'sensor-failure'|'truck-overload'|'fleet-reduction'|'demand-shift'|'heavy-rain'|'combined'
export type ThemeMode='system'|'light'|'dark'
export type TruckStatus='active'|'idle'|'breakdown'|'returning'
export interface ScenarioEvent{ id:string; type:ScenarioType; title:string; startAt:number; durationHours:number; intensity:number; targetZone?:number; targetTruck?:number }
export interface Truck{ id:number; name:string; capacityKg:number; loadKg:number; status:TruckStatus; lat:number; lon:number; speedKph:number; route:number[]; routeIndex:number; segmentProgress:number }
export interface Metrics{ fixedKm:number; optimizedKm:number; fixedMinutes:number; optimizedMinutes:number; criticalBins:number; overflowRiskPct:number; fleetLoadPct:number; projectedOverflow24h:number; activeTrucks:number }
export interface ProviderConfig{ googleMapsKey:string; cesiumIonToken:string; mapTilerKey:string; mapboxToken:string; stadiaKey:string; hereApiKey:string; tomtomApiKey:string; openRouteServiceKey:string }
export interface Snapshot{ t:number; fill:Float32Array; truckState:Truck[]; closedRoads:Set<string> }
