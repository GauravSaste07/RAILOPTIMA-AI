import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const DEPARTMENT_DEFECT_OPTIONS = {
  Engineering: [
    { label: 'Rail Fracture', value: 'track_defect', targetType: 'Track Segment', defaultUrgency: 'Emergency' },
    { label: 'Thermite Weld Failure', value: 'track_defect', targetType: 'Track Segment', defaultUrgency: 'Emergency' },
    { label: 'Track Gauge Slack', value: 'track_defect', targetType: 'Track Segment', defaultUrgency: 'High' },
    { label: 'Track Alignment Defect', value: 'track_defect', targetType: 'Track Segment', defaultUrgency: 'High' },
    { label: 'Rail Joint Crack', value: 'track_defect', targetType: 'Track Segment', defaultUrgency: 'High' },
    { label: 'Fishplate Crack', value: 'track_defect', targetType: 'Track Segment', defaultUrgency: 'High' },
    { label: 'Missing Joint Bolts', value: 'track_defect', targetType: 'Track Segment', defaultUrgency: 'High' },
    { label: 'Rail Corrugation', value: 'track_defect', targetType: 'Track Segment', defaultUrgency: 'Normal' },
    { label: 'Rail Surface Spalling', value: 'track_defect', targetType: 'Track Segment', defaultUrgency: 'Normal' },
    { label: 'Wheel Burn Defect', value: 'track_defect', targetType: 'Track Segment', defaultUrgency: 'Normal' },
    { label: 'Ballast Fouling', value: 'track_defect', targetType: 'Track Segment', defaultUrgency: 'Normal' },
    { label: 'Track Packing Required', value: 'track_defect', targetType: 'Track Segment', defaultUrgency: 'Normal' },
    { label: 'Point Machine Switch Jam', value: 'track_defect', targetType: 'Turnout Switch', defaultUrgency: 'Emergency' },
    { label: 'Tongue Rail Jam', value: 'track_defect', targetType: 'Turnout Switch', defaultUrgency: 'Emergency' },
    { label: 'Crossing Nose Wear', value: 'track_defect', targetType: 'Turnout Switch', defaultUrgency: 'High' },
    { label: 'Check Rail Clearance Defect', value: 'track_defect', targetType: 'Turnout Switch', defaultUrgency: 'High' },
    { label: 'Level Crossing Road Surface Defect', value: 'track_defect', targetType: 'Level Crossing Track', defaultUrgency: 'High' },
    { label: 'Check Rail Flangeway Jam', value: 'track_defect', targetType: 'Level Crossing Track', defaultUrgency: 'High' },
    { label: 'Bridge Girder Distortion', value: 'track_defect', targetType: 'Bridge Structure', defaultUrgency: 'Emergency' },
    { label: 'Expansion Bearing Defect', value: 'track_defect', targetType: 'Bridge Structure', defaultUrgency: 'Emergency' },
    { label: 'Track Creep', value: 'track_defect', targetType: 'Track Segment', defaultUrgency: 'Normal' },
    { label: 'LWR Breathing Joint Gap Defect', value: 'track_defect', targetType: 'Track Segment', defaultUrgency: 'Normal' },
  ],
  'Signal & Telecom': [
    { label: 'Signal Aspect Blown', value: 'signal_fault', targetType: 'Electronic Interlocking', defaultUrgency: 'Emergency' },
    { label: 'Signal Lamp Extinguished', value: 'signal_fault', targetType: 'Electronic Interlocking', defaultUrgency: 'Emergency' },
    { label: 'Point Machine Motor Stall', value: 'signal_fault', targetType: 'Point Machine', defaultUrgency: 'Emergency' },
    { label: 'Point Detection Failure', value: 'signal_fault', targetType: 'Point Machine', defaultUrgency: 'Emergency' },
    { label: 'Point Ground Connection Slack', value: 'signal_fault', targetType: 'Point Machine', defaultUrgency: 'High' },
    { label: 'Point Rod Bending', value: 'signal_fault', targetType: 'Point Machine', defaultUrgency: 'High' },
    { label: 'Digital Axle Counter (DAC) Reset', value: 'signal_fault', targetType: 'Digital Axle Counter', defaultUrgency: 'High' },
    { label: 'Axle Counter Count Mismatch', value: 'signal_fault', targetType: 'Digital Axle Counter', defaultUrgency: 'High' },
    { label: 'Track Circuit Drop', value: 'signal_fault', targetType: 'Track Circuit', defaultUrgency: 'High' },
    { label: 'Low Ballast Resistance (TC)', value: 'signal_fault', targetType: 'Track Circuit', defaultUrgency: 'High' },
    { label: 'Signalling Cable Cut', value: 'signal_fault', targetType: 'Track Circuit', defaultUrgency: 'High' },
    { label: 'Electronic Interlocking CPU Failure', value: 'signal_fault', targetType: 'Electronic Interlocking', defaultUrgency: 'Emergency' },
    { label: 'EI Card Communication Fail', value: 'signal_fault', targetType: 'Electronic Interlocking', defaultUrgency: 'Emergency' },
    { label: 'Block Instrument Failure', value: 'signal_fault', targetType: 'Electronic Interlocking', defaultUrgency: 'Emergency' },
    { label: 'Level Crossing Gate Boom Lock Failure', value: 'signal_fault', targetType: 'Electronic Interlocking', defaultUrgency: 'Emergency' },
  ],
  'Traction Distribution': [
    { label: 'OHE Contact Wire Sag', value: 'traction_fault', targetType: 'OHE Catenary Wire', defaultUrgency: 'Emergency' },
    { label: 'OHE Contact Wire Height Defect', value: 'traction_fault', targetType: 'OHE Catenary Wire', defaultUrgency: 'Emergency' },
    { label: 'Snapped Dropper', value: 'traction_fault', targetType: 'OHE Catenary Wire', defaultUrgency: 'High' },
    { label: 'Loose Jumper Cable', value: 'traction_fault', targetType: 'OHE Catenary Wire', defaultUrgency: 'High' },
    { label: 'Cantilever Insulator Flashover', value: 'traction_fault', targetType: 'Cantilever Assembly', defaultUrgency: 'Emergency' },
    { label: 'Cantilever Assembly Tilt', value: 'traction_fault', targetType: 'Cantilever Assembly', defaultUrgency: 'Emergency' },
    { label: 'Section Insulator Defect', value: 'traction_fault', targetType: 'Section Insulator', defaultUrgency: 'High' },
    { label: 'Neutral Section Overlap Arc', value: 'traction_fault', targetType: 'Section Insulator', defaultUrgency: 'High' },
    { label: 'TSS Transformer Tripping', value: 'traction_fault', targetType: 'Traction Substation', defaultUrgency: 'Emergency' },
    { label: 'TSS Feeder Circuit Breaker Trip', value: 'traction_fault', targetType: 'Traction Substation', defaultUrgency: 'Emergency' },
    { label: 'Auto-Tensioning Device (ATD) Jam', value: 'traction_fault', targetType: 'OHE Catenary Wire', defaultUrgency: 'Normal' },
    { label: 'Structure Earthing Corrosion', value: 'traction_fault', targetType: 'Cantilever Assembly', defaultUrgency: 'Normal' },
    { label: 'OHE Tree Branch Infringement', value: 'traction_fault', targetType: 'OHE Catenary Wire', defaultUrgency: 'High' },
  ],
};

