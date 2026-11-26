import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import billService from '../../services/billService';
import walletService from '../../services/walletService';
import { ALL_INDIAN_STATES, buildAllDistrictsForCategory } from '../../data/indianLocations';
import {
  ReceiptIcon,
  ZapIcon,
  DropletIcon,
  FlameIcon,
  TvIcon,
  WifiIcon,
  PhoneCallIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  LandmarkIcon,
  BuildingIcon,
  BookmarkIcon,
  HistoryIcon,
  SearchIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XIcon,
  CopyIcon,
  CheckIcon,
  WalletIcon,
  ArrowRightIcon,
  FilterIcon,
  SparklesIcon,
  ChevronDownIcon,
  TrashIcon,
  DownloadIcon,
  SmartphoneIcon,
  MapPinIcon
} from '../../components/Icons';

// Category Icon Mapping (Lucide & Custom SVG icons)
const getCategoryIcon = (categoryKey, size = 20, className = '') => {
  const key = String(categoryKey || '').toLowerCase();
  switch (key) {
    case 'electricity':
      return <ZapIcon size={size} className={className} />;
    case 'water':
      return <DropletIcon size={size} className={className} />;
    case 'gas':
    case 'piped-gas':
    case 'piped_gas':
      return <FlameIcon size={size} className={className} />;
    case 'dth':
      return <TvIcon size={size} className={className} />;
    case 'broadband':
    case 'internet':
      return <WifiIcon size={size} className={className} />;
    case 'mobile':
    case 'mobile_postpaid':
    case 'mobile-postpaid':
    case 'mobile-prepaid':
      return <SmartphoneIcon size={size} className={className} />;
    case 'landline':
    case 'telephone':
      return <PhoneCallIcon size={size} className={className} />;
    case 'fastag':
    case 'credit-card':
    case 'credit_card':
      return <CreditCardIcon size={size} className={className} />;
    case 'insurance':
    case 'life-insurance':
      return <ShieldCheckIcon size={size} className={className} />;
    case 'loan-repayment':
    case 'loan_repayment':
    case 'loan':
    case 'emi':
      return <LandmarkIcon size={size} className={className} />;
    case 'municipal-taxes':
    case 'municipal_taxes':
    case 'municipal':
    case 'property-tax':
      return <BuildingIcon size={size} className={className} />;
    default:
      return <ReceiptIcon size={size} className={className} />;
  }
};

const formatINR = (val) => {
  const num = parseFloat(val) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (_) {
    return dateStr;
  }
};

