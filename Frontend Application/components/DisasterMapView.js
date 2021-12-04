import React from 'react';
import {StyleSheet, View} from 'react-native';
import MapView, {Marker, Polygon, PROVIDER_GOOGLE} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import DisasterCallout from './DisasterCallout';

const DisasterMapView = ({disasters}) => {
  var mapView;
  const initialRegion = {
    latitude: 40.044438,
    longitude: -98.852481,
    latitudeDelta: 50,
    longitudeDelta: 30,
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
        while (mapView == null) {}
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
  return (
    <View style={styles.container}>
      <MapView
        ref={ref => (mapView = ref)}
        provider={PROVIDER_GOOGLE} // remove if not using Google Maps
        showsUserLocation={true}
        style={styles.map}
        zoomControlEnabled={true}
        onMapLoaded={() => {
          getCurrentLocation();
        }}
        initialRegion={initialRegion}>
        {Object.keys(disasters).map(location => {
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
                  latitude: disasters[location].bound.northeast.lat,
                  longitude: disasters[location].bound.northeast.lng,
                },
                {
                  latitude: disasters[location].bound.southwest.lat,
                  longitude: disasters[location].bound.northeast.lng,
                },
                {
                  latitude: disasters[location].bound.southwest.lat,
                  longitude: disasters[location].bound.southwest.lng,
                },

                {
                  latitude: disasters[location].bound.northeast.lat,
                  longitude: disasters[location].bound.southwest.lng,
                },
              ]}
            />,
            <Marker
              key={location + 'marker'}
              opacity={0}
              ref={ref => (markerRef[location] = ref)}
              coordinate={{
                latitude:
                  (disasters[location].bound.northeast.lat +
                    disasters[location].bound.southwest.lat) /
                  2,
                longitude:
                  (disasters[location].bound.northeast.lng +
                    disasters[location].bound.southwest.lng) /
                  2,
              }}>
              <DisasterCallout
                key={location + 'callout'}
                location={location}
                disasters={disasters[location].disasters}
              />
            </Marker>,
          ];
        })}
      </MapView>
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

export default DisasterMapView;
