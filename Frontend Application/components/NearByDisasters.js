import React, {useState, useEffect} from 'react';
import {Appbar, Text} from 'react-native-paper';
import {View} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import DisasterMapView from './DisasterMapView';
import DisasterListView from './DisasterListView';
import {getDisasters} from '../backend/backend';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';

const NearByDisasters = ({navigation}) => {
  const [disasters, setDisasters] = useState({byLocation: {}, byIncident: []});
  const TopTab = createMaterialTopTabNavigator();

  useEffect(() => {
    let isMounted = true;
    getDisasters().then(json => {
      if (isMounted) {
        setDisasters(json);
      }
    });

    const unsubscribe = navigation.addListener('tabPress', e => {
      getDisasters().then(json => {
        if (isMounted) {
          setDisasters(json);
        }
      });
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const mapTab = () => {
    return (
      <DisasterMapView
        disasters={disasters.byLocation}
        navigation={navigation}
      />
    );
  };

  const listTab = () => {
    return (
      <DisasterListView
        disasters={disasters.byIncident}
        navigation={navigation}
      />
    );
  };

  return [
    <Appbar.Header
      style={{
        backgroundColor: 'white',
        borderBottomColor: 'gray',
        borderBottomWidth: 0.15,
      }}
      key="appbar">
      <Appbar.Content
        title="Disasters Near You"
        color={'rgba(0,0,0,0.7)'}
        titleStyle={{fontSize: 15, paddingLeft: 5}}
      />
      <Appbar.Action
        icon="cog"
        size={20}
        color={'rgba(0,0,0,0.7)'}
        onPress={() => {
          navigation.navigate('Profile');
        }}
      />
    </Appbar.Header>,
    <TopTab.Navigator
      lazy={true}
      key="disasterTab"
      swipeEnabled={false}
      tabBarOptions={{
        labelStyle: {fontSize: 11, paddingVertical: 0, marginVertical: 0},
        allowFontScaling: false,
      }}>
      <TopTab.Screen name="List" component={listTab} />
      <TopTab.Screen name="Map" component={mapTab} />
    </TopTab.Navigator>,
  ];
};

export default NearByDisasters;