// Real-World Station Names, Block Sections & Directions per Corridor Section
const SECTION_STATION_TRACKS = {
  'ADI-BRC': [
    { label: 'DOWN Line (Towards Vadodara — BRC)', value: 'DOWN Main Line', defaultKm: '45.2', marker: 'Mast 45/12' },
    { label: 'UP Line (Towards Ahmedabad — ADI)', value: 'UP Main Line', defaultKm: '45.2', marker: 'Mast 45/11' },
    { label: 'Nadiad - Anand Block Section (ND - ANND)', value: 'DOWN Main Line', defaultKm: '52.4', marker: 'Pole 52/18' },
    { label: 'Vadodara Junction Yard (BRC Yard)', value: 'Station Yard / Loop Line', defaultKm: 'Yard', marker: 'Point 104A' },
    { label: 'Ahmedabad Junction Yard (ADI Yard)', value: 'Station Yard / Loop Line', defaultKm: 'Yard', marker: 'Point 201B' },
  ],
  'NDLS-GZB': [
    { label: 'DOWN Main (Towards Ghaziabad — GZB)', value: 'DOWN Main Line', defaultKm: '14.5', marker: 'Mast 14/12' },
    { label: 'UP Main (Towards New Delhi — NDLS)', value: 'UP Main Line', defaultKm: '14.5', marker: 'Mast 14/11' },
    { label: 'Anand Vihar - Sahibabad (ANVR - SBB)', value: 'UP Main Line', defaultKm: '12.8', marker: 'Mast 12/20' },
    { label: '3rd / 4th Fast EMU Track', value: '3rd Line (Goods / Fast)', defaultKm: '18.0', marker: 'Mast 18/04' },
    { label: 'Ghaziabad Junction Yard (GZB Yard)', value: 'Station Yard / Loop Line', defaultKm: 'Yard', marker: 'Point 104A' },
    { label: 'New Delhi Station Yard (NDLS Yard & Neck)', value: 'Station Yard / Loop Line', defaultKm: 'Yard', marker: 'Point 101A' },
  ],
  'CSMT-KYN': [
    { label: 'DOWN Fast Line (Towards Kalyan — KYN)', value: 'DOWN Main Line', defaultKm: '32.4', marker: 'Mast 32/14' },
    { label: 'UP Fast Line (Towards Mumbai CSMT)', value: 'UP Main Line', defaultKm: '32.4', marker: 'Mast 32/13' },
    { label: 'Thane - Diva Suburban Section', value: 'DOWN Main Line', defaultKm: '34.0', marker: 'Mast 34/08' },
    { label: 'Dadar - Kurla Central Section (DR - CLA)', value: 'UP Main Line', defaultKm: '10.5', marker: 'Mast 10/16' },
    { label: 'Kalyan Junction Yard (KYN Yard)', value: 'Station Yard / Loop Line', defaultKm: 'Yard', marker: 'Point 102B' },
  ],
  'HWH-BWN': [
    { label: 'DOWN Main (Towards Barddhaman — BWN)', value: 'DOWN Main Line', defaultKm: '68.2', marker: 'Mast 68/20' },
    { label: 'UP Main (Towards Howrah — HWH)', value: 'UP Main Line', defaultKm: '68.2', marker: 'Mast 68/19' },
    { label: 'Bandel Junction Chord (BDC Section)', value: '3rd Line (Goods / Fast)', defaultKm: '40.0', marker: 'Mast 40/06' },
    { label: 'Howrah Terminal Yard (HWH Yard)', value: 'Station Yard / Loop Line', defaultKm: 'Yard', marker: 'Point 101A' },
    { label: 'Barddhaman Junction Yard (BWN Yard)', value: 'Station Yard / Loop Line', defaultKm: 'Yard', marker: 'Point 204B' },
  ],
  'SBC-JTJ': [
    { label: 'DOWN Line (Towards Jolarpettai — JTJ)', value: 'DOWN Main Line', defaultKm: '48.0', marker: 'Mast 48/12' },
    { label: 'UP Line (Towards Bengaluru — SBC)', value: 'UP Main Line', defaultKm: '48.0', marker: 'Mast 48/11' },
    { label: 'Krishnarajapuram - Bangarapet Section (KJM - BWT)', value: 'DOWN Main Line', defaultKm: '35.4', marker: 'Mast 35/08' },
    { label: 'Kuppam - Jolarpettai Ghat Section', value: 'UP Main Line', defaultKm: '105.2', marker: 'Mast 105/14' },
    { label: 'Jolarpettai Junction Yard (JTJ Yard)', value: 'Station Yard / Loop Line', defaultKm: 'Yard', marker: 'Point 106A' },
  ],
  'MAS-AJJ': [
    { label: 'DOWN Line (Towards Arakkonam — AJJ)', value: 'DOWN Main Line', defaultKm: '38.5', marker: 'Mast 38/12' },
    { label: 'UP Line (Towards Chennai Central — MAS)', value: 'UP Main Line', defaultKm: '38.5', marker: 'Mast 38/11' },
    { label: 'Avadi - Tiruvallur Section (AVD - TRL)', value: 'DOWN Main Line', defaultKm: '22.0', marker: 'Mast 22/08' },
    { label: 'Arakkonam Junction Yard (AJJ Yard)', value: 'Station Yard / Loop Line', defaultKm: 'Yard', marker: 'Point 104A' },
  ],
  'PUNE-DD': [
    { label: 'DOWN Line (Towards Daund — DD)', value: 'DOWN Main Line', defaultKm: '35.0', marker: 'Mast 35/10' },
    { label: 'UP Line (Towards Pune Junction — PUNE)', value: 'UP Main Line', defaultKm: '35.0', marker: 'Mast 35/09' },
    { label: 'Hadapsar - Loni Section (HDP - LONI)', value: 'DOWN Main Line', defaultKm: '12.4', marker: 'Mast 12/18' },
    { label: 'Daund Junction Yard (DD Yard)', value: 'Station Yard / Loop Line', defaultKm: 'Yard', marker: 'Point 105B' },
  ],
  'LKO-CNB': [
    { label: 'DOWN Line (Towards Kanpur Central — CNB)', value: 'DOWN Main Line', defaultKm: '42.0', marker: 'Mast 42/10' },
    { label: 'UP Line (Towards Lucknow — LKO)', value: 'UP Main Line', defaultKm: '42.0', marker: 'Mast 42/09' },
    { label: 'Unnao Junction Section (ON Yard & Bypass)', value: '3rd Line (Goods / Fast)', defaultKm: '54.5', marker: 'Mast 54/14' },
    { label: 'Kanpur Central Yard (CNB Yard)', value: 'Station Yard / Loop Line', defaultKm: 'Yard', marker: 'Point 108A' },
  ],
  'BPL-ET': [
    { label: 'DOWN Line (Towards Itarsi — ET)', value: 'DOWN Main Line', defaultKm: '48.0', marker: 'Mast 48/14' },
    { label: 'UP Line (Towards Bhopal — BPL)', value: 'UP Main Line', defaultKm: '48.0', marker: 'Mast 48/13' },
    { label: 'Hoshangabad - Itarsi Narmada Section', value: 'UP Main Line', defaultKm: '72.5', marker: 'Mast 72/06' },
    { label: 'Itarsi Junction Yard (ET Yard & Marshalling)', value: 'Station Yard / Loop Line', defaultKm: 'Yard', marker: 'Point 112A' },
  ],
  'JP-AII': [
    { label: 'DOWN Line (Towards Ajmer — AII)', value: 'DOWN Main Line', defaultKm: '55.0', marker: 'Mast 55/12' },
    { label: 'UP Line (Towards Jaipur — JP)', value: 'UP Main Line', defaultKm: '55.0', marker: 'Mast 55/11' },
    { label: 'Phulera Junction Chord (FL Section)', value: '3rd Line (Goods / Fast)', defaultKm: '54.8', marker: 'Mast 54/20' },
    { label: 'Ajmer Junction Yard (AII Yard)', value: 'Station Yard / Loop Line', defaultKm: 'Yard', marker: 'Point 103B' },
  ],
  'ALD-MGS': [
    { label: 'DOWN Line (Towards Pt. Deen Dayal Upadhyaya — DDU)', value: 'DOWN Main Line', defaultKm: '65.0', marker: 'Mast 65/16' },
    { label: 'UP Line (Towards Prayagraj — PRYJ)', value: 'UP Main Line', defaultKm: '65.0', marker: 'Mast 65/15' },
    { label: 'Naini - Mirzapur Section (NYN - MZP)', value: 'DOWN Main Line', defaultKm: '42.0', marker: 'Mast 42/08' },
    { label: 'Pt. Deen Dayal Upadhyaya Yard (DDU Marshalling)', value: 'Station Yard / Loop Line', defaultKm: 'Yard', marker: 'Point 302A' },
  ],
  'GHY-NJP': [
    { label: 'DOWN Line (Towards New Jalpaiguri — NJP)', value: 'DOWN Main Line', defaultKm: '110.0', marker: 'Mast 110/10' },
    { label: 'UP Line (Towards Guwahati — GHY)', value: 'UP Main Line', defaultKm: '110.0', marker: 'Mast 110/09' },
    { label: 'Kamakhya - Rangiya Section (KYQ - RNY)', value: 'DOWN Main Line', defaultKm: '45.0', marker: 'Mast 45/14' },
    { label: 'New Jalpaiguri Yard (NJP Yard)', value: 'Station Yard / Loop Line', defaultKm: 'Yard', marker: 'Point 105A' },
  ],
  'TVC-QLN': [
    { label: 'DOWN Line (Towards Kollam — QLN)', value: 'DOWN Main Line', defaultKm: '32.0', marker: 'Mast 32/12' },
    { label: 'UP Line (Towards Thiruvananthapuram — TVC)', value: 'UP Main Line', defaultKm: '32.0', marker: 'Mast 32/11' },
    { label: 'Kochuveli - Kazhakuttam Section', value: 'DOWN Main Line', defaultKm: '14.0', marker: 'Mast 14/06' },
    { label: 'Kollam Junction Yard (QLN Yard)', value: 'Station Yard / Loop Line', defaultKm: 'Yard', marker: 'Point 102A' },
  ],
  'BZA-VSKP': [
    { label: 'DOWN Line (Towards Visakhapatnam — VSKP)', value: 'DOWN Main Line', defaultKm: '88.0', marker: 'Mast 88/14' },
    { label: 'UP Line (Towards Vijayawada — BZA)', value: 'UP Main Line', defaultKm: '88.0', marker: 'Mast 88/13' },
    { label: 'Rajahmundry Godavari Section (RJY - NDD)', value: 'UP Main Line', defaultKm: '148.0', marker: 'Mast 148/20' },
    { label: 'Visakhapatnam Marshalling Yard (VSKP Yard)', value: 'Station Yard / Loop Line', defaultKm: 'Yard', marker: 'Point 204C' },
  ],
  'NGP-BSL': [
    { label: 'DOWN Line (Towards Bhusaval — BSL)', value: 'DOWN Main Line', defaultKm: '75.0', marker: 'Mast 75/12' },
    { label: 'UP Line (Towards Nagpur — NGP)', value: 'UP Main Line', defaultKm: '75.0', marker: 'Mast 75/11' },
    { label: 'Wardha - Badnera Section (WR - BD)', value: 'DOWN Main Line', defaultKm: '95.0', marker: 'Mast 95/16' },
    { label: 'Bhusaval Junction Yard & Shed (BSL Yard)', value: 'Station Yard / Loop Line', defaultKm: 'Yard', marker: 'Point 107A' },
  ],
};

