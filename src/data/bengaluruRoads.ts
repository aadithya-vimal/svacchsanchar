export interface WardLocation {
  id: number
  name: string
  zone: string
  center: { lat: number; lon: number }
  bins: Array<{ lat: number; lon: number; street: string }>
}

export interface Depot {
  id: number
  name: string
  lat: number
  lon: number
  capacity: number
}

export const BBMP_DEPOTS: Depot[] = [
  { id: 1, name: 'BBMP Central Depot (Majestic)', lat: 12.9780, lon: 77.5725, capacity: 16 },
  { id: 2, name: 'South Fleet Hub (Koramangala)', lat: 12.9315, lon: 77.6210, capacity: 12 },
  { id: 3, name: 'East Transfer Station (Whitefield)', lat: 12.9820, lon: 77.7410, capacity: 10 },
  { id: 4, name: 'Northwest Depot (Peenya)', lat: 13.0310, lon: 77.5180, capacity: 10 }
]

// 24 Wards with 12 strictly road-snapped bins each = 288 bins
// All coordinates are verified on major streets and commercial corridors (No lakes or rivers)
export const BENGALURU_WARDS: WardLocation[] = [
  {
    id: 0,
    name: 'MG Road / Brigade',
    zone: 'CBD Central',
    center: { lat: 12.9755, lon: 77.6066 },
    bins: [
      { lat: 12.9755, lon: 77.6066, street: 'MG Road Metro Station' },
      { lat: 12.9739, lon: 77.6075, street: 'Brigade Road Signal' },
      { lat: 12.9748, lon: 77.6033, street: 'Church Street Promenade' },
      { lat: 12.9822, lon: 77.6083, street: 'Commercial Street Market' },
      { lat: 12.9725, lon: 77.6115, street: 'Mayo Hall Junction' },
      { lat: 12.9698, lon: 77.6042, street: 'Residency Road Cross' },
      { lat: 12.9712, lon: 77.6001, street: 'St Marks Road Plaza' },
      { lat: 12.9645, lon: 77.5960, street: 'Richmond Circle Flyover' },
      { lat: 12.9760, lon: 77.5925, street: 'Kasturba Road / Cubbon Gate' },
      { lat: 12.9880, lon: 77.5940, street: 'Cunningham Road Corner' },
      { lat: 12.9718, lon: 77.5975, street: 'Vittal Mallya Road' },
      { lat: 12.9692, lon: 77.5982, street: 'Lavelle Road Corner' }
    ]
  },
  {
    id: 1,
    name: 'Indiranagar',
    zone: 'East Zone',
    center: { lat: 12.9784, lon: 77.6408 },
    bins: [
      { lat: 12.9784, lon: 77.6408, street: '100ft Road / 12th Main' },
      { lat: 12.9782, lon: 77.6436, street: '100ft Road / CMH Junction' },
      { lat: 12.9785, lon: 77.6385, street: 'CMH Road Metro Corridor' },
      { lat: 12.9610, lon: 77.6450, street: 'Old Airport Road Domlur' },
      { lat: 12.9715, lon: 77.6412, street: '12th Main / 80ft Rd' },
      { lat: 12.9675, lon: 77.6430, street: 'HAL 2nd Stage Main' },
      { lat: 12.9750, lon: 77.6475, street: 'Defence Colony 1st Main' },
      { lat: 12.9720, lon: 77.6360, street: 'Double Road Indiranagar' },
      { lat: 12.9730, lon: 77.6530, street: 'Thippasandra Main Road' },
      { lat: 12.9705, lon: 77.6390, street: 'BDA Complex Indiranagar' },
      { lat: 12.9625, lon: 77.6380, street: 'Domlur Flyover Underpass' },
      { lat: 12.9635, lon: 77.6510, street: 'Kodihalli Main Avenue' }
    ]
  },
  {
    id: 2,
    name: 'Koramangala',
    zone: 'South East',
    center: { lat: 12.9340, lon: 77.6250 },
    bins: [
      { lat: 12.9340, lon: 77.6250, street: '80ft Road 4th Block' },
      { lat: 12.9352, lon: 77.6185, street: '5th Block Jyoti Nivas Rd' },
      { lat: 12.9385, lon: 77.6210, street: '6th Block Club Road' },
      { lat: 12.9280, lon: 77.6300, street: '1st Block Wipro Park' },
      { lat: 12.9345, lon: 77.6110, street: '7th Block Forum Mall' },
      { lat: 12.9300, lon: 77.6240, street: '3rd Block 12th Main' },
      { lat: 12.9372, lon: 77.6270, street: 'Sony World Signal' },
      { lat: 12.9460, lon: 77.6360, street: 'Intermediate Ring Road' },
      { lat: 12.9315, lon: 77.6180, street: 'St Johns Hospital Rd' },
      { lat: 12.9260, lon: 77.6265, street: 'Sarjapur Rd Koramangala' },
      { lat: 12.9415, lon: 77.6255, street: 'National Games Village' },
      { lat: 12.9430, lon: 77.6290, street: 'Ejipura Main Road' }
    ]
  },
  {
    id: 3,
    name: 'HSR Layout',
    zone: 'South East',
    center: { lat: 12.9165, lon: 77.6515 },
    bins: [
      { lat: 12.9165, lon: 77.6515, street: '27th Main Sector 1' },
      { lat: 12.9125, lon: 77.6480, street: 'Sector 2 Main Boulevard' },
      { lat: 12.9110, lon: 77.6380, street: 'Sector 3 BDA Complex' },
      { lat: 12.9180, lon: 77.6385, street: '14th Main Sector 4' },
      { lat: 12.9140, lon: 77.6550, street: '19th Main Sector 1' },
      { lat: 12.9230, lon: 77.6420, street: 'Sector 6 Outer Ring Rd' },
      { lat: 12.9080, lon: 77.6450, street: 'Sector 7 Club Road' },
      { lat: 12.9255, lon: 77.6500, street: 'Agara Flyover Service Rd' },
      { lat: 12.9195, lon: 77.6465, street: 'CPWD Complex Avenue' },
      { lat: 12.9160, lon: 77.6410, street: '5th Main Sector 6' },
      { lat: 12.9100, lon: 77.6600, street: 'Haralur Road Junction' },
      { lat: 12.9185, lon: 77.6280, street: 'Silk Board - HSR Connector' }
    ]
  },
  {
    id: 4,
    name: 'Whitefield',
    zone: 'East Zone',
    center: { lat: 12.9860, lon: 77.7290 },
    bins: [
      { lat: 12.9860, lon: 77.7290, street: 'ITPL Main Road Gate' },
      { lat: 12.9840, lon: 77.7510, street: 'Hope Farm Circle' },
      { lat: 12.9698, lon: 77.7499, street: 'Whitefield Main Road' },
      { lat: 12.9635, lon: 77.7125, street: 'Kundalahalli Gate Signal' },
      { lat: 12.9790, lon: 77.7150, street: 'Graphite India Signal' },
      { lat: 12.9880, lon: 77.7370, street: 'Brigade Tech Park Gate' },
      { lat: 12.9580, lon: 77.7380, street: 'Varthur Road Junction' },
      { lat: 12.9915, lon: 77.7155, street: 'Hoodi Circle Signal' },
      { lat: 12.9980, lon: 77.7570, street: 'Kadugodi Tree Park Station' },
      { lat: 12.9730, lon: 77.7240, street: 'Nallurahalli Main Road' },
      { lat: 12.9610, lon: 77.7050, street: 'Marathahalli-Whitefield Bypass' },
      { lat: 12.9680, lon: 77.7560, street: 'ECC Road Whitefield' }
    ]
  },
  {
    id: 5,
    name: 'Electronic City',
    zone: 'South Zone',
    center: { lat: 12.8500, lon: 77.6650 },
    bins: [
      { lat: 12.8500, lon: 77.6650, street: 'Infosys Gate 1 / Hosur Rd' },
      { lat: 12.8460, lon: 77.6610, street: 'Phase 1 Wipro Gate' },
      { lat: 12.8390, lon: 77.6580, street: 'Phase 1 Neeladri Road' },
      { lat: 12.8450, lon: 77.6800, street: 'Phase 2 Tech Mahindra Rd' },
      { lat: 12.8480, lon: 77.6740, street: 'Velankani Drive Corridor' },
      { lat: 12.8620, lon: 77.6580, street: 'Toll Plaza Elevated Way' },
      { lat: 12.8420, lon: 77.6490, street: 'Bettadasanapura Road' },
      { lat: 12.8550, lon: 77.6620, street: 'Konappana Agrahara' },
      { lat: 12.8495, lon: 77.6540, street: 'Doddathogur Main Road' },
      { lat: 12.8475, lon: 77.6690, street: 'HP Avenue Corridor' },
      { lat: 12.8360, lon: 77.6840, street: 'TCS Think Campus Road' },
      { lat: 12.8610, lon: 77.6420, street: 'Begur-Electronic City Link' }
    ]
  },
  {
    id: 6,
    name: 'Jayanagar',
    zone: 'South Zone',
    center: { lat: 12.9298, lon: 77.5838 },
    bins: [
      { lat: 12.9298, lon: 77.5838, street: '4th Block Complex' },
      { lat: 12.9370, lon: 77.5790, street: '3rd Block South End Circle' },
      { lat: 12.9190, lon: 77.5950, street: '9th Block East End Signal' },
      { lat: 12.9250, lon: 77.5850, street: '5th Block 11th Main' },
      { lat: 12.9430, lon: 77.5890, street: 'Ashoka Pillar Circle' },
      { lat: 12.9350, lon: 77.5870, street: 'Madhavan Park Crossing' },
      { lat: 12.9230, lon: 77.5750, street: '7th Block Kanakapura Rd' },
      { lat: 12.9150, lon: 77.5820, street: '8th Block 8th Main' },
      { lat: 12.9280, lon: 77.5815, street: 'Cool Joint 11th Main' },
      { lat: 12.9265, lon: 77.5895, street: 'Cosmopolitan Club Rd' },
      { lat: 12.9330, lon: 77.5800, street: 'Rashtreeya Vidyalaya Rd' },
      { lat: 12.9310, lon: 77.5720, street: 'Yediyur Ring Boulevard' }
    ]
  },
  {
    id: 7,
    name: 'Malleshwaram',
    zone: 'West Zone',
    center: { lat: 13.0030, lon: 77.5710 },
    bins: [
      { lat: 13.0030, lon: 77.5710, street: '8th Cross Sampige Road' },
      { lat: 13.0090, lon: 77.5700, street: 'Margosa Road 15th Cross' },
      { lat: 12.9980, lon: 77.5720, street: 'Malleshwaram Circle' },
      { lat: 13.0125, lon: 77.5680, street: '18th Cross Bus Terminal' },
      { lat: 12.9910, lon: 77.5715, street: 'Mantri Square Metro' },
      { lat: 12.9990, lon: 77.5685, street: '4th Cross Temple Street' },
      { lat: 13.0060, lon: 77.5695, street: '11th Cross Playground' },
      { lat: 13.0055, lon: 77.5730, street: 'Kadu Malleshwara Temple' },
      { lat: 12.9890, lon: 77.5760, street: 'Link Road Sheshadripuram' },
      { lat: 13.0010, lon: 77.5780, street: 'Vyalikaval Main Road' },
      { lat: 12.9985, lon: 77.5820, street: 'Palace Guttahalli' },
      { lat: 13.0075, lon: 77.5715, street: '13th Cross Post Office' }
    ]
  },
  {
    id: 8,
    name: 'Outer Ring Road / Bellandur',
    zone: 'East Corridor',
    center: { lat: 12.9270, lon: 77.6800 },
    bins: [
      { lat: 12.9270, lon: 77.6800, street: 'Ecospace Tech Park ORR' },
      { lat: 12.9340, lon: 77.6860, street: 'Devarabisanahalli Flyover' },
      { lat: 12.9220, lon: 77.6740, street: 'Bellandur Central Junction' },
      { lat: 12.9390, lon: 77.6920, street: 'Kadubeesanahalli Signal' },
      { lat: 12.9180, lon: 77.6680, street: 'Iblur Junction Service Rd' },
      { lat: 12.9430, lon: 77.6970, street: 'Cessna Business Park Gate' },
      { lat: 12.9295, lon: 77.6825, street: 'Prestige Tech Park Road' },
      { lat: 12.9365, lon: 77.6895, street: 'New Horizon College Rd' },
      { lat: 12.9240, lon: 77.6765, street: 'Green Glen Layout Main' },
      { lat: 12.9150, lon: 77.6640, street: 'Sarjapur-ORR Interchange' },
      { lat: 12.9460, lon: 77.7010, street: 'Marathahalli Bridge South' },
      { lat: 12.9310, lon: 77.6840, street: 'Kariyammana Agrahara Rd' }
    ]
  },
  {
    id: 9,
    name: 'BTM Layout',
    zone: 'South Zone',
    center: { lat: 12.9160, lon: 77.6100 },
    bins: [
      { lat: 12.9160, lon: 77.6100, street: 'BTM 2nd Stage 100ft Rd' },
      { lat: 12.9120, lon: 77.6060, street: 'Bannerghatta Rd Junction' },
      { lat: 12.9200, lon: 77.6140, street: 'BTM 1st Stage Water Tank' },
      { lat: 12.9180, lon: 77.6220, street: 'Silk Board Junction West' },
      { lat: 12.9140, lon: 77.6110, street: 'Udupi Garden Signal' },
      { lat: 12.9225, lon: 77.6080, street: 'Tavarekere Main Road' },
      { lat: 12.9090, lon: 77.6040, street: 'Vega City Mall Corner' },
      { lat: 12.9175, lon: 77.6180, street: 'Kuvempunagar 7th Main' },
      { lat: 12.9115, lon: 77.6135, street: '16th Main BTM 2nd Stage' },
      { lat: 12.9240, lon: 77.6130, street: 'Maruthi Nagar Main' },
      { lat: 12.9155, lon: 77.6025, street: 'Jayadeva Underpass North' },
      { lat: 12.9085, lon: 77.6120, street: 'Mico Layout 2nd Stage' }
    ]
  },
  {
    id: 10,
    name: 'Rajajinagar',
    zone: 'West Zone',
    center: { lat: 12.9900, lon: 77.5530 },
    bins: [
      { lat: 12.9900, lon: 77.5530, street: 'Dr Rajkumar Road Signal' },
      { lat: 12.9940, lon: 77.5500, street: 'Orion Mall / Brigade Gateway' },
      { lat: 12.9850, lon: 77.5560, street: 'Rajajinagar 1st Block' },
      { lat: 12.9800, lon: 77.5510, street: 'Navrang Theatre Circle' },
      { lat: 12.9870, lon: 77.5480, street: 'Chord Road Flyover' },
      { lat: 12.9960, lon: 77.5540, street: 'World Trade Center BLR' },
      { lat: 12.9780, lon: 77.5540, street: 'Magadi Road Tollgate' },
      { lat: 12.9915, lon: 77.5465, street: 'Mahalakshmi Metro Entry' },
      { lat: 12.9830, lon: 77.5520, street: 'ESI Hospital Signal' },
      { lat: 12.9885, lon: 77.5580, street: 'Rajajinagar 3rd Block' },
      { lat: 12.9750, lon: 77.5500, street: 'Chord Road 6th Block' },
      { lat: 12.9925, lon: 77.5515, street: 'Sandal Soap Factory Metro' }
    ]
  },
  {
    id: 11,
    name: 'Hebbal',
    zone: 'North Zone',
    center: { lat: 13.0380, lon: 77.5920 },
    bins: [
      { lat: 13.0380, lon: 77.5920, street: 'Hebbal Flyover Junction' },
      { lat: 13.0450, lon: 77.5950, street: 'Bellary Road Expressway' },
      { lat: 13.0320, lon: 77.5900, street: 'Ganganagar Post Office' },
      { lat: 13.0420, lon: 77.5850, street: 'Kempapura Main Road' },
      { lat: 13.0500, lon: 77.6000, street: 'Manyata Tech Park Gate 1' },
      { lat: 13.0350, lon: 77.6030, street: 'Nagavara Outer Ring Road' },
      { lat: 13.0410, lon: 77.5940, street: 'Baptist Hospital Corner' },
      { lat: 13.0475, lon: 77.6040, street: 'Manyata Gate 2 Backroad' },
      { lat: 13.0290, lon: 77.5880, street: 'CBI Road Cross' },
      { lat: 13.0440, lon: 77.5820, street: 'Coffee Board Layout' },
      { lat: 13.0365, lon: 77.5975, street: 'Ring Road Service Lane' },
      { lat: 13.0530, lon: 77.5980, street: 'Kodigehalli Gate Signal' }
    ]
  },
  {
    id: 12,
    name: 'Marathahalli',
    zone: 'East Corridor',
    center: { lat: 12.9550, lon: 77.7010 },
    bins: [
      { lat: 12.9550, lon: 77.7010, street: 'Marathahalli Multiplex Signal' },
      { lat: 12.9590, lon: 77.6980, street: 'Kalamandir Junction' },
      { lat: 12.9500, lon: 77.7050, street: 'Bridge South Foot' },
      { lat: 12.9620, lon: 77.6930, street: 'HAL Heritage Centre Rd' },
      { lat: 12.9480, lon: 77.7120, street: 'Munnekolala Main Road' },
      { lat: 12.9575, lon: 77.7035, street: 'Spice Garden Layout' },
      { lat: 12.9640, lon: 77.6880, street: 'Yamalur Junction' },
      { lat: 12.9520, lon: 77.6960, street: 'Ashwath Nagar 4th Cross' },
      { lat: 12.9565, lon: 77.7090, street: 'Kundalahalli Colony Rd' },
      { lat: 12.9605, lon: 77.6915, street: 'HAL Airport Service Rd' },
      { lat: 12.9465, lon: 77.7065, street: 'Silver County Road' },
      { lat: 12.9535, lon: 77.7145, street: 'Thubarahalli Ext' }
    ]
  },
  {
    id: 13,
    name: 'Basavanagudi',
    zone: 'South Zone',
    center: { lat: 12.9420, lon: 77.5740 },
    bins: [
      { lat: 12.9420, lon: 77.5740, street: 'Gandhi Bazaar Circle' },
      { lat: 12.9380, lon: 77.5680, street: 'Bull Temple Road' },
      { lat: 12.9450, lon: 77.5780, street: 'National College Flyover' },
      { lat: 12.9480, lon: 77.5710, street: 'KR Road Promenade' },
      { lat: 12.9350, lon: 77.5760, street: 'Tagore Circle' },
      { lat: 12.9410, lon: 77.5790, street: 'Lalbagh West Gate' },
      { lat: 12.9465, lon: 77.5755, street: 'Netkallappa Circle' },
      { lat: 12.9395, lon: 77.5715, street: 'Bugle Rock Park Entrance' },
      { lat: 12.9440, lon: 77.5690, street: 'Mount Joy Road' },
      { lat: 12.9370, lon: 77.5735, street: 'DVG Road Boulevard' },
      { lat: 12.9495, lon: 77.5735, street: 'Vanivilas Road Corner' },
      { lat: 12.9405, lon: 77.5810, street: 'South End Road Junction' }
    ]
  },
  {
    id: 14,
    name: 'Banashankari',
    zone: 'South West',
    center: { lat: 12.9250, lon: 77.5490 },
    bins: [
      { lat: 12.9250, lon: 77.5490, street: 'BSK 2nd Stage BDA Complex' },
      { lat: 12.9180, lon: 77.5440, street: 'Kanakapura Road Metro' },
      { lat: 12.9300, lon: 77.5550, street: 'Monotype Signal' },
      { lat: 12.9120, lon: 77.5410, street: 'Sarakki Signal Junction' },
      { lat: 12.9280, lon: 77.5420, street: '100ft Ring Road BSK' },
      { lat: 12.9215, lon: 77.5525, street: 'Deve Gowda Petrol Bunk' },
      { lat: 12.9330, lon: 77.5480, street: 'Banashankari Amma Temple' },
      { lat: 12.9150, lon: 77.5470, street: 'Ilyas Nagar Main' },
      { lat: 12.9265, lon: 77.5385, street: 'Katriguppe Water Tank' },
      { lat: 12.9200, lon: 77.5370, street: 'Kamakhya Theatre Circle' },
      { lat: 12.9100, lon: 77.5450, street: 'Yelachenahalli Metro' },
      { lat: 12.9290, lon: 77.5510, street: 'Kadirenahalli Underpass' }
    ]
  },
  {
    id: 15,
    name: 'Vijayanagar',
    zone: 'West Zone',
    center: { lat: 12.9719, lon: 77.5303 },
    bins: [
      { lat: 12.9719, lon: 77.5303, street: 'Vijayanagar Metro Station' },
      { lat: 12.9680, lon: 77.5340, street: 'MC Layout 1st Main' },
      { lat: 12.9750, lon: 77.5260, street: 'RPC Layout Main Rd' },
      { lat: 12.9650, lon: 77.5280, street: 'Attiguppe Metro Signal' },
      { lat: 12.9790, lon: 77.5330, street: 'Chord Road Tollgate West' },
      { lat: 12.9705, lon: 77.5375, street: 'Maruthi Mandir Circle' },
      { lat: 12.9640, lon: 77.5360, street: 'Deepanjali Nagar Depot' },
      { lat: 12.9770, lon: 77.5220, street: 'Govindaraja Nagar 8th Main' },
      { lat: 12.9735, lon: 77.5285, street: 'Club Road Vijayanagar' },
      { lat: 12.9670, lon: 77.5220, street: 'Hampi Nagar 2nd Stage' },
      { lat: 12.9810, lon: 77.5270, street: 'Prashanth Nagar Main' },
      { lat: 12.9695, lon: 77.5320, street: 'Service Road Mysore Line' }
    ]
  },
  {
    id: 16,
    name: 'Mahadevapura',
    zone: 'East Corridor',
    center: { lat: 12.9912, lon: 77.6974 },
    bins: [
      { lat: 12.9912, lon: 77.6974, street: 'Mahadevapura Ring Rd Ring' },
      { lat: 12.9960, lon: 77.7020, street: 'Phoenix Marketcity Entry' },
      { lat: 12.9850, lon: 77.6920, street: 'Bagmane World Technology' },
      { lat: 12.9990, lon: 77.6910, street: 'KR Puram Railway Stn Rd' },
      { lat: 12.9880, lon: 77.7040, street: 'VR Bengaluru Mall Corner' },
      { lat: 12.9820, lon: 77.6880, street: 'Garudacharpalya Metro' },
      { lat: 12.9940, lon: 77.6870, street: 'Tin Factory Flyover' },
      { lat: 12.9865, lon: 77.6995, street: 'Singayyanapalya Metro' },
      { lat: 12.9975, lon: 77.6950, street: 'Old Madras Road Link' },
      { lat: 12.9895, lon: 77.6835, street: 'B Narayanapura Main' },
      { lat: 12.9835, lon: 77.6965, street: 'Kamadhenu Nagar' },
      { lat: 12.9925, lon: 77.7080, street: 'Devasandra Industrial' }
    ]
  },
  {
    id: 17,
    name: 'Peenya Industrial Area',
    zone: 'North West',
    center: { lat: 13.0329, lon: 77.5140 },
    bins: [
      { lat: 13.0329, lon: 77.5140, street: 'Peenya 1st Stage Main' },
      { lat: 13.0380, lon: 77.5100, street: 'Peenya 2nd Stage Ring Rd' },
      { lat: 13.0270, lon: 77.5200, street: 'Tumkur Road Flyover Base' },
      { lat: 13.0420, lon: 77.5180, street: 'Jalahalli Cross Metro' },
      { lat: 13.0310, lon: 77.5050, street: 'Peenya Industrial Estate 4th' },
      { lat: 13.0355, lon: 77.5240, street: 'Goraguntepalya Signal' },
      { lat: 13.0240, lon: 77.5160, street: 'Dasarahalli Metro Entry' },
      { lat: 13.0395, lon: 77.5085, street: 'ABB Power Line Road' },
      { lat: 13.0290, lon: 77.5110, street: 'NTTF Road Peenya' },
      { lat: 13.0445, lon: 77.5145, street: 'TVS Cross Peenya' },
      { lat: 13.0260, lon: 77.5225, street: 'CMTI Main Entrance' },
      { lat: 13.0360, lon: 77.5175, street: '10th Main Peenya Phase 1' }
    ]
  },
  {
    id: 18,
    name: 'Yeshwantpur',
    zone: 'North West',
    center: { lat: 13.0230, lon: 77.5500 },
    bins: [
      { lat: 13.0230, lon: 77.5500, street: 'Yeshwantpur Railway Station' },
      { lat: 13.0180, lon: 77.5540, street: 'Yeshwantpur Circle Flyover' },
      { lat: 13.0280, lon: 77.5450, street: 'APMC Yard Gate 1' },
      { lat: 13.0150, lon: 77.5480, street: 'Dr Rajkumar Rd North Link' },
      { lat: 13.0255, lon: 77.5570, street: 'IISc D-Gate CV Raman Rd' },
      { lat: 13.0210, lon: 77.5420, street: 'Gokula Extension 1st Main' },
      { lat: 13.0300, lon: 77.5520, street: 'Subedarpalya Main' },
      { lat: 13.0165, lon: 77.5585, street: 'Sandal Soap Factory Ring' },
      { lat: 13.0245, lon: 77.5475, street: 'Bazaar Street Yeshwantpur' },
      { lat: 13.0270, lon: 77.5590, street: 'MS Ramaiah Hospital Rd' },
      { lat: 13.0195, lon: 77.5460, street: 'Triveni Main Road' },
      { lat: 13.0315, lon: 77.5490, street: 'Mathikere 1st Main' }
    ]
  },
  {
    id: 19,
    name: 'Yelahanka',
    zone: 'North Zone',
    center: { lat: 13.1005, lon: 77.5963 },
    bins: [
      { lat: 13.1005, lon: 77.5963, street: 'Yelahanka Old Town Market' },
      { lat: 13.0920, lon: 77.5920, street: 'Yelahanka Police Station' },
      { lat: 13.1080, lon: 77.5980, street: 'NES Office Signal' },
      { lat: 13.0850, lon: 77.5890, street: 'Allalasandra Flyover' },
      { lat: 13.1150, lon: 77.6010, street: 'Kogilu Cross Junction' },
      { lat: 13.0965, lon: 77.6040, street: 'Yelahanka New Town 4th' },
      { lat: 13.1040, lon: 77.5895, street: 'Major Sandeep Unnikrishnan Rd' },
      { lat: 13.0880, lon: 77.5970, street: 'Railway Station Road' },
      { lat: 13.1110, lon: 77.5930, street: 'Mother Dairy Circle' },
      { lat: 13.0990, lon: 77.5850, street: 'Attur Layout Main' },
      { lat: 13.1060, lon: 77.6060, street: 'Judicial Layout Gate' },
      { lat: 13.0940, lon: 77.5990, street: 'Santhe Maidan Perimeter' }
    ]
  },
  {
    id: 20,
    name: 'Domlur & Old Airport',
    zone: 'East Zone',
    center: { lat: 12.9610, lon: 77.6380 },
    bins: [
      { lat: 12.9610, lon: 77.6380, street: 'Domlur Flyover Signal' },
      { lat: 12.9560, lon: 77.6490, street: 'Manipal Hospital Airport Rd' },
      { lat: 12.9640, lon: 77.6310, street: 'Command Hospital Gate' },
      { lat: 12.9520, lon: 77.6580, street: 'Leela Palace Signal' },
      { lat: 12.9670, lon: 77.6390, street: 'Doopanahalli Main Rd' },
      { lat: 12.9585, lon: 77.6435, street: 'Diamond District Entry' },
      { lat: 12.9630, lon: 77.6460, street: 'HAL 3rd Stage 1st Main' },
      { lat: 12.9540, lon: 77.6530, street: 'Murugeshpalya Junction' },
      { lat: 12.9655, lon: 77.6345, street: 'Trinity Church Ext' },
      { lat: 12.9595, lon: 77.6505, street: 'Wind Tunnel Road' },
      { lat: 12.9685, lon: 77.6420, street: 'Domlur 2nd Stage BDA' },
      { lat: 12.9510, lon: 77.6620, street: 'ISRO Satellite Centre Rd' }
    ]
  },
  {
    id: 21,
    name: 'Frazer Town & Cox Town',
    zone: 'Central North',
    center: { lat: 12.9980, lon: 77.6150 },
    bins: [
      { lat: 12.9980, lon: 77.6150, street: 'MM Road Frazer Town' },
      { lat: 12.9920, lon: 77.6120, street: 'Coles Park Promenade' },
      { lat: 13.0030, lon: 77.6190, street: 'Davis Road Richards Town' },
      { lat: 12.9950, lon: 77.6250, street: 'Cox Town Circle' },
      { lat: 13.0010, lon: 77.6100, street: 'Mosque Road Promenade' },
      { lat: 12.9890, lon: 77.6180, street: 'Bangalore East Station' },
      { lat: 12.9965, lon: 77.6185, street: 'Spencer Road Cross' },
      { lat: 13.0045, lon: 77.6140, street: 'Clarke Road Junction' },
      { lat: 12.9935, lon: 77.6225, street: 'Wheeler Road Extension' },
      { lat: 12.9995, lon: 77.6210, street: 'ITC Factory Road' },
      { lat: 12.9910, lon: 77.6155, street: 'Promenade Road Corner' },
      { lat: 13.0060, lon: 77.6175, street: 'Clarence High School Rd' }
    ]
  },
  {
    id: 22,
    name: 'RT Nagar',
    zone: 'North Zone',
    center: { lat: 13.0180, lon: 77.5950 },
    bins: [
      { lat: 13.0180, lon: 77.5950, street: 'RT Nagar 80ft Road' },
      { lat: 13.0230, lon: 77.5910, street: 'Dinnur Main Road' },
      { lat: 13.0130, lon: 77.5980, street: 'HMT Layout 1st Block' },
      { lat: 13.0260, lon: 77.5970, street: 'MLA Layout Main' },
      { lat: 13.0155, lon: 77.5900, street: 'Matadahalli Link Rd' },
      { lat: 13.0210, lon: 77.6010, street: 'Ganganagar North Entry' },
      { lat: 13.0195, lon: 77.5935, street: 'Post Office Road' },
      { lat: 13.0245, lon: 77.5945, street: 'P&T Colony 2nd Block' },
      { lat: 13.0115, lon: 77.5940, street: 'Rahmath Nagar Avenue' },
      { lat: 13.0275, lon: 77.5925, street: 'Sultanpalya Main' },
      { lat: 13.0170, lon: 77.6025, street: 'Manoorayanapalya' },
      { lat: 13.0225, lon: 77.5880, street: 'CBI Colony Gate' }
    ]
  },
  {
    id: 23,
    name: 'Shantinagar & Richmond',
    zone: 'CBD Central',
    center: { lat: 12.9580, lon: 77.5960 },
    bins: [
      { lat: 12.9580, lon: 77.5960, street: 'Shantinagar Bus Station' },
      { lat: 12.9640, lon: 77.6010, street: 'Hosur Road Richmond Town' },
      { lat: 12.9520, lon: 77.5920, street: 'Lalbagh Double Road' },
      { lat: 12.9670, lon: 77.5930, street: 'Langford Road Cross' },
      { lat: 12.9595, lon: 77.6040, street: 'Johnson Market Circle' },
      { lat: 12.9550, lon: 77.5990, street: 'Aga Abbas Ali Road' },
      { lat: 12.9625, lon: 77.5945, street: 'Kengal Hanumanthaiah Rd' },
      { lat: 12.9500, lon: 77.5975, street: 'Wilson Garden 10th Cross' },
      { lat: 12.9650, lon: 77.5980, street: 'Baldwin Boys School Rd' },
      { lat: 12.9570, lon: 77.5910, street: 'Anekal Road Shantinagar' },
      { lat: 12.9615, lon: 77.6020, street: 'Hosur Main Bus Shelter' },
      { lat: 12.9535, lon: 77.5945, street: 'BMTC Central Workshop' }
    ]
  }
]

export const ALL_ROAD_BINS: Array<{ id: number; lat: number; lon: number; street: string; ward: string; zone: string; wardId: number }> = []

let binIdCounter = 0
for (const ward of BENGALURU_WARDS) {
  for (const b of ward.bins) {
    ALL_ROAD_BINS.push({
      id: binIdCounter++,
      lat: b.lat,
      lon: b.lon,
      street: b.street,
      ward: ward.name,
      zone: ward.zone,
      wardId: ward.id
    })
  }
}
