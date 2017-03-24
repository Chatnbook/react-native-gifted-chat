import React from 'react';
import {
  Animated,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Image,
} from 'react-native';

import moment from 'moment/min/moment-with-locales.min';
import uuid from 'uuid';

import * as utils from './utils';
import Actions from './Actions';
import Avatar from './Avatar';
import Bubble from './Bubble';
import MessageImage from './MessageImage';
import MessageText from './MessageText';
import Composer from './Composer';
import Day from './Day';
import InputToolbar from './InputToolbar';
import LoadEarlier from './LoadEarlier';
import Message from './Message';
import MessageContainer from './MessageContainer';
import Send from './Send';
import Time from './Time';
import GiftedAvatar from './GiftedAvatar';

// Min and max heights of ToolbarInput and Composer
// Needed for Composer auto grow and ScrollView animation
// TODO move these values to Constants.js (also with used colors #b2b2b2)
const MIN_COMPOSER_HEIGHT = 33; // TODO: test
const MAX_COMPOSER_HEIGHT = 100;
const MIN_INPUT_TOOLBAR_HEIGHT = 44;

class GiftedChat extends React.Component {
  constructor(props) {
    super(props);

    // default values
    this._isMounted = false;
    this._bottomOffset = 0;
    this._maxHeight = null;
    this._isFirstLayout = true;
    this._locale = 'en';
    this._messages = [];

    this.state = {
      isInitialized: false, // initialization will calculate maxHeight before rendering the chat
      composerHeight: MIN_COMPOSER_HEIGHT,
      messagesContainerHeight: null,
      typingDisabled: false,
    };

    this.onSend = this.onSend.bind(this);
    this.getLocale = this.getLocale.bind(this);
    this.onInputSizeChanged = this.onInputSizeChanged.bind(this);
    this.onInputTextChanged = this.onInputTextChanged.bind(this);
    this.onMainViewLayout = this.onMainViewLayout.bind(this);
    this.onInitialLayoutViewLayout = this.onInitialLayoutViewLayout.bind(this);

    this.invertibleScrollViewProps = {
      inverted: true,
    };
  }

  static append(currentMessages = [], messages) {
    if (!Array.isArray(messages)) {
      messages = [messages];
    }
    return messages.concat(currentMessages);
  }

  static prepend(currentMessages = [], messages) {
    if (!Array.isArray(messages)) {
      messages = [messages];
    }
    return currentMessages.concat(messages);
  }

  getChildContext() {
    return {
      getLocale: this.getLocale,
    };
  }

  componentWillMount() {
    this.setIsMounted(true);
    this.initLocale();
    this.initMessages(this.props.messages);
  }

  componentWillUnmount() {
    this.setIsMounted(false);
  }

  componentWillReceiveProps(nextProps = {}) {
    //console.log('nextProps', nextProps);
    this.initMessages(nextProps.messages);
    this.setState({chatVisible: nextProps.chatVisible});
  }

  initLocale() {
    if (this.props.locale === null || moment.locales().indexOf(this.props.locale) === -1) {
      this.setLocale('en');
    } else {
      this.setLocale(this.props.locale);
    }
  }

  initMessages(messages = []) {
    this.setMessages(messages);
  }

  setLocale(locale) {
    this._locale = locale;
  }

  getLocale() {
    return this._locale;
  }

  setMessages(messages) {
    this._messages = messages;
  }

  getMessages() {
    return this._messages;
  }

  setMaxHeight(height) {
    this._maxHeight = height;
  }

  getMaxHeight() {
    return this._maxHeight;
  }

  setBottomOffset(value) {
    this._bottomOffset = value;
  }

  getBottomOffset() {
    return this._bottomOffset;
  }

  setIsFirstLayout(value) {
    this._isFirstLayout = value;
  }

  getIsFirstLayout() {
    return this._isFirstLayout;
  }

  setIsTypingDisabled(value) {
    this.setState({
      typingDisabled: value
    });
  }

  getIsTypingDisabled() {
    return this.state.typingDisabled;
  }

  setIsMounted(value) {
    this._isMounted = value;
  }

  getIsMounted() {
    return this._isMounted;
  }

  // TODO
  // setMinInputToolbarHeight
  getMinInputToolbarHeight() {
    if (this.props.renderAccessory) {
      return MIN_INPUT_TOOLBAR_HEIGHT * 2;
    }
    return MIN_INPUT_TOOLBAR_HEIGHT;
  }

