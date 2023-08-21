import {
  View,
  Text,
  Image,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Linking,
  NativeModules,
  Button,
} from 'react-native';
import React, {useState, useCallback, useEffect} from 'react';
import {GiftedChat, Bubble} from 'react-native-gifted-chat';
import {launchImageLibrary} from 'react-native-image-picker';
import Video from 'react-native-video';
import VideoPlayer from 'react-native-video-controls';
import * as DocumentPicker from 'react-native-document-picker';
import FileViewer from 'react-native-file-viewer';
import BackgroundFetch from 'react-native-background-fetch';
import {
  StripeProvider,
  useStripe,
  CardField,
} from '@stripe/stripe-react-native';

const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAttachImage, setIsAttachImage] = useState(false);
  const [isAttachFile, setIsAttachFile] = useState(false);
  const [imagePath, setImagePath] = useState('');
  const [filePath, setFilePath] = useState('');
  const {ReactOneCustomMethod} = NativeModules;

  const initBackgroundFetch = async () => {
    await BackgroundFetch.configure(
      {
        minimumFetchInterval: 15, // Fetch interval in minutes
        forceAlarmManager: true, // Required for Android 8+
        stopOnTerminate: false, // Continue background task even if app is closed
        startOnBoot: true, // Start background task when device boots
        enableHeadless: true, // Run task in the background without UI
        delay: 10000,
      },
      async () => {
        console.log('Background fetch event fired');
        // Your code here to perform a background task
        BackgroundFetch.finish(); // Call this when your task is complete
      },
      error => {
        console.log('Background fetch failed to start', error);
      },
    );
  };

  useEffect(() => {
    // initBackgroundFetch();

    const getId = () => {
      ReactOneCustomMethod.getPhoneID()
        .then((res: string) => {
          console.log(res);
        })
        .catch((err: any) => {
          console.error(err);
        });
    };
    getId();
    setMessages([
      {
        _id: 1,
        text: 'Hello developer',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'React Native',
          avatar: 'https://placeimg.com/140/140/any',
        },
        file: {
          url: 'file:///data/user/0/com.intialapp/files/f6f02bcc-2ec6-482c-bc60-6d9d509407dc/data.pdf',
        },
        // image:
        //   'file:///data/user/0/com.intialapp/files/4024a031-a563-4fa7-ac09-dff399fd0d29/IMG_20230331_132505.jpg',
        // video:
        //   "'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'",
      },
    ]);
  }, []);

  const transformSingleMessage = message => {
    if (message) {
      let transformedMessage = {
        _id: message.id,
        createdAt: new Date(message.sentAt * 1000),
        user: {
          _id: message.sender.uid,
          name: message.sender.name,
          avatar: message.sender.avatar,
        },
      };
      if (message.text) {
        transformedMessage.text = message.text;
      }
      if (message.data && message.data.url) {
        if (message.type && message.type === 'video') {
          transformedMessage.video = message.data.url;
        } else {
          transformedMessage.image = message.data.url;
        }
      }
      return transformedMessage;
    }
    return message;
  };

  const getFileName = (fileName, type) => {
    if (Platform.OS === 'android' && type === 'photo') {
      return 'Camera_001.jpeg';
    } else if (Platform.OS === 'android' && type.includes('video')) {
      return 'Camera_001.mov';
    }
    return fileName;
  };

  const handleSelectFile = () => {
    const options = {
      mediaType: 'mixed',
    };
    launchImageLibrary(options, response => {
      if (response.didCancel) {
        return null;
      } else if (response.assets && response.assets.length !== 0) {
        const uri = response.assets[0].uri;
        const fileName = response.assets[0].fileName;
        const type = response.assets[0].type;
        if (uri && fileName) {
          const file = {
            name: getFileName(fileName, type),
            uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
            type: type || 'video/quicktime',
          };
          console.log(file);
          setSelectedFile(() => file);
          setChatText(file.name);
        }
      }
    });
  };

  const getSource = message => {
    if (message && message.currentMessage) {
      return message.currentMessage.audio
        ? message.currentMessage.audio
        : message.currentMessage.video
        ? message.currentMessage.video
        : null;
    }
    return null;
  };

  const renderVideo = message => {
    const source = getSource(message);
    console.log('source', source);
    if (source) {
      return (
        <View style={styles.videoContainer} key={message.currentMessage._id}>
          {Platform.OS === 'ios' ? (
            <Video
              style={styles.videoElement}
              shouldPlay
              height={156}
              width={242}
              muted={true}
              source={{uri: source}}
              allowsExternalPlayback={false}></Video>
          ) : (
            <VideoPlayer
              style={styles.videoElement}
              disableVolume
              disableSeekbar
              disableTimer
              disableBack
              tapAnywhereToPause={true}
              source={{
                uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
              }}
            />
          )}
        </View>
      );
    }
    return <></>;
  };

  const renderActions = () => {
    return (
      <View style={{flexDirection: 'row', paddingBottom: 12}}>
        <TouchableOpacity onPress={_pickDocument}>
          <Image
            source={require('./src/assets/add.png')}
            style={{width: 24, height: 24}}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const _pickDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'documentDirectory',
        mode: 'import',
        allowMultiSelection: true,
      });
      const fileUri = result[0].fileCopyUri;
      if (!fileUri) {
        console.log('File URI is undefined or null');
        return;
      }
      if (fileUri.indexOf('.png') !== -1 || fileUri.indexOf('.jpg') !== -1) {
        setImagePath(fileUri);
        setIsAttachImage(true);
        setChatText('Image');
      } else {
        setFilePath(fileUri);
        setIsAttachFile(true);
        setChatText('File');
      }
      console.log('file', fileUri);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled file picker');
      } else {
        console.log('DocumentPicker err => ', err);
        throw err;
      }
    }
  };

  const InChatFileTransfer = ({filePath}) => {
    var fileType = '';
    var name = '';
    if (filePath !== undefined) {
      name = filePath.split('/').pop();
      fileType = filePath.split('.').pop();
    }
    return (
      <View style={styles.container}>
        <View style={styles.frame}>
          {/* <Image
              source={
                fileType === 'pdf'
                  ? require('../assests/chat_file.png')
                  : require('../assests/unknowFile.png')
              }
              style={{height: 60, width: 60}}
            /> */}
          <View>
            <Text style={styles.text}>
              {name.replace('%20', '').replace(' ', '')}
            </Text>
            <Text style={styles.textType}>{fileType.toUpperCase()}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderBubble = props => {
    const {currentMessage} = props;
    if (currentMessage.file && currentMessage.file.url) {
      // console.log('Bubble', currentMessage);
      return (
        <TouchableOpacity
          onPress={() => {
            const path = FileViewer.open(currentMessage?.file.url, {
              showOpenWithDialog: true,
            }) // absolute-path-to-my-local-file.
              .then(() => {
                // success
              })
              .catch(error => {
                // error
              });
          }}
          style={{
            // ...styles.fileContainer,
            backgroundColor:
              props.currentMessage.user._id === 1 ? '#2e64e5' : '#efefef',
            borderBottomLeftRadius:
              props.currentMessage.user._id === 1 ? 15 : 5,
            borderBottomRightRadius:
              props.currentMessage.user._id === 1 ? 5 : 15,
          }}>
          <InChatFileTransfer
            style={{marginTop: -10}}
            filePath={currentMessage.file.url}
          />
          <View style={{flexDirection: 'column'}}>
            <Text
              style={{
                // ...styles.fileText,
                color: currentMessage.user._id === 1 ? 'white' : 'black',
              }}>
              {currentMessage.text}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#2e64e5',
          },
        }}
        textStyle={{
          right: {
            color: '#efefef',
          },
        }}
      />
    );
  };

  const onSend = useCallback((messages = []) => {
    // const video = selectedFile?.uri;
    // const videoMess = video ? [{...messages[0], video}] : messages;
    const file = {url: filePath};
    const fileMess = filePath ? [{...messages[0], file}] : messages;
    console.log('message', messages);
    // console.log('video', video);

    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, fileMess),
    );
    setChatText(null);
  }, []);
  return (
    <GiftedChat
      messages={messages}
      text={chatText}
      onInputTextChanged={value => setChatText(value)}
      onSend={messages => onSend(messages)}
      user={{
        _id: 1,
      }}
      renderActions={renderActions}
      renderMessageVideo={renderVideo}
      renderBubble={renderBubble}
      alwaysShowSend
      // renderCustomView= {(props)=> }
    />
  );
};

