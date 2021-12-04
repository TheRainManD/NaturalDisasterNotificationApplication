import React from 'react';
import {View, StyleSheet, FlatList, Text} from 'react-native';
import {Button, Chip, Divider, Searchbar} from 'react-native-paper';
import {useTheme} from '@react-navigation/native';
import {useState} from 'react';
import {getAutoComplete, reverseGeo} from '../backend/backend';
import Geolocation from '@react-native-community/geolocation';

const LocationPicker = ({locations, setLocations}) => {
  const {colors} = useTheme();
  const [suggestions, setSuggestions] = useState([]);
  const [timeoutFunction, setTimeoutFunction] = useState();
  const [loading, setLoading] = useState(false);

  const containsLocation = location => {
    for (const l of locations) {
      if (l == location) return true;
    }
    return false;
  };

  const queryUpdate = text => {
    if (timeoutFunction != null) clearTimeout(timeoutFunction);
    if (text == '') setSuggestions('');
    else {
      setTimeoutFunction(
        setTimeout(() => getAutoComplete(text, setSuggestions), 2000),
      );
    }
  };

  const renderItem = ({item}) => {
    return (
      <View style={styles.chipContainer}>
        <Chip
          children={item}
          style={styles.chip}
          mode="outlined"
          selectedColor={colors.primary}
          textStyle={{fontSize: 12}}
          selected={true}
          onClose={() => {
            setLocations(locations.filter(location => location != item));
          }}
        />
      </View>
    );
  };

  const renderSuggestion = ({item}) => {
    return (
      <View style={styles.suggestionItemContainer}>
        <Text
          style={{paddingHorizontal: 20}}
          onPress={() => {
            // console.log(item);
            if (!containsLocation(item)) setLocations([...locations, item]);
          }}>
          {item}
        </Text>
        <Divider style={{height: 1}} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Searchbar
        style={{
          height: 40,
          // borderColor: 'rgba(29, 161, 242,0.9)',
          borderWidth: 0.2,
        }}
        inputStyle={{fontSize: 15}}
        placeholder={'Search your city'}
        onChangeText={text => {
          queryUpdate(text);
        }}
      />
      <FlatList
        style={[
          styles.suggestionsContainer,
          {
            borderWidth: suggestions.length > 0 ? 1 : 0,
            display: suggestions.length > 0 ? 'flex' : 'none',
          },
        ]}
        data={suggestions}
        renderItem={renderSuggestion}
        keyExtractor={item => item}
      />

      <Button
        mode={'outlined'}
        icon={'crosshairs-gps'}
        uppercase={false}
        labelStyle={{fontSize: 13}}
        style={styles.locationbutton}
        loading={loading}
        onPress={() => {
          setLoading(true);
          Geolocation.getCurrentPosition(
            position => {
              const coordinate = {
                lat: parseFloat(position.coords.latitude),
                lng: parseFloat(position.coords.longitude),
              };
              reverseGeo(coordinate, setSuggestions, setLoading);
            },
            error => {
              console.log(error);
              setLoading(false);
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 1000,
            },
          );
        }}>
        My location
      </Button>

      <View style={styles.flatlistContainer}>
        <FlatList
          data={locations}
          renderItem={renderItem}
          keyExtractor={item => item}
          scrollEnabled={true}
          nestedScrollEnabled={true}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
  },
  chipContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  chip: {
    paddingHorizontal: 10,
    marginHorizontal: 5,
    marginTop: 5,
  },
  flatlistContainer: {marginTop: 20, flex: 1, marginBottom: 10},
  suggestionsContainer: {
    maxHeight: 70,
    borderWidth: 1,
    flexGrow: 0,
    borderColor: 'rgb(217, 217, 217)',
    paddingVertical: 5,
  },
  suggestionItemContainer: {
    marginBottom: 5,
  },
  locationbutton: {
    width: 150,
    // backgroundColor: 'rgba(29, 161, 242,0.9)',
    borderColor: 'rgba(29, 161, 242,0.9)',
    borderWidth: 0.5,
    alignSelf: 'center',
    marginTop: 15,
  },
});

export default LocationPicker;
