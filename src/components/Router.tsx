import {useEffect,useState} from 'react'
import {LandingPage} from './LandingPage'
import {SimulatorPage} from './SimulatorPage'
import {ScenarioLab} from './ScenarioPanel'
import {AnalyticsPage} from './AnalyticsPage'
import {FleetPage} from './FleetPage'
import {DataPage} from './DataPage'
import {ProviderPanel} from './ProviderPanel'
import '../styles/app.css'
export function Router(){const [path,setPath]=useState(window.location.pathname||'/');const go=(p:string)=>{history.pushState({},'',p);setPath(p)};useEffect(()=>{const onPop=()=>setPath(window.location.pathname);window.addEventListener('popstate',onPop);return()=>window.removeEventListener('popstate',onPop)},[]);if(path==='/')return <LandingPage go={go}/>;if(path==='/simulator')return <SimulatorPage go={go}/>;if(path==='/scenarios')return <><div className="subpage-shell"><button className="subpage-back" onClick={()=>go('/simulator')}>← Return to twin</button><ScenarioLab go={go}/></div></>;if(path==='/analytics')return <><div className="subpage-shell"><button className="subpage-back" onClick={()=>go('/simulator')}>← Return to twin</button><AnalyticsPage/></div></>;if(path==='/fleet')return <><div className="subpage-shell"><button className="subpage-back" onClick={()=>go('/simulator')}>← Return to twin</button><FleetPage/></div></>;if(path==='/data')return <><div className="subpage-shell"><button className="subpage-back" onClick={()=>go('/simulator')}>← Return to twin</button><DataPage/></div></>;if(path==='/providers')return <div className="provider-page"><button className="subpage-back" onClick={()=>go('/')}>← Back</button><ProviderPanel onClose={()=>go('/')}/></div>;return <LandingPage go={go}/>
}
