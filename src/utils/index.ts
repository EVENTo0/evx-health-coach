import { format, parseISO, isToday, isYesterday } from 'date-fns';

// Date helpers
export const formatDate = (dateStr: string): string => {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
};

export const getToday = (): string => new Date().toISOString().split('T')[0];

export const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// Health calculations
export const calculateBMI = (weightKg: number, heightCm: number): number => {
  return parseFloat((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1));
};

export const getBMICategory = (bmi: number): { label: string; color: string } => {
  if (bmi < 18.5) return { label: 'Underweight', color: '#FFB800' };
  if (bmi < 25) return { label: 'Normal', color: '#00E096' };
  if (bmi < 30) return { label: 'Overweight', color: '#FF6B35' };
  return { label: 'Obese', color: '#FF4444' };
};

export const calculateTDEE = (
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string,
  activityLevel: string
): number => {
  const bmr = gender === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  };

  return Math.round(bmr * (multipliers[activityLevel] || 1.55));
};

export const calculateWaterGoal = (weightKg: number): number => {
  return parseFloat((weightKg * 0.033).toFixed(1));
};

// Format helpers
export const formatWeight = (kg: number): string => `${kg} kg`;
export const formatHeight = (cm: number): string => `${cm} cm`;
export const formatCalories = (kcal: number): string => `${kcal.toLocaleString()} kcal`;

// Validation
export const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const isStrongPassword = (password: string): boolean => password.length >= 8;

// Array helpers
export const chunk = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};
