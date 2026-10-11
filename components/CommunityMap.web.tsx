import React, { createContext, forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { View } from 'react-native';
import type { MapViewProps, MapMarkerProps, MapCalloutProps, Region } from 'react-native-maps';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type { Region } from 'react-native-maps';
export type MapHandle = { animateToRegion: (region: Region, duration?: number) => void };
const MapContext = createContext<L.Map | null>(null);
const boundsFor = (region: Region) => L.latLngBounds(
  [Math.max(-85, region.latitude - region.latitudeDelta / 2), region.longitude - region.longitudeDelta / 2],
  [Math.min(85, region.latitude + region.latitudeDelta / 2), region.longitude + region.longitudeDelta / 2]
);

const CommunityMap = forwardRef<MapHandle, Omit<MapViewProps, 'region'> & {region?: Region}>((props, ref) => {
  const element = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const callbacks = useRef(props);
  callbacks.current = props;
  useImperativeHandle(ref, () => ({ animateToRegion(region, duration = 700) {
    map?.flyToBounds(boundsFor(region), {duration: duration / 1000, maxZoom: 19});
  }}), [map]);
  useEffect(() => {
    if (!element.current) return;
    const instance = L.map(element.current, {zoomControl:false, maxZoom:19});
    instance.fitBounds(boundsFor(callbacks.current.region!), {animate:false});
    L.control.zoom({position:'bottomright'}).addTo(instance);
    instance.on('dragstart', () => callbacks.current.onPanDrag?.({} as never));
    instance.on('moveend', () => {
      const center = instance.getCenter();
      const bounds = instance.getBounds();
      callbacks.current.onRegionChangeComplete?.({latitude:center.lat, longitude:center.lng,
        latitudeDelta:bounds.getNorth()-bounds.getSouth(), longitudeDelta:bounds.getEast()-bounds.getWest()}, {isGesture:true});
    });
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(element.current);
    setMap(instance);
    return () => { observer.disconnect(); instance.remove(); };
  }, []);
  useEffect(() => {
    if (!map || !props.region) return;
    const center = map.getCenter();
    const bounds = map.getBounds();
    const region = props.region;
    if (Math.abs(center.lat-region.latitude) > 0.00001 || Math.abs(center.lng-region.longitude) > 0.00001 ||
      Math.abs(bounds.getEast()-bounds.getWest()-region.longitudeDelta) > 0.00001) {
      map.fitBounds(boundsFor(region), {animate:false});
    }
  }, [map, props.region]);
  useEffect(() => {
    if (!map) return;
    const satellite = props.mapType === 'hybrid';
    const layer = L.tileLayer(satellite
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom:19,
      attribution:satellite ? 'Tiles &copy; Esri — Esri, Maxar, Earthstar Geographics, and the GIS User Community'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    return () => { layer.remove(); };
  }, [map, props.mapType]);
  return <View style={props.style}>
    <div ref={element} style={{width:'100%',height:'100%',isolation:'isolate'}} aria-label="Animal sightings map" />
    <MapContext.Provider value={map}>{map && props.children}</MapContext.Provider>
  </View>;
});
export default CommunityMap;

export function Callout({children, onPress}: MapCalloutProps) {
  return <div onClick={() => onPress?.({} as never)}><View>{children}</View></div>;
}
export function Marker({coordinate,children,onPress,title,description,pinColor}: MapMarkerProps) {
  const map = useContext(MapContext);
  const marker = useRef<L.Marker>();
  const press = useRef(onPress);
  press.current = onPress;
  const [containers] = useState(() => ({icon:document.createElement('div'),popup:document.createElement('div')}));
  const items = React.Children.toArray(children);
  const callout = items.filter(item => React.isValidElement(item) && item.type === Callout);
  const content = items.filter(item => !React.isValidElement(item) || item.type !== Callout);
  useEffect(() => {
    if (!map) return;
    const icon = L.divIcon({html:containers.icon, className:'pawprint-map-marker', iconSize:[48,48], iconAnchor:[24,24]});
    const instance = L.marker([coordinate.latitude,coordinate.longitude], {icon, title:title || 'Animal sighting'}).addTo(map);
    if (callout.length || title) instance.bindPopup(containers.popup);
    instance.on('click', () => press.current?.({} as never));
    marker.current = instance;
    return () => { instance.remove(); };
  }, [map, containers]);
  useEffect(() => { marker.current?.setLatLng([coordinate.latitude,coordinate.longitude]); }, [coordinate.latitude,coordinate.longitude]);
  return <>{createPortal(content.length ? content : <div style={{width:20,height:20,background:pinColor || '#2878D0',border:'3px solid white',borderRadius:'50%',margin:12}} />, containers.icon)}
    {createPortal(callout.length ? callout : <div><strong>{title}</strong><p>{description}</p></div>, containers.popup)}</>;
}
