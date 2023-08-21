/**
 * @format
 */

import {AppRegistry} from 'react-native';
import BackgroundFetch from 'react-native-background-fetch';
import App from './App';
import {name as appName} from './app.json';
import backgroundTask from './src/background';

// Register the Headless task with the BackgroundFetch API

BackgroundFetch.configure(
  {
    minimumFetchInterval: 15,
    // forceAlarmManager: true,
    enableHeadless: true,
  },
  async taskId => {
    // <-- Event callback
    console.log('[BackgroundFetch] taskId: ', taskId);
    BackgroundFetch.finish(taskId);
  },
  async taskId => {
    // <-- Task timeout callback
    // This task has exceeded its allowed running-time.
    // You must stop what you're doing and immediately .finish(taskId)
    BackgroundFetch.finish(taskId);
  },
);

// Schedule a background fetch event
BackgroundFetch.scheduleTask({
  taskId: 'MyTaskName',
  minimumFetchInterval: 15,
  delay: 10000, // 15 minutes
  enableHeadless: true,
  stopOnTerminate: false,
  startOnBoot: true,
  //   forceAlarmManager: true,
  periodic: true,
  requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
});

BackgroundFetch.registerHeadlessTask(async taskData => {
  console.log('Headless task started with data:', taskData);

  // Your background code here
  console.log('Headless task completed');
  BackgroundFetch.finish(taskData.taskId);
});
// AppRegistry.registerHeadlessTask('MyTaskName', () => backgroundTask);
AppRegistry.registerComponent(appName, () => App);
