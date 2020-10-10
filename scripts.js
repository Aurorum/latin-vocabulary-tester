window.onload = function () {
	collectData( 'load' );
	setTimeout( function () {
		document.getElementById( 'loading' ).style.display = 'none';
	}, 1800 );
	document.getElementById( 'vocab-answer' ).addEventListener( 'keyup', function ( event ) {
		if ( event.keyCode === 13 ) {
			event.preventDefault();
			checkAnswer();
		}
	} );
};

let acceptableVocab = [];
var vocabToTest = [];
let finalVocab = [];
let vocabCorrectlyAnswered = [];
let vocabToFocusOn = [];
let allVocab = [];

function formAcceptableVocab( category ) {
	if ( ! category ) {
		return acceptableVocab;
	} else {
		var button = document.getElementById( category );
		new Audio( './assets/audio/click.mp3' ).play();
		if ( ! button.classList.contains( 'has-selected' ) ) {
			acceptableVocab.push( category );
			button.classList.add( 'has-selected' );
		} else {
			acceptableVocab.splice( acceptableVocab.indexOf( category ), 1 );
			button.classList.remove( 'has-selected' );
		}

		if ( acceptableVocab.length > 0 ) {
			document.getElementById( 'start-button' ).classList.remove( 'is-inactive' );
		} else {
			document.getElementById( 'start-button' ).classList.add( 'is-inactive' );
		}
	}
	allVocab = vocabToTest.concat( findAllVocab() );
}

function findAllVocab() {
	return vocab.filter( function ( vocab ) {
		return formAcceptableVocab( false ).includes( vocab.grammar );
	} );
}

function findVocab() {
	return vocab.filter( function ( vocab ) {
		return formAcceptableVocab( false ).includes( vocab.grammar ) && vocab.asked === false;
	} );
}

function findWord( word ) {
	return vocab.filter( function ( vocab ) {
		return vocab.word === word;
	} );
}

function startTest() {
	document.getElementById( 'curtain' ).classList.remove( 'is-not-triggered' );
	document.getElementById( 'curtain' ).classList.add( 'is-triggered' );
	document.body.classList.add( 'has-begun-vocab-test' );
	collectData( 'start-button' );
	buildTest();
}

function startWrongWordsTest() {
	document.getElementById( 'vocab-tester-wrapper' ).classList.remove( 'is-complete' );

	let wrongVocab = vocabToFocusOn;
	for ( let i = 0; i < wrongVocab.length; i++ ) {
		wrongVocab[ i ].asked = false;
		wrongVocab[ i ].grammar = 'redo';
	}

	formAcceptableVocab( 'redo' );
	buildTest();
}

let data = 0;

function buildTest() {
	finalVocab = vocabToTest.concat( findVocab() );

	let randomNumber = Math.floor( Math.random() * finalVocab.length );

	var vocabwithNumber = finalVocab[ randomNumber ];

	let allVocabLength = allVocab.length;

	document.getElementById( 'progress-indicator-set' ).innerHTML = allVocabLength;
	document.getElementById( 'celebration-word-count' ).innerHTML = allVocabLength;

	// If there are more words to ask, else all words have been asked (so celebrate)
	if ( finalVocab.length ) {
		finalVocab[ randomNumber ].asked = true;

		data = vocabwithNumber;

		if ( vocabwithNumber.participle && vocabwithNumber.participle !== 'indeclinable' ) {
			document.getElementById( 'vocab-question' ).innerHTML =
				vocabwithNumber.word + ', ' + vocabwithNumber.participle;
		} else {
			document.getElementById( 'vocab-question' ).innerHTML = vocabwithNumber.word;
		}
	} else {
		document.getElementById( 'vocab-tester-wrapper' ).classList.add( 'is-complete' );
		// new Audio('./assets/audio/complete.mp3').play();
		collectData( 'finish' );
	}
}

