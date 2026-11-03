import { ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import type { Guesthouse } from '../services/api';
export default function GuesthouseList({title, items, message}: {title:string; items:Guesthouse[]; message?:string}) {
 return <ScrollView contentContainerStyle={styles.page}><Text style={styles.title}>{title}</Text>{message ? <Text>{message}</Text> : null}{items.map(g => <Pressable key={g.id} style={styles.card} onPress={() => router.push({pathname:'/guesthouse/[id]',params:{id:g.id}})}><Text style={styles.name}>{g.name}</Text><Text>{g.city} · P{g.pricePerNight} / night</Text><Text>View details →</Text></Pressable>)}</ScrollView>;
}
const styles=StyleSheet.create({page:{padding:24,paddingTop:150,paddingBottom:160},title:{fontSize:26,fontWeight:'700',marginBottom:20,color:'#9B1C2B'},card:{padding:20,backgroundColor:'#fff',borderRadius:16,marginBottom:12,gap:8},name:{fontSize:19,fontWeight:'600'}});
