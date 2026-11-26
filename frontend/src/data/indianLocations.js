// All 28 States and 8 Union Territories of India
export const ALL_INDIAN_STATES = [
  'ALL',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu & Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman & Nicobar Islands',
  'Chandigarh',
  'Dadra & Nagar Haveli and Daman & Diu'
];

// Major Districts / Cities for all 36 States & Union Territories
export const STATE_CITIES_MAP = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Kakinada'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat'],
  'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga'],
  'Chhattisgarh': ['Raipur', 'Bilaspur', 'Bhilai', 'Durg', 'Korba'],
  'Delhi': ['New Delhi', 'South Delhi', 'West Delhi', 'East Delhi', 'North Delhi', 'Central Delhi', 'Dwarka', 'Rohini'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar'],
  'Haryana': ['Gurugram', 'Faridabad', 'Ambala', 'Panchkula', 'Panipat', 'Karnal'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Mandi', 'Solan'],
  'Jammu & Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Udhampur'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'],
  'Karnataka': ['Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Mangaluru', 'Hubballi-Dharwad'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur'],
  'Ladakh': ['Leh', 'Kargil'],
  'Lakshadweep': ['Kavaratti'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Rewa', 'Sagar', 'Dewas', 'Satna', 'Ratlam'],
  'Maharashtra': ['Mumbai', 'Mumbai Suburbs', 'South Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad'],
  'Manipur': ['Imphal', 'Thoubal'],
  'Meghalaya': ['Shillong', 'Tura'],
  'Mizoram': ['Aizawl', 'Lunglei'],
  'Nagaland': ['Kohima', 'Dimapur'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Puri'],
  'Puducherry': ['Puducherry', 'Karaikal'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Mohali'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner'],
  'Sikkim': ['Gangtok', 'Namchi'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
  'Telangana': ['Hyderabad', 'Secunderabad', 'Warangal', 'Nizamabad'],
  'Tripura': ['Agartala', 'Udaipur (Tripura)'],
  'Uttar Pradesh': ['Lucknow', 'Noida', 'Ghaziabad', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Haldwani', 'Rishikesh'],
  'West Bengal': ['Kolkata', 'Howrah', 'Siliguri', 'Durgapur'],
  'Andaman & Nicobar Islands': ['Port Blair'],
  'Chandigarh': ['Chandigarh'],
  'Dadra & Nagar Haveli and Daman & Diu': ['Daman', 'Diu', 'Silvassa']
};

export function buildAllDistrictsForCategory(categoryKey, existingList = []) {
  const map = new Map();
  existingList.forEach((item) => {
    map.set(`${item.state.toLowerCase()}::${item.name.toLowerCase()}`, item);
  });

  const defaultProviderByCategory = {
    electricity: { discomCode: 'MSEDCL-MAHA', discomName: 'State Electricity Board (BBPS)', region: 'Regional Electricity Discom', demoConsumer: '100123456789' },
    water: { discomCode: 'DJB-DEL', discomName: 'Municipal Water Supply (BBPS)', matchName: 'Water', region: 'Urban Water Utility', demoConsumer: '1002345678' },
    gas: { discomCode: 'INDANE-GAS', discomName: 'City / LPG Gas Provider (BBPS)', matchName: 'Indane Gas', region: 'Piped & LPG Gas', demoConsumer: '1002345678' },
    'municipal-taxes': { discomCode: 'MCD-DEL', discomName: 'Municipal Corporation Tax (BBPS)', matchName: 'Municipal', region: 'Municipal Property Tax', demoConsumer: '1002345678' }
  };

  const fallback = defaultProviderByCategory[categoryKey] || defaultProviderByCategory.electricity;

  Object.entries(STATE_CITIES_MAP).forEach(([state, cities]) => {
    cities.forEach((city) => {
      const key = `${state.toLowerCase()}::${city.toLowerCase()}`;
      if (!map.has(key)) {
        map.set(key, {
          name: city,
          state,
          discomCode: fallback.discomCode,
          discomName: `${state} — ${fallback.discomName}`,
          matchName: fallback.matchName,
          region: `${city}, ${state}`,
          demoConsumer: fallback.demoConsumer
        });
      }
    });
  });

  return Array.from(map.values());
}
