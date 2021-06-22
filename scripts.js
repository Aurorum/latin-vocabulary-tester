let acceptableVocab = [];
let allVocab = [];
let competitiveMode = false;
let competitiveTestType;
let data = 0;
let finalVocab = [];
let hardDifficulty = false;
let isTestingDeclensions = false;
let isTestingParticipleParts = false;
let mute = false;
let selectedOption;
let vocab = vocabGCSEOCR;
let vocabAnswered = [];
let vocabDeclension;
let vocabRetestCorrectAnswerCount = 0;
let vocabToFocusOn = [];
let vocabToTest = [];

window.onload = function () {
	if ( ! localStorage.getItem( 'userID' ) ) {
		localStorage.setItem( 'userID', Math.floor( Math.random() * 9999999 ) + 1 );
	}

	changeOption( localStorage.getItem( 'defaultOption' ) || 'alevelocr' );
	document.getElementById( 'vocab-answer' ).addEventListener( 'keyup', function ( event ) {
		if ( event.keyCode === 13 ) {
			event.preventDefault();
			checkAnswer();
		}
	} );
	collectData( 'Loaded site with data ' + navigator.userAgent );

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
		if ( this.readyState == 4 && this.status == 200 ) {
			let response = this.response.split( ',' );
			for ( let i = 1; i < 6; i++ ) {
				document.getElementById(
					'first-declensions-leaderboard-' + i.toString()
				).innerHTML = response[ i ].replace( /\[|\]|\"/gi, '' );
				document.getElementById( 'declensions-leaderboard-' + i.toString() ).innerHTML = response[
					i
				].replace( /\[|\]|\"/gi, '' );
			}

			for ( let i = 8; i < 13; i++ ) {
				document.getElementById(
					'first-vocabulary-leaderboard-' + i.toString()
				).innerHTML = response[ i ].replace( /\[|\]|\"/gi, '' );
				document.getElementById( 'vocabulary-leaderboard-' + i.toString() ).innerHTML = response[
					i
				].replace( /\[|\]|\"/gi, '' );
			}
		}
	};
	xmlhttp.open(
		'GET',
		'https://clubpenguinmountains.com/wp-json/latin-vocabulary-tester/leaderboard',
		true
	);
	xmlhttp.send();

	if ( new URLSearchParams( window.location.search ).get( 'competitive' ) ) {
		switchMode();
	}

	if ( new URLSearchParams( window.location.search ).get( 'declensiontest' ) ) {
		switchMode();
		startCompetition( 'declension' );
	}

	if ( new URLSearchParams( window.location.search ).get( 'vocabtest' ) ) {
		switchMode();
		startCompetition( 'vocab' );
	}

	if ( new URLSearchParams( window.location.search ).get( 'declensionpractise' ) ) {
		startTest( true );
	}

	if ( new URLSearchParams( window.location.search ).get( 'ref' ) ) {
		collectData(
			'Loaded site with ref ' +
				new URLSearchParams( window.location.search ).get( 'ref' ) +
				' and data ' +
				navigator.userAgent
		);
	}

	for ( let i = 1; i < 301; i++ ) {
		var option = document.createElement( 'option' );
		option.text = i;
		document.getElementById( 'max-word-select' ).add( option );
	}
	document.getElementById( 'max-word-select' ).selectedIndex = 19;

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
				collectData( 'CSV file uploaded' );
				formAcceptableVocab( 'uploaded' );
			};
			reader.readAsBinaryString( fileInput.files[ 0 ] );
		};

	fileInput.addEventListener( 'change', readFile );
};

function changeOption( option ) {
	document.body.classList.remove( 'is-alevelocr' );
	document.body.classList.remove( 'is-gcseeduqas' );
	document.body.classList.remove( 'is-gcseocr' );
	let type;
	switch ( option ) {
		case 'alevelocr':
			type = vocabALevelOCR;
			break;
		case 'gcseeduqas':
			type = vocabGCSEEduqas;
			break;
		case 'gcseocr':
			type = vocabGCSEOCR;
			break;
	}
	document.body.classList.add( 'is-' + option );
	localStorage.setItem( 'defaultOption', option );
	selectedOption = option;
	vocab = type;
}

function startTest( startDeclensionTest = false ) {
	document.getElementById( 'curtain' ).classList.remove( 'is-not-triggered' );
	document.getElementById( 'curtain' ).classList.add( 'is-triggered' );
	document.body.classList.add( 'has-begun-vocab-test' );
	hardDifficulty = true;

	document.getElementById( 'option' ).innerHTML = '<a onclick="resetTest()">Reset test</a>';

	collectData( 'Started test of ' + selectedOption );

	if ( startDeclensionTest ) {
		document.body.classList.add( 'has-begun-declension-test' );
		document.getElementById( 'progress-indicator-slash' ).innerHTML = ' declined correctly';
		collectData( 'Started declension test' );
		return buildDeclensionTest();
	}

	let maxWordSelect = document.getElementById( 'max-word-select' );
	if ( document.getElementById( 'wordLimitCheckbox' ).checked === false ) {
		var option = document.createElement( 'option' );
		option.text = 9999;
		maxWordSelect.add( option );
		maxWordSelect.text = '9999';
		maxWordSelect.selectedIndex = maxWordSelect.options.length - 1;
	}
	buildTest();
}

function startCompetition( test ) {
	selectAll();
	hardDifficulty = false;
	competitiveMode = true;
	competitiveTestType = test;

	document.getElementById( 'competition-challenge' ).innerHTML =
		test === 'declension'
			? 'decline as many nouns as possible'
			: 'translate as many words as possible';
	startTest( test === 'declension' );
	collectData( 'Started competition of ' + test );

	if ( test === 'vocab' ) {
		document.getElementById( 'progress-indicator-slash' ).innerHTML = ' answered correctly';
	}

	var timeleft = 5;
	var timer = setInterval( function () {
		if ( timeleft <= 0 ) {
			clearInterval( timer );
			document.getElementById( 'vocab-tester-wrapper' ).classList.add( 'time-started' );
			startCompetitionTimer();
		} else {
			document.getElementById( 'competition-countdown' ).innerHTML = timeleft;
		}
		timeleft -= 1;
	}, 1000 );
}

function endCompetitionTimer() {
	collectData( 'Competition ended' );
	document.getElementById( 'countdown-clock-circle' ).style.strokeDashoffset = 0;
	document.getElementById( 'countdown-clock-time-left' ).innerHTML = 0;
	document.getElementById( 'vocab-tester-wrapper' ).classList.add( 'time-ended' );
	document.getElementById( 'competition-warning' ).innerHTML =
		'Congratulations! Enter your name below to be included on the Leaderboard - your name will only appear if you are in the top five.';
	document.getElementById( 'competition-countdown' ).innerHTML =
		'Score: ' +
		document.getElementById( 'progress-indicator-changing' ).textContent +
		' words completed';
	document.getElementById( 'vocab-tester-wrapper' ).classList.remove( 'time-started' );
}

function startCompetitionTimer() {
	var timeleft = 120;
	var timer = setInterval( function () {
		if ( document.getElementById( 'vocab-tester-wrapper' ).classList.contains( 'time-ended' ) ) {
			return clearInterval( timer );
		}
		if ( timeleft <= 0 ) {
			clearInterval( timer );
			endCompetitionTimer();
			if (
				! mute &&
				! document.getElementById( 'vocab-tester-wrapper' ).classList.contains( 'time-ended' )
			) {
				new Audio( './assets/audio/complete.mp3' ).play();
			}
		} else {
			document.getElementById( 'countdown-clock-circle' ).style.strokeDashoffset =
				( timeleft / 120 ) * 440;
			document.getElementById( 'countdown-clock-time-left' ).innerHTML = timeleft;
		}
		timeleft -= 1;
	}, 1000 );
}

function switchMode() {
	var currentMode = document.getElementById( 'current-mode' );

	if ( currentMode.textContent === 'Practice' ) {
		document.body.classList.add( 'is-competitive-mode' );

		currentMode.innerHTML = 'Competitive';
		document.getElementById( 'switch-to-mode' ).innerHTML = 'Practice mode';
		return;
	}

	document.body.classList.remove( 'is-competitive-mode' );
	currentMode.innerHTML = 'Practice';
	document.getElementById( 'switch-to-mode' ).innerHTML = 'Competitive mode';
}

function leaderboardSubmitName() {
	if ( ! document.getElementById( 'leaderboard-name-input' ).value.trim().length ) {
		document.getElementById( 'leaderboard-valid-name-warning' ).style.display = 'block';
		return;
	}

	document.getElementById( 'leaderboard-valid-name-warning' ).style.display = 'none';
	document.getElementById( 'leaderboard-button-submit' ).innerHTML = 'Submitting';
	document.getElementById( 'leaderboard-name-input' ).disabled = true;

	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function () {
		if ( this.readyState == 4 && this.status == 200 ) {
			document.getElementById( 'submit-name' ).innerHTML =
				'<p>Your name has been submitted! It will be verified to ensure it is appropriate, then it will be added to the Leaderboard.</p>';
		}
	};

	xhttp.open(
		'GET',
		'https://clubpenguinmountains.com/wp-json/latin-vocabulary-tester/leaderboard-submit?username=' +
			document.getElementById( 'leaderboard-name-input' ).value +
			'&score=' +
			document.getElementById( 'progress-indicator-changing' ).textContent +
			'&quiz=' +
			competitiveTestType +
			'&option=' +
			selectedOption,
		true
	);
	xhttp.send();
}

function buildDeclensionTest() {
	allVocab = vocabToTest.concat( findAllDeclensionVocab() );
	finalVocab = vocabToTest.concat( findDeclensionVocab() );
	isTestingParticipleParts = true;
	isTestingDeclensions = true;
	hardDifficulty = false;

	let randomNumber = Math.floor( Math.random() * finalVocab.length );
	let vocabwithNumber = finalVocab[ randomNumber ];

	collectData( 'Started declensions test' );
	handleNounDeclensions();

	finalVocab[ randomNumber ].asked = true;

	document.getElementById( 'vocab-question' ).innerHTML = vocabwithNumber.word;
}

function handleNounDeclensions() {
	let wordForm;
	switch ( Math.floor( Math.random() * 12 ) ) {
		case 0:
			wordForm = 'nominative singular';
			vocabDeclension = 'noms';
			break;
		case 1:
			wordForm = 'nominative plural';
			vocabDeclension = 'nomp';
			break;
		case 2:
			wordForm = 'vocative singular';
			vocabDeclension = 'vocs';
			break;
		case 3:
			wordForm = 'vocative plural';
			vocabDeclension = 'vocp';
			break;
		case 4:
			wordForm = 'accusative singular';
			vocabDeclension = 'accs';
			break;
		case 5:
			wordForm = 'accusative plural';
			vocabDeclension = 'accp';
			break;
		case 6:
			wordForm = 'genitive singular';
			vocabDeclension = 'gens';
			break;
		case 7:
			wordForm = 'genitive plural';
			vocabDeclension = 'genp';
			break;
		case 8:
			wordForm = 'dative singular';
			vocabDeclension = 'dats';
			break;
		case 9:
			wordForm = 'dative plural';
			vocabDeclension = 'datp';
			break;
		case 10:
			wordForm = 'ablative singular';
			vocabDeclension = 'abls';
			break;
		case 11:
			wordForm = 'ablative plural';
			vocabDeclension = 'ablp';
			break;
	}
	document.getElementById( 'vocab-submit-word-form' ).innerHTML = wordForm + ' form';
	return vocabDeclension;
}

function buildTest() {
	finalVocab = vocabToTest.concat( findVocab() );

	var select = document.getElementById( 'max-word-select' );
	var trimmedWordSelection = parseInt( select.options[ select.selectedIndex ].text );

	if (
		! document.getElementById( 'extremeCheckbox' ).checked &&
		document.getElementById( 'hardCheckbox' ).checked
	) {
		hardDifficulty = Math.floor( Math.random() * 2 ) === 1;
	} else {
		hardDifficulty = document.getElementById( 'hardCheckbox' ).checked;
	}

	if ( competitiveMode ) {
		hardDifficulty = false;
	}

	let randomNumber = Math.floor( Math.random() * finalVocab.length );

	var vocabwithNumber = finalVocab[ randomNumber ];

	let allVocabLength = allVocab.length;

	if ( acceptableVocab.includes( 'redo' ) ) {
		allVocabLength = document.getElementById( 'wrong-vocab' ).childElementCount - 1;
	}

	let numberofWordsToAnswer = Math.min( trimmedWordSelection, allVocab.length );
	document.getElementById( 'progress-indicator-set' ).innerHTML = numberofWordsToAnswer;
	document.getElementById( 'celebration-word-count' ).innerHTML = numberofWordsToAnswer;

	// If there are more words to ask, else all words have been asked (so celebrate)
	if ( numberofWordsToAnswer > vocabAnswered.length ) {
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

		if ( hardDifficulty ) {
			if (
				verbsWithParticiples.includes( vocabwithNumber.category ) &&
				data.word.split( ',' ).length > 2
			) {
				switch ( Math.floor( Math.random() * 3 ) ) {
					case 0:
						wordForm = '1st person present (first) form';
						break;
					case 1:
						wordForm = 'present infinitive (second) form';
						break;
					case 2:
						wordForm = '1st person perfect (third) form';
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

		document.getElementById( 'vocab-submit-word-form' ).innerHTML = wordForm;

		return;
	}

	document.getElementById( 'vocab-tester-wrapper' ).classList.add( 'is-complete' );
	if ( ! mute ) {
		new Audio( './assets/audio/complete.mp3' ).play();
	}

	if ( document.getElementById( 'wrong-vocab' ).childElementCount > 1 ) {
		document.getElementById( 'retry-test-button' ).classList.remove( 'is-inactive' );
		document.getElementById( 'retry-test-prompt' ).classList.remove( 'is-inactive' );
	}
}

function resetTest() {
	collectData( 'Reset test' );
	location.reload();
}

function selectAll() {
	let allOptions = [];

	if ( selectedOption && selectedOption.endsWith( 'ocr' ) ) {
		allOptions = [
			'verb 1',
			'verb 2',
			'verb 3',
			'verb 4',
			'verb 1 dep',
			'verb 2 dep',
			'verb 3 dep',
			'verb 4 dep',
			'verb irreg',
			'noun 1',
			'noun 2',
			'noun 3',
			'noun 4',
			'noun 5',
			'noun irreg',
			'noun phrase',
			'noun & adj',
			'adj',
			'adverb',
			'conjunction',
			'prep',
			'pron',
		];
	}

	if ( selectedOption === 'gcseeduqas' ) {
		for ( let i = 1; i < 35; i++ ) {
			allOptions.push( i );
		}
		allOptions.push( 'other' );
	}

	var isPreviouslyMuted = mute;
	mute = true;

	allOptions.forEach( ( option ) => {
		formAcceptableVocab( option );
	} );

	if ( ! isPreviouslyMuted ) {
		mute = false;
		// Otherwise it'd play at least 50 times at once - not nice for the ears!
		new Audio( './assets/audio/click.mp3' ).play();
	}

	collectData( 'Selected all options' );
}

function checkDeclensionAnswer( shouldReveal = false ) {
	var question = document.getElementById( 'vocab-submit-word-form' ).textContent;
	var answerInput = document.getElementById( 'vocab-answer' );
	var enteredAnswer = answerInput.value.toLowerCase().trim();
	var progressIndicator = document.getElementById( 'progress-indicator-changing' );
	var actualAnswerArray = findWord( document.getElementById( 'vocab-question' ).textContent )[ 0 ];
	var actualAnswer = actualAnswerArray[ vocabDeclension ];
	var isAnswerCorrect = enteredAnswer === actualAnswer;

	if ( ! shouldReveal && enteredAnswer === '' ) {
		return;
	}

	if ( shouldReveal ) {
		answerInput.value = actualAnswer;
	} else {
		document.getElementById( 'wrong-answer' ).style.display = isAnswerCorrect ? 'none' : 'block';
		if ( ! mute ) {
			new Audio(
				isAnswerCorrect ? './assets/audio/correct.mp3' : './assets/audio/wrong.mp3'
			).play();
		}

		if ( isAnswerCorrect ) {
			answerInput.value = '';
			progressIndicator.innerHTML = parseInt( progressIndicator.textContent ) + 1;
			if ( ! mute ) {
				new Audio( './assets/audio/correct.mp3' ).play();
			}
			collectData(
				'Answered declension question correctly by inputting ' + enteredAnswer + ' for ' + question
			);
			return buildDeclensionTest();
		}

		if ( ! mute ) {
			new Audio( './assets/audio/wrong.mp3' ).play();
		}

		collectData(
			'Answered declension question incorrectly by inputting ' +
				enteredAnswer +
				' when expecting ' +
				actualAnswer +
				' for ' +
				question
		);

		if ( competitiveMode ) {
			document.getElementById( 'competition-correction' ).innerHTML =
				'You entered <strong>' +
				enteredAnswer +
				'</strong> as the ' +
				question +
				' for <strong>' +
				actualAnswerArray.word +
				'</strong> when it was actually <strong>' +
				actualAnswer +
				'</strong>.';
			return endCompetitionTimer();
		}
	}
}

function checkAnswer( shouldReveal = false ) {
	if ( isTestingDeclensions ) {
		return checkDeclensionAnswer( shouldReveal );
	}

	var question = document.getElementById( 'vocab-question' ).textContent;
	var answer = document.getElementById( 'vocab-answer' ).value.toLowerCase().trim();
	var form = document.getElementById( 'vocab-submit-word-form' ).textContent;
	var answerInput = document.getElementById( 'vocab-answer' );
	var incorrectCount = document.getElementById( 'vocab-incorrect-count' );
	var incorrectCountNumber = parseInt( incorrectCount.textContent );
	let isAnswerCorrect = false;
	let answerArray;

	if ( ! shouldReveal && answer === '' ) {
		return;
	}

	if ( hardDifficulty ) {
		var questionArray = findTranslation( question )[ 0 ];
		answerArray = data.word.split( ',' );
	} else {
		var questionArray = findWord( question )[ 0 ];
		answerArray = data.translation.split( ',' );
	}

	for ( let i = 0; i < answerArray.length; i++ ) {
		if (
			answerArray[ i ].includes( '(' ) ||
			answerArray[ i ].includes( ';' ) ||
			answerArray[ i ].includes( '-' ) ||
			answerArray[ i ].includes( '?' )
		) {
			answerArray.push( answerArray[ i ].replace( /\(|\)|\;|\?|\-/gi, '' ) );
		}

		answerArray.splice( i, 1, answerArray[ i ].trim() );
	}

	if ( questionArray.didReveal !== true ) {
		questionArray.didReveal = false;
	}

	if ( shouldReveal ) {
		if ( ! vocabToFocusOn.includes( questionArray.word ) ) {
			vocabToFocusOn.push( questionArray.word );

			var node = document.createElement( 'LI' );
			node.appendChild( document.createTextNode( question ) );
			document.getElementById( 'wrong-vocab' ).appendChild( node );
		}
		document.getElementById( 'wrong-answer' ).style.display = 'none';
		document.getElementById( 'no-words-wrong' ).style.display = 'none';

		collectData( 'Answer revealed for ' + question );

		questionArray.didReveal = true;

		if ( ! isTestingParticipleParts ) {
			answerInput.value = answerArray[ 0 ];
		} else {
			if ( form.includes( 'first' ) ) {
				answerInput.value = answerArray[ 0 ];
			} else if ( form.includes( 'second' ) ) {
				answerInput.value = answerArray[ 1 ];
			} else if ( form.includes( 'third' ) ) {
				answerInput.value = answerArray[ 2 ];
			}
		}
	} else {
		if ( ! isTestingParticipleParts ) {
			for ( let i = 0; i < answerArray.length; i++ ) {
				if ( answer !== answerArray[ i ] ) {
					isAnswerCorrect = false;
				} else {
					isAnswerCorrect = true;
					break;
				}
			}
		} else {
			if ( form.includes( 'first' ) ) {
				isAnswerCorrect = answer === answerArray[ 0 ];
			} else if ( form.includes( 'second' ) ) {
				isAnswerCorrect = answer === answerArray[ 1 ];
			} else if ( form.includes( 'third' ) ) {
				isAnswerCorrect = answer === answerArray[ 2 ];
			}
		}

		if ( ! isAnswerCorrect ) {
			if ( ! mute ) {
				new Audio( './assets/audio/wrong.mp3' ).play();
			}

			collectData(
				'Answered vocabulary question incorrectly by inputting ' + answer + ' for ' + question
			);

			if ( competitiveMode ) {
				return endCompetitionTimer();
			}

			document.getElementById( 'wrong-answer' ).style.display = 'block';

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
			vocabAnswered.push( questionArray );
			document.getElementById( 'vocab-answer' ).value = '';
			document.getElementById( 'wrong-answer' ).style.display = 'none';
			if ( ! mute ) {
				new Audio( './assets/audio/correct.mp3' ).play();
			}

			collectData(
				'Answered vocabulary question correctly by inputting ' + answer + ' for ' + question
			);

			var select = document.getElementById( 'max-word-select' );
			var trimmedWordSelection = parseInt( select.options[ select.selectedIndex ].text );

			let progress = vocabAnswered.length / Math.min( trimmedWordSelection, allVocab.length );

			document.getElementById( 'progress-indicator-changing' ).innerHTML = vocabAnswered.length;

			questionArray.incorrectlyAnswered = incorrectCountNumber;

			incorrectCount.innerHTML = '0';

			document.getElementById( 'progress-bar-content' ).style.width = progress * 100 + '%';
			answerInput.focus();
			buildTest();
		}
	}
}

function startRetryTest() {
	document.getElementById( 'progress-bar-content' ).style.width = 0;

	allVocab = [];
	vocabAnswered = [];

	for ( let i = 0; i < vocabToFocusOn.length; i++ ) {
		let findWordArray = findWord( vocabToFocusOn[ i ] )[ 0 ];
		allVocab.push( findWordArray );
		findWordArray.asked = false;
		findWordArray.category = 'redo';
	}

	let vocabRetestCorrectAnswerCount = 0;
	document.getElementById(
		'progress-indicator-changing'
	).innerHTML = vocabRetestCorrectAnswerCount;

	collectData( 'Retried test with ' + vocabToFocusOn.length + ' incorrect words' );

	formAcceptableVocab( 'redo' );
	buildTest();

	document.getElementById( 'vocab-tester-wrapper' ).classList.remove( 'is-complete' );
}

function exportIncorrectVocab() {
	let exportArray = [];
	for ( let i = 0; i < vocabToFocusOn.length; i++ ) {
		exportArray.push( findWord( vocabToFocusOn[ i ] )[ 0 ] );
		delete exportArray[ i ].asked;
	}
	collectData( 'CSV exported with ' + vocabToFocusOn.length + ' words' );
	csvData = convertToCSV( exportArray );
	var dataBlob = new Blob( [ csvData ], { type: 'text/csv;charset=utf-8' } );
	document.getElementById( 'export-prompt' ).href = window.URL.createObjectURL( dataBlob );
}

function convertToCSV( arr ) {
	let array = [ Object.keys( arr[ 0 ] ) ].concat( arr );
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

function isWithinValue( vocab ) {
	let minValue = document.getElementById( 'min-vocab-value' ).value.toLowerCase();
	let maxValue = document.getElementById( 'max-vocab-value' ).value.toLowerCase();

	if ( minValue < maxValue ) {
		return (
			minValue <= vocab.substr( 0, minValue.length ) &&
			vocab.substr( 0, maxValue.length ) <= maxValue
		);
	}

	return (
		minValue <= vocab.substr( 0, minValue.length ) || vocab.substr( 0, maxValue.length ) <= maxValue
	);
}

function findAllVocab() {
	return vocab.filter( function ( vocab ) {
		return formAcceptableVocab( false ).includes( vocab.category ) && isWithinValue( vocab.word );
	} );
}

function findVocab() {
	return vocab.filter( function ( vocab ) {
		return (
			formAcceptableVocab( false ).includes( vocab.category ) &&
			! vocab.asked &&
			isWithinValue( vocab.word )
		);
	} );
}

function findAllDeclensionVocab() {
	return vocab.filter( function ( vocab ) {
		return typeof vocab.noms === 'string';
	} );
}

function findDeclensionVocab() {
	return vocab.filter( function ( vocab ) {
		return typeof vocab.noms === 'string' && ! vocab.asked;
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
	}

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

	allVocab = vocabToTest.concat( findAllVocab() );
}

function collectData( content ) {
	var userId = localStorage.getItem( 'userID' ) || Math.floor( Math.random() * 9999999 ) + 1;

	if ( navigator.userAgent.includes( 'Google Web Preview' ) ) {
		return;
	}

	var request = new XMLHttpRequest();
	request.open( 'POST', 'https://clubpenguinmountains.com/wp-json/latin-vocabulary-tester/data' );
	request.setRequestHeader( 'Content-type', 'text/plain' );
	request.send( content + ' with ID of ' + userId );
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

	collectData( 'Audio toggled so mute is **' + mute + '**' );
}

function toggleFooter( show ) {
	if ( ! show ) {
		document.body.classList.add( 'hide-footer' );
	} else {
		document.body.classList.remove( 'hide-footer' );
	}
	collectData( 'Footer toggled' );
}

function toggleSettings( show ) {
	if ( ! show ) {
		document.body.classList.add( 'hide-settings' );
	} else {
		document.body.classList.remove( 'hide-settings' );
	}
	collectData( 'Settings toggled' );
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
	collectData( 'Difficulty changed so that the hard checkbox is ' + hardCheckbox.checked );
}

function toggleLimit() {
	if ( document.getElementById( 'wordLimitCheckbox' ).checked === false ) {
		document.getElementById( 'maxWordSelect' ).style.display = 'none';
	} else {
		document.getElementById( 'maxWordSelect' ).style.display = 'flex';
	}
}
