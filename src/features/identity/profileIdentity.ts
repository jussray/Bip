import AsyncStorage from '@react-native-async-storage/async-storage';

export type TeenPrivateProfile = {
  name: string;
  gender: 'girl' | 'boy' | 'other' | null;
  choice: 'suhana' | 'sy' | 'cloud' | 'night';
};

export type TeenCircleIdentity = {
  circleName: string;
};

export async function loadTeenPrivateProfile(): Promise<TeenPrivateProfile> {
  const raw = await AsyncStorage.getItem('teen_profile_data');
  if (!raw) return { name: '', gender: null, choice: 'suhana' };
  try {
    const data = JSON.parse(raw) as Partial<TeenPrivateProfile>;
    const gender = data.gender === 'girl' || data.gender === 'boy' || data.gender === 'other'
      ? data.gender
      : null;
    const choice = data.choice === 'sy' || data.choice === 'cloud' || data.choice === 'night'
      ? data.choice
      : 'suhana';
    return {
      name: typeof data.name === 'string' ? data.name : '',
      gender,
      choice,
    };
  } catch {
    return { name: '', gender: null, choice: 'suhana' };
  }
}

export async function loadTeenCircleIdentity(): Promise<TeenCircleIdentity> {
  const raw = await AsyncStorage.getItem('teen_circle_identity');
  if (!raw) return { circleName: 'anonymous bip' };
  try {
    const data = JSON.parse(raw) as Partial<TeenCircleIdentity>;
    const circleName = typeof data.circleName === 'string' ? data.circleName.trim() : '';
    return { circleName: circleName || 'anonymous bip' };
  } catch {
    return { circleName: 'anonymous bip' };
  }
}
