import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {FlatList, TextInput} from 'react-native-gesture-handler';
import {
  ActivityIndicator,
  Chip,
  List,
  Card,
  Portal,
  Modal,
  IconButton,
  Button,
  Switch,
} from 'react-native-paper';
import {
  deleteFollowup,
  getDisaster,
  getFollowup,
  postComment,
  postFollowup,
} from '../backend/backend';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';

const Disaster = ({route}) => {
  const {id} = route.params;
  const [disaster, setDisaster] = useState();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [followup, setFollowup] = useState(false);
  const [dummy, setDummy] = useState(false);

  const renderDisasterProp = ({item}) => {
    switch (item) {
      case 'type':
        return (
          <View style={styles.typeContainer}>
            <List.Icon
              color={'#1DA1F2'}
              style={{margin: 0}}
              icon={'alert-octagon'}
            />
            <Text style={{fontSize: 15, paddingLeft: 5}}>Type: </Text>
            <Chip
              mode={'outlined'}
              style={{marginLeft: 10, paddingHorizontal: 5}}>
              {disaster.type}
            </Chip>
          </View>
        );
      case 'locations':
        return (
          <List.Accordion
            title={'Locations'}
            expanded={true}
            left={() => (
              <List.Icon
                color={'#1DA1F2'}
                style={{margin: 0}}
                icon={'map-marker'}
              />
            )}>
            {Object.keys(disaster.bounds).map(location => {
              return (
                <List.Item
                  title={location}
                  style={styles.subHeadingItem}
                  titleStyle={{fontSize: 14}}
                  key={location}
                />
              );
            })}
          </List.Accordion>
        );
      case 'updates':
        return (
          <List.Accordion
            title={'Updates'}
            left={() => (
              <List.Icon
                color={'#1DA1F2'}
                icon={'update'}
                style={{margin: 0}}
              />
            )}>
            <FlatList
              style={styles.messageList}
              data={disaster.message}
              renderItem={renderMessage}
              keyExtractor={item => item.source + item.timestamp}
            />
          </List.Accordion>
        );
      case 'comment':
        return (
          <List.Accordion
            title="Comments"
            left={() => (
              <List.Icon
                color={'#1DA1F2'}
                icon={'comment'}
                style={{margin: 0}}
              />
            )}>
            <View
              style={{
                paddingLeft: 0,
                paddingTop: 0,
              }}>
              <Button
                labelStyle={{
                  color: 'white',
                  backgroundColor: 'rgba(29, 161, 242,0.9)',
                  padding: 10,
                  fontSize: 12,
                }}
                uppercase={false}
                onPress={() => {
                  setShowModal(true);
                }}>
                Comment
              </Button>
              <FlatList
                key="commentList"
                data={disaster.comment}
                renderItem={renderComment}
                keyExtractor={item => item.email + item.time}
              />
            </View>
          </List.Accordion>
        );
      case 'followup':
        return (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginVertical: 10,
            }}>
            <Text
              style={{flexGrow: 1, paddingLeft: 20, color: 'rgba(0,0,0,0.7)'}}>
              Receive future update
            </Text>
            <Switch
              value={followup}
              style={{marginRight: 10}}
              color={'rgba(29, 161, 242,0.9)'}
              onValueChange={value => {
                setFollowup(value);
                if (value) {
                  postFollowup(id);
                } else {
                  deleteFollowup(id);
                }
              }}
            />
          </View>
        );
      default:
        return <View></View>;
    }
  };

  const disasterProp = ['type', 'locations', 'updates', 'comment', 'followup'];

  const renderMessage = ({item}) => {
    return (
      <Card elevation={3} style={styles.messageContainer}>
        <Text style={{fontSize: 18}}>{item.source}</Text>
        <Text style={{fontSize: 8, marginBottom: 5}}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
        <Text>{item.message}</Text>
      </Card>
    );
  };

  const renderComment = ({item}) => {
    return (
      <Card elevation={3} style={styles.messageContainer}>
        <Text style={{fontSize: 18}}>{item.email}</Text>
        <Text style={{fontSize: 8, marginBottom: 5}}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
        <Text>{item.comment}</Text>
      </Card>
    );
  };

  useEffect(() => {
    getDisaster(id).then(json => {
      json.message.reverse();
      json.comment.reverse();
      setDisaster(json);
      setLoading(false);
    });
    getFollowup(id).then(res => {
      if (res.ok) setFollowup(true);
      else setFollowup(false);
    });
  }, []);

  if (loading) {
    return (
      <ActivityIndicator animating={true} size="large" style={styles.loading} />
    );
  } else {
    return [
      <FlatList
        data={disasterProp}
        renderItem={renderDisasterProp}
        keyExtractor={item => item}
        key="list"
      />,
      <Portal key="portal">
        <Modal
          visible={showModal}
          contentContainerStyle={styles.modal}
          onDismiss={() => setShowModal(false)}>
          <View style={styles.commentContainer}>
            <View style={styles.commentHeader}>
              <View style={{flexGrow: 1}}>
                <IconButton
                  icon={'close'}
                  onPress={() => {
                    setShowModal(false);
                  }}
                />
              </View>
              <Button
                style={{marginRight: 10}}
                mode={'contained'}
                color={'rgba(29, 161, 242,0.9)'}
                uppercase={false}
                labelStyle={{color: 'white', fontSize: 12}}
                onPress={() => {
                  if (newComment) {
                    // console.log(newComment);
                    postComment(id, newComment);
                    setShowModal(false);
                    getDisaster(id).then(json => {
                      json.message.reverse();
                      json.comment.reverse();
                      setDisaster(json);
                      setLoading(false);
                    });
                  }
                }}>
                Comment
              </Button>
            </View>
            <View style={styles.commentBody}>
              <View>
                <Ionicons
                  name="account-circle"
                  size={30}
                  color={'rgba(0,0,0,0.6)'}
                  style={{marginLeft: 10, paddingTop: 8}}
                />
              </View>
              <View style={{paddingLeft: 5, width: '85%'}}>
                <TextInput
                  placeholder="Share your comment"
                  multiline={true}
                  autoFocus={true}
                  onChangeText={text => setNewComment(text)}></TextInput>
              </View>
            </View>
          </View>
        </Modal>
      </Portal>,
    ];
  }
};

const styles = StyleSheet.create({
  loading: {height: '100%'},
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 9,
    marginTop: 10,
  },
  messageContainer: {
    paddingLeft: 30,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderColor: '#e6e6e6',
    marginVertical: 5,
    marginHorizontal: 10,
  },
  messageList: {
    maxHeight: 300,
    paddingLeft: 0,
  },
  subHeadingItem: {
    paddingLeft: 30,
  },
  modal: {
    backgroundColor: 'white',
    height: '80%',
    width: '90%',
    alignSelf: 'center',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentBody: {marginTop: 10, flexDirection: 'row'},
  commentContainer: {
    height: '100%',
    paddingTop: 5,
  },
});

export default Disaster;
