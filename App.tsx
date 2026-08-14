import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Species = 'Cat' | 'Dog' | 'Bird';
type Animal = {
  id: string; name: string; species: Species; emoji: string; color: string;
  distance: string; area: string; lastFed: string; needsFood: boolean; friends: number; x: number; y: number;
};

const animals: Animal[] = [
  { id: 'miso', name: 'Miso', species: 'Cat', emoji: '🐱', color: '#F2A45C', distance: '180 m', area: 'Garden walk', lastFed: '42 min ago', needsFood: false, friends: 8, x: 24, y: 24 },
  { id: 'pepper', name: 'Pepper', species: 'Dog', emoji: '🐶', color: '#8B6750', distance: '420 m', area: 'Market lane', lastFed: '5 hr ago', needsFood: true, friends: 4, x: 69, y: 38 },
  { id: 'sky', name: 'Sky', species: 'Bird', emoji: '🐦', color: '#66A8BA', distance: '650 m', area: 'Community park', lastFed: '2 hr ago', needsFood: false, friends: 12, x: 46, y: 67 },
  { id: 'mochi', name: 'Mochi', species: 'Cat', emoji: '🐈', color: '#444C54', distance: '900 m', area: 'Library square', lastFed: 'Not confirmed today', needsFood: true, friends: 3, x: 78, y: 78 }
];

const tabs = [
  { id: 'map', label: 'Explore', icon: 'map-outline' },
  { id: 'collection', label: 'My animals', icon: 'paw-outline' },
  { id: 'friends', label: 'Friends', icon: 'people-outline' },
  { id: 'profile', label: 'Profile', icon: 'person-circle-outline' }
] as const;