const PaymentScreen = () => {
  const {confirmPayment, initPaymentSheet} = useStripe();
  const [cardDetails, setCardDetails] = useState(null);

  const fetchPaymentSheetParams = async (data: any) => {
    try {
      const response = await fetch(
        `http://192.168.0.155:5000/payment/payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        },
      );
      const {paymentIntentSecret, ephemeralKey, customer} =
        await response.json();

      return {
        paymentIntentSecret,
        ephemeralKey,
        customer,
      };
    } catch (error) {
      console.log(error);
    }
  };

  const handlePayment = async () => {
    if (!cardDetails) {
      return; // Handle validation or show an error message
    }
    console.log(cardDetails);

    const billingDetails= {
      email: 'vishal@pizoneinfotech.com',
      name: 'Vishal Nirania',
      address: {
        city: 'GangaNagar',
        country: 'US',
        line1: 'dsfsdfs',
        line2: 'fdfdfdf',
        postal_code: '335001',
        state: 'Rajasthan'
      }
    }

    const intent: any = await fetchPaymentSheetParams({
      amount: 1000,
      currency: 'usd',
      billingDetails
    });
    console.log('intent', intent);

    // const {error, paymentOption} = await initPaymentSheet({
    //   merchantDisplayName: 'Example Inc.',
    //   customerId: intent.customer,
    //   paymentIntentClientSecret: intent.paymentIntentSecret,
    //   customerEphemeralKeySecret: intent.ephemeralKey,
    //   allowsDelayedPaymentMethods: true,
    // });

    const {error, paymentIntent} = await confirmPayment(
      intent.paymentIntentSecret,
      {
        paymentMethodType: 'Card',
        // paymentMethodData: {
        //   billingDetails: {
        //     email: 'vishal.nirania@pizoneinfotech.com',
        //     name: 'vishal',
        //     address: {
        //       city: 'abohar',
        //       country: 'US',
        //       line1: 'dsfsdfs',
        //       line2: 'fdfdfdf',
        //       postalCode: '152128',
        //       state: 'Punjab'
        //     }
        //   },
        // },
      },
    );

    if (error) {
      console.log('Payment failed init:', error.message);
    }
    console.log('payment option', paymentIntent);
    
    // const presentSheet = await presentPaymentSheet();

    // console.log('presentSheet', presentSheet);

    // if (presentSheet.error) {
    //   console.log('Payment failed:', presentSheet.error);
    // }

    // console.log('Payment successful:', presentSheet.paymentOption);
  };
  return (
    <View>
      <CardField
        postalCodeEnabled={false}
        placeholders={{
          number: '4242 4242 4242 4242',
        }}
        cardStyle={{
          backgroundColor: '#FFFFFF',
          textColor: '#000000',
        }}
        style={{
          width: '100%',
          height: 50,
          marginVertical: 10,
        }}
        onCardChange={cardDetails => setCardDetails(cardDetails)}
      />
      <Button title="Pay" onPress={handlePayment} />
    </View>
  );
};

const App = () => {
  return (
    <StripeProvider
      publishableKey={
        'pk_test_51N8c3wSG7Npdq0tNr6kZ2Dn7b26NMW15Rx22PBrHaqzGzZmjbQRT2tHOz1ECoIKx6Ns2ydaqnM7mORqeB39RKGzO000RTkkueN'
      }
      // merchantIdentifier="merchant.identifier" // required for Apple Pay
      // urlScheme="your-url-scheme" // required for 3D Secure and bank redirects
    >
      <PaymentScreen />
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  select: {
    paddingLeft: 8,
  },
  videoContainer: {
    position: 'relative',
    height: 156,
    width: 250,
  },
  videoElement: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 150,
    width: 242,
    borderRadius: 20,
    margin: 4,
  },
  chatHeaderTitleContainer: {
    flexDirection: 'row',
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatHeaderStatus: {
    textTransform: 'capitalize',
  },
  container: {
    flex: 1,
    marginTop: 5,
    borderRadius: 15,
    padding: 5,
  },
  text: {
    color: 'black',
    marginTop: 10,
    fontSize: 16,
    lineHeight: 20,
    marginLeft: 5,
    marginRight: 5,
  },
  textType: {
    color: 'black',
    marginTop: 5,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  frame: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    borderRadius: 10,
    padding: 5,
    marginTop: -4,
  },
});

export default App;
