import React from 'react';

import {
  ListView,
  View,
  StyleSheet,
} from 'react-native';

import shallowequal from 'shallowequal';
import InvertibleScrollView from 'react-native-invertible-scroll-view';
import md5 from 'md5';
import LoadEarlier from './LoadEarlier';
import Message from './Message';

const styles = StyleSheet.create({
  containerView: {
    flex: 1,
    background: 'linear-gradient(0deg, rgba(0,0,0,0.75), rgba(0,0,0,0.1))',
    alignSelf: 'flex-end',
    width: '100%',
    marginBottom: 5,
    borderRadius: 20,
  }
});

export default class MessageContainer extends React.Component {
  constructor(props) {
    super(props);

    this.renderRow = this.renderRow.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
    this.renderLoadEarlier = this.renderLoadEarlier.bind(this);
    this.renderScrollComponent = this.renderScrollComponent.bind(this);
    this.offset = { x: 0, y: 0 };

    const dataSource = new ListView.DataSource({
      rowHasChanged: (r1, r2) => {
        return r1.hash !== r2.hash;
      },
    });

    const messagesData = this.prepareMessages(props.messages);
    this.state = {
      dataSource: dataSource.cloneWithRows(messagesData.blob, messagesData.keys),
    };
  }

  prepareMessages(messages) {
    this.messagesCount = messages.length;

    return {
      keys: messages.map((m) => m._id),
      blob: messages.reduce((o, m, i) => {
        const previousMessage = messages[i + 1] || {};
        const nextMessage = messages[i - 1] || {};
        // add next and previous messages to hash to ensure updates
        const toHash = JSON.stringify(m) + previousMessage._id + nextMessage._id;
        o[m._id] = {
          ...m,
          previousMessage,
          nextMessage,
          hash: md5(toHash),
        };
        return o;
      }, {})
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (!shallowequal(this.props, nextProps)) {
      return true;
    }
    if (!shallowequal(this.state, nextState)) {
      return true;
    }
    return false;
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.messages === nextProps.messages) {
      return;
    }
    const messagesData = this.prepareMessages(nextProps.messages);
    this.setState({
      dataSource: this.state.dataSource.cloneWithRows(messagesData.blob, messagesData.keys)
    });
  }

  renderFooter() {
    if (this.props.renderFooter) {
      const footerProps = {
        ...this.props,
      };
      return this.props.renderFooter(footerProps);
    }
    return null;
  }

  renderLoadEarlier() {
    if (this.props.loadEarlier === true) {
      const loadEarlierProps = {
        ...this.props,
      };
      if (this.props.renderLoadEarlier) {
        return this.props.renderLoadEarlier(loadEarlierProps);
      }
      return (
        <LoadEarlier {...loadEarlierProps}/>
      );
    }
    return null;
  }

  scrollTo(options) {
    this.listView.getScrollResponder().scrollTo(options);
  }

  renderRow(message, sectionId, rowId) {
    if (!message._id && message._id !== 0) {
      console.warn('GiftedChat: `_id` is missing for message', JSON.stringify(message));
    }
    if (!message.user) {
      console.warn('GiftedChat: `user` is missing for message', JSON.stringify(message));
      message.user = {};
    }

    const messageProps = {
      ...this.props,
      key: message._id,
      currentMessage: message,
      previousMessage: message.previousMessage,
      nextMessage: message.nextMessage,
      position: message.user._id === this.props.user._id ? 'right' : 'left',
    };

    if (this.props.renderMessage) {
      return this.props.renderMessage(messageProps);
    }
    return <Message {...messageProps}/>;
  }

  onScroll(e) {
    this.offset = e.nativeEvent.contentOffset;
  }

  onWheel(e) { // invert scroller
    this.listView.getScrollResponder().scrollTo({ x: 0, y: this.offset.y - e.nativeEvent.deltaY });
    e.preventDefault();
  }

  renderScrollComponent(props) {
    const invertibleScrollViewProps = this.props.invertibleScrollViewProps;
    return (
      <InvertibleScrollView
        {...props}
        {...invertibleScrollViewProps}
      />
    );
  }

  render() {
    return (
      <View ref='container'
        style={[styles.containerView,
          {
            padding: this.messagesCount > 0 ? 5 : 0,
            paddingTop: this.messagesCount > 0 ? 10 : 0,
            maxWidth: this.props.maxChatWidth,
          }]}
      >
        <ListView
          enableEmptySections
          initialListSize={20}
          pageSize={20}

          {...this.props.listViewProps}

          dataSource={this.state.dataSource}

          renderRow={this.renderRow}
          renderHeader={this.renderFooter}
          renderFooter={this.renderLoadEarlier}
          renderScrollComponent={this.renderScrollComponent}

          ref={(component) => this.listView = component}
          onScroll={(e) => this.onScroll(e)}
          onWheel={(e) => this.onWheel(e)}
        />
      </View>
    );
  }
}

MessageContainer.defaultProps = {
  messages: [],
  user: {},
  renderFooter: null,
  renderMessage: null,
  listViewProps: {},
  onLoadEarlier: () => {},
  maxChatWidth: 420,
};

MessageContainer.propTypes = {
  messages: React.PropTypes.array,
  user: React.PropTypes.object,
  renderFooter: React.PropTypes.func,
  renderMessage: React.PropTypes.func,
  onLoadEarlier: React.PropTypes.func,
  listViewProps: React.PropTypes.object,
  maxChatWidth: React.PropTypes.number,
};
