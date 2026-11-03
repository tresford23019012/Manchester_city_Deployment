import AsyncStorage from '@react-native-async-storage/async-storage';
const key = 'locatebase:recent';
export async function recentIds(): Promise<string[]> { try { return JSON.parse(await AsyncStorage.getItem(key) || '[]'); } catch { return []; } }
export async function rememberGuesthouse(id:string) { const ids = await recentIds(); await AsyncStorage.setItem(key, JSON.stringify([id, ...ids.filter(x => x !== id)].slice(0,20))); }
