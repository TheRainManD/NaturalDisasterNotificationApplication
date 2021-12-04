import React from 'react';
import {StyleSheet, View, RefreshControl} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import {List, Text, Button, IconButton, Card, Appbar} from 'react-native-paper';
import {useState} from 'react';
import {useEffect} from 'react';
import {
  getUserNotifications,
  deleteUserNotification,
  getUserNotificationsV2,
} from '../backend/backend';
import messaging from '@react-native-firebase/messaging';

const Notification = ({navigation}) => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsub = messaging().onNotificationOpenedApp(onRefresh);

    const unsubscribe = messaging().onMessage(async () => {
      onRefresh();
    });

    let isMounted = true; // mount status
    if (isMounted) {
      getUserNotificationsV2().then(json => {
        if (isMounted) {
          json.reverse();
          setNotifications(json);
        }
      });
    }
    return () => {
      isMounted = false;
      unsub();
      unsubscribe();
    };
  }, []);

  const renderItem = item => {
    return (
      <Card
        style={styles.listItem}
        elevation={5}
        onPress={() => {
          navigation.navigate('disaster', {id: item.item.disaster});
        }}>
        <View style={styles.title}>
          <View style={{flexGrow: 1, marginTop: 5}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <List.Icon
                color={'#1DA1F2'}
                style={{margin: 0}}
                icon={'alert-octagon'}
              />
              <Text
                style={styles.titleText}
                numberOfLines={1}
                ellipsizeMode="tail">
                {item.item.title}
              </Text>
            </View>
            <Text style={styles.subText}>{'Source: ' + item.item.source} </Text>
            <Text style={styles.subText}>
              {new Date(item.item.timestamp).toLocaleString()}{' '}
            </Text>
          </View>
          <IconButton
            icon="close"
            size={17}
            onPress={() => {
              deleteUserNotification(item.item.id);
              setNotifications(
                notifications.filter(
                  notification => item.item.id != notification.id,
                ),
              );
            }}
          />
        </View>
        <Text style={styles.message} numberOfLines={3} ellipsizeMode="tail">
          {item.item.message}
        </Text>
        {/* <Button uppercase={false} labelStyle={styles.errorButtonText}>
          Not subscribed to this?
        </Button> */}
      </Card>
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    getUserNotifications(setNotifications);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
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
        title="Notification History"
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
    <View style={styles.container} key="main">
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onRefresh={onRefresh}
      />
    </View>,
  ];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 5,
    marginHorizontal: 10,
    marginBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    margin: 5,
    borderRadius: 10,
    marginVertical: 10,
  },
  title: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  message: {
    fontSize: 15,
    marginLeft: 20,
    marginTop: 5,
    marginBottom: 10,
    marginRight: 10,
  },
  text: {
    flex: 1,
    marginLeft: 20,
    marginRight: 10,
    marginVertical: 10,
  },
  subText: {fontSize: 10, paddingLeft: 10, color: 'rgba(0,0,0,0.6)'},
  titleText: {fontSize: 20, alignItems: 'center', color: 'rgba(0,0,0,0.8)'},
  errorButtonText: {fontSize: 11, fontWeight: '800'},
});

export default Notification;
