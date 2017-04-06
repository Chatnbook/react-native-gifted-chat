import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import StylePropType from 'react-style-proptype';

export default class Actions extends React.Component {
  constructor(props) {
    super(props);
    this.onActionsPress = this.onActionsPress.bind(this);
  }

  onActionsPress() {
    //
  }

  renderIcon() {
    if (this.props.icon) {
      return this.props.icon();
    }
    return (
      <View
        style={[styles.wrapper, this.props.wrapperStyle]}
      >
        <Text
          style={[styles.iconText, this.props.iconTextStyle]}
        >
          +
        </Text>
      </View>
    );
  }

  render() {
    return (
      <TouchableOpacity
        style={[styles.container, this.props.containerStyle]}
        onPress={this.props.onPressActionButton || this.onActionsPress}
      >
        {this.renderIcon()}
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: 26,
    height: 26,
    marginLeft: 10,
    marginBottom: 10,
  },
  wrapper: {
    borderRadius: 13,
    borderColor: '#b2b2b2',
    borderWidth: 2,
    flex: 1,
  },
  iconText: {
    color: '#b2b2b2',
    fontWeight: 'bold',
    fontSize: 16,
    backgroundColor: 'transparent',
    textAlign: 'center',
  },
});

Actions.contextTypes = {
  //
};

Actions.defaultProps = {
  onSend: () => {},
  options: {},
  optionTintColor: '#007AFF',
  icon: null,
  containerStyle: {},
  iconTextStyle: {},
};

Actions.propTypes = {
  onSend: React.PropTypes.func,
  options: React.PropTypes.object,
  optionTintColor: React.PropTypes.string,
  icon: React.PropTypes.func,
  onPressActionButton: React.PropTypes.func,
  containerStyle: StylePropType,//View.propTypes.style,
  iconTextStyle: StylePropType,//Text.propTypes.style,
};