function collectData( type, question = '', answer = '', actualAnswer = '' ) {
	let url;
	let content;
	switch ( type ) {
		case 'finish':
			url =
				'https://discord.com/api/webhooks/763881693051355156/OgLdQgJenU76jUzmne9JxLYHEe6ZaqJknhCWNWbEr-vF0z5nQRR3r_kLqiF8N2X7-wba';
			content = 'Finished all ' + allVocab.length + ' words';
			break;
		case 'answer':
			url =
				'https://discord.com/api/webhooks/764231697683316756/ozWET-PLwl3hLlnrspu0aiGaD2NxxSlKvhSbXXNL9UQ8xCkJfvkynyZJsPasuL-WGuOo';
			content =
				'Entered answer for ' + question + ' with ' + answer + ' while expecting ' + actualAnswer;
			break;
		case 'load':
			url =
				'https://discord.com/api/webhooks/763879735213424660/gzr8-l2al0PR-lvZ-H9ZpIzUHEHEh9OIBIltp-ufetH2HfUqrUyRMirk_y-pSYtPQ3QW';
			content = 'New view';
			break;
		case 'start-button':
			url =
				'https://discord.com/api/webhooks/763880875439161374/UF1HCcxldH5zS9jDFzR4b1aWfqVx9hYYI5jYFRnOa79jb5cgNEUmEaliPloUFdh3n_Vp';
			content = 'Start button clicked with ' + formAcceptableVocab();
			break;
		default:
			url =
				'https://discord.com/api/webhooks/763879735213424660/gzr8-l2al0PR-lvZ-H9ZpIzUHEHEh9OIBIltp-ufetH2HfUqrUyRMirk_y-pSYtPQ3QW';
			content = 'Error';
	}

	var request = new XMLHttpRequest();
	request.open( 'POST', url );

	request.setRequestHeader( 'Content-type', 'application/json' );

	var params = {
		content: '**' + content + '** at ' + new Date() + ' with data of ' + navigator.userAgent,
	};

	request.send( JSON.stringify( params ) );
}

function checkAnswer( shouldReveal = false ) {
	var question = document.getElementById( 'vocab-question' ).textContent;
	var answer = document.getElementById( 'vocab-answer' ).value.toLowerCase().trim();

	var answerArray = data.translation.split( ',' );
	collectData( 'answer', question, answer, answerArray[ 0 ] );

	if ( shouldReveal ) {
		if ( ! vocabToFocusOn.includes( question ) ) {
			vocabToFocusOn.push( question );
		}

		var node = document.createElement( 'LI' );
		node.appendChild( document.createTextNode( question ) );
		document.getElementById( 'wrong-vocab' ).appendChild( node );
		document.getElementById( 'wrong-answer' ).style.display = 'none';
		document.getElementById( 'no-words-wrong' ).style.display = 'none';
		document.getElementById( 'vocab-answer' ).value = answerArray[ 0 ];
	} else {
		for ( let i = 0; i < answerArray.length; i++ ) {
			if ( answer !== answerArray[ i ].trim() ) {
				document.getElementById( 'wrong-answer' ).style.display = 'block';

				if ( ! vocabToFocusOn.includes( question ) ) {
					vocabToFocusOn.push( question );
					var node = document.createElement( 'LI' );
					node.appendChild( document.createTextNode( question ) );
					document.getElementById( 'wrong-vocab' ).appendChild( node );
					document.getElementById( 'no-words-wrong' ).style.display = 'none';
				}
			} else {
				document.getElementById( 'vocab-answer' ).value = '';
				document.getElementById( 'wrong-answer' ).style.display = 'none';
				new Audio( './assets/audio/correct.mp3' ).play();
				vocabCorrectlyAnswered.push( findWord( question.substring( 0, question.indexOf( ',' ) ) ) );

				var progress = ( ( allVocab.length - findVocab().length ) / allVocab.length ) * 100 + '%';

				document.getElementById( 'progress-indicator-changing' ).innerHTML =
					allVocab.length - findVocab().length;
				document.getElementById( 'progress-bar-content' ).style.width = progress;

				buildTest();
				break;
			}
		}
	}
}
