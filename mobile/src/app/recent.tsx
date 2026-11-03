import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import GuesthouseList from '../components/GuesthouseList';
import { getGuesthouse, Guesthouse } from '../services/api';
import { recentIds } from '../services/recent';
export default function Recent() {
 const [items,setItems]=useState<Guesthouse[]>([]); const [message,setMessage]=useState('Loading...');
 useFocusEffect(useCallback(() => { let active=true; recentIds().then(ids => Promise.allSettled(ids.map(getGuesthouse))).then(results => { if(!active)return; const found=results.flatMap(r=>r.status==='fulfilled'?[r.value]:[]);setItems(found);setMessage(found.length?'':'No recently viewed guesthouses available.'); }).catch(()=>{if(active)setMessage('Could not load recent guesthouses.');});return()=>{active=false;}; },[]));
 return <GuesthouseList title="Recently viewed" items={items} message={message}/>;
}
