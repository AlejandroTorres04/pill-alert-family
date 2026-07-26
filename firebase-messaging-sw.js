importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAeL4sIuuixcziq49OrDKEA0P4WmTOdOYE",
  authDomain: "pill-alert-family.firebaseapp.com",
  projectId: "pill-alert-family",
  storageBucket: "pill-alert-family.firebasestorage.app",
  messagingSenderId: "310888753519",
  appId: "1:310888753519:web:61c0f57be4b0e32dfa609a"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'Pill Alert Family';
  const options = {
    body: (payload.notification && payload.notification.body) || '',
    icon: 'icon-192.png'
  };
  self.registration.showNotification(title, options);
});
