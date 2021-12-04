import React from 'react';
import {View, StyleSheet, FlatList} from 'react-native';
import {Chip} from 'react-native-paper';
import DropDownPicker from 'react-native-dropdown-picker';
import {useTheme} from '@react-navigation/native';

const ItemPicker = ({items, setItems, options}) => {
  const {colors} = useTheme();

  const renderItem = item => {
    return (
      <View style={styles.chipContainer}>
        <Chip
          children={item.item}
          style={styles.chip}
          mode="outlined"
          selectedColor={colors.primary}
          selected={true}
          onClose={() => {
            setItems(items.filter(i => i !== item.item));
          }}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <DropDownPicker
        items={options}
        searchable={true}
        placeholder="Add your selections"
        searchablePlaceholder="search"
        containerStyle={styles.dropdown}
        dropDownMaxHeight={250}
        itemStyle={{
          justifyContent: 'flex-start',
        }}
        onChangeItem={item => {
          if (!items.includes(item.value)) setItems([...items, item.value]);
        }}
      />
      <View style={styles.flatlistContainer}>
        <FlatList
          data={items}
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
  dropdown: {
    height: 40,
    marginTop: 20,
  },
  chipContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  chip: {
    paddingHorizontal: 10,
    marginHorizontal: 10,
    marginVertical: 5,
  },
  flatlistContainer: {marginTop: 20, flex: 1, marginBottom: 10},
});

export default ItemPicker;