const getSectionTracks = (secId) => {
  if (!secId) return [];
  if (SECTION_STATION_TRACKS[secId]) {
    return SECTION_STATION_TRACKS[secId];
  }
  const parts = (secId || '').split('-');
  if (parts.length < 2 || !parts[0] || !parts[1]) return [];
  const stnA = parts[0] || 'Origin';
  const stnB = parts[1] || 'Destination';
  return [
    { label: `DOWN Line (Towards ${stnB})`, value: 'DOWN Main Line', defaultKm: '24.0', marker: 'Mast 24/10' },
    { label: `UP Line (Towards ${stnA})`, value: 'UP Main Line', defaultKm: '24.0', marker: 'Mast 24/09' },
    { label: `${stnB} Junction Yard`, value: 'Station Yard / Loop Line', defaultKm: 'Yard', marker: 'Point 104A' },
    { label: `${stnA} Junction Yard`, value: 'Station Yard / Loop Line', defaultKm: 'Yard', marker: 'Point 101B' },
  ];
};

const DEPARTMENT_NAME_TO_ID = {
  'Engineering': '1ef66a28-7465-4ed5-98b7-a5e91f64ed61',
  'Signal & Telecom': 'c710bd13-541c-4dcc-9ecb-14b2059649de',
  'Traction Distribution': '86916be9-bf38-4db6-b606-09a53d78bf3c',
};

const DEFAULT_SECTIONS = [
  { id: 'NDLS-GZB', section_name: 'New Delhi - Ghaziabad', zone: 'NR' },
  { id: 'CSMT-KYN', section_name: 'Mumbai CSMT - Kalyan', zone: 'CR' },
  { id: 'ADI-BRC', section_name: 'Ahmedabad - Vadodara', zone: 'WR' },
  { id: 'HWH-BWN', section_name: 'Howrah - Barddhaman', zone: 'ER' },
  { id: 'SBC-JTJ', section_name: 'Bengaluru - Jolarpettai', zone: 'SWR' },
  { id: 'MAS-AJJ', section_name: 'Chennai Central - Arakkonam', zone: 'SR' },
  { id: 'PUNE-DD', section_name: 'Pune - Daund', zone: 'CR' },
  { id: 'LKO-CNB', section_name: 'Lucknow - Kanpur Central', zone: 'NR' },
  { id: 'BPL-ET', section_name: 'Bhopal - Itarsi', zone: 'WCR' },
  { id: 'JP-AII', section_name: 'Jaipur - Ajmer', zone: 'NWR' },
  { id: 'ALD-MGS', section_name: 'Prayagraj - Pt. Deen Dayal Upadhyaya', zone: 'NCR' },
  { id: 'GHY-NJP', section_name: 'Guwahati - New Jalpaiguri', zone: 'NFR' },
  { id: 'TVC-QLN', section_name: 'Thiruvananthapuram - Kollam', zone: 'SR' },
  { id: 'BZA-VSKP', section_name: 'Vijayawada - Visakhapatnam', zone: 'SCR' },
  { id: 'NGP-BSL', section_name: 'Nagpur - Bhusaval', zone: 'CR' },
];

const FALLBACK_ASSETS_BY_DEPT = {
  'Engineering': [
    { id: 'AST-ENG-001', type: 'Track Segment', section_id: 'NDLS-GZB', criticality: '0.85' },
    { id: 'AST-ENG-055', type: 'Turnout Switch', section_id: 'NDLS-GZB', criticality: '0.90' },
    { id: 'AST-ENG-002', type: 'Level Crossing Track', section_id: 'NDLS-GZB', criticality: '0.75' },
    { id: 'AST-ENG-056', type: 'Bridge Structure', section_id: 'NDLS-GZB', criticality: '0.88' },
  ],
  'Signal & Telecom': [
    { id: 'AST-SNT-032', type: 'Electronic Interlocking', section_id: 'NDLS-GZB', criticality: '0.92' },
    { id: 'AST-SNT-001', type: 'Point Machine', section_id: 'NDLS-GZB', criticality: '0.85' },
    { id: 'AST-SNT-041', type: 'Digital Axle Counter', section_id: 'NDLS-GZB', criticality: '0.80' },
    { id: 'AST-SNT-053', type: 'Track Circuit', section_id: 'NDLS-GZB', criticality: '0.70' },
  ],
  'Traction Distribution': [
    { id: 'AST-TRD-001', type: 'OHE Catenary Wire', section_id: 'NDLS-GZB', criticality: '0.85' },
    { id: 'AST-TRD-033', type: 'Traction Substation', section_id: 'NDLS-GZB', criticality: '0.95' },
    { id: 'AST-TRD-002', type: 'Cantilever Assembly', section_id: 'NDLS-GZB', criticality: '0.75' },
    { id: 'AST-TRD-003', type: 'Section Insulator', section_id: 'NDLS-GZB', criticality: '0.80' },
  ],
};

const getDepartmentKey = (deptName) => {
  if (!deptName) return 'Engineering';
  const lower = deptName.toLowerCase();
  if (lower.includes('signal') || lower.includes('telecom') || lower.includes('s&t')) {
    return 'Signal & Telecom';
  }
  if (lower.includes('traction') || lower.includes('trd') || lower.includes('electrical') || lower.includes('ohe')) {
    return 'Traction Distribution';
  }
  return 'Engineering';
};

