import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import StylePropType from 'react-style-proptype';

export default class MessageText extends React.Component {
  render() {
    return (
      <View style={[styles[this.props.position].container, this.props.containerStyle[this.props.position]]}>
        <Text
          style={[styles[this.props.position].text, this.props.textStyle[this.props.position]]}>
          {this.props.currentMessage.text}
        </Text>
      </View>
    );
  }
}

const textStyle = {
  fontSize: 16,
  lineHeight: 20,
  marginTop: 5,
  marginBottom: 5,
  marginLeft: 10,
  marginRight: 10,
};

const styles = {
  left: StyleSheet.create({
    container: {
    },
    text: {
      color: 'black',
      ...textStyle,
    },
    link: {
      color: 'black',
      textDecorationLine: 'underline',
    },
  }),
  right: StyleSheet.create({
    container: {
    },
    text: {
      color: 'white',
      ...textStyle,
    },
    link: {
      color: 'white',
      textDecorationLine: 'underline',
    },
  }),
};

MessageText.contextTypes = {
  //
};

MessageText.defaultProps = {
  position: 'left',
  currentMessage: {
    text: '',
  },
  containerStyle: {},
  textStyle: {},
  linkStyle: {},
};

MessageText.propTypes = {
  position: React.PropTypes.oneOf(['left', 'right']),
  currentMessage: React.PropTypes.object,
  containerStyle: React.PropTypes.shape({
    left: StylePropType,//View.propTypes.style,
    right: StylePropType,//View.propTypes.style,
  }),
  textStyle: React.PropTypes.shape({
    left: StylePropType,//Text.propTypes.style,
    right: StylePropType,//Text.propTypes.style,
  }),
  linkStyle: React.PropTypes.shape({
    left: StylePropType,//Text.propTypes.style,
    right: StylePropType,//Text.propTypes.style,
  }),
};