function AppContent() {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('map');
  const [selected, setSelected] = useState<Animal>(animals[0]);
  const [collected, setCollected] = useState<string[]>(['miso', 'sky']);
  const [fed, setFed] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => animals.filter(a => `${a.name} ${a.species}`.toLowerCase().includes(query.toLowerCase())), [query]);

  const collect = (id: string) => setCollected(p => p.includes(id) ? p : [...p, id]);
  const virtualFeed = (id: string) => {
    setFed(p => p.includes(id) ? p : [...p, id]);
    Alert.alert('Kindness sent ✨', 'This is a virtual care action. It does not mark the animal as physically fed.');
  };
  const confirmRealFeed = (animal: Animal) => Alert.alert(
    `Confirm feeding ${animal.name}?`,
    'Only confirm food you provided in person. Nearby carers will be notified to prevent overfeeding.',
    [{ text: 'Cancel', style: 'cancel' }, { text: 'I fed them', onPress: () => Alert.alert('Thank you!', 'The community care log has been updated.') }]
  );

  return <SafeAreaView style={s.safe} edges={['top']}>
    <StatusBar style="dark" />
    {tab === 'map' && <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.page}>
      <View style={s.header}><View><Text style={s.eyebrow}>GOOD AFTERNOON</Text><Text style={s.title}>Who’s nearby?</Text></View><View style={s.avatar}><Text>🧑🏽</Text></View></View>
      <View style={s.notice}><Ionicons name="shield-checkmark" size={20} color="#20745B"/><Text style={s.noticeText}>Locations are approximate to protect the animals.</Text></View>
      <View style={s.map}>
        <View style={[s.road, { top: 85, left: -20, width: 390, transform: [{ rotate: '-12deg' }] }]} />
        <View style={[s.road, { top: 180, left: 15, width: 330, transform: [{ rotate: '21deg' }] }]} />
        <Text style={[s.mapLabel, {top: 24, left: 20}]}>Garden walk</Text><Text style={[s.mapLabel, {bottom: 28, right: 22}]}>Community park</Text>
        {animals.map(a => <Pressable key={a.id} onPress={() => setSelected(a)} style={[s.pin, { left: `${a.x}%`, top: `${a.y}%`, backgroundColor: selected.id === a.id ? '#20382E' : '#fff' }]}>
          <Text style={s.pinEmoji}>{a.emoji}</Text>{a.needsFood && <View style={s.alertDot}/>} 
        </Pressable>)}
        <View style={s.you}><View style={s.youDot}/><Text style={s.youText}>You</Text></View>
      </View>
      <AnimalCard animal={selected} isCollected={collected.includes(selected.id)} isFed={fed.includes(selected.id)} onCollect={() => collect(selected.id)} onVirtualFeed={() => virtualFeed(selected.id)} onConfirmFeed={() => confirmRealFeed(selected)} />
      <Text style={s.sectionTitle}>Care nearby</Text>
      <View style={s.careCard}><View style={s.careIcon}><Ionicons name="notifications" size={20} color="#9C5C22"/></View><View style={{flex:1}}><Text style={s.cardTitle}>2 animals may need food</Text><Text style={s.muted}>Based on trusted community updates</Text></View><Ionicons name="chevron-forward" size={20} color="#85908A"/></View>
    </ScrollView>}
    {tab === 'collection' && <ScrollView contentContainerStyle={s.page}><Text style={s.eyebrow}>YOUR FIELD GUIDE</Text><Text style={s.title}>Animals you’ve met</Text><TextInput value={query} onChangeText={setQuery} placeholder="Search your sightings" style={s.search}/><View style={s.grid}>{filtered.filter(a => collected.includes(a.id)).map(a => <View key={a.id} style={s.tile}><View style={[s.bigEmoji,{backgroundColor:a.color+'22'}]}><Text style={{fontSize:42}}>{a.emoji}</Text></View><Text style={s.cardTitle}>{a.name}</Text><Text style={s.muted}>{a.species} · {a.friends} sightings</Text><Pressable style={s.smallButton} onPress={() => virtualFeed(a.id)}><Text style={s.smallButtonText}>{fed.includes(a.id) ? 'Fed virtually ✓' : 'Give virtual treat'}</Text></Pressable></View>)}</View></ScrollView>}
    {tab === 'friends' && <ScrollView contentContainerStyle={s.page}><Text style={s.eyebrow}>YOUR COMMUNITY</Text><Text style={s.title}>Friends & activity</Text><View style={s.invite}><View><Text style={s.cardTitle}>Grow your care circle</Text><Text style={s.muted}>Share sightings with people you trust.</Text></View><Pressable style={s.addButton}><Ionicons name="person-add" size={18} color="white"/></Pressable></View>{[['Ari','🧑🏻','spotted Mochi near Library square','12 min'],['Sam','👨🏽','confirmed Pepper was fed','42 min'],['Lina','👩🏼','added Sky to her collection','2 hr']].map(x=><View key={x[0]} style={s.activity}><Text style={s.friendAvatar}>{x[1]}</Text><View style={{flex:1}}><Text style={s.cardTitle}>{x[0]}</Text><Text style={s.muted}>{x[2]}</Text></View><Text style={s.time}>{x[3]}</Text></View>)}</ScrollView>}
    {tab === 'profile' && <ScrollView contentContainerStyle={s.page}><Text style={s.eyebrow}>PAWPRINT PROFILE</Text><Text style={s.title}>Your impact</Text><View style={s.impact}><Text style={s.impactEmoji}>🌱</Text><Text style={s.impactNumber}>14</Text><Text style={s.cardTitle}>care actions this month</Text></View>{[['paw','Animals collected','12'],['fast-food','Real feeds confirmed','4'],['people','Trusted friends','8'],['notifications','Nearby care alerts','On']].map(x=><View key={x[1]} style={s.setting}><Ionicons name={x[0] as any} size={21} color="#244638"/><Text style={[s.cardTitle,{flex:1}]}>{x[1]}</Text><Text style={s.settingValue}>{x[2]}</Text></View>)}<Text style={s.disclaimer}>Pawprint coordinates community care. It does not replace veterinary or animal rescue services. Report injured or endangered animals to a local rescue organization.</Text></ScrollView>}
    <View style={s.nav}>{tabs.map(t=><Pressable key={t.id} onPress={()=>setTab(t.id)} style={s.navItem}><Ionicons name={t.icon as any} size={23} color={tab===t.id?'#20382E':'#87928D'}/><Text style={[s.navText,tab===t.id&&s.navTextActive]}>{t.label}</Text></Pressable>)}</View>
  </SafeAreaView>;
}