export default function SubmitRequest() {
  const navigate = useNavigate();
  const { user, profile, department, role } = useAuth();

  // Redirect admin users to Risk Queue since maintenance submission is field-department only
  useEffect(() => {
    if (role === 'admin') {
      navigate('/risk-queue', { replace: true });
    }
  }, [role, navigate]);

  const deptKey = getDepartmentKey(department);
  const effectiveDeptId = profile?.department_id || user?.user_metadata?.department_id || DEPARTMENT_NAME_TO_ID[deptKey] || '1ef66a28-7465-4ed5-98b7-a5e91f64ed61';
  const currentDefectOptions = DEPARTMENT_DEFECT_OPTIONS[deptKey] || DEPARTMENT_DEFECT_OPTIONS.Engineering;

  // Form State
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [selectedSection, setSelectedSection] = useState('');
  const [assets, setAssets] = useState(FALLBACK_ASSETS_BY_DEPT[deptKey] || FALLBACK_ASSETS_BY_DEPT.Engineering);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedLine, setSelectedLine] = useState('');
  const [kmLocation, setKmLocation] = useState('');
  const [locationMarker, setLocationMarker] = useState('');
  const [manualAssetOverride, setManualAssetOverride] = useState(false);
  const [selectedDefectLabel, setSelectedDefectLabel] = useState('');
  const [urgency, setUrgency] = useState('');
  const [overdueDays, setOverdueDays] = useState('');

  // Active resolved asset instance
  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  // NLP Free-Text Defect Classifier State
  const [defectText, setDefectText] = useState('');
  const [aiClassificationResult, setAiClassificationResult] = useState(null);
  const [classifying, setClassifying] = useState(false);

  const currentTracks = useMemo(() => getSectionTracks(selectedSection), [selectedSection]);

  // Sync selectedDefectLabel when department changes/initializes
  useEffect(() => {
    if (selectedDefectLabel && currentDefectOptions.length > 0) {
      const exists = currentDefectOptions.some((opt) => opt.label === selectedDefectLabel);
      if (!exists) {
        setSelectedDefectLabel('');
      }
    }
  }, [deptKey, currentDefectOptions, selectedDefectLabel]);

  // Smart Asset Auto-Resolver: Maps Defect Target Type -> Matching Asset in selected section
  useEffect(() => {
    if (!manualAssetOverride) {
      if (selectedDefectLabel && assets.length > 0) {
        const chosenOpt = currentDefectOptions.find((opt) => opt.label === selectedDefectLabel);
        const targetType = chosenOpt?.targetType?.toLowerCase();
        if (targetType) {
          const matched = assets.find((a) => a.type?.toLowerCase() === targetType);
          if (matched) {
            setSelectedAssetId(matched.id);
            return;
          }
        }
        setSelectedAssetId(assets[0]?.id || '');
      } else {
        setSelectedAssetId('');
      }
    }
  }, [selectedDefectLabel, assets, manualAssetOverride, currentDefectOptions]);

  const handleClassifyDefect = async (customText) => {
    const textToAnalyze = customText !== undefined ? customText : defectText;
    if (!textToAnalyze || !textToAnalyze.trim()) return;

    setClassifying(true);
    try {
      const resp = await fetch('http://127.0.0.1:8000/classify-defect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: textToAnalyze, department: deptKey }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.matched && data.detected_sublabel) {
          setAiClassificationResult(data);
          setSelectedDefectLabel(data.detected_sublabel);
          if (data.recommended_urgency) {
            setUrgency(data.recommended_urgency);
          }
          if (data.extracted_line) {
            setSelectedLine(data.extracted_line);
          }
          if (data.extracted_km) {
            setKmLocation(data.extracted_km);
          }
          if (data.extracted_marker) {
            setLocationMarker(data.extracted_marker);
          }
        } else {
          setAiClassificationResult(null);
        }
      } else {
        throw new Error('ML endpoint returned non-200');
      }
    } catch (err) {
      // Robust local fallback with typo tolerance
      const lower = textToAnalyze.toLowerCase()
        .replace(/\bpiont\b/g, 'point')
        .replace(/\bponit\b/g, 'point')
        .replace(/\bmchine\b/g, 'machine')
        .replace(/\bmotr\b/g, 'motor');

      let matchedOpt = null;
      let matchedUrgency = 'Normal';
      let matchedConfidence = 0.85;

      if (lower.includes('point machine') || lower.includes('motor stall') || (lower.includes('stall') && lower.includes('motor')) || (lower.includes('point') && lower.includes('motor')) || lower.includes('crank handle')) {
        matchedOpt = 'Point Machine Motor Stall / Detection Failure';
        matchedUrgency = 'Emergency';
        matchedConfidence = 0.90;
      } else if (lower.includes('rail joint') || (lower.includes('joint') && lower.includes('crack')) || lower.includes('joint crack') || lower.includes('joint defect')) {
        matchedOpt = 'Rail Joint Crack';
        matchedUrgency = 'High';
        matchedConfidence = 0.85;
      } else if (lower.includes('fishplate') || lower.includes('fish plate')) {
        matchedOpt = 'Fishplate Crack / Defect';
        matchedUrgency = 'High';
        matchedConfidence = 0.88;
      } else if (lower.includes('bolt') || lower.includes('joint bolt')) {
        matchedOpt = 'Missing Joint Bolts / Fastener Defect';
        matchedUrgency = 'High';
        matchedConfidence = 0.85;
      } else if (lower.includes('weld') || lower.includes('fracture') || lower.includes('thermite') || lower.includes('broken rail') || lower.includes('rail crack')) {
        matchedOpt = 'Rail Fracture / Thermite Weld Failure';
        matchedUrgency = 'Emergency';
        matchedConfidence = 0.92;
      } else if (lower.includes('turnout') || lower.includes('switch rail') || lower.includes('tongue rail') || lower.includes('stretcher bar')) {
        matchedOpt = 'Turnout Point Machine Switch / Tongue Rail Jam';
        matchedUrgency = 'Emergency';
        matchedConfidence = 0.90;
      } else if (lower.includes('signal') || lower.includes('aspect') || lower.includes('lamp') || lower.includes('red lamp')) {
        matchedOpt = 'Signal Aspect Blown / Lamp Extinguished';
        matchedUrgency = 'Emergency';
        matchedConfidence = 0.90;
      } else if (lower.includes('catenary') || lower.includes('ohe') || lower.includes('dropper') || lower.includes('panto') || lower.includes('wire sag')) {
        matchedOpt = 'OHE Catenary Contact Wire Sag / Height Defect';
        matchedUrgency = 'Emergency';
        matchedConfidence = 0.90;
      } else if (lower.includes('axle') || lower.includes('dac')) {
        matchedOpt = 'Digital Axle Counter (DAC) Reset / Count Mismatch';
        matchedUrgency = 'High';
        matchedConfidence = 0.88;
      } else if (lower.includes('bridge') || lower.includes('girder')) {
        matchedOpt = 'Bridge Girder Distortion / Expansion Bearing Defect';
        matchedUrgency = 'Emergency';
        matchedConfidence = 0.90;
      } else if (lower.includes('ballast') || lower.includes('packing') || lower.includes('tamping')) {
        matchedOpt = 'Ballast Fouling / Deep Screening & Packing Required';
        matchedUrgency = 'Normal';
        matchedConfidence = 0.85;
      }

      if (matchedOpt) {
        setSelectedDefectLabel(matchedOpt);
        setUrgency(matchedUrgency);
        setAiClassificationResult({
          matched: true,
          source: 'local_nlp',
          department: deptKey,
          predicted_department: deptKey,
          category: deptKey === 'Signal & Telecom' ? 'Signal Fault' : deptKey === 'Traction Distribution' ? 'Traction Defect' : 'Track Defect',
          predicted_defect_type: deptKey === 'Signal & Telecom' ? 'signal_fault' : deptKey === 'Traction Distribution' ? 'traction_fault' : 'track_defect',
          detected_issue: matchedOpt,
          detected_sublabel: matchedOpt,
          severity: matchedUrgency,
          recommended_urgency: matchedUrgency,
          confidence: matchedConfidence,
          matched_keywords: ['offline fallback match']
        });
      } else {
        setAiClassificationResult(null);
      }
    } finally {
      setClassifying(false);
    }
  };

  // Debounced auto-classification when user types in defectText
  useEffect(() => {
    if (!defectText || defectText.trim().length < 6) {
      setAiClassificationResult(null);
      return;
    }
    const timer = setTimeout(() => {
      handleClassifyDefect(defectText);
    }, 600);
    return () => clearTimeout(timer);
  }, [defectText, deptKey]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Table State
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [actionLoading, setActionLoading] = useState(null);
  const [fitModal, setFitModal] = useState({ open: false, req: null });
  const [tsrOption, setTsrOption] = useState('normal');
  const [memoNumber, setMemoNumber] = useState('');

  // Clock ticker every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Fetch Corridor Sections on Mount
  useEffect(() => {
    async function loadSections() {
      const { data, error } = await supabase
        .from('corridor_sections')
        .select('id, section_name, zone')
        .order('id');
      if (data && data.length > 0) {
        setSections(data);
      }
    }
    loadSections();
  }, []);

  // 2. Fetch Assets filtered to user's department_id & selected section
  useEffect(() => {
    async function loadAssets() {
      const activeDeptId = effectiveDeptId;
      const activeSec = selectedSection || 'NDLS-GZB';
      if (!activeDeptId) return;

      try {
        const { data, error } = await supabase
          .from('assets')
          .select('id, type, section_id, criticality')
          .eq('department_id', activeDeptId)
          .eq('section_id', activeSec)
          .order('id');

        let targetList = [];
        if (data && data.length > 0) {
          targetList = data;
        } else {
          // If no section-specific asset, fetch all for department
          const { data: deptAssets } = await supabase
            .from('assets')
            .select('id, type, section_id, criticality')
            .eq('department_id', activeDeptId)
            .order('id');
          targetList = deptAssets && deptAssets.length > 0 ? deptAssets : (FALLBACK_ASSETS_BY_DEPT[deptKey] || []);
        }

        setAssets(targetList);
        if (!manualAssetOverride) {
          if (selectedDefectLabel && targetList.length > 0) {
            const chosenOpt = currentDefectOptions.find((opt) => opt.label === selectedDefectLabel);
            const targetType = chosenOpt?.targetType?.toLowerCase();
            const matched = targetType ? targetList.find((a) => a.type?.toLowerCase() === targetType) : null;
            setSelectedAssetId(matched ? matched.id : targetList[0].id);
          } else {
            setSelectedAssetId('');
          }
        }
      } catch (err) {
        console.warn('[loadAssets warning]:', err);
        const fb = FALLBACK_ASSETS_BY_DEPT[deptKey] || [];
        setAssets(fb);
        if (!manualAssetOverride && !selectedDefectLabel) {
          setSelectedAssetId('');
        }
      }
    }
    loadAssets();
  }, [effectiveDeptId, selectedSection, deptKey, currentDefectOptions, selectedDefectLabel, manualAssetOverride]);

  // 3. Fetch My Department Requests (with range pagination & realtime sync)
  const fetchMyRequests = useCallback(async () => {
    if (!effectiveDeptId) return;
    setLoadingRequests(true);

    try {
      let allDeptRequests = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('maintenance_requests')
          .select('id, asset_id, defect_type, overdue_days, section_id, requested_window_start, requested_window_end, status, risk_score, conflict_flag, conflicting_with, conflicting_approved_block_id, created_at, possession_start_time, track_fit_status')
          .eq('department_id', effectiveDeptId)
          .order('created_at', { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) {
          console.error('Error fetching department requests:', error);
          break;
        }

        if (data && data.length > 0) {
          allDeptRequests = allDeptRequests.concat(data);
          from += pageSize;
          if (data.length < pageSize) hasMore = false;
        } else {
          hasMore = false;
        }
      }

      setMyRequests(allDeptRequests);
    } catch (err) {
      console.error('Error fetching department requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  }, [effectiveDeptId]);

  useEffect(() => {
    fetchMyRequests();

    if (!effectiveDeptId) return;

    // Realtime channel for live updates when requests are scored or scheduled
    const channel = supabase
      .channel(`dept-requests-${effectiveDeptId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_requests',
          filter: `department_id=eq.${effectiveDeptId}`,
        },
        () => {
          fetchMyRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMyRequests, effectiveDeptId]);

  // 4. Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedSection) {
      setFeedback({ type: 'error', message: 'Please select a Corridor Section.' });
      return;
    }
    if (!selectedLine) {
      setFeedback({ type: 'error', message: 'Please select a Track Line / Direction.' });
      return;
    }
    if (!kmLocation || !kmLocation.trim()) {
      setFeedback({ type: 'error', message: 'Please enter Chainage / KM Post.' });
      return;
    }
    if (!selectedDefectLabel) {
      setFeedback({ type: 'error', message: 'Please select a Defect.' });
      return;
    }
    if (!selectedAssetId) {
      setFeedback({ type: 'error', message: 'Please select a valid Asset ID.' });
      return;
    }
    if (!urgency) {
      setFeedback({ type: 'error', message: 'Please select an Urgency level.' });
      return;
    }
    if (!startDate || !endDate) {
      setFeedback({ type: 'error', message: 'Please specify both Window Start and Window End dates.' });
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      setFeedback({ type: 'error', message: 'Window Start must be before Window End.' });
      return;
    }

    setSubmitting(true);
    const newReqId = `REQ-${Date.now().toString().slice(-6)}`;
    const assetCrit = selectedAsset?.criticality ? (parseFloat(selectedAsset.criticality) >= 0.7 ? 'High' : 'Medium') : 'Medium';
    const finalCriticality = urgency === 'Emergency' ? 'High' : urgency === 'High' ? 'High' : assetCrit;

    const chosenOption = currentDefectOptions.find((opt) => opt.label === selectedDefectLabel) || currentDefectOptions[0];
    const underlyingDefectType = chosenOption.value; // Strictly one of 'track_defect', 'signal_fault', 'traction_fault'

    const requestPayload = {
      id: newReqId,
      asset_id: selectedAssetId,
      section_id: selectedSection,
      department_id: effectiveDeptId,
      defect_type: underlyingDefectType, // Submits 'track_defect', 'signal_fault', or 'traction_fault'
      overdue_days: parseInt(overdueDays, 10) || (urgency === 'Emergency' ? 3 : 0),
      criticality: finalCriticality,
      // NOTE: asset_stress_index and section_traffic_density are intentionally NOT sent here.
      // The ML /score endpoint computes them dynamically:
      //   - asset_stress_index: from asset temporal fields (age, last_inspection_date, failure_count, MGT)
      //   - section_traffic_density: live count from timetable_slots for this section
      // Sending hardcoded constants (0.65, 48.0) would corrupt 21.6% of model feature weight.
      requested_window_start: new Date(startDate).toISOString(),
      requested_window_end: new Date(endDate).toISOString(),
      status: 'pending',
      conflict_flag: false,
      created_by: user.id,
    };

    try {
      // Step A: Insert into Supabase maintenance_requests
      const { error: insertError } = await supabase
        .from('maintenance_requests')
        .insert([requestPayload]);

      if (insertError) {
        throw new Error(insertError.message);
      }

      setFeedback({
        type: 'info',
        message: `Request ${newReqId} saved to database. Running AI risk scoring & conflict detection...`,
      });

      // Step B: Call ML Service POST /score for instant risk evaluation
      try {
        const scoreRes = await fetch('http://localhost:8000/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maintenance_request_id: newReqId }),
        });
        if (scoreRes.ok) {
          const scoreData = await scoreRes.json();
          console.log('[ML Score Success]:', scoreData);
        }
      } catch (scoreErr) {
        console.warn('[ML Score Call Warning]:', scoreErr);
      }

      // Step C: Call ML Service POST /detect-conflicts (scoped to this section & request)
      try {
        const conflictRes = await fetch('http://localhost:8000/detect-conflicts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request_id: newReqId, section_id: selectedSection }),
        });
        if (conflictRes.ok) {
          const conflictData = await conflictRes.json();
          console.log('[ML Conflict Detection Success]:', conflictData);
        }
      } catch (conflictErr) {
        console.warn('[ML Conflict Call Warning]:', conflictErr);
      }

      // Step D: Refresh list to show live scored data
      await fetchMyRequests();

      // Reset all inputs back to blank
      setSelectedSection('');
      setSelectedLine('');
      setKmLocation('');
      setLocationMarker('');
      setSelectedDefectLabel('');
      setDefectText('');
      setSelectedAssetId('');
      setUrgency('');
      setOverdueDays('');
      setStartDate('');
      setEndDate('');
      setManualAssetOverride(false);
      setAiClassificationResult(null);

      setFeedback({
        type: 'success',
        message: `Request ${newReqId} successfully logged, scored by ML XGBoost model, and synchronized with Supabase!`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `Submission failed: ${err.message}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Field gang takes track possession
  const handleTakePossession = async (req) => {
    try {
      setActionLoading(req.id);
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('maintenance_requests')
        .update({
          status: 'in_progress',
          possession_start_time: nowIso,
        })
        .eq('id', req.id);

      if (error) throw error;
      setFeedback({ type: 'success', message: `Track possession taken for ${req.id}! Maintenance is now Active on Track.` });
      setTimeout(() => setFeedback(null), 4000);
      fetchMyRequests();
    } catch (err) {
      console.error('Error taking track possession:', err);
      setFeedback({ type: 'error', message: `Failed to take possession: ${err.message}` });
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Field gang completes work & certifies track fit
  const handleIssueFitSubmit = async () => {
    if (!fitModal.req) return;
    const req = fitModal.req;
    try {
      setActionLoading(req.id);
      const fitText = tsrOption === 'normal' ? 'Fit for Normal Speed' : `Temporary Caution Speed: ${tsrOption} km/h`;
      const { error } = await supabase
        .from('maintenance_requests')
        .update({
          status: 'completed',
          track_fit_status: `${fitText}${memoNumber ? ` (Memo: ${memoNumber})` : ''}`,
        })
        .eq('id', req.id);

      if (error) throw error;
      setFitModal({ open: false, req: null });
      setFeedback({ type: 'success', message: `Track Fit certified for ${req.id}! Track cleared and line restored to traffic.` });
      setTimeout(() => setFeedback(null), 4000);
      fetchMyRequests();
    } catch (err) {
      console.error('Error issuing track fit:', err);
      setFeedback({ type: 'error', message: `Failed: ${err.message}` });
    } finally {
      setActionLoading(null);
    }
  };

  // Helper to compute live countdown and overrun
  const getWindowCountdown = (req) => {
    if (!req.requested_window_start || !req.requested_window_end) return null;
    const s = new Date(req.requested_window_start);
    const e = new Date(req.requested_window_end);
    const durationMs = Math.max(1000 * 60 * 60, e.getTime() - s.getTime());

    if (req.status === 'completed') {
      return { text: req.track_fit_status || 'Track Fit Certified', color: 'text-emerald-400 font-bold', isOverrun: false };
    }

    if (req.status === 'in_progress') {
      const startTime = req.possession_start_time ? new Date(req.possession_start_time) : s;
      const elapsedMs = Math.max(0, currentTime.getTime() - startTime.getTime());
      const remainingMs = durationMs - elapsedMs;

      if (remainingMs < 0) {
        const overMins = Math.floor(Math.abs(remainingMs) / (1000 * 60));
        return {
          text: `⚠️ Window Overrun (+${overMins}m)`,
          color: 'text-red-400 font-bold animate-pulse',
          isOverrun: true,
        };
      }
      const remHrs = Math.floor(remainingMs / (1000 * 60 * 60));
      const remMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const remSecs = Math.floor((remainingMs % (1000 * 60)) / 1000);
      return {
        text: `⏳ ${String(remHrs).padStart(2, '0')}h ${String(remMins).padStart(2, '0')}m ${String(remSecs).padStart(2, '0')}s left`,
        color: remHrs === 0 && remMins < 30 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold',
        isOverrun: false,
      };
    }

    if (req.status === 'scheduled') {
      const durationHrs = (durationMs / (1000 * 60 * 60)).toFixed(1);
      return {
        text: `Approved Slot: ${durationHrs} hrs`,
        color: 'text-[#00daf3]',
        isOverrun: false,
      };
    }

    return null;
  };

  const filteredRequests = myRequests.filter((r) => {
    if (filter === 'Pending' && r.status !== 'pending' && r.status !== 'scored') return false;
    if (filter === 'Scheduled' && r.status !== 'scheduled') return false;
    if (filter === 'Active on Track' && r.status !== 'in_progress') return false;
    if (filter === 'Completed' && r.status !== 'completed') return false;
    if (filter === 'Conflicts' && !r.conflict_flag) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = r.id?.toLowerCase().includes(q);
      const matchSec = r.section_id?.toLowerCase().includes(q);
      const matchAsset = r.asset_id?.toLowerCase().includes(q);
      if (!matchId && !matchSec && !matchAsset) return false;
    }
    return true;
  });

  const formatDefectLabel = (type) => {
    switch (type) {
      case 'track_defect':
        return 'Track Defect';
      case 'signal_fault':
        return 'Signal Fault';
      case 'traction_fault':
        return 'Traction / OHE Fault';
      default:
        return type || 'Defect';
    }
  };

  const formatWindow = (startStr, endStr) => {
    if (!startStr || !endStr) return '-';
    try {
      const s = new Date(startStr);
      const e = new Date(endStr);
      const datePart = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const startTime = s.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      const endTime = e.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${datePart}, ${startTime}-${endTime}`;
    } catch {
      return `${startStr.slice(5, 16)} to ${endStr.slice(11, 16)}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#dce4e5] tracking-tight">Submit Maintenance Request</h1>
          <p className="text-sm text-[#bac9cc] mt-1 flex items-center gap-2">
            <span>Log defect telemetry for</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#00626e]/40 border border-[#00e5ff]/50 text-[#00e5ff] font-mono text-xs font-semibold">
              {department}
            </span>
          </p>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-lg text-xs font-mono flex items-center gap-2 animate-fadeIn ${feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : feedback.type === 'error'
                ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                : 'bg-[#00daf3]/10 border border-[#00daf3]/30 text-[#00daf3]'
              }`}
          >
            <span className="material-symbols-outlined text-sm">
              {feedback.type === 'success' ? 'check_circle' : feedback.type === 'error' ? 'error' : 'sync'}
            </span>
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Form Section (Bento Card) */}
        <div className="lg:col-span-1 bg-[#192122] rounded-xl border border-[#3b494c] p-4 sm:p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00e5ff]/10 rounded-full blur-3xl pointer-events-none"></div>

          <h2 className="text-base font-bold text-[#dce4e5] flex items-center gap-2 border-b border-[#3b494c] pb-2.5">
            <span className="material-symbols-outlined text-[#00e5ff] text-[20px]">edit_document</span>
            Maintenance Telemetry Input
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Corridor Section */}
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-[#bac9cc] uppercase tracking-wider">
                Corridor Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedSection(val);
                  setSelectedLine('');
                  setKmLocation('');
                  setLocationMarker('');
                }}
                className="w-full bg-[#242b2d] border border-[#3b494c] rounded-lg px-2.5 py-1.5 text-xs text-[#dce4e5] focus:border-[#00e5ff] outline-none font-mono cursor-pointer"
                required
              >
                <option value="">-- Select Corridor Section --</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.id} - {sec.section_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Track Line / Direction (Station-Aware Real World) */}
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-[#bac9cc] uppercase tracking-wider">
                Track Line / Direction (Station Block)
              </label>
              <select
                value={selectedLine}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedLine(val);
                  const trackInfo = currentTracks.find((t) => t.label === val);
                  if (trackInfo) {
                    setKmLocation(trackInfo.defaultKm || '');
                    setLocationMarker(trackInfo.marker || '');
                  }
                }}
                disabled={!selectedSection}
                className="w-full bg-[#242b2d] border border-[#3b494c] rounded-lg px-2.5 py-1.5 text-xs text-[#dce4e5] focus:border-[#00e5ff] outline-none font-mono cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                required
              >
                <option value="">
                  {selectedSection ? '-- Select Track Line / Direction --' : '-- Select Corridor First --'}
                </option>
                {currentTracks.map((track) => (
                  <option key={track.label} value={track.label}>
                    {track.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Chainage / KM Post & Mast Location */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-[11px] font-mono text-[#bac9cc] uppercase tracking-wider">
                  Chainage / KM Post
                </label>
                <input
                  type="text"
                  value={kmLocation}
                  onChange={(e) => {
                    const val = e.target.value;
                    setKmLocation(val);
                    if (val.toLowerCase().includes('yard')) {
                      setLocationMarker('Point 104A');
                    } else if (val) {
                      setLocationMarker(`Mast ${val.replace('.', '/')}`);
                    }
                  }}
                  placeholder="e.g. 14.5"
                  className="w-full bg-[#242b2d] border border-[#3b494c] rounded-lg px-2.5 py-1.5 text-xs text-[#dce4e5] focus:border-[#00e5ff] outline-none font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-mono text-[#bac9cc] uppercase tracking-wider">
                  Mast / Point Marker
                </label>
                <input
                  type="text"
                  value={locationMarker}
                  onChange={(e) => setLocationMarker(e.target.value)}
                  placeholder="e.g. Mast 14/12"
                  className="w-full bg-[#242b2d] border border-[#3b494c] rounded-lg px-2.5 py-1.5 text-xs text-[#dce4e5] focus:border-[#00e5ff] outline-none font-mono"
                />
              </div>
            </div>

            {/* Select Defect (Department-Specific Realistic Sub-Labels) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-mono text-[#bac9cc] uppercase tracking-wider">
                  Select Defect ({deptKey})
                </label>
                <span className="text-[10px] font-mono text-[#00e5ff]">{currentDefectOptions.length} Possible Defects</span>
              </div>
              <select
                id="select-defect-type"
                value={selectedDefectLabel}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDefectLabel(val);
                  const opt = currentDefectOptions.find((o) => o.label === val);
                  if (opt?.defaultUrgency) {
                    setUrgency(opt.defaultUrgency);
                  }
                }}
                className="w-full bg-[#242b2d] border border-[#3b494c] rounded-lg px-2.5 py-2 text-xs text-[#dce4e5] focus:border-[#00e5ff] outline-none font-mono cursor-pointer"
                required
              >
                <option value="">-- Select Defect --</option>
                {currentDefectOptions.map((opt) => (
                  <option key={opt.label} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Option to Describe Defect / Field Notes */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-mono text-[#bac9cc] uppercase tracking-wider">
                  Describe Defect / Field Notes <span className="text-[#869294] font-normal normal-case">(Optional)</span>
                </label>
                {defectText.trim() && (
                  <button
                    type="button"
                    onClick={() => handleClassifyDefect(defectText)}
                    disabled={classifying}
                    className="text-[10px] font-mono text-[#00e5ff] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {classifying ? 'Analyzing...' : '⚡ AI Assist'}
                  </button>
                )}
              </div>
              <textarea
                rows="2"
                value={defectText}
                onChange={(e) => setDefectText(e.target.value)}
                placeholder='Add field notes or describe freely in English / Hinglish (e.g. "Thermite weld crack at km 45.2" or "UP line mast 42 track vibration")...'
                className="w-full bg-[#242b2d] border border-[#3b494c] rounded-lg px-2.5 py-1.5 text-xs text-[#dce4e5] focus:border-[#00e5ff] outline-none font-mono resize-none"
              />
              {classifying && (
                <div className="text-[11px] font-mono text-[#00e5ff] flex items-center gap-1.5 animate-pulse py-0.5">
                  <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                  <span>Analyzing defect telemetry...</span>
                </div>
              )}
            </div>

            {/* 🎯 Target Asset (Clean, Compact One-Line Auto-Matched Status) */}
            <div className="bg-[#182124] border border-[#3b494c] rounded-lg px-3 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="material-symbols-outlined text-[#00e5ff] text-[16px]">fmd_good</span>
                <div className="truncate">
                  <span className="text-[#869294] font-mono text-[11px]">Target Asset: </span>
                  <strong className="text-[#dce4e5]">{selectedAsset?.type || (selectedDefectLabel ? 'Auto-Resolving...' : 'Select defect to resolve')}</strong>
                  {selectedAssetId ? (
                    <span className="ml-2 font-mono text-[10px] text-[#00e5ff] bg-[#00e5ff]/10 px-1.5 py-0.5 rounded border border-[#00e5ff]/30">
                      {selectedAssetId}
                    </span>
                  ) : (
                    <span className="ml-2 font-mono text-[10px] text-[#869294] bg-[#242b2d] px-1.5 py-0.5 rounded border border-[#3b494c]">
                      Pending
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManualAssetOverride(!manualAssetOverride)}
                className="text-[10px] font-mono text-[#869294] hover:text-[#00e5ff] underline ml-2 whitespace-nowrap cursor-pointer"
              >
                {manualAssetOverride ? '← Auto' : 'Override'}
              </button>
            </div>

            {manualAssetOverride && (
              <div className="space-y-1 animate-fadeIn">
                <label className="block text-[10px] font-mono text-[#bac9cc] uppercase tracking-wider">
                  Manual Asset Selection (Override)
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full bg-[#242b2d] border border-[#3b494c] rounded-lg px-2.5 py-1.5 text-xs text-[#dce4e5] focus:border-[#00e5ff] outline-none font-mono cursor-pointer"
                >
                  <option value="">-- Select Asset --</option>
                  {assets.map((ast) => (
                    <option key={ast.id} value={ast.id}>
                      {ast.type} — {ast.id} (Criticality: {parseFloat(ast.criticality) >= 0.7 ? 'High' : 'Normal'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Urgency & Overdue Days */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-[11px] font-mono text-[#bac9cc] uppercase tracking-wider">Urgency</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full bg-[#242b2d] border border-[#3b494c] rounded-lg px-2.5 py-1.5 text-xs text-[#dce4e5] focus:border-[#00e5ff] outline-none font-mono cursor-pointer"
                  required
                >
                  <option value="">-- Select Urgency --</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-mono text-[#bac9cc] uppercase tracking-wider">Overdue Days</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={overdueDays}
                  onChange={(e) => setOverdueDays(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#242b2d] border border-[#3b494c] rounded-lg px-2.5 py-1.5 text-xs text-[#dce4e5] focus:border-[#00e5ff] outline-none font-mono"
                />
              </div>
            </div>

            {/* Requested Window Start & End (Side by Side in 2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-[11px] font-mono text-[#bac9cc] uppercase tracking-wider">
                  Window Start
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#242b2d] border border-[#3b494c] rounded-lg px-2.5 py-1.5 text-xs text-[#dce4e5] focus:border-[#00e5ff] outline-none font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-mono text-[#bac9cc] uppercase tracking-wider">
                  Window End
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#242b2d] border border-[#3b494c] rounded-lg px-2.5 py-1.5 text-xs text-[#dce4e5] focus:border-[#00e5ff] outline-none font-mono"
                  required
                />
              </div>
            </div>

            {/* Submit CTA Button */}
            <div className="pt-2 border-t border-[#3b494c]">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#00e5ff] text-[#00363d] font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 glow-btn hover:bg-[#c3f5ff] transition-all cursor-pointer disabled:opacity-50 text-xs sm:text-sm shadow-md"
              >
                {submitting ? (
                  <span className="flex items-center gap-2 font-mono text-xs">
                    <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                    Evaluating ML Risk & Conflicts...
                  </span>
                ) : (
                  <>
                    <span>Submit & Run AI Scoring</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Table Section (Bento Card) - Live My Requests */}
        <div className="lg:col-span-2 bg-[#192122] rounded-xl border border-[#3b494c] shadow-sm flex flex-col overflow-hidden">
          {/* Table Header / Controls */}
          <div className="p-5 border-b border-[#3b494c] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#242b2d]/50">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#98d0da]">table_rows</span>
              <h2 className="text-lg font-bold text-[#dce4e5]">
                {role === 'admin' ? 'Master Field Maintenance & Live Possession Queue' : 'My Department Requests Queue'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Filter Pills */}
              <div className="flex bg-[#2e3638] rounded-lg p-0.5 border border-[#3b494c] overflow-x-auto">
                {['All', 'Pending', 'Scheduled', 'Active on Track', 'Completed', 'Conflicts'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilter(p)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium whitespace-nowrap transition-colors cursor-pointer ${filter === p
                      ? 'bg-[#192122] text-[#00e5ff] shadow-sm border border-[#3b494c]'
                      : 'text-[#bac9cc] hover:text-[#dce4e5]'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative flex-grow sm:flex-grow-0">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-[#bac9cc] pointer-events-none">
                  search
                </span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-36 bg-[#2e3638] border border-[#3b494c] rounded-lg py-1.5 pl-8 pr-3 text-xs text-[#dce4e5] focus:border-[#00e5ff] outline-none font-mono"
                  placeholder="Filter ID/Asset..."
                  type="text"
                />
              </div>

              <button
                onClick={fetchMyRequests}
                className="p-1.5 rounded-lg bg-[#2e3638] hover:bg-[#3b494c] text-[#bac9cc] transition-colors cursor-pointer"
                title="Refresh Table"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto overflow-y-auto max-h-[540px] flex-grow">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#080f11] border-b border-[#3b494c]">
                  <th className="py-3 px-4 text-xs font-mono text-[#bac9cc] tracking-wider uppercase font-semibold">Request ID</th>
                  <th className="py-3 px-4 text-xs font-mono text-[#bac9cc] tracking-wider uppercase font-semibold">Section & Asset</th>
                  <th className="py-3 px-4 text-xs font-mono text-[#bac9cc] tracking-wider uppercase font-semibold">Defect Type</th>
                  <th className="py-3 px-4 text-xs font-mono text-[#bac9cc] tracking-wider uppercase font-semibold">Window & Timer</th>
                  <th className="py-3 px-4 text-xs font-mono text-[#bac9cc] tracking-wider uppercase font-semibold text-center">Risk Score</th>
                  <th className="py-3 px-4 text-xs font-mono text-[#bac9cc] tracking-wider uppercase font-semibold text-center">Conflict Status</th>
                  <th className="py-3 px-4 text-xs font-mono text-[#bac9cc] tracking-wider uppercase font-semibold text-right">Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3b494c]/40 text-sm font-mono">
                {loadingRequests ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-[#bac9cc]">
                      <div className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                        <span>Loading live department telemetry...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-[#849396]">
                      No maintenance requests found matching criteria. Submit one using the form!
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => {
                    const countdown = getWindowCountdown(req);
                    return (
                      <tr key={req.id} className="hover:bg-[#242b2d]/50 transition-colors group">
                        <td className="py-3 px-4 text-[#00e5ff] font-bold text-xs">{req.id}</td>
                        <td className="py-3 px-4">
                          <div className="text-[#dce4e5] font-semibold text-xs">{req.section_id}</div>
                          <div className="text-[11px] text-[#849396]">{req.asset_id}</div>
                          {role === 'admin' && (req.departments?.name || req.department_name) && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-[#00363d] text-[#00daf3] text-[9px] font-bold">
                              {req.departments?.name || req.department_name}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#bac9cc]">
                          {formatDefectLabel(req.defect_type)}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#bac9cc]">
                          <div>{formatWindow(req.requested_window_start, req.requested_window_end)}</div>
                          {countdown && (
                            <div className={`text-[10px] font-mono mt-0.5 ${countdown.color}`}>
                              {countdown.text}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {req.risk_score !== null && req.risk_score !== undefined ? (
                            <span
                              className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full font-bold text-xs border ${req.risk_score >= 0.7
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : req.risk_score >= 0.4
                                  ? 'bg-amber-400/10 text-amber-400 border-amber-400/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                }`}
                            >
                              {(req.risk_score * 100).toFixed(0)}
                            </span>
                          ) : (
                            <span className="text-[#849396] text-xs">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {req.conflict_flag ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/10 border border-red-500/30 text-red-400"
                              title={
                                req.conflicting_with
                                  ? `Conflicts with: ${req.conflicting_with}`
                                  : req.conflicting_approved_block_id
                                    ? 'conflicts with an already-approved block'
                                    : 'Conflict detected'
                              }
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                              <span>
                                {req.conflicting_with
                                  ? `Conflict (${req.conflicting_with.slice(0, 14)})`
                                  : req.conflicting_approved_block_id
                                    ? 'Approved Block Conflict'
                                    : 'Conflict Detected'}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              <span>Clean Slot</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${req.status === 'in_progress'
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 font-bold animate-pulse'
                                : req.status === 'completed'
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold'
                                  : req.status === 'scheduled'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : req.status === 'proposed'
                                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                                      : req.status === 'scored'
                                        ? 'bg-[#00e5ff]/10 border-[#00e5ff]/30 text-[#00e5ff]'
                                        : 'bg-[#2e3638] border-[#3b494c] text-[#bac9cc]'
                                }`}
                            >
                              {req.status === 'in_progress' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>}
                              <span>{req.status === 'in_progress' ? 'Active on Track' : req.status === 'completed' ? 'Completed (Fit)' : req.status}</span>
                            </span>

                            {/* Action Button: Take Possession for Scheduled */}
                            {req.status === 'scheduled' && (
                              <button
                                disabled={actionLoading === req.id}
                                onClick={() => handleTakePossession(req)}
                                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Field gang takes track possession"
                              >
                                <span className="material-symbols-outlined text-[14px]">play_circle</span>
                                <span>Take Possession</span>
                              </button>
                            )}

                            {/* Action Button: Clear Track for In-Progress */}
                            {req.status === 'in_progress' && (
                              <button
                                disabled={actionLoading === req.id}
                                onClick={() => {
                                  setFitModal({ open: true, req });
                                  setMemoNumber(`TF-${req.section_id}-${new Date().toISOString().slice(5, 10).replace('-', '')}`);
                                }}
                                className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Certify track fitness and restore traffic"
                              >
                                <span className="material-symbols-outlined text-[14px]">verified</span>
                                <span>Clear Track & Fit</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-4 border-t border-[#3b494c] flex items-center justify-between text-xs text-[#bac9cc] bg-[#2e3638]/20 font-mono">
            <span>Showing {filteredRequests.length} live records</span>
            <span className="text-[#00e5ff]">Live Telemetry Stream Active</span>
          </div>
        </div>
      </div>

      {/* Track Fit & Completion Modal */}
      {fitModal.open && fitModal.req && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#192122] border border-[#3b494c] rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 font-mono text-xs animate-fadeIn">
            <div className="flex justify-between items-center border-b border-[#3b494c] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-xl">verified</span>
                <div>
                  <h3 className="font-bold text-[#dce4e5] text-sm">Issue Track Fitness Certificate</h3>
                  <p className="text-[11px] text-[#849396]">{fitModal.req.id} • {fitModal.req.section_id}</p>
                </div>
              </div>
              <button
                onClick={() => setFitModal({ open: false, req: null })}
                className="text-[#849396] hover:text-[#dce4e5] text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-[#bac9cc] uppercase mb-1">Track Fitness Condition</label>
                <div className="space-y-1.5 bg-[#242b2d] p-3 rounded-lg border border-[#3b494c]">
                  <label className="flex items-center gap-2 cursor-pointer text-[#dce4e5]">
                    <input
                      type="radio"
                      name="tsrOption"
                      value="normal"
                      checked={tsrOption === 'normal'}
                      onChange={() => setTsrOption('normal')}
                      className="accent-emerald-400"
                    />
                    <span>Fit for Normal Permissible Speed (100%)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[#dce4e5]">
                    <input
                      type="radio"
                      name="tsrOption"
                      value="30"
                      checked={tsrOption === '30'}
                      onChange={() => setTsrOption('30')}
                      className="accent-amber-400"
                    />
                    <span>Temporary Caution Speed: 30 km/h</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[#dce4e5]">
                    <input
                      type="radio"
                      name="tsrOption"
                      value="45"
                      checked={tsrOption === '45'}
                      onChange={() => setTsrOption('45')}
                      className="accent-amber-400"
                    />
                    <span>Temporary Caution Speed: 45 km/h</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#bac9cc] uppercase mb-1">Clearance Memo / Certificate No.</label>
                <input
                  type="text"
                  placeholder="e.g. TF-ADI-BRC-0912"
                  value={memoNumber}
                  onChange={(e) => setMemoNumber(e.target.value)}
                  className="w-full bg-[#242b2d] border border-[#3b494c] rounded-lg px-3 py-2 text-[#dce4e5] outline-none focus:border-emerald-400 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#3b494c]">
              <button
                onClick={() => setFitModal({ open: false, req: null })}
                className="px-3 py-1.5 bg-[#242b2d] hover:bg-[#2e3638] text-[#bac9cc] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading === fitModal.req.id}
                onClick={handleIssueFitSubmit}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>Certify Fit & Clear Line</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