// Comprehensive District to Electricity Discom Mapping across India
const ALL_DISTRICTS_MAPPING = [
  // Madhya Pradesh - West Discom (MPPKVVCL-W: Indore & Ujjain Region)
  { name: 'Indore', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-W', discomName: 'MPPKVVCL – West Discom', region: 'West Discom (Indore & Ujjain Region)', demoConsumer: '1000234567' },
  { name: 'Ujjain', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-W', discomName: 'MPPKVVCL – West Discom', region: 'West Discom (Indore & Ujjain Region)', demoConsumer: '1000345678' },
  { name: 'Dewas', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-W', discomName: 'MPPKVVCL – West Discom', region: 'West Discom (Indore & Ujjain Region)', demoConsumer: '1000456789' },
  { name: 'Dhar', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-W', discomName: 'MPPKVVCL – West Discom', region: 'West Discom (Indore & Ujjain Region)', demoConsumer: '1000567890' },
  { name: 'Khargone', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-W', discomName: 'MPPKVVCL – West Discom', region: 'West Discom (Indore & Ujjain Region)', demoConsumer: '1000678901' },
  { name: 'Khandwa', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-W', discomName: 'MPPKVVCL – West Discom', region: 'West Discom (Indore & Ujjain Region)', demoConsumer: '1000789012' },
  { name: 'Ratlam', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-W', discomName: 'MPPKVVCL – West Discom', region: 'West Discom (Indore & Ujjain Region)', demoConsumer: '1000890123' },
  { name: 'Mandsaur', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-W', discomName: 'MPPKVVCL – West Discom', region: 'West Discom (Indore & Ujjain Region)', demoConsumer: '1000901234' },
  { name: 'Neemuch', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-W', discomName: 'MPPKVVCL – West Discom', region: 'West Discom (Indore & Ujjain Region)', demoConsumer: '1000912345' },
  { name: 'Barwani', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-W', discomName: 'MPPKVVCL – West Discom', region: 'West Discom (Indore & Ujjain Region)', demoConsumer: '1000923456' },
  { name: 'Jhabua', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-W', discomName: 'MPPKVVCL – West Discom', region: 'West Discom (Indore & Ujjain Region)', demoConsumer: '1000934567' },
  { name: 'Alirajpur', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-W', discomName: 'MPPKVVCL – West Discom', region: 'West Discom (Indore & Ujjain Region)', demoConsumer: '1000945678' },
  { name: 'Burhanpur', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-W', discomName: 'MPPKVVCL – West Discom', region: 'West Discom (Indore & Ujjain Region)', demoConsumer: '1000956789' },
  { name: 'Agar Malwa', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-W', discomName: 'MPPKVVCL – West Discom', region: 'West Discom (Indore & Ujjain Region)', demoConsumer: '1000967890' },
  { name: 'Shajapur', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-W', discomName: 'MPPKVVCL – West Discom', region: 'West Discom (Indore & Ujjain Region)', demoConsumer: '1000978901' },

  // Madhya Pradesh - Central Discom (MPMKVVCL-C: Bhopal & Gwalior Region)
  { name: 'Bhopal', state: 'Madhya Pradesh', discomCode: 'MPMKVVCL-C', discomName: 'MPMKVVCL – Central Discom', region: 'Central Discom (Bhopal & Gwalior Region)', demoConsumer: '2000234567' },
  { name: 'Gwalior', state: 'Madhya Pradesh', discomCode: 'MPMKVVCL-C', discomName: 'MPMKVVCL – Central Discom', region: 'Central Discom (Bhopal & Gwalior Region)', demoConsumer: '2000345678' },
  { name: 'Sehore', state: 'Madhya Pradesh', discomCode: 'MPMKVVCL-C', discomName: 'MPMKVVCL – Central Discom', region: 'Central Discom (Bhopal & Gwalior Region)', demoConsumer: '2000456789' },
  { name: 'Vidisha', state: 'Madhya Pradesh', discomCode: 'MPMKVVCL-C', discomName: 'MPMKVVCL – Central Discom', region: 'Central Discom (Bhopal & Gwalior Region)', demoConsumer: '2000567890' },
  { name: 'Raisen', state: 'Madhya Pradesh', discomCode: 'MPMKVVCL-C', discomName: 'MPMKVVCL – Central Discom', region: 'Central Discom (Bhopal & Gwalior Region)', demoConsumer: '2000678901' },
  { name: 'Hoshangabad', state: 'Madhya Pradesh', discomCode: 'MPMKVVCL-C', discomName: 'MPMKVVCL – Central Discom', region: 'Central Discom (Bhopal & Gwalior Region)', demoConsumer: '2000789012' },
  { name: 'Narmadapuram', state: 'Madhya Pradesh', discomCode: 'MPMKVVCL-C', discomName: 'MPMKVVCL – Central Discom', region: 'Central Discom (Bhopal & Gwalior Region)', demoConsumer: '2000789013' },
  { name: 'Rajgarh', state: 'Madhya Pradesh', discomCode: 'MPMKVVCL-C', discomName: 'MPMKVVCL – Central Discom', region: 'Central Discom (Bhopal & Gwalior Region)', demoConsumer: '2000890123' },
  { name: 'Betul', state: 'Madhya Pradesh', discomCode: 'MPMKVVCL-C', discomName: 'MPMKVVCL – Central Discom', region: 'Central Discom (Bhopal & Gwalior Region)', demoConsumer: '2000901234' },
  { name: 'Guna', state: 'Madhya Pradesh', discomCode: 'MPMKVVCL-C', discomName: 'MPMKVVCL – Central Discom', region: 'Central Discom (Bhopal & Gwalior Region)', demoConsumer: '2000912345' },
  { name: 'Shivpuri', state: 'Madhya Pradesh', discomCode: 'MPMKVVCL-C', discomName: 'MPMKVVCL – Central Discom', region: 'Central Discom (Bhopal & Gwalior Region)', demoConsumer: '2000923456' },
  { name: 'Bhind', state: 'Madhya Pradesh', discomCode: 'MPMKVVCL-C', discomName: 'MPMKVVCL – Central Discom', region: 'Central Discom (Bhopal & Gwalior Region)', demoConsumer: '2000934567' },
  { name: 'Morena', state: 'Madhya Pradesh', discomCode: 'MPMKVVCL-C', discomName: 'MPMKVVCL – Central Discom', region: 'Central Discom (Bhopal & Gwalior Region)', demoConsumer: '2000945678' },
  { name: 'Sheopur', state: 'Madhya Pradesh', discomCode: 'MPMKVVCL-C', discomName: 'MPMKVVCL – Central Discom', region: 'Central Discom (Bhopal & Gwalior Region)', demoConsumer: '2000956789' },
  { name: 'Datia', state: 'Madhya Pradesh', discomCode: 'MPMKVVCL-C', discomName: 'MPMKVVCL – Central Discom', region: 'Central Discom (Bhopal & Gwalior Region)', demoConsumer: '2000967890' },
  { name: 'Ashoknagar', state: 'Madhya Pradesh', discomCode: 'MPMKVVCL-C', discomName: 'MPMKVVCL – Central Discom', region: 'Central Discom (Bhopal & Gwalior Region)', demoConsumer: '2000978901' },

  // Madhya Pradesh - East Discom (MPPKVVCL-JBP: Jabalpur, Rewa & Sagar Region)
  { name: 'Jabalpur', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-JBP', discomName: 'MPPKVVCL-JBP – East Discom', region: 'East Discom (Jabalpur, Rewa & Sagar Region)', demoConsumer: '3000234567' },
  { name: 'Rewa', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-JBP', discomName: 'MPPKVVCL-JBP – East Discom', region: 'East Discom (Jabalpur, Rewa & Sagar Region)', demoConsumer: '3000345678' },
  { name: 'Sagar', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-JBP', discomName: 'MPPKVVCL-JBP – East Discom', region: 'East Discom (Jabalpur, Rewa & Sagar Region)', demoConsumer: '3000456789' },
  { name: 'Satna', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-JBP', discomName: 'MPPKVVCL-JBP – East Discom', region: 'East Discom (Jabalpur, Rewa & Sagar Region)', demoConsumer: '3000567890' },
  { name: 'Katni', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-JBP', discomName: 'MPPKVVCL-JBP – East Discom', region: 'East Discom (Jabalpur, Rewa & Sagar Region)', demoConsumer: '3000678901' },
  { name: 'Chhindwara', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-JBP', discomName: 'MPPKVVCL-JBP – East Discom', region: 'East Discom (Jabalpur, Rewa & Sagar Region)', demoConsumer: '3000789012' },
  { name: 'Damoh', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-JBP', discomName: 'MPPKVVCL-JBP – East Discom', region: 'East Discom (Jabalpur, Rewa & Sagar Region)', demoConsumer: '3000890123' },
  { name: 'Shahdol', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-JBP', discomName: 'MPPKVVCL-JBP – East Discom', region: 'East Discom (Jabalpur, Rewa & Sagar Region)', demoConsumer: '3000901234' },
  { name: 'Singrauli', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-JBP', discomName: 'MPPKVVCL-JBP – East Discom', region: 'East Discom (Jabalpur, Rewa & Sagar Region)', demoConsumer: '3000912345' },
  { name: 'Sidhi', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-JBP', discomName: 'MPPKVVCL-JBP – East Discom', region: 'East Discom (Jabalpur, Rewa & Sagar Region)', demoConsumer: '3000923456' },
  { name: 'Seoni', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-JBP', discomName: 'MPPKVVCL-JBP – East Discom', region: 'East Discom (Jabalpur, Rewa & Sagar Region)', demoConsumer: '3000934567' },
  { name: 'Mandla', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-JBP', discomName: 'MPPKVVCL-JBP – East Discom', region: 'East Discom (Jabalpur, Rewa & Sagar Region)', demoConsumer: '3000945678' },
  { name: 'Narsinghpur', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-JBP', discomName: 'MPPKVVCL-JBP – East Discom', region: 'East Discom (Jabalpur, Rewa & Sagar Region)', demoConsumer: '3000956789' },
  { name: 'Panna', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-JBP', discomName: 'MPPKVVCL-JBP – East Discom', region: 'East Discom (Jabalpur, Rewa & Sagar Region)', demoConsumer: '3000967890' },
  { name: 'Chhatarpur', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-JBP', discomName: 'MPPKVVCL-JBP – East Discom', region: 'East Discom (Jabalpur, Rewa & Sagar Region)', demoConsumer: '3000978901' },
  { name: 'Tikamgarh', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-JBP', discomName: 'MPPKVVCL-JBP – East Discom', region: 'East Discom (Jabalpur, Rewa & Sagar Region)', demoConsumer: '3000989012' },
  { name: 'Dindori', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-JBP', discomName: 'MPPKVVCL-JBP – East Discom', region: 'East Discom (Jabalpur, Rewa & Sagar Region)', demoConsumer: '3000990123' },
  { name: 'Umaria', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-JBP', discomName: 'MPPKVVCL-JBP – East Discom', region: 'East Discom (Jabalpur, Rewa & Sagar Region)', demoConsumer: '3000991234' },
  { name: 'Anuppur', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-JBP', discomName: 'MPPKVVCL-JBP – East Discom', region: 'East Discom (Jabalpur, Rewa & Sagar Region)', demoConsumer: '3000992345' },
  { name: 'Niwari', state: 'Madhya Pradesh', discomCode: 'MPPKVVCL-JBP', discomName: 'MPPKVVCL-JBP – East Discom', region: 'East Discom (Jabalpur, Rewa & Sagar Region)', demoConsumer: '3000993456' },

  // Delhi
  { name: 'South Delhi', state: 'Delhi', discomCode: 'BSES-RAJ', discomName: 'BSES Rajdhani', region: 'South & West Delhi', demoConsumer: '100123456' },
  { name: 'West Delhi', state: 'Delhi', discomCode: 'BSES-RAJ', discomName: 'BSES Rajdhani', region: 'South & West Delhi', demoConsumer: '100123457' },
  { name: 'Dwarka', state: 'Delhi', discomCode: 'BSES-RAJ', discomName: 'BSES Rajdhani', region: 'South & West Delhi', demoConsumer: '100123458' },
  { name: 'East Delhi', state: 'Delhi', discomCode: 'BSES-YAM', discomName: 'BSES Yamuna', region: 'East & Central Delhi', demoConsumer: '200123456' },
  { name: 'Central Delhi', state: 'Delhi', discomCode: 'BSES-YAM', discomName: 'BSES Yamuna', region: 'East & Central Delhi', demoConsumer: '200123457' },
  { name: 'North Delhi', state: 'Delhi', discomCode: 'TPDDL-DEL', discomName: 'Tata Power DDL', region: 'North & North-West Delhi', demoConsumer: '60001234567' },
  { name: 'Rohini', state: 'Delhi', discomCode: 'TPDDL-DEL', discomName: 'Tata Power DDL', region: 'North & North-West Delhi', demoConsumer: '60001234568' },

  // Maharashtra
  { name: 'Mumbai Suburbs', state: 'Maharashtra', discomCode: 'ADANI-MUM', discomName: 'Adani Electricity Mumbai', region: 'Mumbai Suburban Area', demoConsumer: '100123456' },
  { name: 'South Mumbai', state: 'Maharashtra', discomCode: 'TATAPOWER-MUM', discomName: 'Tata Power Mumbai', region: 'Mumbai City & Suburban', demoConsumer: '900000123456' },
  { name: 'Pune', state: 'Maharashtra', discomCode: 'MSEDCL-MAHA', discomName: 'MSEDCL Mahavitaran', region: 'Rest of Maharashtra', demoConsumer: '100123456789' },
  { name: 'Nagpur', state: 'Maharashtra', discomCode: 'MSEDCL-MAHA', discomName: 'MSEDCL Mahavitaran', region: 'Rest of Maharashtra', demoConsumer: '100123456790' },
  { name: 'Nashik', state: 'Maharashtra', discomCode: 'MSEDCL-MAHA', discomName: 'MSEDCL Mahavitaran', region: 'Rest of Maharashtra', demoConsumer: '100123456791' },
  { name: 'Thane', state: 'Maharashtra', discomCode: 'MSEDCL-MAHA', discomName: 'MSEDCL Mahavitaran', region: 'Rest of Maharashtra', demoConsumer: '100123456792' },

  // Rajasthan
  { name: 'Jaipur', state: 'Rajasthan', discomCode: 'JVVNL-RAJ', discomName: 'Jaipur Vidyut (JVVNL)', region: 'Jaipur & Eastern Rajasthan', demoConsumer: '210012345678' },
  { name: 'Kota', state: 'Rajasthan', discomCode: 'JVVNL-RAJ', discomName: 'Jaipur Vidyut (JVVNL)', region: 'Jaipur & Eastern Rajasthan', demoConsumer: '210012345679' },
  { name: 'Ajmer', state: 'Rajasthan', discomCode: 'AVVNL-RAJ', discomName: 'Ajmer Vidyut (AVVNL)', region: 'Ajmer & Central/Southern Rajasthan', demoConsumer: '310012345678' },
  { name: 'Udaipur', state: 'Rajasthan', discomCode: 'AVVNL-RAJ', discomName: 'Ajmer Vidyut (AVVNL)', region: 'Ajmer & Central/Southern Rajasthan', demoConsumer: '310012345679' },
  { name: 'Jodhpur', state: 'Rajasthan', discomCode: 'JDVVNL-RAJ', discomName: 'Jodhpur Vidyut (JdVVNL)', region: 'Jodhpur & Western Rajasthan', demoConsumer: '410012345678' },
  { name: 'Bikaner', state: 'Rajasthan', discomCode: 'JDVVNL-RAJ', discomName: 'Jodhpur Vidyut (JdVVNL)', region: 'Jodhpur & Western Rajasthan', demoConsumer: '410012345679' },

  // Gujarat
  { name: 'Surat', state: 'Gujarat', discomCode: 'DGVCL-GUJ', discomName: 'Dakshin Gujarat (DGVCL)', region: 'South Gujarat', demoConsumer: '10023456789' },
  { name: 'Vadodara', state: 'Gujarat', discomCode: 'MGVCL-GUJ', discomName: 'Madhya Gujarat (MGVCL)', region: 'Central Gujarat', demoConsumer: '20023456789' },
  { name: 'Rajkot', state: 'Gujarat', discomCode: 'PGVCL-GUJ', discomName: 'Paschim Gujarat (PGVCL)', region: 'Saurashtra & Kutch', demoConsumer: '30023456789' },
  { name: 'Ahmedabad', state: 'Gujarat', discomCode: 'UGVCL-GUJ', discomName: 'Uttar Gujarat (UGVCL)', region: 'North Gujarat', demoConsumer: '40023456789' },

  // Karnataka
  { name: 'Bengaluru Urban', state: 'Karnataka', discomCode: 'BESCOM-KA', discomName: 'BESCOM Bengaluru', region: 'Bengaluru & Central Karnataka', demoConsumer: '1000123456' },
  { name: 'Bengaluru Rural', state: 'Karnataka', discomCode: 'BESCOM-KA', discomName: 'BESCOM Bengaluru', region: 'Bengaluru & Central Karnataka', demoConsumer: '1000123457' },

  // Telangana
  { name: 'Hyderabad', state: 'Telangana', discomCode: 'TSSPDCL-TG', discomName: 'TSSPDCL Hyderabad', region: 'Southern Telangana & Hyderabad', demoConsumer: '100123456' },
  { name: 'Secunderabad', state: 'Telangana', discomCode: 'TSSPDCL-TG', discomName: 'TSSPDCL Hyderabad', region: 'Southern Telangana & Hyderabad', demoConsumer: '100123457' },

  // Haryana
  { name: 'Gurugram', state: 'Haryana', discomCode: 'DHBVN-HR', discomName: 'DHBVN Haryana', region: 'South & West Haryana', demoConsumer: '1000123456' },
  { name: 'Faridabad', state: 'Haryana', discomCode: 'DHBVN-HR', discomName: 'DHBVN Haryana', region: 'South & West Haryana', demoConsumer: '1000123457' },
  { name: 'Ambala', state: 'Haryana', discomCode: 'UHBVN-HR', discomName: 'UHBVN Haryana', region: 'North & East Haryana', demoConsumer: '2000123456' },
  { name: 'Panchkula', state: 'Haryana', discomCode: 'UHBVN-HR', discomName: 'UHBVN Haryana', region: 'North & East Haryana', demoConsumer: '2000123457' }
];

// District / City mappings for Water, Gas & Municipal Taxes across India
const WATER_DISTRICTS_MAPPING = [
  { name: 'Indore', state: 'Madhya Pradesh', discomCode: 'IMC-WATER', discomName: 'Indore Municipal Corporation - Water', matchName: 'Indore Municipal', region: 'Indore Municipal Area', demoConsumer: '1002345678' },
  { name: 'Bhopal', state: 'Madhya Pradesh', discomCode: 'IMC-WATER', discomName: 'MP Municipal Water (IMC/BMC)', matchName: 'Indore Municipal', region: 'Madhya Pradesh Urban Water', demoConsumer: '1002345679' },
  { name: 'Jabalpur', state: 'Madhya Pradesh', discomCode: 'IMC-WATER', discomName: 'MP Municipal Water', matchName: 'Indore Municipal', region: 'Madhya Pradesh Urban Water', demoConsumer: '1002345680' },
  { name: 'Gwalior', state: 'Madhya Pradesh', discomCode: 'IMC-WATER', discomName: 'MP Municipal Water', matchName: 'Indore Municipal', region: 'Madhya Pradesh Urban Water', demoConsumer: '1002345681' },
  { name: 'New Delhi', state: 'Delhi', discomCode: 'DJB-DEL', discomName: 'Delhi Jal Board (DJB)', matchName: 'Delhi Jal Board', region: 'NCT of Delhi', demoConsumer: '1002345678' },
  { name: 'South Delhi', state: 'Delhi', discomCode: 'DJB-DEL', discomName: 'Delhi Jal Board (DJB)', matchName: 'Delhi Jal Board', region: 'South Delhi Zone', demoConsumer: '1002345679' },
  { name: 'Mumbai', state: 'Maharashtra', discomCode: 'MCGM-WATER', discomName: 'MCGM Water (Mumbai)', matchName: 'Greater Mumbai', region: 'Greater Mumbai', demoConsumer: '1002345678' },
  { name: 'Pune', state: 'Maharashtra', discomCode: 'MCGM-WATER', discomName: 'Maharashtra Municipal Water', matchName: 'Greater Mumbai', region: 'Pune / Maharashtra Urban', demoConsumer: '1002345679' },
  { name: 'Nagpur', state: 'Maharashtra', discomCode: 'MCGM-WATER', discomName: 'Maharashtra Municipal Water', matchName: 'Greater Mumbai', region: 'Nagpur / Maharashtra Urban', demoConsumer: '1002345680' },
  { name: 'Bengaluru', state: 'Karnataka', discomCode: 'BWSSB-KA', discomName: 'BWSSB Bengaluru', matchName: 'Bangalore Water', region: 'Bengaluru Urban', demoConsumer: '1002345678' },
  { name: 'Ahmedabad', state: 'Gujarat', discomCode: 'MCGM-WATER', discomName: 'Gujarat Municipal Water (AMC/BBPS)', matchName: 'Greater Mumbai', region: 'Ahmedabad & North Gujarat', demoConsumer: '1002345682' },
  { name: 'Surat', state: 'Gujarat', discomCode: 'MCGM-WATER', discomName: 'Gujarat Municipal Water (SMC/BBPS)', matchName: 'Greater Mumbai', region: 'Surat & South Gujarat', demoConsumer: '1002345683' },
  { name: 'Vadodara', state: 'Gujarat', discomCode: 'MCGM-WATER', discomName: 'Gujarat Municipal Water (VMC/BBPS)', matchName: 'Greater Mumbai', region: 'Vadodara & Central Gujarat', demoConsumer: '1002345684' },
  { name: 'Rajkot', state: 'Gujarat', discomCode: 'MCGM-WATER', discomName: 'Gujarat Municipal Water (RMC/BBPS)', matchName: 'Greater Mumbai', region: 'Rajkot & Saurashtra', demoConsumer: '1002345685' },
  { name: 'Jaipur', state: 'Rajasthan', discomCode: 'DJB-DEL', discomName: 'PHED Rajasthan Water', matchName: 'Delhi Jal Board', region: 'Jaipur & Eastern Rajasthan', demoConsumer: '1002345686' },
  { name: 'Lucknow', state: 'Uttar Pradesh', discomCode: 'DJB-DEL', discomName: 'UP Jal Sansthan', matchName: 'Delhi Jal Board', region: 'Lucknow & Central UP', demoConsumer: '1002345687' },
  { name: 'Noida', state: 'Uttar Pradesh', discomCode: 'DJB-DEL', discomName: 'Noida Jal Authority', matchName: 'Delhi Jal Board', region: 'Gautam Buddha Nagar (NCR)', demoConsumer: '1002345688' },
  { name: 'Gurugram', state: 'Haryana', discomCode: 'DJB-DEL', discomName: 'GMDA Water Supply', matchName: 'Delhi Jal Board', region: 'Gurugram NCR', demoConsumer: '1002345689' },
  { name: 'Hyderabad', state: 'Telangana', discomCode: 'BWSSB-KA', discomName: 'HMWSSB Hyderabad', matchName: 'Bangalore Water', region: 'Greater Hyderabad', demoConsumer: '1002345690' }
];

const GAS_DISTRICTS_MAPPING = [
  { name: 'New Delhi / NCR', state: 'Delhi', discomCode: 'IGL-DEL', discomName: 'Indraprastha Gas Limited (IGL)', matchName: 'Indraprastha Gas', region: 'Delhi, Noida & Ghaziabad', demoConsumer: '1002345678' },
  { name: 'Noida / Ghaziabad', state: 'Uttar Pradesh', discomCode: 'IGL-DEL', discomName: 'Indraprastha Gas Limited (IGL)', matchName: 'Indraprastha Gas', region: 'NCR Piped Gas', demoConsumer: '1002345679' },
  { name: 'Gurugram', state: 'Haryana', discomCode: 'IGL-DEL', discomName: 'IGL / Haryana City Gas', matchName: 'Indraprastha Gas', region: 'Gurugram NCR', demoConsumer: '1002345680' },
  { name: 'Mumbai / Thane', state: 'Maharashtra', discomCode: 'MGL-MUM', discomName: 'Mahanagar Gas Limited (MGL)', matchName: 'Mahanagar Gas', region: 'Mumbai Metropolitan Region', demoConsumer: '1002345678' },
  { name: 'Pune', state: 'Maharashtra', discomCode: 'MGL-MUM', discomName: 'MGL / MNGL Piped Gas', matchName: 'Mahanagar Gas', region: 'Pune Region', demoConsumer: '1002345681' },
  { name: 'Ahmedabad', state: 'Gujarat', discomCode: 'INDANE-GAS', discomName: 'Gujarat Gas / Indane', matchName: 'Indane Gas', region: 'Ahmedabad & North Gujarat', demoConsumer: '1002345682' },
  { name: 'Surat', state: 'Gujarat', discomCode: 'BHARAT-GAS', discomName: 'Gujarat Gas / Bharat Gas', matchName: 'Bharat Gas', region: 'Surat & South Gujarat', demoConsumer: '1002345683' },
  { name: 'Indore', state: 'Madhya Pradesh', discomCode: 'HP-GAS', discomName: 'Avantika / HP Gas', matchName: 'HP Gas', region: 'Indore & Malwa', demoConsumer: '1002345684' },
  { name: 'Bhopal', state: 'Madhya Pradesh', discomCode: 'INDANE-GAS', discomName: 'Think Gas / Indane', matchName: 'Indane Gas', region: 'Bhopal & Central MP', demoConsumer: '1002345685' },
  { name: 'Jaipur', state: 'Rajasthan', discomCode: 'BHARAT-GAS', discomName: 'Torrent / Bharat Gas', matchName: 'Bharat Gas', region: 'Jaipur Region', demoConsumer: '1002345686' },
  { name: 'Bengaluru', state: 'Karnataka', discomCode: 'HP-GAS', discomName: 'GAIL / HP Gas', matchName: 'HP Gas', region: 'Bengaluru Urban', demoConsumer: '1002345687' },
  { name: 'Hyderabad', state: 'Telangana', discomCode: 'INDANE-GAS', discomName: 'Bhagyanagar / Indane Gas', matchName: 'Indane Gas', region: 'Hyderabad Region', demoConsumer: '1002345688' }
];

const MUNICIPAL_DISTRICTS_MAPPING = [
  { name: 'New Delhi', state: 'Delhi', discomCode: 'MCD-DEL', discomName: 'Municipal Corporation of Delhi (MCD)', matchName: 'Municipal Corporation of Delhi', region: 'Delhi Property Tax', demoConsumer: '1002345678' },
  { name: 'Bengaluru', state: 'Karnataka', discomCode: 'BBMP-KA', discomName: 'BBMP Property Tax', matchName: 'Bruhat Bengaluru', region: 'Bengaluru Property Tax', demoConsumer: '1002345678' },
  { name: 'Hyderabad', state: 'Telangana', discomCode: 'GHMC-TG', discomName: 'GHMC Property Tax', matchName: 'Greater Hyderabad', region: 'Hyderabad Property Tax', demoConsumer: '1002345678' },
  { name: 'Ahmedabad', state: 'Gujarat', discomCode: 'MCD-DEL', discomName: 'Gujarat Municipal Tax (AMC/BBPS)', matchName: 'Municipal Corporation', region: 'Ahmedabad & Gujarat', demoConsumer: '1002345679' },
  { name: 'Surat', state: 'Gujarat', discomCode: 'MCD-DEL', discomName: 'Gujarat Municipal Tax (SMC/BBPS)', matchName: 'Municipal Corporation', region: 'Surat & Gujarat', demoConsumer: '1002345680' },
  { name: 'Indore', state: 'Madhya Pradesh', discomCode: 'MCD-DEL', discomName: 'Indore Municipal Tax (IMC)', matchName: 'Municipal Corporation', region: 'Indore & MP', demoConsumer: '1002345681' },
  { name: 'Mumbai', state: 'Maharashtra', discomCode: 'BBMP-KA', discomName: 'BMC Municipal Property Tax', matchName: 'Bruhat Bengaluru', region: 'Mumbai Region', demoConsumer: '1002345682' },
  { name: 'Jaipur', state: 'Rajasthan', discomCode: 'MCD-DEL', discomName: 'Jaipur Municipal Tax (JMC)', matchName: 'Municipal Corporation', region: 'Jaipur Region', demoConsumer: '1002345683' },
  { name: 'Lucknow', state: 'Uttar Pradesh', discomCode: 'MCD-DEL', discomName: 'Lucknow Nagar Nigam', matchName: 'Municipal Corporation', region: 'Lucknow Region', demoConsumer: '1002345684' },
  { name: 'Gurugram', state: 'Haryana', discomCode: 'MCD-DEL', discomName: 'MCG Gurugram Property Tax', matchName: 'Municipal Corporation', region: 'Gurugram NCR', demoConsumer: '1002345685' }
];

const LOCATION_BASED_CATEGORIES = ['electricity', 'water', 'gas', 'municipal-taxes'];

const inferBillerState = (biller, categoryKey) => {
  if (biller?.state && biller.state.toLowerCase() !== 'national') return biller.state;
  const name = String(biller?.billerName || biller?.biller_name || '').toLowerCase();
  if (name.includes('delhi') || name.includes('mcd') || name.includes('indraprastha') || name.includes('mtnl delhi')) return 'Delhi';
  if (name.includes('indore') || name.includes('mppkvvcl') || name.includes('mpmkvvcl')) return 'Madhya Pradesh';
  if (name.includes('mumbai') || name.includes('mcgm') || name.includes('mahanagar gas') || name.includes('msedcl')) return 'Maharashtra';
  if (name.includes('bangalore') || name.includes('bengaluru') || name.includes('bbmp') || name.includes('bwssb') || name.includes('bescom')) return 'Karnataka';
  if (name.includes('hyderabad') || name.includes('ghmc') || name.includes('tsspdcl')) return 'Telangana';
  return categoryKey === 'electricity' ? (biller?.state || '') : 'National';
};

const CustomerBillsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Active Tab: 'pay' | 'favorites' | 'history'
  const [activeTab, setActiveTab] = useState('pay');

  // Core Data
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [billers, setBillers] = useState([]);
  const [selectedBiller, setSelectedBiller] = useState(null);
  const [billerSearch, setBillerSearch] = useState('');
  const [isBillerDropdownOpen, setIsBillerDropdownOpen] = useState(false);
  const [selectedState, setSelectedState] = useState('ALL');
  const [stateSearch, setStateSearch] = useState('');
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);

  // District / City Auto-Resolution State
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districtSearch, setDistrictSearch] = useState('');
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);

  const POPULAR_STATES = [
    'ALL',
    'Madhya Pradesh',
    'Delhi',
    'Maharashtra',
    'Uttar Pradesh',
    'Rajasthan',
    'Gujarat',
    'Karnataka',
    'Telangana',
    'Haryana'
  ];

  // Form & Fetch State
  const [consumerNumber, setConsumerNumber] = useState('');
  const [inputError, setInputError] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedBill, setFetchedBill] = useState(null);
  const [fetchError, setFetchError] = useState('');

  // Payment Configuration
  const [paymentMode, setPaymentMode] = useState('DEMO'); // 'DEMO' | 'WALLET'
  const [paymentPin, setPaymentPin] = useState('1234');
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);
  const [favoriteNickname, setFavoriteNickname] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null); // Completed receipt object
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Wallet Balance
  const [walletBalance, setWalletBalance] = useState(null);

  // Favorites Tab State
  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [deletingFavoriteId, setDeletingFavoriteId] = useState(null);

  // History Tab State
  const [historyList, setHistoryList] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({});
  const [historyFilterStatus, setHistoryFilterStatus] = useState('ALL');
  const [historyFilterCategory, setHistoryFilterCategory] = useState('ALL');
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Copy Feedback
  const [copiedTxn, setCopiedTxn] = useState(false);
  const [globalNotice, setGlobalNotice] = useState(null); // { type: 'success'|'error', message }

  const billerDropdownRef = useRef(null);
  const districtDropdownRef = useRef(null);
  const stateDropdownRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (billerDropdownRef.current && !billerDropdownRef.current.contains(e.target)) {
        setIsBillerDropdownOpen(false);
      }
      if (districtDropdownRef.current && !districtDropdownRef.current.contains(e.target)) {
        setIsDistrictDropdownOpen(false);
      }
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(e.target)) {
        setIsStateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Initial Load: Categories & Wallet Balance
  useEffect(() => {
    loadCategories();
    loadWalletBalance();
    loadFavorites();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await billService.getCategories();
      if (res?.data && res.data.length > 0) {
        const normalized = res.data.map((cat) => {
          const resolvedName =
            cat.name ||
            cat.categoryName ||
            cat.category_name ||
            (cat.categoryKey
              ? cat.categoryKey.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
              : 'Category');

          return {
            ...cat,
            name: resolvedName,
            categoryName: resolvedName
          };
        });

        setCategories(normalized);
        // Default to category from URL params, or electricity, or first category
        const urlParams = new URLSearchParams(location.search);
        const urlCat = urlParams.get('category');
        const targetCat = urlCat
          ? normalized.find((c) => c.categoryKey === urlCat || c.category_key === urlCat || c.name?.toLowerCase() === urlCat?.toLowerCase())
          : null;
        const defaultCat = targetCat || normalized.find((c) => c.categoryKey === 'electricity') || normalized[0];
        setSelectedCategory(defaultCat);
      }
    } catch (err) {
      setGlobalNotice({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load bill categories.'
      });
    }
  };

  const loadWalletBalance = async () => {
    try {
      const res = await walletService.getBalance();
      if (res?.data) {
        setWalletBalance(res.data.availableBalance ?? res.data.balance ?? 0);
      }
    } catch (_) {}
  };

  // 2. Load ALL Billers for Category (filter by State on client for instant, accurate matching)
  useEffect(() => {
    if (selectedCategory?.categoryKey) {
      loadBillers(selectedCategory.categoryKey, 'ALL');
    }
  }, [selectedCategory]);

  const loadBillers = async (categoryKey, stateFilter = 'ALL') => {
    try {
      setSelectedBiller(null);
      setFetchedBill(null);
      setFetchError('');
      setInputError('');
      const res = await billService.getBillers(categoryKey, 1, 100, '', stateFilter);
      const list = res?.data?.billers || res?.data || [];
      if (Array.isArray(list)) {
        setBillers(list);
        const urlParams = new URLSearchParams(location.search);
        const urlBillerId = urlParams.get('billerId');
        if (urlBillerId) {
          const matched = list.find(
            (b) =>
              String(b.id) === String(urlBillerId) ||
              String(b.biller_code) === String(urlBillerId) ||
              String(b.billerCode) === String(urlBillerId) ||
              String(b.billerId) === String(urlBillerId) ||
              (b.biller_name && b.biller_name.toLowerCase().includes(urlBillerId.toLowerCase())) ||
              (b.billerName && b.billerName.toLowerCase().includes(urlBillerId.toLowerCase()))
          );
          if (matched) {
            setSelectedBiller(matched);
            return;
          }
        }
      }
    } catch (err) {
      setBillers([]);
    }
  };

  // 3. Load Favorites
  const loadFavorites = async () => {
    setLoadingFavorites(true);
    try {
      const res = await billService.getFavorites();
      setFavorites(res?.data || []);
    } catch (_) {
      setFavorites([]);
    } finally {
      setLoadingFavorites(false);
    }
  };

  // 4. Load History
  const loadHistory = async (page = 1) => {
    setLoadingHistory(true);
    try {
      const params = { page, limit: 10 };
      if (historyFilterStatus !== 'ALL') params.status = historyFilterStatus;
      if (historyFilterCategory !== 'ALL') params.category = historyFilterCategory;
      if (historySearch.trim()) params.search = historySearch.trim();

      const res = await billService.getHistory(params);
      setHistoryList(res?.data?.payments || []);
      setHistoryPagination(res?.data?.pagination || {});
      setHistoryPage(page);
    } catch (_) {
      setHistoryList([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory(1);
    } else if (activeTab === 'favorites') {
      loadFavorites();
    }
  }, [activeTab, historyFilterStatus, historyFilterCategory]);

  // Handle Category selection
  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setConsumerNumber('');
    setInputError('');
    setFetchedBill(null);
    setFetchError('');
    setBillerSearch('');
    setIsBillerDropdownOpen(false);
    setSelectedState('ALL');
    setStateSearch('');
    setIsStateDropdownOpen(false);
    setSelectedDistrict(null);
    setDistrictSearch('');
    setIsDistrictDropdownOpen(false);
  };

  // Handle District / City selection
  const handleSelectDistrict = (distItem) => {
    setSelectedDistrict(distItem.name);

    // 1. If currently in another state, switch state to match
    if (distItem.state && selectedState !== distItem.state && selectedState !== 'ALL') {
      setSelectedState(distItem.state);
    }

    // 2. Find matching biller from current list
    const matched = billers.find(
      (b) =>
        b.billerCode === distItem.discomCode ||
        b.biller_code === distItem.discomCode ||
        (distItem.matchName && (b.billerName || b.biller_name || '').toLowerCase().includes(distItem.matchName.toLowerCase())) ||
        (Array.isArray(b.districts) && b.districts.some((d) => d.toLowerCase() === distItem.name.toLowerCase()))
    );

    if (matched) {
      setSelectedBiller(matched);
    } else if (billers.length > 0) {
      setSelectedBiller(billers[0]);
    }

    // 3. Pre-fill authentic demo consumer number for this provider
    if (distItem.demoConsumer) {
      setConsumerNumber(distItem.demoConsumer);
      setInputError('');
    }

    setIsDistrictDropdownOpen(false);
    setDistrictSearch('');
    setFetchedBill(null);
    setFetchError('');
  };

  // Clear District filter
  const handleClearDistrict = () => {
    setSelectedDistrict(null);
    setDistrictSearch('');
    setIsDistrictDropdownOpen(false);
  };

  // Active category location config
  const activeCatKey = String(selectedCategory?.categoryKey || '').toLowerCase();
  const isLocationCategory = LOCATION_BASED_CATEGORIES.includes(activeCatKey);

  const activeDistrictList = React.useMemo(() => {
    const base =
      activeCatKey === 'water'
        ? WATER_DISTRICTS_MAPPING
        : activeCatKey === 'gas'
        ? GAS_DISTRICTS_MAPPING
        : activeCatKey === 'municipal-taxes'
        ? MUNICIPAL_DISTRICTS_MAPPING
        : ALL_DISTRICTS_MAPPING;
    return buildAllDistrictsForCategory(activeCatKey, base);
  }, [activeCatKey]);

  const filteredStatesForSearch = React.useMemo(() => {
    const q = stateSearch.trim().toLowerCase();
    if (!q) return ALL_INDIAN_STATES;
    return ALL_INDIAN_STATES.filter((st) =>
      st === 'ALL' ? 'all states india'.includes(q) : st.toLowerCase().includes(q)
    );
  }, [stateSearch]);

  // Synchronize District selection when billers list updates
  useEffect(() => {
    if (selectedDistrict && billers.length > 0) {
      const match = activeDistrictList.find((d) => d.name.toLowerCase() === selectedDistrict.toLowerCase());
      if (match) {
        const matchedBiller = billers.find(
          (b) =>
            b.billerCode === match.discomCode ||
            b.biller_code === match.discomCode ||
            (match.matchName && (b.billerName || b.biller_name || '').toLowerCase().includes(match.matchName.toLowerCase())) ||
            (Array.isArray(b.districts) && b.districts.some((d) => d.toLowerCase() === match.name.toLowerCase()))
        );
        if (matchedBiller && (!selectedBiller || selectedBiller.id !== matchedBiller.id)) {
          setSelectedBiller(matchedBiller);
        }
      }
    }
  }, [billers, selectedDistrict, activeDistrictList]);

  // Handle Biller selection
  const handleSelectBiller = (biller) => {
    setSelectedBiller(biller);
    setIsBillerDropdownOpen(false);
    setFetchedBill(null);
    setFetchError('');
    setInputError('');

    // If selected biller does not cover current district, reset district
    if (selectedDistrict && Array.isArray(biller.districts)) {
      const covers = biller.districts.some((d) => d.toLowerCase() === selectedDistrict.toLowerCase());
      if (!covers) {
        setSelectedDistrict(null);
      }
    }
  };

  // Quick Pay from Favorite
  const handleQuickPayFavorite = async (fav) => {
    // 1. Find category
    const cat = categories.find((c) => c.categoryKey === fav.categoryKey);
    if (cat) setSelectedCategory(cat);

    // 2. Load billers and select
    try {
      const res = await billService.getBillers(fav.categoryKey);
      setBillers(res?.data || []);
      const match = res?.data?.find((b) => b.id === fav.billerId);
      if (match) setSelectedBiller(match);
      setConsumerNumber(fav.consumerNumber);
      setActiveTab('pay');

      // Auto-trigger fetch
      if (fav.billerId && fav.consumerNumber) {
        setIsFetching(true);
        setFetchError('');
        try {
          const fetchRes = await billService.fetchBill({
            billerId: fav.billerId,
            consumerNumber: fav.consumerNumber
          });
          setFetchedBill(fetchRes?.data || null);
        } catch (fetchErr) {
          setFetchError(fetchErr.response?.data?.message || 'Failed to fetch bill.');
        } finally {
          setIsFetching(false);
        }
      }
    } catch (_) {}
  };

  // Delete Favorite
  const handleDeleteFavorite = async (id) => {
    if (!window.confirm('Are you sure you want to remove this saved biller?')) return;
    setDeletingFavoriteId(id);
    try {
      await billService.deleteFavorite(id);
      setFavorites((prev) => prev.filter((f) => f.id !== id));
      setGlobalNotice({ type: 'success', message: 'Saved biller removed successfully.' });
      setTimeout(() => setGlobalNotice(null), 4000);
    } catch (err) {
      setGlobalNotice({
        type: 'error',
        message: err.response?.data?.message || 'Failed to remove saved biller.'
      });
      setTimeout(() => setGlobalNotice(null), 4000);
    } finally {
      setDeletingFavoriteId(null);
    }
  };

  // Real-time parameter validation
  const validateConsumerInput = (val) => {
    if (!selectedBiller) return true;
    const param = selectedBiller.customerParameter;
    if (!param) return true;

    if (!val || !val.trim()) {
      setInputError(`Please enter your ${param.paramName || 'consumer number'}.`);
      return false;
    }

    const trimmed = val.trim();
    if (param.minLength && trimmed.length < param.minLength) {
      setInputError(`Must be at least ${param.minLength} characters.`);
      return false;
    }
    if (param.maxLength && trimmed.length > param.maxLength) {
      setInputError(`Cannot exceed ${param.maxLength} characters.`);
      return false;
    }
    if (param.regex) {
      try {
        const re = new RegExp(param.regex);
        if (!re.test(trimmed)) {
          setInputError(param.helpText || `Invalid format for ${param.paramName}.`);
          return false;
        }
      } catch (_) {}
    }

    setInputError('');
    return true;
  };

  // Fetch Bill Action
  const handleFetchBill = async (e) => {
    if (e) e.preventDefault();
    if (!selectedBiller) return;

    if (!validateConsumerInput(consumerNumber)) return;

    setIsFetching(true);
    setFetchError('');
    setFetchedBill(null);

    try {
      const res = await billService.fetchBill({
        billerId: selectedBiller.id,
        consumerNumber: consumerNumber.trim()
      });
      setFetchedBill(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to fetch bill details. Please check the consumer number.';
      setFetchError(msg);
    } finally {
      setIsFetching(false);
    }
  };

  // Execute Payment
  const handlePayBill = async () => {
    if (!fetchedBill || !fetchedBill.fetchReferenceId) return;

    // Haptic vibration feedback on payment initiation
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch (_) {}
    }

    // Check wallet balance if in WALLET mode
    if (paymentMode === 'WALLET') {
      if (walletBalance !== null && walletBalance < fetchedBill.billAmount) {
        setFetchError(`Insufficient wallet balance (${formatINR(walletBalance)}). Please choose Demo Sandbox Mode or top up your wallet.`);
        return;
      }
      if (!paymentPin || paymentPin.length < 4) {
        setFetchError('Please enter your 4-digit Wallet Transaction PIN.');
        return;
      }
    }

    setIsPaying(true);
    setFetchError('');

    try {
      // 1. Client-Side Server Validation Call
      await billService.validateBill({
        fetchReferenceId: fetchedBill.fetchReferenceId,
        billerId: selectedBiller.id,
        consumerNumber: consumerNumber.trim(),
        amount: fetchedBill.billAmount
      });

      // 2. Generate client-side idempotency key for network resilience
      const idempotencyKey = `bp-client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // 3. Execute Payment Request
      const paymentPayload = {
        fetchReferenceId: fetchedBill.fetchReferenceId,
        billerId: selectedBiller.id,
        consumerNumber: consumerNumber.trim(),
        amount: fetchedBill.billAmount,
        paymentMode: paymentMode,
        paymentPin: paymentMode === 'WALLET' ? paymentPin : undefined,
        idempotencyKey
      };

      const res = await billService.payBill(paymentPayload);

      // Haptic vibration feedback on payment success
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([80, 40, 120]);
        } catch (_) {}
      }

      // 4. Save Favorite if requested
      if (saveAsFavorite) {
        try {
          await billService.saveFavorite({
            billerId: selectedBiller.id,
            consumerNumber: consumerNumber.trim(),
            nickname: favoriteNickname.trim() || `${selectedBiller.billerName} (${consumerNumber.slice(-4)})`
          });
          loadFavorites();
        } catch (_) {}
      }

      // 5. Update local wallet balance if WALLET mode
      if (paymentMode === 'WALLET') {
        loadWalletBalance();
      }

      // 6. Set receipt data and open receipt modal
      setPaymentResult(res.data);
      setShowReceiptModal(true);

      // Clear current bill state
      setFetchedBill(null);
      setConsumerNumber('');
      setSaveAsFavorite(false);
      setFavoriteNickname('');
    } catch (err) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([150, 80, 150]);
        } catch (_) {}
      }
      const msg = err.response?.data?.message || 'Payment execution failed. Please try again.';
      setFetchError(msg);
    } finally {
      setIsPaying(false);
    }
  };

  // View Receipt for previous transaction in history
  const handleViewHistoricalReceipt = async (txn) => {
    try {
      const res = await billService.getPaymentDetails(txn.txnReference || txn.id);
      setPaymentResult(res.data);
      setShowReceiptModal(true);
    } catch (_) {
      // Fallback to local txn object if API lookup fails
      setPaymentResult(txn);
      setShowReceiptModal(true);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedTxn(true);
    setTimeout(() => setCopiedTxn(false), 2500);
  };

  // Fill sample demo consumer number
  const handleFillDemoNumber = (type) => {
    if (!selectedBiller) return;
    const param = selectedBiller.customerParameter || {};
    const minLen = param.minLength || selectedBiller.paramMinLength || 10;
    const maxLen = param.maxLength || selectedBiller.paramMaxLength || 10;
    const targetLen = minLen;
    const bCode = (selectedBiller.billerCode || selectedBiller.biller_code || '').toUpperCase();

    let sample = '';
    if (type === 'standard') {
      if (bCode === 'MPPKVVCL-W') {
        sample = '1000234567'; // 10-digit IVRS for West Discom (Indore)
      } else if (bCode === 'MPMKVVCL-C') {
        sample = '2000345678'; // 10-digit IVRS for Central Discom (Bhopal)
      } else if (bCode === 'MPPKVVCL-JBP') {
        sample = '3000456789'; // 10-digit IVRS for East Discom (Jabalpur)
      } else if (bCode === 'BSES-RAJ' || bCode === 'BSES-YAM') {
        sample = '100123456'; // 9-digit CA
      } else if (bCode === 'TPDDL-DEL') {
        sample = '60001234567'; // 11-digit CA
      } else if (bCode === 'ADANI-MUM') {
        sample = '100123456'; // 9-digit CA
      } else {
        const seed = '100234567890';
        sample = seed.slice(0, targetLen).padEnd(targetLen, '7');
      }
    } else if (type === 'overdue') {
      const prefix = '100000000000'.slice(0, Math.max(0, targetLen - 4));
      sample = prefix + '9999';
      if (sample.length < targetLen) sample = sample.padEnd(targetLen, '9');
    } else if (type === 'paid') {
      const prefix = '100000000000'.slice(0, Math.max(0, targetLen - 4));
      sample = prefix + '0000';
      if (sample.length < targetLen) sample = sample.padEnd(targetLen, '0');
    } else if (type === 'fail') {
      sample = 'FAIL999999'.slice(0, maxLen);
    }

    setConsumerNumber(sample);
    validateConsumerInput(sample);
  };

  // Filtered billers in dropdown (supports search by name, code, state, regionName, and districts)
  const filteredBillers = React.useMemo(() => {
    const term = billerSearch.toLowerCase().trim();
    const matchesSearch = (b) => {
      if (!term) return true;
      const name = b.billerName || b.biller_name || '';
      const code = b.billerCode || b.biller_code || '';
      const state = inferBillerState(b, activeCatKey);
      const region = b.regionName || b.region_name || '';
      const districts = Array.isArray(b.districts) ? b.districts.join(' ') : (b.districts || '');
      return (
        name.toLowerCase().includes(term) ||
        code.toLowerCase().includes(term) ||
        state.toLowerCase().includes(term) ||
        region.toLowerCase().includes(term) ||
        districts.toLowerCase().includes(term)
      );
    };

    const byState = billers.filter((b) => {
      const state = inferBillerState(b, activeCatKey);
      const stateMatch =
        !isLocationCategory ||
        selectedState === 'ALL' ||
        state.toLowerCase() === selectedState.toLowerCase() ||
        (activeCatKey === 'gas' && state === 'National');
      return stateMatch && matchesSearch(b);
    });

    if (byState.length > 0 || !isLocationCategory || selectedState === 'ALL') {
      return byState;
    }
    // Fallback to compatible providers if state has no dedicated DB biller
    return billers.filter(matchesSearch);
  }, [billers, billerSearch, selectedState, isLocationCategory, activeCatKey]);

  // Filtered districts for searchable district dropdown (filtered by selectedState + districtSearch)
  const filteredDistrictsForSearch = activeDistrictList.filter((d) => {
    const stateOk = selectedState === 'ALL' || d.state.toLowerCase() === selectedState.toLowerCase();
    if (!districtSearch.trim()) return stateOk;
    const term = districtSearch.toLowerCase().trim();
    return (
      d.name.toLowerCase().includes(term) ||
      d.state.toLowerCase().includes(term) ||
      d.discomName.toLowerCase().includes(term) ||
      d.region.toLowerCase().includes(term)
    );
  });

  // Dynamic quick district pills based on selected category & state
  const quickDistrictPills = React.useMemo(() => {
    if (!isLocationCategory) return [];
    if (activeCatKey !== 'electricity') {
      if (selectedState !== 'ALL') {
        return activeDistrictList.filter((d) => d.state.toLowerCase() === selectedState.toLowerCase());
      }
      return activeDistrictList;
    }
    if (selectedState === 'Madhya Pradesh') {
      return ALL_DISTRICTS_MAPPING.filter((d) => d.state === 'Madhya Pradesh');
    }
    if (selectedState !== 'ALL') {
      return ALL_DISTRICTS_MAPPING.filter((d) => d.state.toLowerCase() === selectedState.toLowerCase());
    }
    // Key hubs across states when 'ALL' is selected
    return [
      ALL_DISTRICTS_MAPPING.find((d) => d.name === 'Indore'),
      ALL_DISTRICTS_MAPPING.find((d) => d.name === 'Bhopal'),
      ALL_DISTRICTS_MAPPING.find((d) => d.name === 'Jabalpur'),
      ALL_DISTRICTS_MAPPING.find((d) => d.name === 'Gwalior'),
      ALL_DISTRICTS_MAPPING.find((d) => d.name === 'Ujjain'),
      ALL_DISTRICTS_MAPPING.find((d) => d.name === 'South Delhi'),
      ALL_DISTRICTS_MAPPING.find((d) => d.name === 'Mumbai Suburbs'),
      ALL_DISTRICTS_MAPPING.find((d) => d.name === 'Pune'),
      ALL_DISTRICTS_MAPPING.find((d) => d.name === 'Jaipur'),
      ALL_DISTRICTS_MAPPING.find((d) => d.name === 'Surat'),
      ALL_DISTRICTS_MAPPING.find((d) => d.name === 'Bengaluru Urban'),
      ALL_DISTRICTS_MAPPING.find((d) => d.name === 'Hyderabad')
    ].filter(Boolean);
  }, [selectedState, activeCatKey, isLocationCategory, activeDistrictList]);

  return (
    <DashboardLayout
      title="Bill Payments & Utilities"
      subtitle="BBPS-ready simulated utility bill payments, instant status checks, saved billers, and ledger recording"
      backFallback="/app"
      onRefresh={() => {
        loadCategories();
        loadWalletBalance();
        if (activeTab === 'favorites') loadFavorites();
        if (activeTab === 'history') loadHistory(historyPage);
      }}
    >
      {/* Simulation Banner */}
      <div
        className="dashboard-card"
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(10, 20, 34, 0.98) 100%)',
          borderColor: 'rgba(245, 158, 11, 0.35)',
          padding: '14px 18px',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <SparklesIcon size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#FCD34D' }}>
                  DEMO SIMULATION MODE ACTIVE
                </span>
                <span className="sidebar-badge yellow">Sandbox BBPS</span>
              </div>
              <p style={{ fontSize: '12px', color: '#A9BDD7', margin: '2px 0 0 0' }}>
                Simulate authentic utility bills, dynamic bill fetching, and wallet deductions. No real payments are transmitted to utility providers.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#A9BDD7' }}>Escrow Wallet Balance</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#10B981' }}>
                {walletBalance !== null ? formatINR(walletBalance) : 'Loading...'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Notifications */}
      {globalNotice && (
        <div className={`auth-alert ${globalNotice.type}`} style={{ marginBottom: '16px' }}>
          {globalNotice.type === 'success' ? <CheckCircleIcon size={18} /> : <AlertCircleIcon size={18} />}
          <span>{globalNotice.message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          borderBottom: '1px solid #17385D',
          marginBottom: '24px',
          overflowX: 'auto',
          paddingBottom: '12px'
        }}
      >
        <button
          onClick={() => setActiveTab('pay')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            background: activeTab === 'pay' ? 'linear-gradient(90deg, #087BFF 0%, #00A8FF 100%)' : '#0B1B32',
            border: activeTab === 'pay' ? 'none' : '1px solid #17385D',
            color: activeTab === 'pay' ? '#FFFFFF' : '#A9BDD7',
            fontWeight: activeTab === 'pay' ? '700' : '500',
            cursor: 'pointer',
            fontSize: '13px',
            boxShadow: activeTab === 'pay' ? '0 4px 14px rgba(8, 123, 255, 0.35)' : 'none',
            transition: 'all 0.22s ease'
          }}
        >
          <ReceiptIcon size={16} />
          <span>Pay New Bill</span>
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            background: activeTab === 'favorites' ? 'linear-gradient(90deg, #087BFF 0%, #00A8FF 100%)' : '#0B1B32',
            border: activeTab === 'favorites' ? 'none' : '1px solid #17385D',
            color: activeTab === 'favorites' ? '#FFFFFF' : '#A9BDD7',
            fontWeight: activeTab === 'favorites' ? '700' : '500',
            cursor: 'pointer',
            fontSize: '13px',
            boxShadow: activeTab === 'favorites' ? '0 4px 14px rgba(8, 123, 255, 0.35)' : 'none',
            transition: 'all 0.22s ease'
          }}
        >
          <BookmarkIcon size={16} />
          <span>Saved Billers ({favorites.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            background: activeTab === 'history' ? 'linear-gradient(90deg, #087BFF 0%, #00A8FF 100%)' : '#0B1B32',
            border: activeTab === 'history' ? 'none' : '1px solid #17385D',
            color: activeTab === 'history' ? '#FFFFFF' : '#A9BDD7',
            fontWeight: activeTab === 'history' ? '700' : '500',
            cursor: 'pointer',
            fontSize: '13px',
            boxShadow: activeTab === 'history' ? '0 4px 14px rgba(8, 123, 255, 0.35)' : 'none',
            transition: 'all 0.22s ease'
          }}
        >
          <HistoryIcon size={16} />
          <span>Payment History</span>
        </button>
      </div>

      {/* ================= TAB 1: PAY NEW BILL ================= */}
      {activeTab === 'pay' && (
        <div className="fade-in">
          {/* Step 1: Category Selection Grid */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ZapIcon size={16} style={{ color: '#00D5FF' }} />
                <span>SELECT BILL CATEGORY</span>
              </span>
              <span style={{ fontSize: '12px', color: '#A9BDD7' }}>
                {categories.length} Available BBPS Categories
              </span>
            </div>

            <div className="bill-categories-grid">
              {categories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                const displayName = cat.name || cat.categoryName || 'Category';
                return (
                  <button
                    key={cat.id || cat.categoryKey}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={`bill-category-card ${isSelected ? 'selected' : ''}`}
                    title={`Select ${displayName}`}
                    aria-pressed={isSelected}
                  >
                    <div className="bill-category-icon-wrap">
                      {getCategoryIcon(cat.categoryKey, 22)}
                    </div>
                    <span className="bill-category-name">
                      {displayName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Biller Selector & Consumer Parameter Form */}
          {selectedCategory && (
            <div
              className="dashboard-card fade-in"
              style={{
                background: '#0B1B32',
                borderColor: '#17385D',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(8, 123, 255, 0.16)',
                    border: '1px solid rgba(0, 168, 255, 0.35)',
                    color: '#00D5FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {getCategoryIcon(selectedCategory.categoryKey, 20)}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                    {selectedCategory.name || selectedCategory.categoryName} Bill Details
                  </h3>
                  <span style={{ fontSize: '12px', color: '#A9BDD7' }}>
                    {selectedCategory.description}
                  </span>
                </div>
              </div>

              <form onSubmit={handleFetchBill}>
                {/* State / Region & District / City Dropdowns (Location-based categories only) */}
                {isLocationCategory ? (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: selectedDistrict ? '12px' : '0' }}>
                      {/* Dropdown 1: Filter by State / Region (Searchable All-India Dropdown) */}
                      <div style={{ position: 'relative' }} ref={stateDropdownRef}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#A9BDD7' }}>
                            Filter by State / Region
                          </label>
                          <span style={{ fontSize: '11px', color: '#00D5FF' }}>
                            {filteredBillers.length} Providers Available
                          </span>
                        </div>

                        <div
                          onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                          style={{
                            height: '46px',
                            background: '#071426',
                            border: '1px solid #17385D',
                            borderRadius: '8px',
                            padding: '0 14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            color: selectedState === 'ALL' ? '#6B87A8' : '#FFFFFF'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <MapPinIcon size={15} style={{ color: '#00D5FF', flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: selectedState === 'ALL' ? '#6B87A8' : '#FFFFFF' }}>
                              {selectedState === 'ALL' ? 'Select States (All India)...' : selectedState}
                            </span>
                          </div>
                          <ChevronDownIcon size={16} />
                        </div>

                        {isStateDropdownOpen && (
                          <div
                            className="biller-select-menu"
                            style={{ maxHeight: '280px', zIndex: 75 }}
                          >
                            {/* Search input inside State dropdown */}
                            <div style={{ padding: '8px', borderBottom: '1px solid #17385D', position: 'sticky', top: 0, background: '#0B1B32', zIndex: 2 }}>
                              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '36px' }}>
                                <SearchIcon size={14} style={{ position: 'absolute', left: '10px', color: '#6B87A8', pointerEvents: 'none' }} />
                                <input
                                  type="text"
                                  placeholder="Search State or Union Territory..."
                                  value={stateSearch}
                                  onChange={(e) => setStateSearch(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                  style={{
                                    width: '100%',
                                    height: '36px',
                                    background: '#071426',
                                    border: '1px solid #17385D',
                                    borderRadius: '7px',
                                    padding: '0 10px 0 32px',
                                    fontSize: '12px',
                                    color: '#FFFFFF',
                                    outline: 'none',
                                    margin: 0
                                  }}
                                />
                              </div>
                            </div>

                            {filteredStatesForSearch.length === 0 ? (
                              <div style={{ padding: '14px', fontSize: '12px', color: '#6B87A8', textAlign: 'center' }}>
                                No states found matching "{stateSearch}".
                              </div>
                            ) : (
                              filteredStatesForSearch.map((st) => {
                                const isActive = selectedState === st;
                                return (
                                  <div
                                    key={st}
                                    onClick={() => {
                                      setSelectedState(st);
                                      setIsStateDropdownOpen(false);
                                      setStateSearch('');
                                      if (selectedDistrict) {
                                        const dMatch = activeDistrictList.find((d) => d.name.toLowerCase() === selectedDistrict.toLowerCase());
                                        if (dMatch && st !== 'ALL' && dMatch.state.toLowerCase() !== st.toLowerCase()) {
                                          setSelectedDistrict(null);
                                        }
                                      }
                                    }}
                                    className={`biller-select-item ${isActive ? 'selected' : ''}`}
                                    style={{ padding: '9px 12px' }}
                                  >
                                    <span style={{ fontSize: '13px', fontWeight: isActive ? '700' : '500', color: '#FFFFFF' }}>
                                      {st === 'ALL' ? 'All States (All India)' : st}
                                    </span>
                                    {isActive && <CheckIcon size={14} style={{ color: '#00D5FF' }} />}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>

                      {/* Dropdown 2: Select District / City (Searchable Dropdown) */}
                      <div style={{ position: 'relative' }} ref={districtDropdownRef}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#A9BDD7' }}>
                            Select District / City
                          </label>
                          {selectedDistrict ? (
                            <button
                              type="button"
                              onClick={handleClearDistrict}
                              style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                            >
                              ✕ Clear
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#6B87A8' }}>Auto-resolves provider</span>
                          )}
                        </div>

                        <div
                          onClick={() => setIsDistrictDropdownOpen(!isDistrictDropdownOpen)}
                          style={{
                            height: '46px',
                            background: '#071426',
                            border: '1px solid #17385D',
                            borderRadius: '8px',
                            padding: '0 14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            color: selectedDistrict ? '#FFFFFF' : '#6B87A8'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <MapPinIcon size={15} style={{ color: '#00D5FF', flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: selectedDistrict ? '#FFFFFF' : '#6B87A8' }}>
                              {selectedDistrict || 'Select District / City...'}
                            </span>
                          </div>
                          <ChevronDownIcon size={16} />
                        </div>

                        {isDistrictDropdownOpen && (
                          <div
                            className="biller-select-menu"
                            style={{ maxHeight: '280px', zIndex: 75 }}
                          >
                            {/* Search input inside District dropdown */}
                            <div style={{ padding: '8px', borderBottom: '1px solid #17385D', position: 'sticky', top: 0, background: '#0B1B32', zIndex: 2 }}>
                              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '36px' }}>
                                <SearchIcon size={14} style={{ position: 'absolute', left: '10px', color: '#6B87A8', pointerEvents: 'none' }} />
                                <input
                                  type="text"
                                  placeholder="Search District / City / State..."
                                  value={districtSearch}
                                  onChange={(e) => setDistrictSearch(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                  style={{
                                    width: '100%',
                                    height: '36px',
                                    background: '#071426',
                                    border: '1px solid #17385D',
                                    borderRadius: '7px',
                                    padding: '0 10px 0 32px',
                                    fontSize: '12px',
                                    color: '#FFFFFF',
                                    outline: 'none',
                                    margin: 0
                                  }}
                                />
                              </div>
                            </div>

                            {filteredDistrictsForSearch.length === 0 ? (
                              <div style={{ padding: '14px', fontSize: '12px', color: '#6B87A8', textAlign: 'center' }}>
                                No districts found matching "{districtSearch}".
                              </div>
                            ) : (
                              filteredDistrictsForSearch.map((dist) => {
                                const isDistActive = selectedDistrict?.toLowerCase() === dist.name.toLowerCase();
                                return (
                                  <div
                                    key={`${dist.state}-${dist.name}`}
                                    onClick={() => handleSelectDistrict(dist)}
                                    className={`biller-select-item ${isDistActive ? 'selected' : ''}`}
                                    style={{ padding: '9px 12px' }}
                                  >
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>
                                          {dist.name}
                                        </span>
                                        <span className="sidebar-badge blue" style={{ fontSize: '10px', padding: '1px 6px' }}>
                                          {dist.state}
                                        </span>
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#00D5FF', marginTop: '2px' }}>
                                        {dist.discomName} • <span style={{ color: '#8EB2DA' }}>{dist.region}</span>
                                      </div>
                                    </div>
                                    {isDistActive && <CheckIcon size={14} style={{ color: '#00D5FF' }} />}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Active District Mapping Confirmation Alert */}
                    {selectedDistrict && (
                      <div className="district-mapping-alert">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <CheckCircleIcon size={16} style={{ color: '#00D5FF', flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', color: '#FFFFFF' }}>
                            District: <strong style={{ color: '#00D5FF' }}>{selectedDistrict}</strong>
                            {' ➔ '}
                            Mapped to <strong style={{ color: '#10B981' }}>{selectedBiller?.billerName || 'Regional Provider'}</strong>
                            {selectedBiller?.regionName ? ` (${selectedBiller.regionName})` : ''}
                          </span>
                        </div>
                        <span className="sidebar-badge green" style={{ fontSize: '10px' }}>
                          Provider Auto-Selected
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', padding: '8px 12px', background: '#071426', border: '1px solid #17385D', borderRadius: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#A9BDD7' }}>
                      🇮🇳 Pan-India / National Providers
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#00D5FF' }}>
                      {filteredBillers.length} Providers Available
                    </span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {/* Biller Search / Dropdown */}
                  <div style={{ position: 'relative' }} ref={billerDropdownRef}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#A9BDD7', marginBottom: '6px' }}>
                      Select {selectedCategory?.name || selectedCategory?.categoryName || 'Service'} Biller / Provider *
                    </label>

                    <div
                      onClick={() => setIsBillerDropdownOpen(!isBillerDropdownOpen)}
                      style={{
                        height: '46px',
                        background: '#071426',
                        border: '1px solid #17385D',
                        borderRadius: '8px',
                        padding: '0 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        color: selectedBiller ? '#FFFFFF' : '#6B87A8'
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: selectedBiller ? '#FFFFFF' : '#6B87A8', minWidth: 0, flex: 1 }}>
                        {selectedBiller
                          ? selectedBiller.billerName
                          : `Select ${selectedCategory?.name || selectedCategory?.categoryName || 'Service'} Biller / Provider...`}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {selectedBiller && (
                          <span className="sidebar-badge blue" style={{ fontSize: '10px', padding: '1px 6px' }}>
                            {inferBillerState(selectedBiller, activeCatKey) || 'India'}
                          </span>
                        )}
                        <ChevronDownIcon size={16} />
                      </div>
                    </div>

                    {/* Biller Dropdown Menu */}
                    {isBillerDropdownOpen && (
                      <div className="biller-select-menu">
                        <div style={{ padding: '8px', borderBottom: '1px solid #17385D', position: 'sticky', top: 0, background: '#0B1B32', zIndex: 10 }}>
                          <input
                            type="text"
                            placeholder="Search provider name, code, region or district..."
                            value={billerSearch}
                            onChange={(e) => setBillerSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              width: '100%',
                              background: '#071426',
                              border: '1px solid #17385D',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              color: '#FFFFFF',
                              outline: 'none'
                            }}
                            autoFocus
                          />
                        </div>

                        {filteredBillers.length === 0 ? (
                          <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#6B87A8' }}>
                            No billers match your search in {selectedState === 'ALL' ? 'any state' : selectedState}.
                          </div>
                        ) : (
                          filteredBillers.map((b) => {
                            const isChosen = selectedBiller?.id === b.id;
                            return (
                              <div
                                key={b.id}
                                onClick={() => handleSelectBiller(b)}
                                className={`biller-select-item ${isChosen ? 'selected' : ''}`}
                              >
                                <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '13px', color: '#FFFFFF', fontWeight: isChosen ? '700' : '500' }}>
                                      {b.billerName}
                                    </span>
                                    {b.state && (
                                      <span className="sidebar-badge blue" style={{ fontSize: '10px', padding: '1px 6px' }}>
                                        {b.state}
                                      </span>
                                    )}
                                    {b.regionName && (
                                      <span className="sidebar-badge green" style={{ fontSize: '10px', padding: '1px 6px' }}>
                                        {b.regionName}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#6B87A8', marginTop: '3px' }}>
                                    Code: <code style={{ color: '#00D5FF' }}>{b.billerCode}</code> • {b.customerParameter?.paramName || 'Consumer No'}
                                  </div>
                                  {b.districts && (Array.isArray(b.districts) ? b.districts.length > 0 : Boolean(b.districts)) && (
                                    <div style={{ fontSize: '10.5px', color: '#88A2C2', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      📍 <em>Districts:</em> {Array.isArray(b.districts) ? b.districts.slice(0, 6).join(', ') : b.districts}{Array.isArray(b.districts) && b.districts.length > 6 ? ` +${b.districts.length - 6} more` : ''}
                                    </div>
                                  )}
                                </div>
                                {isChosen && <CheckIcon size={16} style={{ color: '#00D5FF', flexShrink: 0 }} />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Dynamic Parameter Input */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#A9BDD7' }}>
                        {selectedBiller?.customerParameter?.paramName || 'Consumer Number'} *
                      </label>
                      {selectedBiller?.customerParameter?.minLength && (
                        <span style={{ fontSize: '11px', color: '#6B87A8' }}>
                          Length: {selectedBiller.customerParameter.minLength}
                          {selectedBiller.customerParameter.maxLength !== selectedBiller.customerParameter.minLength ? ` - ${selectedBiller.customerParameter.maxLength}` : ''} digits
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={consumerNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConsumerNumber(val);
                        validateConsumerInput(val);
                      }}
                      placeholder={selectedBiller?.customerParameter?.placeholder || 'Enter consumer number'}
                      style={{
                        width: '100%',
                        background: '#071426',
                        border: inputError ? '1px solid #EF4444' : '1px solid #17385D',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        fontSize: '13px',
                        color: '#FFFFFF',
                        outline: 'none'
                      }}
                    />
                    <div style={{ fontSize: '11px', color: inputError ? '#EF4444' : '#6B87A8', marginTop: '4px' }}>
                      {inputError || selectedBiller?.customerParameter?.helpText || 'Enter registered customer identifier'}
                    </div>
                  </div>
                </div>

                {/* Quick Realistic Demo Scenarios Helper */}
                <div style={{ marginTop: '16px', background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#FCD34D', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <SparklesIcon size={14} />
                      <span>Demo Testing Scenarios:</span>
                    </span>
                    <span style={{ fontSize: '11px', color: '#6B87A8' }}>
                      Click any scenario below to auto-populate consumer ID
                    </span>
                  </div>
                  <div className="demo-chips-grid">
                    <button
                      type="button"
                      onClick={() => handleFillDemoNumber('standard')}
                      className="demo-chip-btn"
                      style={{ color: '#00D5FF', borderColor: 'rgba(0, 213, 255, 0.3)' }}
                      title="Simulate standard active bill (~₹1,240 Due)"
                    >
                      <ZapIcon size={13} />
                      <span>⚡ Standard Bill (Pending)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFillDemoNumber('overdue')}
                      className="demo-chip-btn"
                      style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      title="Simulate overdue bill with late payment surcharge"
                    >
                      <AlertCircleIcon size={13} />
                      <span>⚠️ Overdue Bill (+₹150 Surcharge)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFillDemoNumber('paid')}
                      className="demo-chip-btn"
                      style={{ color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                      title="Simulate already settled bill (₹0 balance)"
                    >
                      <CheckCircleIcon size={13} />
                      <span>✅ Settled Bill (₹0 Dues)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFillDemoNumber('fail')}
                      className="demo-chip-btn"
                      style={{ color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                      title="Simulate invalid account / discom fetch failure"
                    >
                      <XIcon size={13} />
                      <span>❌ Invalid ID (Test Failure)</span>
                    </button>
                  </div>
                </div>

                {/* Fetch Button & Error */}
                {fetchError && (
                  <div className="auth-alert error" style={{ marginTop: '16px' }}>
                    <AlertCircleIcon size={16} />
                    <span>{fetchError}</span>
                  </div>
                )}

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={isFetching || !selectedBiller}
                    className="auth-button"
                    style={{
                      width: 'auto',
                      padding: '0 24px',
                      height: '42px',
                      fontSize: '13px',
                      margin: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {isFetching ? (
                      <>
                        <RefreshCwIcon size={16} className="animate-spin" />
                        <span>Querying BBPS Switch...</span>
                      </>
                    ) : (
                      <>
                        <SearchIcon size={16} />
                        <span>Fetch Bill Details</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Fetched Bill Details Card */}
          {fetchedBill && (
            <div
              className="dashboard-card"
              style={{
                background: 'linear-gradient(135deg, rgba(11, 21, 36, 0.98) 0%, rgba(7, 14, 25, 0.98) 100%)',
                borderColor: fetchedBill.isPayable ? '#00A8FF' : '#17385D',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: fetchedBill.isPayable ? '0 0 20px rgba(0, 166, 255, 0.15)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #17385D', paddingBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: '#00D5FF', fontWeight: '700', letterSpacing: '0.8px' }}>
                      VERIFIED BBPS BILL ENQUIRY
                    </span>
                    {(fetchedBill.metadata?.state || selectedBiller?.state) && (
                      <span className="sidebar-badge blue" style={{ fontSize: '10px' }}>
                        {fetchedBill.metadata?.state || selectedBiller?.state}
                      </span>
                    )}
                    {(selectedBiller?.regionName || fetchedBill.metadata?.regionName) && (
                      <span className="sidebar-badge green" style={{ fontSize: '10px' }}>
                        {selectedBiller?.regionName || fetchedBill.metadata?.regionName}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                    {fetchedBill.billerName}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '3px' }}>
                    Ref: <code style={{ color: '#00D5FF' }}>{fetchedBill.fetchReferenceId}</code>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    className={`sidebar-badge ${
                      fetchedBill.billStatus === 'paid'
                        ? 'green'
                        : fetchedBill.billStatus === 'overdue'
                        ? 'red'
                        : 'amber'
                    }`}
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                  >
                    ● {fetchedBill.billStatus.toUpperCase()}
                  </span>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: fetchedBill.isPayable ? '#10B981' : '#A9BDD7', marginTop: '6px' }}>
                    {formatINR(fetchedBill.billAmount)}
                  </div>
                </div>
              </div>

              {/* Bill Attributes Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '14px',
                  margin: '20px 0'
                }}
              >
                <div style={{ background: '#071426', padding: '12px', borderRadius: '8px', border: '1px solid #0E223D' }}>
                  <div style={{ fontSize: '11px', color: '#6B87A8' }}>Customer Name</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', marginTop: '4px' }}>
                    {fetchedBill.customerName || 'N/A'}
                  </div>
                </div>

                <div style={{ background: '#071426', padding: '12px', borderRadius: '8px', border: '1px solid #0E223D' }}>
                  <div style={{ fontSize: '11px', color: '#6B87A8' }}>Consumer / Account No</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#00D5FF', marginTop: '4px', fontFamily: 'monospace' }}>
                    {fetchedBill.consumerNumber}
                  </div>
                </div>

                <div style={{ background: '#071426', padding: '12px', borderRadius: '8px', border: '1px solid #0E223D' }}>
                  <div style={{ fontSize: '11px', color: '#6B87A8' }}>Bill & Meter Number</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', marginTop: '4px', fontFamily: 'monospace' }}>
                    {fetchedBill.billNumber}
                    {fetchedBill.metadata?.meterNumber ? ` • ${fetchedBill.metadata.meterNumber}` : ''}
                  </div>
                </div>

                <div style={{ background: '#071426', padding: '12px', borderRadius: '8px', border: '1px solid #0E223D' }}>
                  <div style={{ fontSize: '11px', color: '#6B87A8' }}>Billing Cycle & Consumption</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', marginTop: '4px' }}>
                    {fetchedBill.billPeriod || 'Current Month'}
                    {fetchedBill.metadata?.unitsConsumed ? ` (${fetchedBill.metadata.unitsConsumed})` : ''}
                  </div>
                </div>

                <div style={{ background: '#071426', padding: '12px', borderRadius: '8px', border: '1px solid #0E223D' }}>
                  <div style={{ fontSize: '11px', color: '#6B87A8' }}>Bill Date</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', marginTop: '4px' }}>
                    {fetchedBill.billDate || 'N/A'}
                  </div>
                </div>

                <div style={{ background: '#071426', padding: '12px', borderRadius: '8px', border: '1px solid #0E223D' }}>
                  <div style={{ fontSize: '11px', color: '#6B87A8' }}>Due Date</div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: fetchedBill.billStatus === 'overdue' ? '#EF4444' : '#10B981',
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {fetchedBill.dueDate || 'N/A'}
                    {fetchedBill.billStatus === 'overdue' && <span>(Overdue)</span>}
                  </div>
                </div>
              </div>

              {/* Financial Charges Breakdown */}
              {fetchedBill.billAmount > 0 && (
                <div style={{ background: '#071426', borderRadius: '10px', padding: '14px 18px', border: '1px solid #132742', marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#A9BDD7', marginBottom: '8px', letterSpacing: '0.5px' }}>
                    BILL CHARGES BREAKDOWN
                  </div>
                  <table className="bill-breakdown-table">
                    <tbody>
                      <tr>
                        <td style={{ color: '#A9BDD7' }}>Energy Charges (Units Consumed)</td>
                        <td style={{ textAlign: 'right', fontWeight: '600', color: '#FFFFFF' }}>
                          ₹{fetchedBill.metadata?.energyCharges ? fetchedBill.metadata.energyCharges.toFixed(2) : (fetchedBill.billAmount - 110 - (fetchedBill.metadata?.lateFee || 0)).toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ color: '#A9BDD7' }}>Fixed Meter Rent & Regulatory Duty</td>
                        <td style={{ textAlign: 'right', fontWeight: '600', color: '#FFFFFF' }}>
                          ₹{fetchedBill.metadata?.fixedCharges ? fetchedBill.metadata.fixedCharges.toFixed(2) : '110.00'}
                        </td>
                      </tr>
                      {fetchedBill.metadata?.lateFee > 0 && (
                        <tr>
                          <td style={{ color: '#EF4444' }}>Late Payment Surcharge</td>
                          <td style={{ textAlign: 'right', fontWeight: '700', color: '#EF4444' }}>
                            +₹{fetchedBill.metadata.lateFee.toFixed(2)}
                          </td>
                        </tr>
                      )}
                      <tr style={{ borderTop: '1px solid #17385D' }}>
                        <td style={{ fontWeight: '700', color: '#FFFFFF', paddingTop: '10px' }}>Total Amount Due</td>
                        <td style={{ textAlign: 'right', fontWeight: '800', color: '#10B981', fontSize: '15px', paddingTop: '10px' }}>
                          {formatINR(fetchedBill.billAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Already Paid Notice */}
              {fetchedBill.billStatus === 'paid' && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid #10B981',
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#10B981'
                  }}
                >
                  <CheckCircleIcon size={20} />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px' }}>No Payment Due</div>
                    <div style={{ fontSize: '12px', color: '#A7F3D0', marginTop: '2px' }}>
                      All dues for this consumer number have been settled with {fetchedBill.billerName}.
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Section for Payable Bills */}
              {fetchedBill.isPayable && (
                <div style={{ borderTop: '1px solid #17385D', paddingTop: '20px', marginTop: '10px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF', marginBottom: '14px' }}>
                    Choose Payment Method
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                    {/* DEMO Simulation Mode */}
                    <div
                      onClick={() => setPaymentMode('DEMO')}
                      style={{
                        background: paymentMode === 'DEMO' ? 'rgba(0, 166, 255, 0.12)' : '#071426',
                        border: paymentMode === 'DEMO' ? '2px solid #00A8FF' : '1px solid #17385D',
                        borderRadius: '10px',
                        padding: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <SparklesIcon size={18} style={{ color: '#00A8FF' }} />
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>Demo Sandbox Mode</span>
                        </div>
                        <span className="sidebar-badge blue">Instant Test</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '6px' }}>
                        Fast simulation with realistic receipt. No wallet balance required or deducted.
                      </div>
                    </div>

                    {/* WALLET Live Escrow Mode */}
                    <div
                      onClick={() => setPaymentMode('WALLET')}
                      style={{
                        background: paymentMode === 'WALLET' ? 'rgba(16, 185, 129, 0.12)' : '#071426',
                        border: paymentMode === 'WALLET' ? '2px solid #10B981' : '1px solid #17385D',
                        borderRadius: '10px',
                        padding: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <WalletIcon size={18} style={{ color: '#10B981' }} />
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>ApnaPay Escrow Wallet</span>
                        </div>
                        <span className="sidebar-badge green">Ledger Tracked</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '6px' }}>
                        Deducts ₹{fetchedBill.billAmount} from wallet ({formatINR(walletBalance || 0)} available) with double-entry ledger entry.
                      </div>
                    </div>
                  </div>

                  {/* WALLET Mode Pin Prompt */}
                  {paymentMode === 'WALLET' && (
                    <div
                      style={{
                        background: '#071426',
                        border: '1px solid #17385D',
                        borderRadius: '8px',
                        padding: '14px',
                        marginBottom: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#FFFFFF' }}>
                          Wallet Transaction PIN
                        </div>
                        <div style={{ fontSize: '11px', color: '#6B87A8' }}>
                          Enter your 4-digit PIN to authorize escrow balance debit (Default demo PIN: 1234)
                        </div>
                      </div>
                      <input
                        type="password"
                        maxLength={6}
                        value={paymentPin}
                        onChange={(e) => setPaymentPin(e.target.value)}
                        placeholder="1234"
                        style={{
                          width: '120px',
                          background: '#0B1B32',
                          border: '1px solid #17385D',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '14px',
                          letterSpacing: '3px',
                          textAlign: 'center',
                          color: '#FFFFFF'
                        }}
                      />
                    </div>
                  )}

                  {/* Save to Favorites Checkbox */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#A9BDD7' }}>
                      <input
                        type="checkbox"
                        checked={saveAsFavorite}
                        onChange={(e) => setSaveAsFavorite(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#00A8FF' }}
                      />
                      <span>Save this biller to my favorites for quick 1-click recharges</span>
                    </label>

                    {saveAsFavorite && (
                      <input
                        type="text"
                        placeholder="Give a nickname (e.g. Home Electricity, Office DTH)"
                        value={favoriteNickname}
                        onChange={(e) => setFavoriteNickname(e.target.value)}
                        style={{
                          marginTop: '8px',
                          width: '100%',
                          maxWidth: '360px',
                          background: '#071426',
                          border: '1px solid #17385D',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          color: '#FFFFFF'
                        }}
                      />
                    )}
                  </div>

                  {/* Pay Button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setFetchedBill(null)}
                      className="auth-button secondary"
                      style={{ width: 'auto', padding: '0 20px', height: '42px', fontSize: '13px', margin: 0 }}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handlePayBill}
                      disabled={isPaying}
                      className="auth-button"
                      style={{
                        width: 'auto',
                        padding: '0 28px',
                        height: '42px',
                        fontSize: '13px',
                        margin: 0,
                        background: '#10B981',
                        borderColor: '#10B981',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {isPaying ? (
                        <>
                          <RefreshCwIcon size={16} className="animate-spin" />
                          <span>Processing Payment...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon size={16} />
                          <span>Pay {formatINR(fetchedBill.billAmount)} Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: SAVED BILLERS ================= */}
      {activeTab === 'favorites' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                Saved Billers & Frequent Payees
              </h3>
              <p style={{ fontSize: '12px', color: '#A9BDD7', margin: '2px 0 0 0' }}>
                Quickly fetch dues and settle utility bills with your pre-saved consumer IDs.
              </p>
            </div>
            <button
              onClick={loadFavorites}
              className="auth-button secondary"
              style={{ width: 'auto', padding: '0 14px', height: '34px', fontSize: '12px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCwIcon size={13} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingFavorites ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#A9BDD7' }}>
              <RefreshCwIcon size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
              <div>Loading your saved billers...</div>
            </div>
          ) : favorites.length === 0 ? (
            <div
              className="dashboard-card"
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: '#0B1B32',
                borderColor: '#17385D'
              }}
            >
              <BookmarkIcon size={36} style={{ color: '#17385D', margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF' }}>No Saved Billers Yet</div>
              <p style={{ fontSize: '12px', color: '#A9BDD7', maxWidth: '360px', margin: '6px auto 16px auto' }}>
                When paying a bill, check "Save this biller to my favorites" to access 1-click payments here.
              </p>
              <button
                onClick={() => setActiveTab('pay')}
                className="auth-button"
                style={{ width: 'auto', padding: '0 18px', height: '36px', fontSize: '12px', margin: 0 }}
              >
                Pay a New Bill Now
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px'
              }}
            >
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="dashboard-card"
                  style={{
                    background: '#0B1B32',
                    borderColor: '#17385D',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: '#0E223D',
                            color: '#00A8FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {getCategoryIcon(fav.categoryKey, 18)}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>
                            {fav.nickname || fav.billerName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6B87A8' }}>
                            {fav.billerName}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteFavorite(fav.id)}
                        disabled={deletingFavoriteId === fav.id}
                        title="Delete saved biller"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>

                    <div style={{ background: '#071426', borderRadius: '6px', padding: '10px 12px', margin: '14px 0 16px 0' }}>
                      <div style={{ fontSize: '11px', color: '#6B87A8' }}>Registered Consumer ID</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#00A8FF', fontFamily: 'monospace' }}>
                        {fav.maskedConsumerNumber || fav.consumerNumber}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuickPayFavorite(fav)}
                    className="auth-button"
                    style={{
                      width: '100%',
                      height: '36px',
                      fontSize: '12px',
                      margin: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>Quick Fetch & Pay</span>
                    <ArrowRightIcon size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: PAYMENT HISTORY ================= */}
      {activeTab === 'history' && (
        <div>
          {/* Filters Bar */}
          <div
            className="dashboard-card"
            style={{
              background: '#0B1B32',
              borderColor: '#17385D',
              padding: '16px',
              marginBottom: '18px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
                {/* Search */}
                <div style={{ position: 'relative', minWidth: '200px', flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Search biller or txn reference..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') loadHistory(1); }}
                    style={{
                      width: '100%',
                      background: '#071426',
                      border: '1px solid #17385D',
                      borderRadius: '6px',
                      padding: '8px 12px 8px 32px',
                      fontSize: '12px',
                      color: '#FFFFFF',
                      outline: 'none'
                    }}
                  />
                  <SearchIcon size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#6B87A8' }} />
                </div>

                {/* Status Filter */}
                <select
                  value={historyFilterStatus}
                  onChange={(e) => setHistoryFilterStatus(e.target.value)}
                  style={{
                    background: '#071426',
                    border: '1px solid #17385D',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#FFFFFF',
                    outline: 'none'
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUCCESS">Success</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>

                {/* Category Filter */}
                <select
                  value={historyFilterCategory}
                  onChange={(e) => setHistoryFilterCategory(e.target.value)}
                  style={{
                    background: '#071426',
                    border: '1px solid #17385D',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#FFFFFF',
                    outline: 'none'
                  }}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id || c.categoryKey} value={c.categoryKey}>
                      {c.name || c.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => loadHistory(1)}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 14px', height: '34px', fontSize: '12px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <FilterIcon size={13} />
                <span>Apply Filter</span>
              </button>
            </div>
          </div>

          {/* History Table */}
          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#A9BDD7' }}>
              <RefreshCwIcon size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
              <div>Loading payment history records...</div>
            </div>
          ) : historyList.length === 0 ? (
            <div
              className="dashboard-card"
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: '#0B1B32',
                borderColor: '#17385D'
              }}
            >
              <HistoryIcon size={36} style={{ color: '#17385D', margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF' }}>No Bill Payment Records</div>
              <p style={{ fontSize: '12px', color: '#A9BDD7', maxWidth: '360px', margin: '6px auto 16px auto' }}>
                Your completed utility payments and receipts will appear here with full ledger tracking.
              </p>
              <button
                onClick={() => setActiveTab('pay')}
                className="auth-button"
                style={{ width: 'auto', padding: '0 18px', height: '36px', fontSize: '12px', margin: 0 }}
              >
                Pay Your First Bill
              </button>
            </div>
          ) : (
            <div className="dashboard-card" style={{ background: '#0B1B32', borderColor: '#17385D', padding: '0', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#071426', borderBottom: '1px solid #17385D', color: '#A9BDD7' }}>
                      <th style={{ padding: '12px 16px' }}>Date & Time</th>
                      <th style={{ padding: '12px 16px' }}>Txn Reference</th>
                      <th style={{ padding: '12px 16px' }}>Biller & Category</th>
                      <th style={{ padding: '12px 16px' }}>Consumer No.</th>
                      <th style={{ padding: '12px 16px' }}>Amount</th>
                      <th style={{ padding: '12px 16px' }}>Mode</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.map((row) => (
                      <tr
                        key={row.id}
                        style={{
                          borderBottom: '1px solid #0E223D',
                          color: '#FFFFFF',
                          transition: 'background 0.15s'
                        }}
                      >
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: '#A9BDD7' }}>
                          {formatDate(row.paidAt || row.createdAt)}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#00A8FF' }}>
                          {row.txnReference}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: '600' }}>{row.billerName}</div>
                          <div style={{ fontSize: '11px', color: '#6B87A8', textTransform: 'capitalize' }}>
                            {row.categoryName || row.categoryKey}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>
                          {row.maskedConsumerNumber || row.consumerNumber}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: '700', color: '#10B981' }}>
                          {formatINR(row.amount)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={`sidebar-badge ${row.paymentMode === 'WALLET' ? 'green' : 'blue'}`}>
                            {row.paymentMode}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            className={`sidebar-badge ${
                              row.status === 'SUCCESS' ? 'green' : row.status === 'FAILED' ? 'red' : 'yellow'
                            }`}
                          >
                            ● {row.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleViewHistoricalReceipt(row)}
                            style={{
                              background: '#0E223D',
                              border: '1px solid #17385D',
                              color: '#00A8FF',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {historyPagination.totalPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderTop: '1px solid #17385D',
                    background: '#071426'
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#A9BDD7' }}>
                    Showing page {historyPagination.page} of {historyPagination.totalPages} ({historyPagination.totalRecords} payments)
                  </span>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => loadHistory(historyPage - 1)}
                      disabled={historyPage <= 1}
                      className="auth-button secondary"
                      style={{ width: 'auto', padding: '0 12px', height: '30px', fontSize: '11px', margin: 0 }}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => loadHistory(historyPage + 1)}
                      disabled={historyPage >= historyPagination.totalPages}
                      className="auth-button secondary"
                      style={{ width: 'auto', padding: '0 12px', height: '30px', fontSize: '11px', margin: 0 }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= PAYMENT RECEIPT MODAL ================= */}
      {showReceiptModal && paymentResult && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#0B1B32',
              border: '1px solid #17385D',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowReceiptModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#A9BDD7',
                cursor: 'pointer'
              }}
            >
              <XIcon size={20} />
            </button>

            {/* Receipt Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid #10B981',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}
              >
                <CheckCircleIcon size={30} />
              </div>
              <span className="sidebar-badge green" style={{ fontSize: '11px' }}>
                PAYMENT SUCCESSFUL
              </span>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#FFFFFF', margin: '8px 0 2px 0' }}>
                {formatINR(paymentResult.amount)}
              </h3>
              <p style={{ fontSize: '12px', color: '#A9BDD7', margin: 0 }}>
                Paid to {paymentResult.billerName}
              </p>
            </div>

            {/* Txn Reference Box */}
            <div
              style={{
                background: '#071426',
                border: '1px solid #17385D',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '10px', color: '#6B87A8', textTransform: 'uppercase' }}>
                  Transaction Reference ID
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#00A8FF', fontFamily: 'monospace' }}>
                  {paymentResult.txnReference}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(paymentResult.txnReference)}
                style={{
                  background: '#0E223D',
                  border: '1px solid #17385D',
                  color: copiedTxn ? '#10B981' : '#A9BDD7',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {copiedTxn ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
                <span>{copiedTxn ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Receipt Breakdown Details */}
            <div style={{ borderTop: '1px dashed #17385D', borderBottom: '1px dashed #17385D', padding: '12px 0', marginBottom: '16px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#A9BDD7' }}>Provider & Discom</span>
                <span style={{ fontWeight: '600', color: '#FFFFFF', textAlign: 'right' }}>
                  {paymentResult.billerName}
                  {(paymentResult.metadata?.regionName || selectedBiller?.regionName) && (
                    <div style={{ fontSize: '11px', color: '#00D5FF', fontWeight: '500' }}>
                      {paymentResult.metadata?.regionName || selectedBiller?.regionName}
                    </div>
                  )}
                </span>
              </div>
              {paymentResult.metadata?.division && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#A9BDD7' }}>Division</span>
                  <span style={{ color: '#FFFFFF' }}>{paymentResult.metadata.division}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#A9BDD7' }}>Customer Name</span>
                <span style={{ fontWeight: '600', color: '#FFFFFF' }}>{paymentResult.customerName || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#A9BDD7' }}>Consumer Number</span>
                <span style={{ fontFamily: 'monospace', color: '#00D5FF' }}>
                  {paymentResult.maskedConsumerNumber || paymentResult.consumerNumber}
                </span>
              </div>
              {(paymentResult.metadata?.meterNumber || paymentResult.meterNumber) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#A9BDD7' }}>Meter / Units</span>
                  <span style={{ fontFamily: 'monospace', color: '#FFFFFF' }}>
                    {paymentResult.metadata?.meterNumber || paymentResult.meterNumber}
                    {paymentResult.metadata?.unitsConsumed ? ` • ${paymentResult.metadata.unitsConsumed}` : ''}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#A9BDD7' }}>Payment Mode</span>
                <span className={`sidebar-badge ${paymentResult.paymentMode === 'WALLET' ? 'green' : 'blue'}`}>
                  {paymentResult.paymentMode}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#A9BDD7' }}>BBPS Ref No.</span>
                <span style={{ fontFamily: 'monospace', color: '#A9BDD7' }}>
                  {paymentResult.receipt?.bbpsRefNo || `BBPS-${paymentResult.id || 'SIM'}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#A9BDD7' }}>Timestamp</span>
                <span style={{ color: '#A9BDD7' }}>
                  {formatDate(paymentResult.paidAt || paymentResult.createdAt)}
                </span>
              </div>
            </div>

            {/* Demo Simulation Notice Watermark */}
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '8px',
                padding: '8px 12px',
                textAlign: 'center',
                fontSize: '11px',
                color: '#FCD34D',
                marginBottom: '18px'
              }}
            >
              Demo Simulation Receipt • For Demonstration Purposes Only
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  window.print();
                }}
                className="auth-button secondary"
                style={{
                  flex: 1,
                  height: '38px',
                  fontSize: '12px',
                  margin: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <DownloadIcon size={14} />
                <span>Print Receipt</span>
              </button>

              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setActiveTab('history');
                  loadHistory(1);
                }}
                className="auth-button"
                style={{ flex: 1, height: '38px', fontSize: '12px', margin: 0 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerBillsPage;

