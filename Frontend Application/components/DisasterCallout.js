import React from 'react';
import {Callout} from 'react-native-maps';
import {Text} from 'react-native-paper';
import {StyleSheet, View} from 'react-native';

const DisasterCallout = ({disasters, location}) => {
  return (
    <Callout>
      <Text style={styles.title}>{location}</Text>
      <View>
        {Object.keys(disasters).map(disaster => {
          return (
            <View key={disaster}>
              <Text style={styles.type}>{disaster}</Text>
              <Text style={styles.timestamp}>
                {'Last updated: ' +
                  new Date(disasters[disaster].timestamp).toLocaleString()}
              </Text>
            </View>
          );
        })}
      </View>
    </Callout>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 15,
  },
  type: {
    fontSize: 12,
  },
  timestamp: {
    fontSize: 10,
    marginLeft: 5,
    color: 'gray',
  },
});

export default DisasterCallout;
