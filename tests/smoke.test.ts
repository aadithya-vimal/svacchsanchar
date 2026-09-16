import {describe,it,expect} from 'vitest'
import {season,seasonMultiplier,timeMultiplier} from '../src/engine/sim'
describe('simulation model',()=>{it('classifies seasons',()=>{expect(season(7)).toBe('monsoon');expect(season(12)).toBe('winter')});it('models peak periods',()=>{expect(timeMultiplier(18)).toBeGreaterThan(timeMultiplier(2))});it('models monsoon lift',()=>{expect(seasonMultiplier(7)).toBeGreaterThan(seasonMultiplier(12))})})
