// Documentation preview only: render App.tsx through React Native Web.
// Native integrations are substituted, never represented as working features.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const esbuild = require('esbuild');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'docs/screenshots');

const adapters = `
import React from 'react';
import { View, Text } from 'react-native';
export const SafeAreaProvider = ({children}) => children;
export const SafeAreaView = View;
export const StatusBar = () => null;
const icons = {'map-outline':'◇','paw-outline':'♧','people-outline':'♙','person-circle-outline':'○',camera:'▣',earth:'◎',locate:'⊙','layers-outline':'▱','shield-checkmark':'✓','paper-plane-outline':'➤',refresh:'↻',notifications:'♧','chevron-forward':'›',time:'◷','time-outline':'◷','person-add':'+','images-outline':'▧',paw:'♧','fast-food':'♨',people:'♙'};
export const Ionicons = ({name,size,color}) => <Text style={{fontSize:size,color}}>{icons[name] || '○'}</Text>;
export const Map = React.forwardRef(({style}, ref) => <View style={[style,{backgroundColor:'#E3ECE5',alignItems:'center',justifyContent:'center',padding:30}]}><Text style={{fontSize:34,color:'#315E4C'}}>◎</Text><Text style={{fontSize:17,fontWeight:'700',color:'#315E4C',marginTop:12}}>Native map preview</Text><Text style={{fontSize:12,color:'#547064',textAlign:'center',marginTop:8}}>Map tiles and animal pins appear on device.</Text><Text style={{fontSize:11,color:'#547064',textAlign:'center',marginTop:8}}>No GPS or satellite imagery in this capture.</Text></View>);
export const Marker = () => null;
export const Callout = () => null;
export const storage = {getItem:async()=>null,setItem:async()=>{},multiSet:async()=>{}};
export const Accuracy = {High:4};
export const requestForegroundPermissionsAsync = async()=>({granted:false});
export const hasServicesEnabledAsync = async()=>false;
export const watchPositionAsync = async()=>({remove(){}});
export const MediaTypeOptions = {Images:'Images'};
export const requestCameraPermissionsAsync = async()=>({granted:false});
export const launchCameraAsync = async()=>({canceled:true});
`;

(async () => {
  fs.mkdirSync(output, {recursive:true});
  const source = fs.readFileSync(path.join(root, 'App.tsx'), 'utf8');
  const modules = {
    'react-native-safe-area-context':'export {SafeAreaProvider,SafeAreaView} from "preview-adapters";',
    'expo-status-bar':'export {StatusBar} from "preview-adapters";',
    '@expo/vector-icons':'export {Ionicons} from "preview-adapters";',
    'react-native-maps':'export {Map as default,Marker,Callout} from "preview-adapters";',
    '@react-native-async-storage/async-storage':'export {storage as default} from "preview-adapters";',
    'expo-location':'export {Accuracy,requestForegroundPermissionsAsync,hasServicesEnabledAsync,watchPositionAsync} from "preview-adapters";',
    'expo-image-picker':'export {MediaTypeOptions,requestCameraPermissionsAsync,launchCameraAsync} from "preview-adapters";'
  };
  const result = await esbuild.build({
    stdin:{contents:'import React from "react"; import {createRoot} from "react-dom/client"; import App from "preview-app"; createRoot(document.getElementById("root")).render(<App/>);',loader:'tsx',resolveDir:__dirname},
    bundle:true,write:false,define:{'process.env.NODE_ENV':'"production"','process.env.EXPO_PUBLIC_API_URL':'undefined'},
    plugins:[{name:'documentation-preview',setup(build){
      build.onResolve({filter:/CommunityMap$/}, () => ({path:'react-native-maps',namespace:'preview'}));
      build.onResolve({filter:/^(preview-app|preview-adapters|react-native|react-native-maps|react-native-safe-area-context|expo-status-bar|@expo\/vector-icons|@react-native-async-storage\/async-storage|expo-location|expo-image-picker)$/}, args => args.path === 'react-native' ? {path:require.resolve('react-native-web')} : {path:args.path,namespace:'preview'});
      build.onLoad({filter:/.*/,namespace:'preview'},args => ({contents:args.path==='preview-app'?source:args.path==='preview-adapters'?adapters:modules[args.path],loader:'tsx',resolveDir:__dirname}));
    }}]
  });
  const html = '<!doctype html><meta charset="utf-8"><title>Pawprint documentation preview</title><style>html,body,#root{margin:0;width:100%;height:100%;}body{font-family:system-ui;overflow:hidden}#root{display:flex;flex-direction:column}</style><div id="root"></div><script src="/app.js"></script>';
  const server = http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/app.js'?'text/javascript':'text/html');res.end(req.url==='/app.js'?result.outputFiles[0].contents:html);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser = await chromium.launch({channel:process.env.SCREENSHOT_BROWSER || 'chrome',headless:true});
    const page = await browser.newPage({viewport:{width:430,height:1050},deviceScaleFactor:2});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByText(/nearby\?/).waitFor();
    for (const [tab,file] of [['Explore','explore'],['My animals','collection'],['Friends','friends'],['Profile','profile']]) {
      await page.getByText(tab,{exact:true}).click();
      await page.screenshot({path:path.join(output,`${file}.png`)});
      console.log(`Captured ${file}.png`);
    }
    if(errors.length) throw new Error(errors.join('\n'));
  } finally { await browser?.close(); await new Promise(resolve=>server.close(resolve)); }
})().catch(error=>{console.error(error);process.exitCode=1;});

