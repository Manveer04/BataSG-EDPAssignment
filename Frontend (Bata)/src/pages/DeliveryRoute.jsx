// filepath: /c:/Users/TUF_F15/Downloads/Ok this one - Copy/Frontend-IntegratedCodeOfManveerBernandJunLong/IntegrateManveerBernandJunLong-main/src/components/DeliveryRouteMap.jsx
import React, { useEffect, useRef } from 'react';

const DeliveryRouteMap = ({ routeGeometry, routeInstructions }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 1.319498, lng: 103.842142 },
      zoom: 16,
    });

    const decodedPath = window.google.maps.geometry.encoding.decodePath(routeGeometry);
    const routePath = new window.google.maps.Polyline({
      path: decodedPath,
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });

    routePath.setMap(map);

    routeInstructions.forEach((instruction, index) => {
      const position = {
        lat: parseFloat(instruction[3].split(',')[0]),
        lng: parseFloat(instruction[3].split(',')[1]),
      };

      const marker = new window.google.maps.Marker({
        position,
        map,
        title: instruction[9],
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: instruction[9],
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    });
  }, [routeGeometry, routeInstructions]);

  return <div ref={mapRef} style={{ height: '400px', width: '100%' }} />;
};

export default DeliveryRouteMap;