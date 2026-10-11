import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import NativeMapView, { MapViewProps, Region } from 'react-native-maps';
export { Marker, Callout } from 'react-native-maps';
export type { Region } from 'react-native-maps';
export type MapHandle = { animateToRegion: (region: Region, duration?: number) => void };
// Metro selects CommunityMap.web.tsx in browsers.
export default forwardRef<MapHandle, MapViewProps>((props, ref) => {
  const nativeRef = useRef<NativeMapView>(null);
  useImperativeHandle(ref, () => ({animateToRegion(region, duration) {
    nativeRef.current?.animateToRegion(region, duration);
  }}), []);
  return <NativeMapView {...props} ref={nativeRef} />;
});
