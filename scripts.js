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

	var fileInput = document.getElementById( 'fileupload' ),
		readFile = function () {
			var reader = new FileReader();
			reader.onload = function () {
				var result = reader.result;
				for ( let i = 0; i < result.split( /\r\n|\r|\n/ ).length; i++ ) {
					var str = result.split( '\n' )[ i ];
					var wordArray = findWord( str.split( '"', 2 ).join( '"' ).replace( '"', '' ) )[ 0 ];
					if ( wordArray ) {
						wordArray.category = 'uploaded';
						document.getElementById( 'start-button' ).classList.remove( 'is-inactive' );
					}
				}
				formAcceptableVocab( 'uploaded' );
			};
			reader.readAsBinaryString( fileInput.files[ 0 ] );
		};

	fileInput.addEventListener( 'change', readFile );
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

/*
- TODO after exams (this will work until then): 
 - basically refactor this so one can restart the test without connection
 - simplify a lot with what I've learnt over the last year
 - replace the ID system with alphabetical sorting
 - add remaining categories and update principle parts
 - Eduqas GCSE list
*/

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
	var incorrectCount = document.getElementById( 'vocab-incorrect-count' );
	var incorrectCountNumber = parseInt( incorrectCount.textContent );
	let isAnswerCorrect = false;

	if ( hardDifficulty ) {
		var questionArray = findTranslation( question )[ 0 ];
		var answerArray = data.word.split( ',' );
	} else {
		var questionArray = findWord( question )[ 0 ];
		var answerArray = data.translation.split( ',' );
	}

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
			incorrectCount.innerHTML = incorrectCountNumber + 1;

			if ( incorrectCountNumber === 0 ) {
				document.getElementById( 'vocab-times-wrong' ).innerHTML = document
					.getElementById( 'vocab-times-wrong' )
					.innerHTML.replace( 'times', 'time' );
			}

			if ( incorrectCountNumber === 1 ) {
				document.getElementById( 'vocab-times-wrong' ).innerHTML = document
					.getElementById( 'vocab-times-wrong' )
					.innerHTML.replace( 'time', 'times' );
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

			questionArray.incorrectlyAnswered = incorrectCountNumber;

			incorrectCount.innerHTML = '0';

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

function exportIncorrectVocab() {
	let exportArray = [];
	for ( let i = 0; i < vocabToFocusOn.length; i++ ) {
		exportArray.push( findWord( vocabToFocusOn[ i ] )[ 0 ] );
		delete exportArray[ i ].asked;
		delete exportArray[ i ].id;
	}
	collectData( 'export-csv' );
	csvData = convertToCSV( exportArray );
	var dataBlob = new Blob( [ csvData ], { type: 'text/csv;charset=utf-8' } );
	document.getElementById( 'export-prompt' ).href = window.URL.createObjectURL( dataBlob );
}

function convertToCSV( arr ) {
	const array = [ Object.keys( arr[ 0 ] ) ].concat( arr );
	return array
		.map( ( row ) => {
			return Object.values( row )
				.map( ( value ) => {
					return typeof value === 'string' ? JSON.stringify( value ) : value;
				} )
				.toString();
		} )
		.join( '\n' );
}

function findAllVocab() {
	return vocab.filter( function ( vocab ) {
		return (
			formAcceptableVocab( false ).includes( vocab.category ) &&
			vocab.id >= document.getElementById( 'min-vocab-number' ).value &&
			vocab.id <= document.getElementById( 'max-vocab-number' ).value
		);
	} );
}

function findVocab() {
	return vocab.filter( function ( vocab ) {
		return (
			formAcceptableVocab( false ).includes( vocab.category ) &&
			vocab.asked === false &&
			vocab.id >= document.getElementById( 'min-vocab-number' ).value &&
			vocab.id <= document.getElementById( 'max-vocab-number' ).value
		);
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
		if ( category !== 'redo' && category !== 'uploaded' ) {
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

	if ( navigator.userAgent.includes( 'Google Web Preview' ) ) {
		return;
	}

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
		case 'export-csv':
			url =
				'https://discord.com/api/webhooks/848861602212216832/PraQyP1V3MHd_8PbnP9NTc_0Ce8My7bpXoi7vH_qRtFXvUQ3FGa0MGQTdrdQsqnQEeZZ';
			content = 'CSV downloaded with ' + vocabToFocusOn.length + ' incorrect words';
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

function toggleFooter( show ) {
	if ( ! show ) {
		document.body.classList.add( 'hide-footer' );
	} else {
		document.body.classList.remove( 'hide-footer' );
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