function AnimalCard({animal,isCollected,isFed,onCollect,onVirtualFeed,onConfirmFeed}:{animal:Animal;isCollected:boolean;isFed:boolean;onCollect:()=>void;onVirtualFeed:()=>void;onConfirmFeed:()=>void}) {
  return <View style={s.animalCard}><View style={[s.animalFace,{backgroundColor:animal.color+'22'}]}><Text style={{fontSize:46}}>{animal.emoji}</Text></View><View style={{flex:1}}><View style={s.row}><Text style={s.animalName}>{animal.name}</Text><View style={[s.status,animal.needsFood?s.statusNeed:s.statusOkay]}><Text style={[s.statusText,{color:animal.needsFood?'#9A4B22':'#24705A'}]}>{animal.needsFood?'Needs check':'Fed recently'}</Text></View></View><Text style={s.muted}>{animal.species} · {animal.distance} · {animal.area}</Text><Text style={s.feedLine}><Ionicons name="time-outline" size={14}/> {animal.lastFed}</Text><View style={s.actions}><Pressable style={s.secondary} onPress={onCollect}><Text style={s.secondaryText}>{isCollected?'✓ Collected':'Add to collection'}</Text></Pressable><Pressable style={s.primary} onPress={onVirtualFeed}><Text style={s.primaryText}>{isFed?'✓ Treat sent':'Virtual treat'}</Text></Pressable></View><Pressable onPress={onConfirmFeed}><Text style={s.realFeed}>I fed {animal.name} in person</Text></Pressable></View></View>
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F7F5EF'},page:{padding:20,paddingBottom:28},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:14},eyebrow:{fontSize:11,fontWeight:'800',letterSpacing:1.5,color:'#6E7B75',marginBottom:5},title:{fontSize:30,fontWeight:'800',letterSpacing:-.8,color:'#20382E'},avatar:{width:44,height:44,borderRadius:22,backgroundColor:'#E4C99D',alignItems:'center',justifyContent:'center'},notice:{flexDirection:'row',gap:9,alignItems:'center',backgroundColor:'#E3F0E9',padding:12,borderRadius:14,marginBottom:14},noticeText:{fontSize:13,color:'#315E4C',fontWeight:'600',flex:1},map:{height:310,borderRadius:24,backgroundColor:'#DDE7D4',overflow:'hidden',position:'relative',borderWidth:1,borderColor:'#D0DCC8'},road:{position:'absolute',height:30,backgroundColor:'#F4F0E7',borderTopWidth:2,borderBottomWidth:2,borderColor:'#fff'},mapLabel:{position:'absolute',fontSize:11,fontWeight:'700',color:'#6C7D68'},pin:{position:'absolute',width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center',borderWidth:3,borderColor:'#fff',shadowColor:'#1D332A',shadowOpacity:.18,shadowRadius:7,elevation:4,transform:[{translateX:-24},{translateY:-24}]},pinEmoji:{fontSize:26},alertDot:{position:'absolute',right:-1,top:-1,width:13,height:13,borderRadius:7,backgroundColor:'#E36A43',borderWidth:2,borderColor:'#fff'},you:{position:'absolute',left:'45%',top:'45%',alignItems:'center'},youDot:{width:16,height:16,borderRadius:8,backgroundColor:'#3979E8',borderWidth:3,borderColor:'#fff'},youText:{fontSize:10,fontWeight:'700',backgroundColor:'#fff',paddingHorizontal:5,borderRadius:5,marginTop:2},animalCard:{marginTop:-5,backgroundColor:'#fff',borderRadius:22,padding:15,flexDirection:'row',gap:13,shadowColor:'#20382E',shadowOpacity:.09,shadowRadius:12,elevation:3},animalFace:{width:66,height:66,borderRadius:20,alignItems:'center',justifyContent:'center'},row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:5},animalName:{fontSize:21,fontWeight:'800',color:'#20382E'},cardTitle:{fontSize:15,fontWeight:'700',color:'#263C33'},muted:{fontSize:12,color:'#718079',lineHeight:18},status:{borderRadius:12,paddingHorizontal:8,paddingVertical:4},statusNeed:{backgroundColor:'#FBE5D9'},statusOkay:{backgroundColor:'#DDF0E7'},statusText:{fontSize:10,fontWeight:'800'},feedLine:{fontSize:12,color:'#4E6259',marginTop:6},actions:{flexDirection:'row',gap:7,marginTop:10},primary:{backgroundColor:'#E76F45',paddingHorizontal:11,paddingVertical:8,borderRadius:10},primaryText:{color:'#fff',fontSize:11,fontWeight:'800'},secondary:{backgroundColor:'#EDF2EF',paddingHorizontal:10,paddingVertical:8,borderRadius:10},secondaryText:{color:'#345345',fontSize:11,fontWeight:'800'},realFeed:{fontSize:11,fontWeight:'700',color:'#376C58',textDecorationLine:'underline',marginTop:10},sectionTitle:{fontSize:19,fontWeight:'800',color:'#20382E',marginTop:24,marginBottom:10},careCard:{flexDirection:'row',alignItems:'center',gap:12,padding:15,backgroundColor:'#FFF4E6',borderRadius:18},careIcon:{width:40,height:40,borderRadius:20,backgroundColor:'#FFE3C1',alignItems:'center',justifyContent:'center'},nav:{height:72,flexDirection:'row',backgroundColor:'#fff',borderTopWidth:1,borderColor:'#E5E7E3',paddingBottom:8},navItem:{flex:1,alignItems:'center',justifyContent:'center',gap:3},navText:{fontSize:10,fontWeight:'700',color:'#87928D'},navTextActive:{color:'#20382E'},search:{backgroundColor:'#fff',borderRadius:14,padding:14,marginTop:18,marginBottom:16,fontSize:15},grid:{flexDirection:'row',flexWrap:'wrap',gap:12},tile:{width:'48%',backgroundColor:'#fff',padding:12,borderRadius:18},bigEmoji:{height:105,borderRadius:15,alignItems:'center',justifyContent:'center',marginBottom:10},smallButton:{marginTop:9,backgroundColor:'#EDF2EF',padding:9,borderRadius:9,alignItems:'center'},smallButtonText:{fontSize:10,fontWeight:'800',color:'#345345'},invite:{marginTop:18,marginBottom:14,padding:16,borderRadius:18,backgroundColor:'#E3F0E9',flexDirection:'row',alignItems:'center',justifyContent:'space-between'},addButton:{width:42,height:42,borderRadius:21,backgroundColor:'#244638',alignItems:'center',justifyContent:'center'},activity:{flexDirection:'row',gap:12,alignItems:'center',backgroundColor:'#fff',padding:15,borderRadius:16,marginBottom:10},friendAvatar:{fontSize:28},time:{fontSize:10,color:'#89938E'},impact:{alignItems:'center',backgroundColor:'#E3F0E9',padding:25,borderRadius:22,marginTop:18,marginBottom:15},impactEmoji:{fontSize:34},impactNumber:{fontSize:40,fontWeight:'900',color:'#244638'},setting:{flexDirection:'row',gap:12,backgroundColor:'#fff',padding:16,borderRadius:14,marginBottom:8,alignItems:'center'},settingValue:{fontSize:13,fontWeight:'700',color:'#6B7B74'},disclaimer:{fontSize:11,lineHeight:17,color:'#738079',marginTop:13,paddingHorizontal:8}
});

export default function App(){return <SafeAreaProvider><AppContent/></SafeAreaProvider>}