  prepareMessagesContainerHeight(value) {
    if (this.props.isAnimated === true) {
      return new Animated.Value(value);
    }
    return value;
  }

  scrollToBottom(animated = true) {
    this._messageContainerRef.scrollTo({
      y: 0,
      animated,
    });
  }

  renderHideButton() {
    if (!this.state.chatVisible) {
      return null;
    }
    return (
      <TouchableOpacity
        style={styles.hideButton}
        onPress={() => this.props.onHideButtonPress()}
      >
        <Text style={styles.hideText}>
          {this.props.hideButtonTitle}
        </Text>
        <Image style={styles.hideImage} source={this.props.hideButtonImage} />
      </TouchableOpacity>
    );
  }

  renderMessages() {
    if (!this.state.chatVisible) {
      return null;
    }
    const AnimatedView = this.props.isAnimated === true ? Animated.View : View;
    return (
      <AnimatedView style={styles.animated}>
        <MessageContainer
          {...this.props}

          invertibleScrollViewProps={this.invertibleScrollViewProps}

          messages={this.getMessages()}

          ref={component => this._messageContainerRef = component}
        />
        {this.renderChatFooter()}
      </AnimatedView>
    );
  }

  onSend(messages = [], shouldResetInputToolbar = false) {
    if (!Array.isArray(messages)) {
      messages = [messages];
    }

    messages = messages.map((message) => {
      return {
        ...message,
        user: this.props.user,
        createdAt: new Date(),
        _id: this.props.messageIdGenerator(),
      };
    });

    if (shouldResetInputToolbar === true) {
      this.resetInputToolbar();
    }

    this.props.onSend(messages);
    this.scrollToBottom();
  }

  resetInputToolbar() {
    if (this.textInput) {
      this.textInput.clear();
    }
    this.setState({
      text: '',
      composerHeight: MIN_COMPOSER_HEIGHT,
      messagesContainerHeight: this.prepareMessagesContainerHeight(this.getMaxHeight() - this.getMinInputToolbarHeight() + this.props.bottomOffset),
    });
  }

  calculateInputToolbarHeight(newComposerHeight) {
    return newComposerHeight + (this.getMinInputToolbarHeight() - MIN_COMPOSER_HEIGHT);
  }

  onInputSizeChanged(size) {
    /*const newComposerHeight = Math.max(MIN_COMPOSER_HEIGHT, Math.min(MAX_COMPOSER_HEIGHT, size.height));
    const newMessagesContainerHeight = this.getMaxHeight() - this.calculateInputToolbarHeight(newComposerHeight) + this.getBottomOffset();
    this.setState({
      composerHeight: newComposerHeight,
      messagesContainerHeight: this.prepareMessagesContainerHeight(newMessagesContainerHeight),
    });*/
  }

  onInputTextChanged(text) {
    if (this.getIsTypingDisabled()) {
      return;
    }
    if (this.props.onInputTextChanged) {
      this.props.onInputTextChanged(text);
    }
    this.setState({text});
  }

  onInitialLayoutViewLayout(e) {
    const layout = e.nativeEvent.layout;
    if (layout.height <= 0) {
      return;
    }
    this.setMaxHeight(layout.height);

    this.setState({
      isInitialized: true,
      text: '',
      composerHeight: MIN_COMPOSER_HEIGHT,
      messagesContainerHeight: this.prepareMessagesContainerHeight(this.getMaxHeight() - this.getMinInputToolbarHeight()),
    });
  }

  onMainViewLayout(e) {
    if (this.getIsFirstLayout() === true) {
      this.setIsFirstLayout(false);
    }
  }

  renderInputToolbar() {
    const inputToolbarProps = {
      ...this.props,
      text: this.state.text,
      composerHeight: Math.max(MIN_COMPOSER_HEIGHT, this.state.composerHeight),
      onSend: this.onSend,
      onInputSizeChanged: this.onInputSizeChanged,
      onTextChanged: this.onInputTextChanged,
      textInputProps: {
        ...this.props.textInputProps,
        ref: textInput => this.textInput = textInput,
        maxLength: this.getIsTypingDisabled() ? 0 : null
      }
    };
    if (this.getIsTypingDisabled()) {
      inputToolbarProps.textInputProps.maxLength = 0;
    }
    if (this.props.renderInputToolbar) {
      return this.props.renderInputToolbar(inputToolbarProps);
    }
    return (
      <InputToolbar
        {...inputToolbarProps}
      />
    );
  }

