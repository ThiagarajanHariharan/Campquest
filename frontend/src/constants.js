export const FITNESS_URL  = process.env.REACT_APP_FITNESS_URL  || 'http://localhost:3001';
export const MERCHANT_URL = process.env.REACT_APP_MERCHANT_URL || 'http://localhost:3002';
export const GEO_URL      = process.env.REACT_APP_GEO_URL      || 'http://localhost:3003';
export const REWARDS_URL  = process.env.REACT_APP_REWARDS_URL  || 'http://localhost:3004';

export const DEMO_USERS = [
  { id: 1, username: 'student_alex',  name: 'Alex',  role: 'student',     password: 'student123' },
  { id: 2, username: 'student_hari',  name: 'Hari',  role: 'student',     password: 'student123' },
  { id: 3, username: 'student_bella', name: 'Bella', role: 'student',     password: 'student123' },
  { id: 4, username: 'stall_owner',   name: 'Mary',  role: 'stall_owner', password: 'owner123'   },
];
