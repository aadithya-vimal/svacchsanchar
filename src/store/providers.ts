import {create} from 'zustand'
import type {ProviderConfig} from '../data/types'
const read=(k:string)=>{try{return localStorage.getItem(k)||''}catch{return ''}}
const write=(k:string,v:string)=>{try{localStorage.setItem(k,v)}catch{}}
export const useProviders=create<ProviderConfig & {
  set:(key:keyof ProviderConfig,v:string)=>void;clear:()=>void
}>((set)=>({
  googleMapsKey:read('sv.google'),cesiumIonToken:read('sv.cesium'),mapTilerKey:read('sv.maptiler'),mapboxToken:read('sv.mapbox'),stadiaKey:read('sv.stadia'),hereApiKey:read('sv.here'),tomtomApiKey:read('sv.tomtom'),openRouteServiceKey:read('sv.ors'),
  set:(key,v)=>{const map:Record<keyof ProviderConfig,string>={googleMapsKey:'sv.google',cesiumIonToken:'sv.cesium',mapTilerKey:'sv.maptiler',mapboxToken:'sv.mapbox',stadiaKey:'sv.stadia',hereApiKey:'sv.here',tomtomApiKey:'sv.tomtom',openRouteServiceKey:'sv.ors'};write(map[key],v);set({[key]:v} as Partial<ProviderConfig>)},
  clear:()=>{for(const k of ['sv.google','sv.cesium','sv.maptiler','sv.mapbox','sv.stadia','sv.here','sv.tomtom','sv.ors'])try{localStorage.removeItem(k)}catch{};set({googleMapsKey:'',cesiumIonToken:'',mapTilerKey:'',mapboxToken:'',stadiaKey:'',hereApiKey:'',tomtomApiKey:'',openRouteServiceKey:''})}
}))
