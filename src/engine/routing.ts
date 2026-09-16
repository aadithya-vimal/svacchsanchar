import {binPosition,TRUCK_COUNT} from '../data/model'
import {visibleCriticalBins} from './sim'
import type {Truck} from '../data/types'

export interface Plan{truckId:number;stops:number[];km:number;minutes:number}
const dist=(a:{lat:number,lon:number},b:{lat:number,lon:number})=>Math.sqrt(((a.lat-b.lat)*111)**2+((a.lon-b.lon)*102)**2)

export function optimize(fill:Float32Array,trucks:Truck[]):Plan[]{
  const candidates=visibleCriticalBins(fill,Math.min(3200,Math.max(800,trucks.length*7)))
  const remaining=candidates.map(id=>({id,score:fill[id]})).sort((a,b)=>b.score-a.score)
  const plans:Plan[]=[]
  for(const truck of trucks){
    let current={lat:truck.lat,lon:truck.lon}, loadLeft=Math.max(60,truck.capacityKg-truck.loadKg), km=0
    const stops:number[]=[]
    while(remaining.length && stops.length<8 && loadLeft>80){
      let best=-1,bestScore=1e9
      for(let i=0;i<Math.min(remaining.length,320);i++){
        const bin=remaining[i], p=binPosition(bin.id), d=dist(current,p), urgency=fill[bin.id]/100
        const score=d*(1.18-urgency*.34)+(loadLeft<240?6:0)
        if(score<bestScore){bestScore=score;best=i}
      }
      if(best<0)break
      const chosen=remaining.splice(best,1)[0], p=binPosition(chosen.id), d=dist(current,p)
      km+=d;loadLeft-=Math.min(140,fill[chosen.id]*12*.18);stops.push(chosen.id);current=p
    }
    plans.push({truckId:truck.id,stops,km:Number((km+3.2).toFixed(1)),minutes:Math.round((km+3.2)*3.5+10)})
  }
  return plans
}

export function fixedBaseline(fill:Float32Array,trucks:Truck[]):Plan[]{
  const candidates=visibleCriticalBins(fill,2400);const chunk=Math.ceil(candidates.length/Math.max(1,trucks.length));const out:Plan[]=[]
  trucks.forEach((t,i)=>{const stops=candidates.slice(i*chunk,(i+1)*chunk).slice(0,6);let km=3.5;let cur={lat:t.lat,lon:t.lon};for(const id of stops){const p=binPosition(id);km+=dist(cur,p);cur=p}out.push({truckId:t.id,stops,km:Number(km.toFixed(1)),minutes:Math.round(km*4.4+12)})})
  return out
}
