/**
 * Curated additions to the master city list.
 * These are popular tourist destinations not captured by Wikipedia lists.
 */

export type CuratedCity = {
  name: string;
  country: string;
  countryCode: string;
  wikiSlug: string;
};

export const CURATED_ADDITIONS: CuratedCity[] = [
  // ============================================
  // EUROPE
  // ============================================

  // Spain
  { name: "Seville", country: "Spain", countryCode: "ES", wikiSlug: "Seville" },
  { name: "Valencia", country: "Spain", countryCode: "ES", wikiSlug: "Valencia" },
  { name: "Granada", country: "Spain", countryCode: "ES", wikiSlug: "Granada" },
  { name: "Málaga", country: "Spain", countryCode: "ES", wikiSlug: "Málaga" },
  { name: "Bilbao", country: "Spain", countryCode: "ES", wikiSlug: "Bilbao" },
  { name: "San Sebastián", country: "Spain", countryCode: "ES", wikiSlug: "San_Sebastián" },
  { name: "Palma de Mallorca", country: "Spain", countryCode: "ES", wikiSlug: "Palma_de_Mallorca" },
  { name: "Ibiza", country: "Spain", countryCode: "ES", wikiSlug: "Ibiza" },
  { name: "Tenerife", country: "Spain", countryCode: "ES", wikiSlug: "Tenerife" },
  { name: "Toledo", country: "Spain", countryCode: "ES", wikiSlug: "Toledo,_Spain" },

  // France
  { name: "Lyon", country: "France", countryCode: "FR", wikiSlug: "Lyon" },
  { name: "Marseille", country: "France", countryCode: "FR", wikiSlug: "Marseille" },
  { name: "Bordeaux", country: "France", countryCode: "FR", wikiSlug: "Bordeaux" },
  { name: "Strasbourg", country: "France", countryCode: "FR", wikiSlug: "Strasbourg" },
  { name: "Cannes", country: "France", countryCode: "FR", wikiSlug: "Cannes" },
  { name: "Monaco", country: "Monaco", countryCode: "MC", wikiSlug: "Monaco" },
  { name: "Toulouse", country: "France", countryCode: "FR", wikiSlug: "Toulouse" },
  { name: "Avignon", country: "France", countryCode: "FR", wikiSlug: "Avignon" },
  { name: "Provence", country: "France", countryCode: "FR", wikiSlug: "Provence" },
  { name: "Chamonix", country: "France", countryCode: "FR", wikiSlug: "Chamonix" },

  // Italy
  { name: "Naples", country: "Italy", countryCode: "IT", wikiSlug: "Naples" },
  { name: "Turin", country: "Italy", countryCode: "IT", wikiSlug: "Turin" },
  { name: "Bologna", country: "Italy", countryCode: "IT", wikiSlug: "Bologna" },
  { name: "Verona", country: "Italy", countryCode: "IT", wikiSlug: "Verona" },
  { name: "Cinque Terre", country: "Italy", countryCode: "IT", wikiSlug: "Cinque_Terre" },
  { name: "Amalfi Coast", country: "Italy", countryCode: "IT", wikiSlug: "Amalfi_Coast" },
  { name: "Sicily", country: "Italy", countryCode: "IT", wikiSlug: "Sicily" },
  { name: "Sardinia", country: "Italy", countryCode: "IT", wikiSlug: "Sardinia" },
  { name: "Pisa", country: "Italy", countryCode: "IT", wikiSlug: "Pisa" },
  { name: "Siena", country: "Italy", countryCode: "IT", wikiSlug: "Siena" },
  { name: "Lake Como", country: "Italy", countryCode: "IT", wikiSlug: "Lake_Como" },

  // Germany
  { name: "Munich", country: "Germany", countryCode: "DE", wikiSlug: "Munich" },
  { name: "Hamburg", country: "Germany", countryCode: "DE", wikiSlug: "Hamburg" },
  { name: "Frankfurt", country: "Germany", countryCode: "DE", wikiSlug: "Frankfurt" },
  { name: "Cologne", country: "Germany", countryCode: "DE", wikiSlug: "Cologne" },
  { name: "Dresden", country: "Germany", countryCode: "DE", wikiSlug: "Dresden" },
  { name: "Düsseldorf", country: "Germany", countryCode: "DE", wikiSlug: "Düsseldorf" },
  { name: "Heidelberg", country: "Germany", countryCode: "DE", wikiSlug: "Heidelberg" },
  { name: "Nuremberg", country: "Germany", countryCode: "DE", wikiSlug: "Nuremberg" },
  { name: "Stuttgart", country: "Germany", countryCode: "DE", wikiSlug: "Stuttgart" },
  { name: "Bavaria", country: "Germany", countryCode: "DE", wikiSlug: "Bavaria" },

  // UK
  { name: "Edinburgh", country: "United Kingdom", countryCode: "GB", wikiSlug: "Edinburgh" },
  { name: "Manchester", country: "United Kingdom", countryCode: "GB", wikiSlug: "Manchester" },
  { name: "Liverpool", country: "United Kingdom", countryCode: "GB", wikiSlug: "Liverpool" },
  { name: "Oxford", country: "United Kingdom", countryCode: "GB", wikiSlug: "Oxford" },
  { name: "Cambridge", country: "United Kingdom", countryCode: "GB", wikiSlug: "Cambridge" },
  { name: "Bath", country: "United Kingdom", countryCode: "GB", wikiSlug: "Bath,_Somerset" },
  { name: "York", country: "United Kingdom", countryCode: "GB", wikiSlug: "York" },
  { name: "Brighton", country: "United Kingdom", countryCode: "GB", wikiSlug: "Brighton" },
  { name: "Bristol", country: "United Kingdom", countryCode: "GB", wikiSlug: "Bristol" },
  { name: "Glasgow", country: "United Kingdom", countryCode: "GB", wikiSlug: "Glasgow" },
  { name: "Cornwall", country: "United Kingdom", countryCode: "GB", wikiSlug: "Cornwall" },
  { name: "Lake District", country: "United Kingdom", countryCode: "GB", wikiSlug: "Lake_District" },

  // Netherlands
  { name: "Rotterdam", country: "Netherlands", countryCode: "NL", wikiSlug: "Rotterdam" },
  { name: "The Hague", country: "Netherlands", countryCode: "NL", wikiSlug: "The_Hague" },
  { name: "Utrecht", country: "Netherlands", countryCode: "NL", wikiSlug: "Utrecht" },

  // Portugal
  { name: "Lisbon", country: "Portugal", countryCode: "PT", wikiSlug: "Lisbon" },
  { name: "Porto", country: "Portugal", countryCode: "PT", wikiSlug: "Porto" },
  { name: "Algarve", country: "Portugal", countryCode: "PT", wikiSlug: "Algarve" },
  { name: "Madeira", country: "Portugal", countryCode: "PT", wikiSlug: "Madeira" },
  { name: "Azores", country: "Portugal", countryCode: "PT", wikiSlug: "Azores" },
  { name: "Sintra", country: "Portugal", countryCode: "PT", wikiSlug: "Sintra" },

  // Austria
  { name: "Salzburg", country: "Austria", countryCode: "AT", wikiSlug: "Salzburg" },
  { name: "Innsbruck", country: "Austria", countryCode: "AT", wikiSlug: "Innsbruck" },
  { name: "Hallstatt", country: "Austria", countryCode: "AT", wikiSlug: "Hallstatt" },

  // Greece
  { name: "Santorini", country: "Greece", countryCode: "GR", wikiSlug: "Santorini" },
  { name: "Mykonos", country: "Greece", countryCode: "GR", wikiSlug: "Mykonos" },
  { name: "Crete", country: "Greece", countryCode: "GR", wikiSlug: "Crete" },
  { name: "Rhodes", country: "Greece", countryCode: "GR", wikiSlug: "Rhodes" },
  { name: "Corfu", country: "Greece", countryCode: "GR", wikiSlug: "Corfu" },
  { name: "Thessaloniki", country: "Greece", countryCode: "GR", wikiSlug: "Thessaloniki" },

  // Croatia
  { name: "Dubrovnik", country: "Croatia", countryCode: "HR", wikiSlug: "Dubrovnik" },
  { name: "Split", country: "Croatia", countryCode: "HR", wikiSlug: "Split,_Croatia" },
  { name: "Zagreb", country: "Croatia", countryCode: "HR", wikiSlug: "Zagreb" },
  { name: "Plitvice Lakes", country: "Croatia", countryCode: "HR", wikiSlug: "Plitvice_Lakes_National_Park" },

  // Czech Republic
  { name: "Český Krumlov", country: "Czech Republic", countryCode: "CZ", wikiSlug: "Český_Krumlov" },
  { name: "Karlovy Vary", country: "Czech Republic", countryCode: "CZ", wikiSlug: "Karlovy_Vary" },

  // Poland
  { name: "Kraków", country: "Poland", countryCode: "PL", wikiSlug: "Kraków" },
  { name: "Warsaw", country: "Poland", countryCode: "PL", wikiSlug: "Warsaw" },
  { name: "Gdańsk", country: "Poland", countryCode: "PL", wikiSlug: "Gdańsk" },
  { name: "Wrocław", country: "Poland", countryCode: "PL", wikiSlug: "Wrocław" },

  // Hungary
  { name: "Budapest", country: "Hungary", countryCode: "HU", wikiSlug: "Budapest" },

  // Nordic
  { name: "Stockholm", country: "Sweden", countryCode: "SE", wikiSlug: "Stockholm" },
  { name: "Oslo", country: "Norway", countryCode: "NO", wikiSlug: "Oslo" },
  { name: "Copenhagen", country: "Denmark", countryCode: "DK", wikiSlug: "Copenhagen" },
  { name: "Helsinki", country: "Finland", countryCode: "FI", wikiSlug: "Helsinki" },
  { name: "Reykjavik", country: "Iceland", countryCode: "IS", wikiSlug: "Reykjavik" },
  { name: "Bergen", country: "Norway", countryCode: "NO", wikiSlug: "Bergen" },
  { name: "Tromsø", country: "Norway", countryCode: "NO", wikiSlug: "Tromsø" },
  { name: "Lapland", country: "Finland", countryCode: "FI", wikiSlug: "Lapland_(Finland)" },
  { name: "Gothenburg", country: "Sweden", countryCode: "SE", wikiSlug: "Gothenburg" },

  // Ireland
  { name: "Galway", country: "Ireland", countryCode: "IE", wikiSlug: "Galway" },
  { name: "Cork", country: "Ireland", countryCode: "IE", wikiSlug: "Cork_(city)" },
  { name: "Ring of Kerry", country: "Ireland", countryCode: "IE", wikiSlug: "Ring_of_Kerry" },

  // Belgium
  { name: "Brussels", country: "Belgium", countryCode: "BE", wikiSlug: "Brussels" },
  { name: "Bruges", country: "Belgium", countryCode: "BE", wikiSlug: "Bruges" },
  { name: "Ghent", country: "Belgium", countryCode: "BE", wikiSlug: "Ghent" },
  { name: "Antwerp", country: "Belgium", countryCode: "BE", wikiSlug: "Antwerp" },

  // Switzerland
  { name: "Zurich", country: "Switzerland", countryCode: "CH", wikiSlug: "Zurich" },
  { name: "Geneva", country: "Switzerland", countryCode: "CH", wikiSlug: "Geneva" },
  { name: "Lucerne", country: "Switzerland", countryCode: "CH", wikiSlug: "Lucerne" },
  { name: "Interlaken", country: "Switzerland", countryCode: "CH", wikiSlug: "Interlaken" },
  { name: "Zermatt", country: "Switzerland", countryCode: "CH", wikiSlug: "Zermatt" },
  { name: "Bern", country: "Switzerland", countryCode: "CH", wikiSlug: "Bern" },

  // Balkans & Eastern Europe
  { name: "Sofia", country: "Bulgaria", countryCode: "BG", wikiSlug: "Sofia" },
  { name: "Bucharest", country: "Romania", countryCode: "RO", wikiSlug: "Bucharest" },
  { name: "Belgrade", country: "Serbia", countryCode: "RS", wikiSlug: "Belgrade" },
  { name: "Ljubljana", country: "Slovenia", countryCode: "SI", wikiSlug: "Ljubljana" },
  { name: "Lake Bled", country: "Slovenia", countryCode: "SI", wikiSlug: "Lake_Bled" },
  { name: "Bratislava", country: "Slovakia", countryCode: "SK", wikiSlug: "Bratislava" },
  { name: "Tirana", country: "Albania", countryCode: "AL", wikiSlug: "Tirana" },
  { name: "Sarajevo", country: "Bosnia and Herzegovina", countryCode: "BA", wikiSlug: "Sarajevo" },
  { name: "Kotor", country: "Montenegro", countryCode: "ME", wikiSlug: "Kotor" },

  // Baltic States
  { name: "Tallinn", country: "Estonia", countryCode: "EE", wikiSlug: "Tallinn" },
  { name: "Riga", country: "Latvia", countryCode: "LV", wikiSlug: "Riga" },
  { name: "Vilnius", country: "Lithuania", countryCode: "LT", wikiSlug: "Vilnius" },

  // Russia & CIS
  { name: "Moscow", country: "Russia", countryCode: "RU", wikiSlug: "Moscow" },
  { name: "Saint Petersburg", country: "Russia", countryCode: "RU", wikiSlug: "Saint_Petersburg" },
  { name: "Kyiv", country: "Ukraine", countryCode: "UA", wikiSlug: "Kyiv" },
  { name: "Tbilisi", country: "Georgia", countryCode: "GE", wikiSlug: "Tbilisi" },
  { name: "Baku", country: "Azerbaijan", countryCode: "AZ", wikiSlug: "Baku" },
  { name: "Yerevan", country: "Armenia", countryCode: "AM", wikiSlug: "Yerevan" },

  // ============================================
  // ASIA
  // ============================================

  // Japan
  { name: "Tokyo", country: "Japan", countryCode: "JP", wikiSlug: "Tokyo" },
  { name: "Kyoto", country: "Japan", countryCode: "JP", wikiSlug: "Kyoto" },
  { name: "Osaka", country: "Japan", countryCode: "JP", wikiSlug: "Osaka" },
  { name: "Hiroshima", country: "Japan", countryCode: "JP", wikiSlug: "Hiroshima" },
  { name: "Nara", country: "Japan", countryCode: "JP", wikiSlug: "Nara,_Nara" },
  { name: "Hakone", country: "Japan", countryCode: "JP", wikiSlug: "Hakone" },
  { name: "Nikko", country: "Japan", countryCode: "JP", wikiSlug: "Nikkō" },
  { name: "Okinawa", country: "Japan", countryCode: "JP", wikiSlug: "Okinawa_Island" },
  { name: "Sapporo", country: "Japan", countryCode: "JP", wikiSlug: "Sapporo" },
  { name: "Fukuoka", country: "Japan", countryCode: "JP", wikiSlug: "Fukuoka" },
  { name: "Nagoya", country: "Japan", countryCode: "JP", wikiSlug: "Nagoya" },
  { name: "Kanazawa", country: "Japan", countryCode: "JP", wikiSlug: "Kanazawa" },

  // South Korea
  { name: "Seoul", country: "South Korea", countryCode: "KR", wikiSlug: "Seoul" },
  { name: "Busan", country: "South Korea", countryCode: "KR", wikiSlug: "Busan" },
  { name: "Jeju Island", country: "South Korea", countryCode: "KR", wikiSlug: "Jeju_Island" },
  { name: "Gyeongju", country: "South Korea", countryCode: "KR", wikiSlug: "Gyeongju" },

  // China
  { name: "Shanghai", country: "China", countryCode: "CN", wikiSlug: "Shanghai" },
  { name: "Hong Kong", country: "Hong Kong", countryCode: "HK", wikiSlug: "Hong_Kong" },
  { name: "Macau", country: "Macau", countryCode: "MO", wikiSlug: "Macau" },
  { name: "Guangzhou", country: "China", countryCode: "CN", wikiSlug: "Guangzhou" },
  { name: "Shenzhen", country: "China", countryCode: "CN", wikiSlug: "Shenzhen" },
  { name: "Xi'an", country: "China", countryCode: "CN", wikiSlug: "Xi'an" },
  { name: "Chengdu", country: "China", countryCode: "CN", wikiSlug: "Chengdu" },
  { name: "Guilin", country: "China", countryCode: "CN", wikiSlug: "Guilin" },
  { name: "Hangzhou", country: "China", countryCode: "CN", wikiSlug: "Hangzhou" },
  { name: "Suzhou", country: "China", countryCode: "CN", wikiSlug: "Suzhou" },

  // Taiwan
  { name: "Taipei", country: "Taiwan", countryCode: "TW", wikiSlug: "Taipei" },
  { name: "Kaohsiung", country: "Taiwan", countryCode: "TW", wikiSlug: "Kaohsiung" },
  { name: "Taichung", country: "Taiwan", countryCode: "TW", wikiSlug: "Taichung" },

  // Southeast Asia
  { name: "Bangkok", country: "Thailand", countryCode: "TH", wikiSlug: "Bangkok" },
  { name: "Phuket", country: "Thailand", countryCode: "TH", wikiSlug: "Phuket_Province" },
  { name: "Chiang Mai", country: "Thailand", countryCode: "TH", wikiSlug: "Chiang_Mai" },
  { name: "Krabi", country: "Thailand", countryCode: "TH", wikiSlug: "Krabi_Province" },
  { name: "Koh Samui", country: "Thailand", countryCode: "TH", wikiSlug: "Ko_Samui" },
  { name: "Pattaya", country: "Thailand", countryCode: "TH", wikiSlug: "Pattaya" },

  { name: "Singapore", country: "Singapore", countryCode: "SG", wikiSlug: "Singapore" },

  { name: "Kuala Lumpur", country: "Malaysia", countryCode: "MY", wikiSlug: "Kuala_Lumpur" },
  { name: "Penang", country: "Malaysia", countryCode: "MY", wikiSlug: "Penang" },
  { name: "Langkawi", country: "Malaysia", countryCode: "MY", wikiSlug: "Langkawi" },
  { name: "Borneo", country: "Malaysia", countryCode: "MY", wikiSlug: "Borneo" },

  { name: "Bali", country: "Indonesia", countryCode: "ID", wikiSlug: "Bali" },
  { name: "Jakarta", country: "Indonesia", countryCode: "ID", wikiSlug: "Jakarta" },
  { name: "Yogyakarta", country: "Indonesia", countryCode: "ID", wikiSlug: "Yogyakarta" },
  { name: "Lombok", country: "Indonesia", countryCode: "ID", wikiSlug: "Lombok" },
  { name: "Raja Ampat", country: "Indonesia", countryCode: "ID", wikiSlug: "Raja_Ampat_Islands" },

  { name: "Ho Chi Minh City", country: "Vietnam", countryCode: "VN", wikiSlug: "Ho_Chi_Minh_City" },
  { name: "Hanoi", country: "Vietnam", countryCode: "VN", wikiSlug: "Hanoi" },
  { name: "Da Nang", country: "Vietnam", countryCode: "VN", wikiSlug: "Da_Nang" },
  { name: "Hoi An", country: "Vietnam", countryCode: "VN", wikiSlug: "Hội_An" },
  { name: "Ha Long Bay", country: "Vietnam", countryCode: "VN", wikiSlug: "Hạ_Long_Bay" },
  { name: "Sapa", country: "Vietnam", countryCode: "VN", wikiSlug: "Sa_Pa" },
  { name: "Nha Trang", country: "Vietnam", countryCode: "VN", wikiSlug: "Nha_Trang" },

  { name: "Manila", country: "Philippines", countryCode: "PH", wikiSlug: "Manila" },
  { name: "Cebu", country: "Philippines", countryCode: "PH", wikiSlug: "Cebu" },
  { name: "Palawan", country: "Philippines", countryCode: "PH", wikiSlug: "Palawan" },
  { name: "Boracay", country: "Philippines", countryCode: "PH", wikiSlug: "Boracay" },
  { name: "Siargao", country: "Philippines", countryCode: "PH", wikiSlug: "Siargao" },

  { name: "Siem Reap", country: "Cambodia", countryCode: "KH", wikiSlug: "Siem_Reap" },
  { name: "Phnom Penh", country: "Cambodia", countryCode: "KH", wikiSlug: "Phnom_Penh" },

  { name: "Luang Prabang", country: "Laos", countryCode: "LA", wikiSlug: "Luang_Prabang" },
  { name: "Vientiane", country: "Laos", countryCode: "LA", wikiSlug: "Vientiane" },

  { name: "Yangon", country: "Myanmar", countryCode: "MM", wikiSlug: "Yangon" },
  { name: "Bagan", country: "Myanmar", countryCode: "MM", wikiSlug: "Bagan" },

  // South Asia
  { name: "Mumbai", country: "India", countryCode: "IN", wikiSlug: "Mumbai" },
  { name: "Delhi", country: "India", countryCode: "IN", wikiSlug: "Delhi" },
  { name: "Jaipur", country: "India", countryCode: "IN", wikiSlug: "Jaipur" },
  { name: "Agra", country: "India", countryCode: "IN", wikiSlug: "Agra" },
  { name: "Goa", country: "India", countryCode: "IN", wikiSlug: "Goa" },
  { name: "Kerala", country: "India", countryCode: "IN", wikiSlug: "Kerala" },
  { name: "Varanasi", country: "India", countryCode: "IN", wikiSlug: "Varanasi" },
  { name: "Udaipur", country: "India", countryCode: "IN", wikiSlug: "Udaipur" },
  { name: "Bangalore", country: "India", countryCode: "IN", wikiSlug: "Bangalore" },
  { name: "Kolkata", country: "India", countryCode: "IN", wikiSlug: "Kolkata" },
  { name: "Darjeeling", country: "India", countryCode: "IN", wikiSlug: "Darjeeling" },
  { name: "Rishikesh", country: "India", countryCode: "IN", wikiSlug: "Rishikesh" },

  { name: "Kathmandu", country: "Nepal", countryCode: "NP", wikiSlug: "Kathmandu" },
  { name: "Pokhara", country: "Nepal", countryCode: "NP", wikiSlug: "Pokhara" },

  { name: "Colombo", country: "Sri Lanka", countryCode: "LK", wikiSlug: "Colombo" },
  { name: "Kandy", country: "Sri Lanka", countryCode: "LK", wikiSlug: "Kandy" },
  { name: "Galle", country: "Sri Lanka", countryCode: "LK", wikiSlug: "Galle" },

  { name: "Maldives", country: "Maldives", countryCode: "MV", wikiSlug: "Maldives" },
  { name: "Malé", country: "Maldives", countryCode: "MV", wikiSlug: "Malé" },

  { name: "Thimphu", country: "Bhutan", countryCode: "BT", wikiSlug: "Thimphu" },
  { name: "Paro", country: "Bhutan", countryCode: "BT", wikiSlug: "Paro,_Bhutan" },

  // Central Asia
  { name: "Samarkand", country: "Uzbekistan", countryCode: "UZ", wikiSlug: "Samarkand" },
  { name: "Bukhara", country: "Uzbekistan", countryCode: "UZ", wikiSlug: "Bukhara" },
  { name: "Tashkent", country: "Uzbekistan", countryCode: "UZ", wikiSlug: "Tashkent" },
  { name: "Almaty", country: "Kazakhstan", countryCode: "KZ", wikiSlug: "Almaty" },
  { name: "Astana", country: "Kazakhstan", countryCode: "KZ", wikiSlug: "Astana" },
  { name: "Bishkek", country: "Kyrgyzstan", countryCode: "KG", wikiSlug: "Bishkek" },

  // Middle East
  { name: "Dubai", country: "United Arab Emirates", countryCode: "AE", wikiSlug: "Dubai" },
  { name: "Istanbul", country: "Turkey", countryCode: "TR", wikiSlug: "Istanbul" },
  { name: "Antalya", country: "Turkey", countryCode: "TR", wikiSlug: "Antalya" },
  { name: "Cappadocia", country: "Turkey", countryCode: "TR", wikiSlug: "Cappadocia" },
  { name: "Bodrum", country: "Turkey", countryCode: "TR", wikiSlug: "Bodrum" },
  { name: "Pamukkale", country: "Turkey", countryCode: "TR", wikiSlug: "Pamukkale" },
  { name: "Ephesus", country: "Turkey", countryCode: "TR", wikiSlug: "Ephesus" },

  { name: "Jerusalem", country: "Israel", countryCode: "IL", wikiSlug: "Jerusalem" },
  { name: "Tel Aviv", country: "Israel", countryCode: "IL", wikiSlug: "Tel_Aviv" },
  { name: "Dead Sea", country: "Israel", countryCode: "IL", wikiSlug: "Dead_Sea" },

  { name: "Petra", country: "Jordan", countryCode: "JO", wikiSlug: "Petra" },
  { name: "Wadi Rum", country: "Jordan", countryCode: "JO", wikiSlug: "Wadi_Rum" },

  { name: "Muscat", country: "Oman", countryCode: "OM", wikiSlug: "Muscat" },
  { name: "Doha", country: "Qatar", countryCode: "QA", wikiSlug: "Doha" },
  { name: "Riyadh", country: "Saudi Arabia", countryCode: "SA", wikiSlug: "Riyadh" },
  { name: "Jeddah", country: "Saudi Arabia", countryCode: "SA", wikiSlug: "Jeddah" },

  // ============================================
  // AFRICA
  // ============================================

  { name: "Marrakech", country: "Morocco", countryCode: "MA", wikiSlug: "Marrakech" },
  { name: "Fes", country: "Morocco", countryCode: "MA", wikiSlug: "Fes" },
  { name: "Chefchaouen", country: "Morocco", countryCode: "MA", wikiSlug: "Chefchaouen" },
  { name: "Essaouira", country: "Morocco", countryCode: "MA", wikiSlug: "Essaouira" },
  { name: "Sahara Desert", country: "Morocco", countryCode: "MA", wikiSlug: "Sahara" },

  { name: "Cairo", country: "Egypt", countryCode: "EG", wikiSlug: "Cairo" },
  { name: "Luxor", country: "Egypt", countryCode: "EG", wikiSlug: "Luxor" },
  { name: "Aswan", country: "Egypt", countryCode: "EG", wikiSlug: "Aswan" },
  { name: "Sharm El Sheikh", country: "Egypt", countryCode: "EG", wikiSlug: "Sharm_El_Sheikh" },
  { name: "Hurghada", country: "Egypt", countryCode: "EG", wikiSlug: "Hurghada" },
  { name: "Giza", country: "Egypt", countryCode: "EG", wikiSlug: "Giza" },

  { name: "Cape Town", country: "South Africa", countryCode: "ZA", wikiSlug: "Cape_Town" },
  { name: "Johannesburg", country: "South Africa", countryCode: "ZA", wikiSlug: "Johannesburg" },
  { name: "Kruger National Park", country: "South Africa", countryCode: "ZA", wikiSlug: "Kruger_National_Park" },
  { name: "Garden Route", country: "South Africa", countryCode: "ZA", wikiSlug: "Garden_Route" },

  { name: "Victoria Falls", country: "Zimbabwe", countryCode: "ZW", wikiSlug: "Victoria_Falls" },

  { name: "Serengeti", country: "Tanzania", countryCode: "TZ", wikiSlug: "Serengeti" },
  { name: "Zanzibar", country: "Tanzania", countryCode: "TZ", wikiSlug: "Zanzibar" },
  { name: "Mount Kilimanjaro", country: "Tanzania", countryCode: "TZ", wikiSlug: "Mount_Kilimanjaro" },
  { name: "Dar es Salaam", country: "Tanzania", countryCode: "TZ", wikiSlug: "Dar_es_Salaam" },

  { name: "Nairobi", country: "Kenya", countryCode: "KE", wikiSlug: "Nairobi" },
  { name: "Maasai Mara", country: "Kenya", countryCode: "KE", wikiSlug: "Maasai_Mara" },
  { name: "Mombasa", country: "Kenya", countryCode: "KE", wikiSlug: "Mombasa" },

  { name: "Kigali", country: "Rwanda", countryCode: "RW", wikiSlug: "Kigali" },

  { name: "Tunis", country: "Tunisia", countryCode: "TN", wikiSlug: "Tunis" },

  { name: "Mauritius", country: "Mauritius", countryCode: "MU", wikiSlug: "Mauritius" },
  { name: "Seychelles", country: "Seychelles", countryCode: "SC", wikiSlug: "Seychelles" },
  { name: "Madagascar", country: "Madagascar", countryCode: "MG", wikiSlug: "Madagascar" },

  // ============================================
  // NORTH AMERICA
  // ============================================

  // USA
  { name: "New York City", country: "United States", countryCode: "US", wikiSlug: "New_York_City" },
  { name: "Los Angeles", country: "United States", countryCode: "US", wikiSlug: "Los_Angeles" },
  { name: "San Francisco", country: "United States", countryCode: "US", wikiSlug: "San_Francisco" },
  { name: "Las Vegas", country: "United States", countryCode: "US", wikiSlug: "Las_Vegas" },
  { name: "Miami", country: "United States", countryCode: "US", wikiSlug: "Miami" },
  { name: "Chicago", country: "United States", countryCode: "US", wikiSlug: "Chicago" },
  { name: "Washington, D.C.", country: "United States", countryCode: "US", wikiSlug: "Washington,_D.C." },
  { name: "Boston", country: "United States", countryCode: "US", wikiSlug: "Boston" },
  { name: "Seattle", country: "United States", countryCode: "US", wikiSlug: "Seattle" },
  { name: "New Orleans", country: "United States", countryCode: "US", wikiSlug: "New_Orleans" },
  { name: "San Diego", country: "United States", countryCode: "US", wikiSlug: "San_Diego" },
  { name: "Honolulu", country: "United States", countryCode: "US", wikiSlug: "Honolulu" },
  { name: "Hawaii", country: "United States", countryCode: "US", wikiSlug: "Hawaii" },
  { name: "Orlando", country: "United States", countryCode: "US", wikiSlug: "Orlando,_Florida" },
  { name: "Nashville", country: "United States", countryCode: "US", wikiSlug: "Nashville,_Tennessee" },
  { name: "Austin", country: "United States", countryCode: "US", wikiSlug: "Austin,_Texas" },
  { name: "Denver", country: "United States", countryCode: "US", wikiSlug: "Denver" },
  { name: "Portland", country: "United States", countryCode: "US", wikiSlug: "Portland,_Oregon" },
  { name: "Phoenix", country: "United States", countryCode: "US", wikiSlug: "Phoenix,_Arizona" },
  { name: "Grand Canyon", country: "United States", countryCode: "US", wikiSlug: "Grand_Canyon" },
  { name: "Yellowstone", country: "United States", countryCode: "US", wikiSlug: "Yellowstone_National_Park" },
  { name: "Yosemite", country: "United States", countryCode: "US", wikiSlug: "Yosemite_National_Park" },

  // Canada
  { name: "Toronto", country: "Canada", countryCode: "CA", wikiSlug: "Toronto" },
  { name: "Vancouver", country: "Canada", countryCode: "CA", wikiSlug: "Vancouver" },
  { name: "Montreal", country: "Canada", countryCode: "CA", wikiSlug: "Montreal" },
  { name: "Quebec City", country: "Canada", countryCode: "CA", wikiSlug: "Quebec_City" },
  { name: "Banff", country: "Canada", countryCode: "CA", wikiSlug: "Banff,_Alberta" },
  { name: "Whistler", country: "Canada", countryCode: "CA", wikiSlug: "Whistler,_British_Columbia" },
  { name: "Niagara Falls", country: "Canada", countryCode: "CA", wikiSlug: "Niagara_Falls" },
  { name: "Calgary", country: "Canada", countryCode: "CA", wikiSlug: "Calgary" },
  { name: "Ottawa", country: "Canada", countryCode: "CA", wikiSlug: "Ottawa" },
  { name: "Victoria", country: "Canada", countryCode: "CA", wikiSlug: "Victoria,_British_Columbia" },

  // Mexico
  { name: "Mexico City", country: "Mexico", countryCode: "MX", wikiSlug: "Mexico_City" },
  { name: "Cancún", country: "Mexico", countryCode: "MX", wikiSlug: "Cancún" },
  { name: "Playa del Carmen", country: "Mexico", countryCode: "MX", wikiSlug: "Playa_del_Carmen" },
  { name: "Tulum", country: "Mexico", countryCode: "MX", wikiSlug: "Tulum" },
  { name: "Oaxaca", country: "Mexico", countryCode: "MX", wikiSlug: "Oaxaca_City" },
  { name: "San Miguel de Allende", country: "Mexico", countryCode: "MX", wikiSlug: "San_Miguel_de_Allende" },
  { name: "Guadalajara", country: "Mexico", countryCode: "MX", wikiSlug: "Guadalajara" },
  { name: "Puerto Vallarta", country: "Mexico", countryCode: "MX", wikiSlug: "Puerto_Vallarta" },
  { name: "Cabo San Lucas", country: "Mexico", countryCode: "MX", wikiSlug: "Cabo_San_Lucas" },
  { name: "Mérida", country: "Mexico", countryCode: "MX", wikiSlug: "Mérida,_Yucatán" },

  // ============================================
  // CENTRAL AMERICA & CARIBBEAN
  // ============================================

  { name: "San José", country: "Costa Rica", countryCode: "CR", wikiSlug: "San_José,_Costa_Rica" },
  { name: "Monteverde", country: "Costa Rica", countryCode: "CR", wikiSlug: "Monteverde" },
  { name: "Manuel Antonio", country: "Costa Rica", countryCode: "CR", wikiSlug: "Manuel_Antonio_National_Park" },

  { name: "Panama City", country: "Panama", countryCode: "PA", wikiSlug: "Panama_City" },
  { name: "Bocas del Toro", country: "Panama", countryCode: "PA", wikiSlug: "Bocas_del_Toro" },

  { name: "Antigua", country: "Guatemala", countryCode: "GT", wikiSlug: "Antigua_Guatemala" },
  { name: "Lake Atitlán", country: "Guatemala", countryCode: "GT", wikiSlug: "Lake_Atitlán" },
  { name: "Guatemala City", country: "Guatemala", countryCode: "GT", wikiSlug: "Guatemala_City" },

  { name: "Belize City", country: "Belize", countryCode: "BZ", wikiSlug: "Belize_City" },
  { name: "San Pedro", country: "Belize", countryCode: "BZ", wikiSlug: "San_Pedro,_Belize" },

  { name: "Havana", country: "Cuba", countryCode: "CU", wikiSlug: "Havana" },
  { name: "Trinidad", country: "Cuba", countryCode: "CU", wikiSlug: "Trinidad,_Cuba" },
  { name: "Varadero", country: "Cuba", countryCode: "CU", wikiSlug: "Varadero" },

  { name: "Punta Cana", country: "Dominican Republic", countryCode: "DO", wikiSlug: "Punta_Cana" },
  { name: "Santo Domingo", country: "Dominican Republic", countryCode: "DO", wikiSlug: "Santo_Domingo" },

  { name: "San Juan", country: "Puerto Rico", countryCode: "PR", wikiSlug: "San_Juan,_Puerto_Rico" },

  { name: "Nassau", country: "Bahamas", countryCode: "BS", wikiSlug: "Nassau,_Bahamas" },

  { name: "Montego Bay", country: "Jamaica", countryCode: "JM", wikiSlug: "Montego_Bay" },
  { name: "Kingston", country: "Jamaica", countryCode: "JM", wikiSlug: "Kingston,_Jamaica" },

  { name: "Aruba", country: "Aruba", countryCode: "AW", wikiSlug: "Aruba" },
  { name: "Curaçao", country: "Curaçao", countryCode: "CW", wikiSlug: "Curaçao" },
  { name: "Saint Lucia", country: "Saint Lucia", countryCode: "LC", wikiSlug: "Saint_Lucia" },
  { name: "Barbados", country: "Barbados", countryCode: "BB", wikiSlug: "Barbados" },

  // ============================================
  // SOUTH AMERICA
  // ============================================

  { name: "Rio de Janeiro", country: "Brazil", countryCode: "BR", wikiSlug: "Rio_de_Janeiro" },
  { name: "São Paulo", country: "Brazil", countryCode: "BR", wikiSlug: "São_Paulo" },
  { name: "Salvador", country: "Brazil", countryCode: "BR", wikiSlug: "Salvador,_Bahia" },
  { name: "Florianópolis", country: "Brazil", countryCode: "BR", wikiSlug: "Florianópolis" },
  { name: "Iguazu Falls", country: "Brazil", countryCode: "BR", wikiSlug: "Iguazu_Falls" },
  { name: "Fernando de Noronha", country: "Brazil", countryCode: "BR", wikiSlug: "Fernando_de_Noronha" },
  { name: "Amazon Rainforest", country: "Brazil", countryCode: "BR", wikiSlug: "Amazon_rainforest" },
  { name: "Manaus", country: "Brazil", countryCode: "BR", wikiSlug: "Manaus" },

  { name: "Buenos Aires", country: "Argentina", countryCode: "AR", wikiSlug: "Buenos_Aires" },
  { name: "Mendoza", country: "Argentina", countryCode: "AR", wikiSlug: "Mendoza,_Argentina" },
  { name: "Patagonia", country: "Argentina", countryCode: "AR", wikiSlug: "Patagonia" },
  { name: "Bariloche", country: "Argentina", countryCode: "AR", wikiSlug: "San_Carlos_de_Bariloche" },
  { name: "El Calafate", country: "Argentina", countryCode: "AR", wikiSlug: "El_Calafate" },
  { name: "Ushuaia", country: "Argentina", countryCode: "AR", wikiSlug: "Ushuaia" },

  { name: "Santiago", country: "Chile", countryCode: "CL", wikiSlug: "Santiago" },
  { name: "Valparaíso", country: "Chile", countryCode: "CL", wikiSlug: "Valparaíso" },
  { name: "Atacama Desert", country: "Chile", countryCode: "CL", wikiSlug: "Atacama_Desert" },
  { name: "Torres del Paine", country: "Chile", countryCode: "CL", wikiSlug: "Torres_del_Paine_National_Park" },
  { name: "Easter Island", country: "Chile", countryCode: "CL", wikiSlug: "Easter_Island" },

  { name: "Lima", country: "Peru", countryCode: "PE", wikiSlug: "Lima" },
  { name: "Cusco", country: "Peru", countryCode: "PE", wikiSlug: "Cusco" },
  { name: "Machu Picchu", country: "Peru", countryCode: "PE", wikiSlug: "Machu_Picchu" },
  { name: "Sacred Valley", country: "Peru", countryCode: "PE", wikiSlug: "Sacred_Valley" },
  { name: "Lake Titicaca", country: "Peru", countryCode: "PE", wikiSlug: "Lake_Titicaca" },
  { name: "Arequipa", country: "Peru", countryCode: "PE", wikiSlug: "Arequipa" },

  { name: "Bogotá", country: "Colombia", countryCode: "CO", wikiSlug: "Bogotá" },
  { name: "Cartagena", country: "Colombia", countryCode: "CO", wikiSlug: "Cartagena,_Colombia" },
  { name: "Medellín", country: "Colombia", countryCode: "CO", wikiSlug: "Medellín" },
  { name: "Cali", country: "Colombia", countryCode: "CO", wikiSlug: "Cali" },

  { name: "Quito", country: "Ecuador", countryCode: "EC", wikiSlug: "Quito" },
  { name: "Galápagos Islands", country: "Ecuador", countryCode: "EC", wikiSlug: "Galápagos_Islands" },
  { name: "Guayaquil", country: "Ecuador", countryCode: "EC", wikiSlug: "Guayaquil" },

  { name: "La Paz", country: "Bolivia", countryCode: "BO", wikiSlug: "La_Paz" },
  { name: "Uyuni", country: "Bolivia", countryCode: "BO", wikiSlug: "Uyuni" },
  { name: "Salar de Uyuni", country: "Bolivia", countryCode: "BO", wikiSlug: "Salar_de_Uyuni" },

  { name: "Montevideo", country: "Uruguay", countryCode: "UY", wikiSlug: "Montevideo" },
  { name: "Punta del Este", country: "Uruguay", countryCode: "UY", wikiSlug: "Punta_del_Este" },

  // ============================================
  // OCEANIA
  // ============================================

  { name: "Sydney", country: "Australia", countryCode: "AU", wikiSlug: "Sydney" },
  { name: "Melbourne", country: "Australia", countryCode: "AU", wikiSlug: "Melbourne" },
  { name: "Brisbane", country: "Australia", countryCode: "AU", wikiSlug: "Brisbane" },
  { name: "Perth", country: "Australia", countryCode: "AU", wikiSlug: "Perth" },
  { name: "Gold Coast", country: "Australia", countryCode: "AU", wikiSlug: "Gold_Coast,_Queensland" },
  { name: "Cairns", country: "Australia", countryCode: "AU", wikiSlug: "Cairns" },
  { name: "Great Barrier Reef", country: "Australia", countryCode: "AU", wikiSlug: "Great_Barrier_Reef" },
  { name: "Adelaide", country: "Australia", countryCode: "AU", wikiSlug: "Adelaide" },
  { name: "Tasmania", country: "Australia", countryCode: "AU", wikiSlug: "Tasmania" },
  { name: "Uluru", country: "Australia", countryCode: "AU", wikiSlug: "Uluru" },

  { name: "Auckland", country: "New Zealand", countryCode: "NZ", wikiSlug: "Auckland" },
  { name: "Wellington", country: "New Zealand", countryCode: "NZ", wikiSlug: "Wellington" },
  { name: "Queenstown", country: "New Zealand", countryCode: "NZ", wikiSlug: "Queenstown,_New_Zealand" },
  { name: "Rotorua", country: "New Zealand", countryCode: "NZ", wikiSlug: "Rotorua" },
  { name: "Milford Sound", country: "New Zealand", countryCode: "NZ", wikiSlug: "Milford_Sound" },
  { name: "Christchurch", country: "New Zealand", countryCode: "NZ", wikiSlug: "Christchurch" },

  { name: "Fiji", country: "Fiji", countryCode: "FJ", wikiSlug: "Fiji" },
  { name: "Tahiti", country: "French Polynesia", countryCode: "PF", wikiSlug: "Tahiti" },
  { name: "Bora Bora", country: "French Polynesia", countryCode: "PF", wikiSlug: "Bora_Bora" },
  { name: "Moorea", country: "French Polynesia", countryCode: "PF", wikiSlug: "Moorea" },
  { name: "Samoa", country: "Samoa", countryCode: "WS", wikiSlug: "Samoa" },
  { name: "Vanuatu", country: "Vanuatu", countryCode: "VU", wikiSlug: "Vanuatu" },
  { name: "Palau", country: "Palau", countryCode: "PW", wikiSlug: "Palau" },
];
