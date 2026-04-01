import type { Course, CourseModule, Batch } from '../types';

// Replace these with real Supabase queries once connected.
// Example: const { data: courses } = await supabase.from('courses').select('*');

export const COURSES: Course[] = [
  {
    id: 1, title: 'Environment & Waste Management', subtitle: 'Certification Course',
    duration: '2 Months', fee: 13500, seats: 15, filled: 9, mode: 'Online',
    startDate: 'Jan 15, 2026', badge: 'ISO Certified', modules: 25,
    trainer: 'Dr. Sushanth Gade', category: 'Environment', color: '#2d5a3d', icon: '🌿',
    topics: [
      'Environment Management','Introduction to Waste Management',
      'Solid Waste Streams & Management Hierarchy','Source Segregation & MRF',
      'Waste Collection & Transportation Logistics','Smart & Digital Waste Management',
      'Waste Transfer & Processing Systems','Waste Treatment & Disposal',
      'Recycling, Circular Economy & EPR','IPR & Technology Management in Waste Systems',
      'Organic / Food Waste Management','Industrial / Hazardous Waste Management',
      'Plastics Waste Management','Dumpsite & Landfill Management',
      'Energy Recovery & Waste-to-Energy (WtE)','Waste Processing Technologies',
      'Waste Economics, Finance & Institutional Management',
      'Stakeholder Engagement & Community Participation',
      'Behavioral Change in Waste Management','EH&S in Waste Systems',
      'Waste Conventions, Protocols & International Regulations',
      'Career & Business Prospects in Waste Management',
      'Resource Efficiency and Resource Recovery',
      'Impact of Waste on Biodiversity and the Environment',
      'ESG - Environment, Sustainability & Governance',
      'Climate Change, Carbon Management & Waste Sector Emissions',
    ],
  },
  {
    id: 2, title: 'Hazardous Waste Specialist', subtitle: 'Advanced Program',
    duration: '6 Weeks', fee: 9500, seats: 15, filled: 5, mode: 'Hybrid',
    startDate: 'Feb 10, 2026', badge: 'Advanced', modules: 14,
    trainer: 'Dr. Sushanth Gade', category: 'Industrial', color: '#8b6f47', icon: '⚗️',
    topics: ['Industrial Waste Identification','Chemical Hazard Assessment',
      'Treatment Technologies','Regulatory Compliance',
      'Emergency Response Protocols','Documentation & Reporting'],
  },
  {
    id: 3, title: 'Circular Economy & EPR', subtitle: 'Specialization',
    duration: '4 Weeks', fee: 7500, seats: 15, filled: 12, mode: 'Online',
    startDate: 'Mar 1, 2026', badge: 'Popular', modules: 10,
    trainer: 'Guest Faculty', category: 'Policy', color: '#4a7c59', icon: '♻️',
    topics: ['Circular Economy Principles','Extended Producer Responsibility',
      'Product Life Cycle Analysis','Resource Recovery Strategies',
      'Policy & Regulation Framework','Sustainable Business Models'],
  },
];

export const MODULES_DATA: CourseModule[] = [
  { id: 1, title: 'Environment Management',           type: 'video', duration: '45 min', status: 'completed',   locked: false, description: 'Introduction to environmental management systems and frameworks.', videoUrl: undefined },
  { id: 2, title: 'Introduction to Waste Management', type: 'pdf',   duration: '30 min', status: 'completed',   locked: false, description: 'Foundational concepts in waste management.', pdfUrl: undefined },
  { id: 3, title: 'Solid Waste Streams & Hierarchy',  type: 'video', duration: '60 min', status: 'in-progress', locked: false, description: 'Understanding waste hierarchies and classifications.', videoUrl: undefined },
  { id: 4, title: 'Source Segregation & MRF',         type: 'pdf',   duration: '40 min', status: 'locked',      locked: true },
  { id: 5, title: 'Waste Collection Logistics',       type: 'video', duration: '55 min', status: 'locked',      locked: true },
  { id: 6, title: 'Smart & Digital Waste Systems',    type: 'video', duration: '50 min', status: 'locked',      locked: true },
];

export const BATCHES: Batch[] = [
  { id: 1, label: 'Evening Batch', date: 'Jan 15, 2026', time: '7:00 PM – 9:00 PM',   seats: 6 },
  { id: 2, label: 'Morning Batch', date: 'Jan 20, 2026', time: '10:00 AM – 12:00 PM', seats: 2 },
];

export const PAYMENT_METHODS = [
  { id: 'upi',        label: 'UPI / PhonePe / GPay', icon: '📱' },
  { id: 'card',       label: 'Credit / Debit Card',  icon: '💳' },
  { id: 'netbanking', label: 'Net Banking',           icon: '🏦' },
  { id: 'transfer',   label: 'Bank Transfer',         icon: '🏛️' },
] as const;
