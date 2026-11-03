import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { ScrollView, Text, Image, Pressable, Linking, ActivityIndicator, Alert } from 'react-native';
import { getGuesthouse, Guesthouse } from '../../services/api';
import { rememberGuesthouse } from '../../services/recent';
import { useFavourites } from '../../context/FavouritesContext';
export default function Details() {
 const {id}=useLocalSearchParams<{id:string}>();const [item,setItem]=useState<Guesthouse|null>(null);const [error,setError]=useState('');const {favourites,toggle}=useFavourites();
 useEffect(()=>{let active=true;getGuesthouse(id).then(g=>{if(active){setItem(g);void rememberGuesthouse(g.id);}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[id]);
 return <ScrollView contentContainerStyle={{padding:24,paddingTop:150,paddingBottom:160,gap:16}}><Pressable onPress={()=>router.back()}><Text>← Back</Text></Pressable>{error?<Text>{error}</Text>:!item?<ActivityIndicator/>:<><Text style={{fontSize:28,fontWeight:'700',color:'#9B1C2B'}}>{item.name}</Text>{item.images.map(uri=><Image key={uri} source={{uri}} style={{height:220,borderRadius:16}}/>)}<Text>{item.address}, {item.city}</Text><Text>P{item.pricePerNight} / night · {item.averageRating} ★ ({item.ratingCount} ratings)</Text><Text>{item.description}</Text><Text>{item.amenities.join(' · ')}</Text><Pressable onPress={()=>toggle(item.id).catch(e=>Alert.alert('Favourites',e.message))}><Text>{favourites.some(g=>g.id===item.id)?'Remove from favourites':'Save to favourites'}</Text></Pressable>{item.contactPhone?<Pressable onPress={()=>Linking.openURL(`tel:${item.contactPhone}`)}><Text>Call {item.contactPhone}</Text></Pressable>:null}{item.contactEmail?<Pressable onPress={()=>Linking.openURL(`mailto:${item.contactEmail}`)}><Text>Email {item.contactEmail}</Text></Pressable>:null}{item.latitude!==null&&item.longitude!==null?<Pressable onPress={()=>Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`)}><Text>Open directions</Text></Pressable>:null}</>}</ScrollView>;
}
