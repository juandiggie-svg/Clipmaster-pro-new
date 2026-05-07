import AsyncStorage from '@react-native-async-storage/async-storage';

export type Profile = {
  name: string;
  biz: string;
  niche: string;
  city: string;
  booking: string;
};

const K = {
  profile: 'cm_profile',
  gens: 'cm_gens',
  paid: 'cm_paid',
  device: 'cm_device_id',
};

export const store = {
  async getProfile(): Promise<Profile | null> {
    try {
      const v = await AsyncStorage.getItem(K.profile);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  },
  async setProfile(p: Profile) {
    await AsyncStorage.setItem(K.profile, JSON.stringify(p));
  },
  async getGens(): Promise<number> {
    try {
      const v = await AsyncStorage.getItem(K.gens);
      return v ? parseInt(v, 10) || 0 : 0;
    } catch { return 0; }
  },
  async setGens(n: number) {
    await AsyncStorage.setItem(K.gens, String(n));
  },
  async getPaid(): Promise<boolean> {
    try {
      const v = await AsyncStorage.getItem(K.paid);
      return v === 'true';
    } catch { return false; }
  },
  async setPaid(v: boolean) {
    await AsyncStorage.setItem(K.paid, v ? 'true' : 'false');
  },
  async getDeviceId(): Promise<string> {
    let id = await AsyncStorage.getItem(K.device);
    if (!id) {
      id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      await AsyncStorage.setItem(K.device, id);
    }
    return id;
  },
  async resetAll() {
    await AsyncStorage.multiRemove([K.profile, K.gens, K.paid]);
  },
};