  renderChatFooter() {
    if (this.props.renderChatFooter) {
      const footerProps = {
        ...this.props,
      };
      return this.props.renderChatFooter(footerProps);
    }
    return null;
  }

  renderLoading() {
    if (this.props.renderLoading) {
      return this.props.renderLoading();
    }
    return null;
  }

  render() {
    if (this.state.isInitialized === true) {
      return (
        <View style={styles.container} onLayout={this.onMainViewLayout}>
          {this.renderHideButton()}
          {this.renderMessages()}
          {this.renderInputToolbar()}
        </View>
      );
    }
    return (
      <View style={styles.container} onLayout={this.onInitialLayoutViewLayout}>
        {this.renderLoading()}
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    paddingTop: 20,
    // maxHeight: '484px',
    // height: '60vh',
  },
  animated: {
    flex: 1,
    overflow: 'hidden',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    maxHeight: '440px',
    // height: 'calc(60vh - 44px)',
    // marginBottom: '70px',
  },
  hideButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignSelf: 'flex-end',
    height: 30,
    marginBottom: 5,
    borderRadius: 16,
    color: '#fff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hideText: {
    fontSize: 13,
    margin: 'auto',
    marginLeft: 10,
  },
  hideImage: {
    margin: 10,
    marginTop: 11,
    width: 15,
    height: 10,
    resizeMode: 'contain',
  },
});

GiftedChat.childContextTypes = {
  getLocale: React.PropTypes.func,
};

GiftedChat.defaultProps = {
  messages: [],
  onSend: () => {
  },
  loadEarlier: false,
  onLoadEarlier: () => {
  },
  locale: null,
  isAnimated: false, // TODO: test
  renderAccessory: null,
  renderActions: null,
  renderAvatar: null,
  renderBubble: null,
  renderFooter: null,
  renderChatFooter: null,
  renderMessageText: null,
  renderMessageImage: null,
  renderComposer: null,
  renderCustomView: null,
  renderDay: null,
  renderInputToolbar: null,
  renderLoadEarlier: null,
  renderLoading: null,
  renderMessage: null,
  renderSend: null,
  renderTime: null,
  user: {},
  bottomOffset: 0,
  isLoadingEarlier: false,
  messageIdGenerator: () => uuid.v4(),
  chatVisible: false,
  hideButtonTitle: 'Hide chat',
  hideButtonImage: null,
  onHideButtonPress: () => {},
};

GiftedChat.propTypes = {
  messages: React.PropTypes.array,
  onSend: React.PropTypes.func,
  onInputTextChanged: React.PropTypes.func,
  loadEarlier: React.PropTypes.bool,
  onLoadEarlier: React.PropTypes.func,
  locale: React.PropTypes.string,
  isAnimated: React.PropTypes.bool,
  renderAccessory: React.PropTypes.func,
  renderActions: React.PropTypes.func,
  renderAvatar: React.PropTypes.func,
  renderBubble: React.PropTypes.func,
  renderFooter: React.PropTypes.func,
  renderChatFooter: React.PropTypes.func,
  renderMessageText: React.PropTypes.func,
  renderMessageImage: React.PropTypes.func,
  renderComposer: React.PropTypes.func,
  renderCustomView: React.PropTypes.func,
  renderDay: React.PropTypes.func,
  renderInputToolbar: React.PropTypes.func,
  renderLoadEarlier: React.PropTypes.func,
  renderLoading: React.PropTypes.func,
  renderMessage: React.PropTypes.func,
  renderSend: React.PropTypes.func,
  renderTime: React.PropTypes.func,
  user: React.PropTypes.object,
  bottomOffset: React.PropTypes.number,
  isLoadingEarlier: React.PropTypes.bool,
  messageIdGenerator: React.PropTypes.func,
  chatVisible: React.PropTypes.bool,
  hideButtonTitle: React.PropTypes.string,
  hideButtonImage: React.PropTypes.any,
  onHideButtonPress: React.PropTypes.func,
};

export {
  GiftedChat,
  Actions,
  Avatar,
  Bubble,
  MessageImage,
  MessageText,
  Composer,
  Day,
  InputToolbar,
  LoadEarlier,
  Message,
  Send,
  Time,
  GiftedAvatar,
  utils
};
