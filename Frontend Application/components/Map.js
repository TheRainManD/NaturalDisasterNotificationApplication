import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import MapView, {
  Callout,
  Marker,
  Polygon,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import {getDisasterLocations} from '../backend/backend';
import DisasterCallout from './DisasterCallout';

const Map = () => {
  var mapView;
  const initialRegion = {
    latitude: -37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };
  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const region = {
          latitude: parseFloat(position.coords.latitude),
          longitude: parseFloat(position.coords.longitude),
          latitudeDelta: 4,
          longitudeDelta: 4,
        };
        mapView.animateToRegion(region, 1000);
      },
      error => {
        console.log(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 1000,
      },
    );
  };

  var markerRef = {};

  const [locations, setLocations] = useState({});

  return (
    <View style={styles.container}>
      <Text>1</Text>
      {/* <MapView
        ref={ref => (mapView = ref)}
        provider={PROVIDER_GOOGLE} // remove if not using Google Maps
        showsUserLocation={true}
        style={styles.map}
        zoomControlEnabled={true}
        onMapReady={() => {
          // getCurrentLocation();
          // getDisasterLocations(setLocations);
        }}
        initialRegion={initialRegion}>
        {Object.keys(locations).map(location => {
          return [
            <Polygon
              key={location + 'polygon'}
              fillColor={'rgba(224, 82, 70,0.3)'}
              strokeColor={'#f22311'}
              tappable={true}
              onPress={() => {
                if (markerRef[location] != null)
                  markerRef[location].showCallout();
              }}
              coordinates={[
                {
                  latitude: locations[location].bound.northeast.lat,
                  longitude: locations[location].bound.northeast.lng,
                },
                {
                  latitude: locations[location].bound.southwest.lat,
                  longitude: locations[location].bound.northeast.lng,
                },
                {
                  latitude: locations[location].bound.southwest.lat,
                  longitude: locations[location].bound.southwest.lng,
                },

                {
                  latitude: locations[location].bound.northeast.lat,
                  longitude: locations[location].bound.southwest.lng,
                },
              ]}
            />,
            <Marker
              key={location + 'marker'}
              opacity={0}
              ref={ref => (markerRef[location] = ref)}
              coordinate={{
                latitude:
                  (locations[location].bound.northeast.lat +
                    locations[location].bound.southwest.lat) /
                  2,
                longitude:
                  (locations[location].bound.northeast.lng +
                    locations[location].bound.southwest.lng) /
                  2,
              }}>
              <DisasterCallout
                key={location + 'callout'}
                location={location}
                disasters={locations[location].disasters}
              />
            </Marker>,
          ];
        })}
      </MapView> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default Map;
