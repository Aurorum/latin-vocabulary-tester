const firebaseConfig = {
	apiKey: 'AIzaSyCewYnBcrpvyNZgoMJzYuADyyHItPECUwU',
	authDomain: 'latin-scrabble.firebaseapp.com',
	databaseURL: 'https://latin-scrabble-default-rtdb.europe-west1.firebasedatabase.app',
	projectId: 'latin-scrabble',
	storageBucket: 'latin-scrabble.firebasestorage.app',
	messagingSenderId: '291142740259',
	appId: '1:291142740259:web:82f72cfef4fa8787f60496',
	measurementId: 'G-GW0D6JVXZF',
};

firebase.initializeApp( firebaseConfig );

const db = firebase.database();
