window.onload = function () {
	if ( ! localStorage.getItem( 'userID' ) ) {
		localStorage.setItem( 'userID', Math.floor( Math.random() * 9999999 ) + 1 );
	}
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

// Definitions
let acceptableVocab = [];
let vocabToTest = [];
let finalVocab = [];
let vocabCorrectlyAnswered = [];
let vocabToFocusOn = [];
let allVocab = [];
let vocabRetestCorrectAnswerCount = 0;
let mute = false;
let hardDifficulty = false;
let isTestingParticipleParts = false;
let data = 0;

function startTest() {
	document.getElementById( 'curtain' ).classList.remove( 'is-not-triggered' );
	document.getElementById( 'curtain' ).classList.add( 'is-triggered' );
	document.body.classList.add( 'has-begun-vocab-test' );
	collectData( 'start-button' );
	hardDifficulty = true;
	buildTest();
}

function buildTest() {
	finalVocab = vocabToTest.concat( findVocab() );

	if (
		! document.getElementById( 'extremeCheckbox' ).checked &&
		document.getElementById( 'hardCheckbox' ).checked
	) {
		hardDifficulty = Math.floor( Math.random() * 2 ) === 1;
	} else {
		hardDifficulty = document.getElementById( 'hardCheckbox' ).checked;
	}

	let randomNumber = Math.floor( Math.random() * finalVocab.length );

	var vocabwithNumber = finalVocab[ randomNumber ];

	let allVocabLength = allVocab.length;

	if ( acceptableVocab.includes( 'redo' ) ) {
		allVocabLength = document.getElementById( 'wrong-vocab' ).childElementCount - 1;
	}

	document.getElementById( 'progress-indicator-set' ).innerHTML = allVocabLength;
	document.getElementById( 'celebration-word-count' ).innerHTML = allVocabLength;

	// If there are more words to ask, else all words have been asked (so celebrate)
	if ( finalVocab.length ) {
		finalVocab[ randomNumber ].asked = true;

		data = vocabwithNumber;

		document.getElementById( 'vocab-question' ).innerHTML = vocabwithNumber.word;

		console.log( data.word.split( ',' ) );

		console.log( hardDifficulty && data.word.split( ',' ).length > 2 );
		let wordForm;
		if ( hardDifficulty ) {
			document.getElementById( 'vocab-question' ).innerHTML = vocabwithNumber.translation;
		}

		var verbsWithParticiples = [
			'verb 1',
			'verb 2',
			'verb 3',
			'verb 1 dep',
			'verb 2 dep',
			'verb 3 dep',
			'verb irreg',
		];
		var nounsWithCases = [ 'noun 1', 'noun 2', 'noun 3', 'noun 4', 'noun 5' ];
		if ( hardDifficulty ) {
			if (
				verbsWithParticiples.includes( vocabwithNumber.category ) &&
				data.word.split( ',' ).length > 2
			) {
				switch ( Math.floor( Math.random() * 3 ) ) {
					case 0:
						wordForm = '1st person present (first)';
						break;
					case 1:
						wordForm = 'present infinitive (second)';
						break;
					case 2:
						wordForm = '1st person perfect (third)';
						break;
				}
				isTestingParticipleParts = true;
			} else if (
				nounsWithCases.includes( vocabwithNumber.category ) &&
				data.word.split( ',' ).length > 1
			) {
				switch ( Math.floor( Math.random() * 2 ) ) {
					case 0:
						wordForm = 'nominative singular (first)';
						break;
					case 1:
						wordForm = 'genitive singular (second)';
						break;
				}
				isTestingParticipleParts = true;
			} else {
				wordForm = 'root meaning';
				isTestingParticipleParts = false;
			}
		} else {
			isTestingParticipleParts = false;
			wordForm = 'root meaning';
		}

		document.getElementById( 'vocab-submit-word-form' ).innerHTML = wordForm + ' form';
	} else {
		document.getElementById( 'vocab-tester-wrapper' ).classList.add( 'is-complete' );
		if ( ! mute ) {
			new Audio( './assets/audio/complete.mp3' ).play();
		}

		if ( document.getElementById( 'wrong-vocab' ).childElementCount > 1 ) {
			document.getElementById( 'retry-test-button' ).classList.remove( 'is-inactive' );
			document.getElementById( 'retry-test-prompt' ).classList.remove( 'is-inactive' );
		}

		collectData( 'finish' );
	}
}

function checkAnswer( shouldReveal = false ) {
	var question = document.getElementById( 'vocab-question' ).textContent;
	var answer = document.getElementById( 'vocab-answer' ).value.toLowerCase().trim();
	var form = document.getElementById( 'vocab-submit-word-form' ).textContent;
	var answerInput = document.getElementById( 'vocab-answer' );

	console.log( hardDifficulty );

	let isAnswerCorrect = false;
	console.log( data );

	if ( hardDifficulty ) {
		var questionArray = findTranslation( question )[ 0 ];
		var answerArray = data.word.split( ',' );
	} else {
		var questionArray = findWord( question )[ 0 ];
		var answerArray = data.translation.split( ',' );
	}

	console.log( questionArray );
	console.log( answerArray );

	collectData( 'answer', question, answer, answerArray[ 0 ] );

	if ( shouldReveal ) {
		if ( ! vocabToFocusOn.includes( questionArray.word ) ) {
			vocabToFocusOn.push( questionArray.word );

			var node = document.createElement( 'LI' );
			node.appendChild( document.createTextNode( question ) );
			document.getElementById( 'wrong-vocab' ).appendChild( node );
		}
		document.getElementById( 'wrong-answer' ).style.display = 'none';
		document.getElementById( 'no-words-wrong' ).style.display = 'none';

		if ( ! isTestingParticipleParts ) {
			answerInput.value = answerArray[ 0 ];
		} else {
			if ( form.includes( 'first' ) ) {
				answerInput.value = answerArray[ 0 ].trim();
			} else if ( form.includes( 'second' ) ) {
				answerInput.value = answerArray[ 1 ].trim();
			} else if ( form.includes( 'third' ) ) {
				answerInput.value = answerArray[ 2 ].trim();
			}
		}
	} else {
		if ( ! isTestingParticipleParts ) {
			for ( let i = 0; i < answerArray.length; i++ ) {
				if ( answer !== answerArray[ i ].trim() ) {
					isAnswerCorrect = false;
				} else {
					isAnswerCorrect = true;
					break;
				}
			}
		} else {
			if ( form.includes( 'first' ) ) {
				isAnswerCorrect = answer === answerArray[ 0 ].trim();
			} else if ( form.includes( 'second' ) ) {
				isAnswerCorrect = answer === answerArray[ 1 ].trim();
			} else if ( form.includes( 'third' ) ) {
				isAnswerCorrect = answer === answerArray[ 2 ].trim();
			}
		}

		if ( ! isAnswerCorrect ) {
			document.getElementById( 'wrong-answer' ).style.display = 'block';
			if ( ! mute ) {
				new Audio( './assets/audio/wrong.mp3' ).play();
			}
			if ( ! vocabToFocusOn.includes( questionArray.word ) ) {
				vocabToFocusOn.push( questionArray.word );
				var node = document.createElement( 'LI' );
				node.appendChild( document.createTextNode( question ) );
				document.getElementById( 'wrong-vocab' ).appendChild( node );
				document.getElementById( 'no-words-wrong' ).style.display = 'none';
			}
		} else {
			document.getElementById( 'vocab-answer' ).value = '';
			document.getElementById( 'wrong-answer' ).style.display = 'none';
			if ( ! mute ) {
				new Audio( './assets/audio/correct.mp3' ).play();
			}
			vocabCorrectlyAnswered.push( questionArray );

			let progress = ( allVocab.length - findVocab().length ) / allVocab.length;

			document.getElementById( 'progress-indicator-changing' ).innerHTML =
				allVocab.length - findVocab().length;

			if ( acceptableVocab.includes( 'redo' ) ) {
				vocabRetestCorrectAnswerCount++;
				progress = vocabRetestCorrectAnswerCount / allVocab.length;
				document.getElementById(
					'progress-indicator-changing'
				).innerHTML = vocabRetestCorrectAnswerCount;
			}

			document.getElementById( 'progress-bar-content' ).style.width = progress * 100 + '%';
			buildTest();
		}
	}
}

function startRetryTest() {
	document.getElementById( 'progress-bar-content' ).style.width = 0;

	for ( let i = 0; i < vocabToFocusOn.length; i++ ) {
		let wordArray = findWord( vocabToFocusOn[ i ] )[ 0 ];
		wordArray.asked = false;
		wordArray.category = 'redo';
	}

	let vocabRetestCorrectAnswerCount = 0;
	document.getElementById(
		'progress-indicator-changing'
	).innerHTML = vocabRetestCorrectAnswerCount;

	formAcceptableVocab( 'redo' );
	buildTest();
	collectData( 'start-button-retest' );

	document.getElementById( 'vocab-tester-wrapper' ).classList.remove( 'is-complete' );
}

function findAllVocab() {
	return vocab.filter( function ( vocab ) {
		return formAcceptableVocab( false ).includes( vocab.category );
	} );
}

function findVocab() {
	return vocab.filter( function ( vocab ) {
		return formAcceptableVocab( false ).includes( vocab.category ) && vocab.asked === false;
	} );
}

function findWord( word ) {
	return vocab.filter( function ( vocab ) {
		return vocab.word === word;
	} );
}

function findTranslation( translation ) {
	return vocab.filter( function ( vocab ) {
		return vocab.translation === translation;
	} );
}

function formAcceptableVocab( category ) {
	if ( ! category ) {
		return acceptableVocab;
	} else {
		if ( category !== 'redo' ) {
			var button = document.getElementById( category );
			if ( ! mute ) {
				new Audio( './assets/audio/click.mp3' ).play();
			}
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
		} else {
			acceptableVocab.push( category );
		}
	}
	allVocab = vocabToTest.concat( findAllVocab() );
}

function collectData( type, question = '', answer = '', actualAnswer = '' ) {
	var userId = localStorage.getItem( 'userID' );

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
			content = 'New view with data of ' + navigator.userAgent;
			break;
		case 'start-button':
			url =
				'https://discord.com/api/webhooks/763880875439161374/UF1HCcxldH5zS9jDFzR4b1aWfqVx9hYYI5jYFRnOa79jb5cgNEUmEaliPloUFdh3n_Vp';
			content =
				'Start button clicked with ' +
				formAcceptableVocab() +
				' with Hard set to ' +
				document.getElementById( 'hardCheckbox' ).checked +
				' and Extreme set to ' +
				document.getElementById( 'extremeCheckbox' ).checked;
			break;
		case 'start-button-retest':
			url =
				'https://discord.com/api/webhooks/763880875439161374/UF1HCcxldH5zS9jDFzR4b1aWfqVx9hYYI5jYFRnOa79jb5cgNEUmEaliPloUFdh3n_Vp';
			content = 'Retest button clicked for ' + allVocab.length + ' words';
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
		content: '**' + content + '** at ' + new Date() + ' (User ID: **' + userId + '**)',
	};

	request.send( JSON.stringify( params ) );
}

function muteAudio() {
	var muteAudioLink = document.getElementById( 'mute-audio' );

	if ( muteAudioLink.textContent.includes( 'Unmute' ) ) {
		muteAudioLink.textContent = 'Mute sound effects';
		mute = false;
	} else {
		muteAudioLink.textContent = 'Unmute sound effects';
		mute = true;
	}
}

function changeDifficulty() {
	var hardCheckbox = document.getElementById( 'hardCheckbox' );
	var extremeCheckbox = document.getElementById( 'extremeCheckbox' );

	if ( hardCheckbox.checked === false ) {
		extremeCheckbox.disabled = true;
		extremeCheckbox.checked = false;
	} else {
		extremeCheckbox.disabled = false;
	}
}
