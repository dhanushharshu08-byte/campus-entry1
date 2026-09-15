/**
 * Centralized College & Brand Configuration for CampuSentry
 * Akshaya College of Engineering and Technology
 */

export const COLLEGE_CONFIG = {
  // Institutional Identity
  COLLEGE_NAME: 'Akshaya College of Engineering and Technology',
  COLLEGE_SHORT_NAME: 'ACET',
  CAMPUS_NAME: 'Kinathukadavu Campus',
  AFFILIATION: 'Approved by AICTE, Affiliated to Anna University & Accredited by NAAC',
  
  // Product Identity
  PROJECT_NAME: 'CampuSentry',
  PROJECT_TAGLINE: 'Smart Campus Helpdesk & Maintenance',
  HERO_SUBTITLE: 'Report campus issues, connect with the right maintenance department, and track every resolution in real time.',
  
  // Contact & Location Details
  COLLEGE_ADDRESS: 'Kinathukadavu, Coimbatore, Tamil Nadu 642109',
  COLLEGE_EMAIL: 'helpdesk@acetcbe.edu.in',
  COLLEGE_PHONE: '+91 4259 200300',
  COLLEGE_HELPLINE: '+91 94899 90000',
  ACADEMIC_YEAR: '2025 - 2026',
  PORTAL_DOMAIN: 'campusentry.in',
  OFFICIAL_EMAIL_DOMAIN: 'acetcbe.edu.in',
  OFFICIAL_EMAIL_ERROR_MSG: 'Please use your official college email address.',

  // Email validation helper
  isCollegeEmail: (email) => {
    if (!email || typeof email !== 'string') return false;
    return email.trim().toLowerCase().endsWith('@acetcbe.edu.in');
  },
  
  // Campus Blocks & Infrastructure
  CAMPUS_BLOCKS: [
    'Main Academic Block',
    'Computer Science & IT Block',
    'Electrical & Electronics Block',
    'Mechanical & Civil Block',
    'Central Library & Admin',
    'Boys Hostel (Block A)',
    'Girls Hostel (Block B)',
    'College Food Court & Canteen',
    'Auditorium & Sports Complex',
    'Campus Grounds & Parking'
  ],

  // Campus Floors
  CAMPUS_FLOORS: [
    'Ground Floor',
    '1st Floor',
    '2nd Floor',
    '3rd Floor',
    '4th Floor',
    'Basement / Parking',
    'Outdoor Campus Area'
  ],

  // Maintenance Departments
  DEPARTMENTS: [
    { id: 'electrical', name: 'Electrical', code: 'ELEC', description: 'Power supply, lighting, switchboards, wiring, fans, and lab power' },
    { id: 'plumbing', name: 'Plumbing', code: 'PLUMB', description: 'Restrooms, water coolers, piping, taps, drainage, and pumps' },
    { id: 'civil', name: 'Civil', code: 'CIVIL', description: 'Masonry, plastering, doors, windows, paint, ceiling, and flooring' },
    { id: 'carpentry', name: 'Carpentry', code: 'CARP', description: 'Desks, benches, podiums, lab furniture, doors, and cupboards' },
    { id: 'cleaning', name: 'Cleaning', code: 'CLEAN', description: 'Classroom housekeeping, sanitation, washrooms, and waste disposal' },
    { id: 'other', name: 'Other', code: 'OTHER', description: 'General facilities, sports equipment, signage, and miscellaneous' }
  ]
};

export default COLLEGE_CONFIG;
