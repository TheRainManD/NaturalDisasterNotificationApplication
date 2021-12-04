import React, {useState, useEffect} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import {
  Text,
  List,
  Card,
  TouchableRipple,
  Avatar,
  ActivityIndicator,
} from 'react-native-paper';

const DisasterListView = ({disasters, navigation}) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 500);

    return () => {
      isMounted = false;
    };
  }, []);

  const renderItem = ({item}) => {
    return (
      <Card
        style={styles.listItem}
        elevation={5}
        onPress={() => {
          navigation.navigate('disaster', {id: item.id});
        }}>
        <View>
          <List.Accordion
            title={item.type}
            expanded={true}
            description={
              'Last updated: ' + new Date(item.timestamp).toLocaleString()
            }
            descriptionStyle={{fontSize: 12}}
            onPress={() => {
              navigation.navigate('disaster', {id: item.id});
            }}
            left={() => (
              <List.Icon
                color={'#1DA1F2'}
                style={{margin: 0}}
                icon={'alert-octagon'}
              />
            )}>
            <List.Accordion
              title={'Locations'}
              style={styles.subHeading}
              onPress={() => {
                navigation.navigate('disaster', {id: item.id});
              }}
              left={() => (
                <List.Icon
                  color={'#1DA1F2'}
                  style={{margin: 0}}
                  icon={'map-marker'}
                />
              )}
              expanded={true}>
              {item.locations.map(location => {
                return (
                  <List.Item
                    title={location}
                    style={styles.subHeadingItem}
                    key={location}
                  />
                );
              })}
            </List.Accordion>
          </List.Accordion>
        </View>
      </Card>
    );
  };

  if (!loading) {
    return (
      <View style={styles.container}>
        <FlatList
          data={disasters}
          // data={[{id: 1}, {id: 2}]}
          renderItem={renderItem}
          keyExtractor={item => item.id}
        />
      </View>
    );
  } else {
    return (
      <ActivityIndicator
        animating={true}
        size="large"
        style={{height: '100%'}}></ActivityIndicator>
    );
  }
};

const styles = StyleSheet.create({
  subHeading: {
    paddingLeft: 30,
  },
  subHeadingItem: {
    paddingLeft: 70,
  },
  messageList: {
    // backgroundColor: 'red',
  },
  messageContainer: {
    // marginVertical: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderColor: '#e6e6e6',
    paddingLeft: 10,
  },
  listItem: {
    marginHorizontal: 5,
    borderRadius: 10,
    marginVertical: 10,
  },
  container: {
    flex: 1,
    marginHorizontal: 5,
    marginBottom: 20,
  },
});

export default DisasterListView;
