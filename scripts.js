let acceptableCases = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ];
let acceptableVerbs = [];
let acceptableVocab = [];
let allVocab = [];
let competitionCountdown;
let competitiveMode = false;
let competitiveTestType;
let currentWord;
let finalVocab = [];
let hardDifficulty = false;
let isTableMode = false;
let isTestingConjugations = false;
let isTestingDeclensions = false;
let isTestingParticipleParts = false;
let mute = false;
let selectedOption;
let timer;
let userId = localStorage.getItem( 'userID' ) || Math.floor( Math.random() * 9999999 ) + 1;
let vocab = [];
let vocabAnswered = [];
let vocabConjugation;
let vocabCustomList = [];
let vocabDeclension;
let vocabFilesLoaded = false;
let vocabToFocusOn = [];
let vocabToFocusOnOriginal = [];
let vocabToTest = [];

const VOCAB_FILES_CACHE_VERSION = 1.4; // Increment when editing vocabulary lists.

loadAllVocabFiles();

window.onload = function () {
	if ( ! localStorage.getItem( 'userID' ) ) {
		localStorage.setItem( 'userID', userId );
	}

	if ( 'serviceWorker' in navigator && navigator.onLine ) {
		navigator.serviceWorker.register( 'serviceWorker.js' );
	}

	let loadTimeout = setTimeout( function () {
		function checkCondition() {
			if ( vocabFilesLoaded ) {
				changeOption( localStorage.getItem( 'defaultOption' ) || 'alevelocr', false );
				document.getElementById( 'loading' ).style.display = 'none';
				clearTimeout( loadTimeout );
			} else {
				loadTimeout = setTimeout( checkCondition, 100 );
			}
		}
		checkCondition();
	}, 800 );

	document.getElementById( 'vocab-answer' ).addEventListener( 'keyup', function ( event ) {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			checkAnswer();
		}
	} );
	collectData( 'Loaded site with data ' + navigator.userAgent + ' at ' + new Date(), 'load' );

	// Create leaderboard.
	if ( navigator.onLine ) {
		fetchLeaderboard();
	}

	// Handle parameters in URL.
	handleParameters();

	// Mute audio.
	let defaultAudioSetting = localStorage.getItem( 'defaultAudio' );
	if ( defaultAudioSetting && defaultAudioSetting === 'Muted' ) {
		muteAudio();
	}

	// Default at testing all words.
	acceptableVerbs = Array.from( { length: 128 }, ( _, i ) => i );

	let maxWordSelect = document.getElementById( 'max-word-select' );
	for ( let i = 1; i <= 300; i++ ) {
		let option = new Option( i, i );
		maxWordSelect.add( option );
	}
	maxWordSelect.selectedIndex = 19;

	// Configure uploading files.
	let fileInput = document.getElementById( 'fileupload' );
	let advancedFileInput = document.getElementById( 'advancedfileupload' );

	let readFile = ( reader ) => {
		reader.onload = () => {
			let result = reader.result;
			let lines = result.split( /\r\n|\r|\n/ );
			let foundWord = false;

			for ( let line of lines ) {
				let item = line.split( '","' ).map( ( item ) => item.replace( /(^"|"$)/g, '' ) );

				if ( item[ 0 ] === 'selectedOption' ) {
					changeOption( item[ 1 ] );
					break;
				}
			}

			lines.forEach( ( line ) => {
				let item = line.split( '","' ).map( ( item ) => item.replace( /(^"|"$)/g, '' ) );
				let word = item[ 0 ];

				if ( word !== 'selectedOption' ) {
					let wordArray = findWord( word );
					if ( wordArray ) {
						wordArray.category = 'uploaded';
						foundWord = true;
					}
				}
			} );

			formAcceptableVocab( 'uploaded' );
			document.getElementById( 'file-upload-notice' ).classList.remove( 'is-inactive' );

			if ( foundWord ) {
				let lineCount = vocab.filter( ( item ) => item.category === 'uploaded' ).length;
				let wordString = lineCount === 1 ? ' word' : ' words';
				document.getElementById( 'start-button' ).classList.remove( 'is-inactive' );
				document.getElementById( 'file-upload-notice' ).classList.remove( 'is-error' );
				document.getElementById( 'file-upload-message' ).innerHTML =
					'Successfully uploaded ' + lineCount + wordString;
				collectData( 'CSV file uploaded with ' + lineCount + ' words', 'csv_upload' );
				return;
			}

			document.getElementById( 'file-upload-notice' ).classList.add( 'is-error' );
			document.getElementById( 'file-upload-message' ).innerHTML = 'Error: invalid file format.';
			collectData( 'CSV file upload failed', 'csv_upload_failed' );
		};
	};

	let handleRegularFileUpload = () => {
		let reader = new FileReader();
		readFile( reader );
		reader.readAsBinaryString( fileInput.files[ 0 ] );
	};

	let handleCustomFileUpload = () => {
		let advancedReader = new FileReader();
		readCustomFile( advancedReader );
		advancedReader.readAsText( advancedFileInput.files[ 0 ] );
	};

	let readCustomFile = ( reader ) => {
		reader.onload = () => {
			let result = reader.result;
			let header = 'word,translation,category\n';

			if ( ! result.startsWith( 'word,translation,category' ) ) {
				result = header + result;
			}

			let list = csvToJSON( result );

			document.getElementById( 'custom-file-upload-notice' ).classList.remove( 'is-inactive' );

			if ( ! isValidCustomList( list ) ) {
				collectData( 'Invalid custom list uploaded', 'invalid_custom_list' );
				document.getElementById( 'custom-file-upload-notice' ).classList.add( 'is-error' );
				document.getElementById( 'custom-file-upload-message' ).innerHTML = result.includes(
					'selectedOption'
				)
					? "Error: invalid file format. If you're trying to upload a previous test, use the box above instead."
					: 'Error: invalid file format.';
				return;
			}

			document.getElementById( 'custom-file-upload-notice' ).classList.remove( 'is-error' );
			document.getElementById( 'custom-file-upload-message' ).innerHTML =
				'Successfully uploaded custom list';
			collectData( 'Successful custom list uploaded', 'successful_custom_list' );
			handleCustomList( list );
			document.body.classList.add( 'has-custom-list-option' );
			changeOption( 'custom-list', false );
		};
	};

	fileInput.addEventListener( 'change', handleRegularFileUpload );
	advancedFileInput.addEventListener( 'change', handleCustomFileUpload );
};

/* Initialisation functions */
function loadAllVocabFiles() {
	let fileVariableMapping = {
		'alevel-ocr.json': 'vocabALevelOCR',
		'cambridge-latin-course.json': 'vocabCLC',
		'gcse-eduqas.json': 'vocabGCSEEduqas',
		'gcse-ocr.json': 'vocabGCSEOCR',
		'literature.json': 'vocabLiterature',
	};

	let vocabCache = caches.open( 'vocabCache' );

	let promises = Object.entries( fileVariableMapping ).map( ( [ fileName, variableName ] ) => {
		let filePath = `./vocab-lists/${ fileName }`;

		return vocabCache
			.then( ( cache ) => {
				return cache.match( fileName ).then( ( cacheResponse ) => {
					if (
						cacheResponse &&
						parseFloat( localStorage.getItem( 'vocabFilesCacheVersion' ) ) ===
							VOCAB_FILES_CACHE_VERSION
					) {
						return cacheResponse.json();
					} else {
						return fetch( filePath )
							.then( ( response ) => {
								if ( ! response.ok ) {
									throw new Error( 'Vocabulary lists failed to load' );
								}
								return response.json();
							} )
							.then( ( vocabFile ) => {
								cache.put( fileName, new Response( JSON.stringify( vocabFile ) ) );
								localStorage.setItem( 'vocabFilesCacheVersion', VOCAB_FILES_CACHE_VERSION );

								return vocabFile;
							} )
							.catch( ( error ) => {
								collectData( 'Vocabulary lists failed to load', 'initialisation_error' );
								collectData( error.message || error );
							} );
					}
				} );
			} )
			.then( ( data ) => {
				window[ variableName ] = data;
			} );
	} );

	return Promise.all( promises ).then( () => {
		Object.entries( fileVariableMapping ).map( ( [ _, variableName ] ) => {
			window[ variableName ].forEach( ( word ) => {
				word.asked = false;
			} );
		} );
		vocabFilesLoaded = true;
	} );
}

window.onerror = function ( message, source, line, col, error ) {
	collectData( 'Console error logged', 'console_error_logged' );
	collectData(
		'Error message: ' +
			message +
			'\nSource: ' +
			source +
			'\nLine number: ' +
			line +
			'\nColumn number: ' +
			col +
			'\nError object: ' +
			error.stack
			? error.stack
			: error
	);
};

function playAudio( sound ) {
	if ( ! mute ) {
		let file = sound ? sound : 'click';
		new Audio( './assets/audio/' + file + '.mp3' ).play();
	}
}

function handleParameters() {
	if ( new URLSearchParams( window.location.search ).get( 'competitive' ) ) {
		switchMode();
	}

	if ( sessionStorage.getItem( 'reset-mode' ) === 'competitive' ) {
		switchMode();
		sessionStorage.removeItem( 'reset-mode' );
	}

	if ( new URLSearchParams( window.location.search ).get( 'declensiontest' ) ) {
		switchMode();
		startCompetition( 'declension' );
	}

	if ( new URLSearchParams( window.location.search ).get( 'vocabtest' ) ) {
		switchMode();
		startCompetition( 'vocab' );
	}

	if ( new URLSearchParams( window.location.search ).get( 'conjugationtest' ) ) {
		switchMode();
		startCompetition( 'conjugation' );
	}

	if ( new URLSearchParams( window.location.search ).get( 'declensionpractise' ) ) {
		startTest( true );
	}

	if ( new URLSearchParams( window.location.search ).get( 'conjugationpractise' ) ) {
		startTest( false, true );
	}

	if ( new URLSearchParams( window.location.search ).get( 'ref' ) ) {
		collectData(
			'Loaded site with ref ' +
				new URLSearchParams( window.location.search ).get( 'ref' ) +
				' and data ' +
				navigator.userAgent
		);
	}

	if ( new URLSearchParams( window.location.search ).get( 'cid' ) ) {
		collectData(
			'Loaded site with centre ID ' +
				new URLSearchParams( window.location.search ).get( 'cid' ) +
				' and data ' +
				navigator.userAgent
		);
	}

	if ( document.referrer ) {
		collectData(
			'Loaded site with referrer ' + document.referrer + ' and data ' + navigator.userAgent
		);
	}

	let customList = localStorage.getItem( 'customList' );
	if ( customList && JSON.parse( customList ).length > 0 ) {
		document.body.classList.add( 'has-custom-list-option' );
		collectData( 'Loaded with custom list available', 'custom_list_option_available' );
	} else if ( localStorage.getItem( 'defaultOption' ) === 'custom-list' ) {
		changeOption( 'alevelocr', false );
	}

	if ( new URLSearchParams( window.location.search ).get( 'ovid' ) ) {
		changeOption( 'literature', false );
		collectData( 'Loaded Ovid' );
	}
}

function changeOption( option, manualChange = true ) {
	let allOptions = [ 'alevelocr', 'gcseeduqas', 'gcseocr', 'clc', 'custom-list', 'literature' ];

	allOptions.forEach( ( option ) => {
		document.body.classList.remove( 'is-' + option );
	} );

	if ( manualChange ) {
		collectData( 'Changed option from ' + selectedOption + ' to ' + option, 'changed_option' );
	}

	let optionMap = {
		alevelocr: vocabALevelOCR,
		gcseeduqas: vocabGCSEEduqas,
		gcseocr: vocabGCSEOCR,
		clc: vocabCLC,
		'custom-list': vocabCustomList,
		literature: vocabLiterature,
	};

	selectAll( 'change-option' );
	resetFileUpload();

	selectedOption = option;
	vocab = optionMap[ option ];
	document.body.classList.add( 'is-' + selectedOption );
	localStorage.setItem( 'defaultOption', selectedOption );
	document.getElementById( 'word-table-select' ).options.length = '0';

	document.getElementById( 'switch-literature' ).innerHTML = 'Switch to literature vocabulary';
	document.getElementById( 'switch-literature' ).onclick = function () {
		changeOption( 'literature' );
	};

	if ( selectedOption === 'custom-list' && localStorage.getItem( 'customList' ) ) {
		handleCustomList( JSON.parse( localStorage.getItem( 'customList' ) ) );
	}

	if ( selectedOption === 'literature' ) {
		document.getElementById( 'switch-literature' ).innerHTML = 'Switch to prescribed vocabulary';

		document.getElementById( 'switch-literature' ).onclick = function () {
			changeOption( 'alevelocr' );
		};
	}

	if ( isTestingDeclensions || isTestingConjugations ) {
		if ( ! isTableMode ) {
			toggleWordTable( false );
		}

		buildDeclensionOrConjugationTest( isTestingConjugations, true );
	}

	if ( manualChange ) {
		playAudio();
	}
}

function startTest( startDeclensionTest = false, startConjugationTest = false ) {
	if ( competitiveMode || ( ! startDeclensionTest && ! startConjugationTest ) ) {
		let curtain = document.getElementById( 'curtain' );
		curtain.classList.remove( 'is-not-triggered' );
		curtain.classList.add( 'is-triggered' );
	}

	document.body.classList.add( 'has-begun-vocab-test' );
	hardDifficulty = true;

	window.scrollTo( 0, 0 );

	collectData(
		'Started test of ' + selectedOption + ' with competition mode set to ' + competitiveMode,
		'started_test'
	);

	collectData( 'Test categories of ' + acceptableVocab.join( ', ' ) );

	let wordTablePrompt = competitiveMode ? 'word-table-prompt-competitive' : 'word-table-prompt';
	if ( startDeclensionTest ) {
		document.body.classList.add( 'has-begun-declension-test' );
		document.getElementById( 'progress-indicator-slash' ).innerHTML = ' declined correctly';
		document.getElementById( 'grammar-type' ).innerHTML = 'noun';
		document.getElementById( wordTablePrompt ).innerHTML = 'Show declensions table';
		collectData( 'Started declension test', 'started_declension_test' );
		return buildDeclensionOrConjugationTest( false );
	}

	if ( startConjugationTest ) {
		if ( ! [ 'alevelocr', 'literature' ].includes( selectedOption ) ) {
			let subjunctiveCheckboxes = document.querySelectorAll(
				'.select-verbs .subjunctive .subjunctive-toggle-wrapper .toggle input[type="checkbox"]'
			);
			for ( let i = 0; i < subjunctiveCheckboxes.length; i++ ) {
				subjunctiveCheckboxes[ i ].checked = false;
				handleVerbSelection( subjunctiveCheckboxes[ i ], false );
			}
		}
		document.body.classList.add( 'has-begun-conjugation-test' );
		document.getElementById( 'progress-indicator-slash' ).innerHTML = ' conjugated correctly';
		document.getElementById( 'grammar-type' ).innerHTML = 'verb';
		document.getElementById( wordTablePrompt ).innerHTML = 'Show verb tables';
		collectData( 'Started conjugation test', 'started_conjugation_test' );

		return buildDeclensionOrConjugationTest( true, true, true );
	}

	let maxWordSelect = document.getElementById( 'max-word-select' );
	if ( ! document.getElementById( 'wordLimitCheckbox' ).checked ) {
		let option = document.createElement( 'option' );
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

	let challenge;
	switch ( test ) {
		case 'declension':
			challenge = 'decline as many nouns as possible';
			document.getElementById( 'grammar-type-competition' ).innerHTML = 'noun';
			break;
		case 'conjugation':
			challenge = 'conjugate as many verbs as possible';
			document.getElementById( 'grammar-type-competition' ).innerHTML = 'verb';
			document.getElementById( 'progress-indicator-slash' ).innerHTML = ' conjugated correctly';
			break;
		default:
			challenge = 'translate as many words as possible';
			document.getElementById( 'progress-indicator-slash' ).innerHTML = ' answered correctly';
	}

	document.getElementById( 'competition-challenge' ).innerHTML = challenge;
	startTest( test === 'declension', test === 'conjugation' );
	collectData( 'Started competition of ' + test, 'started_competition' );

	clearInterval( competitionCountdown );

	let timeleft = 5;
	competitionCountdown = setInterval( function () {
		if ( timeleft <= 0 ) {
			clearInterval( competitionCountdown );
			document.getElementById( 'vocab-tester-wrapper' ).classList.add( 'time-started' );
			startCompetitionTimer();
		} else {
			document.getElementById( 'competition-countdown' ).innerHTML = timeleft;
		}
		timeleft -= 1;
	}, 1000 );
}

function checkIncorrectAnswerGrammar() {
	let grammarForm = getKeysInObject(
		currentWord,
		document.getElementById( 'vocab-answer' ).value.toLowerCase().trim()
	);
	let possibleForms = [];

	grammarForm.forEach( ( form ) => {
		let fullForm = '';

		if ( isTestingDeclensions ) {
			if ( form.startsWith( 'nom' ) ) {
				fullForm = 'nominative';
			} else if ( form.startsWith( 'voc' ) ) {
				fullForm = 'vocative';
			} else if ( form.startsWith( 'acc' ) ) {
				fullForm = 'accusative';
			} else if ( form.startsWith( 'gen' ) ) {
				fullForm = 'genitive';
			} else if ( form.startsWith( 'dat' ) ) {
				fullForm = 'dative';
			} else if ( form.startsWith( 'abl' ) ) {
				fullForm = 'ablative';
			}

			if ( form.endsWith( 'p' ) ) {
				fullForm += ' plural';
			} else {
				fullForm += ' singular';
			}
		}

		if ( isTestingConjugations ) {
			if ( form.includes( '1' ) ) {
				fullForm = 'first-person';
			} else if ( form.includes( '2' ) ) {
				fullForm = 'second-person';
			} else if ( form.includes( '3' ) ) {
				fullForm = 'third-person';
			}

			let formNumber = form.replace( /^\D*/, '' );

			if ( formNumber.endsWith( 's' ) ) {
				fullForm += ' singular';
			} else if ( formNumber.endsWith( 'pl' ) ) {
				fullForm += ' plural';
			}

			if ( form.startsWith( 'pr' ) ) {
				fullForm += ' present';
			} else if ( form.startsWith( 'imp' ) && form.length > 5 ) {
				fullForm += ' imperfect';
			} else if ( form.startsWith( 'ft' ) ) {
				fullForm += ' future';
			} else if ( form.startsWith( 'fp' ) ) {
				fullForm += ' future perfect';
			} else if ( form.startsWith( 'pf' ) ) {
				fullForm += ' perfect';
			} else if ( form.startsWith( 'pl' ) ) {
				fullForm += ' pluperfect';
			}

			if ( form.includes( 'ac' ) ) {
				fullForm += ' active';
			} else if ( form.includes( 'pa' ) ) {
				fullForm += ' passive';
			}

			if ( form.includes( 'suj' ) ) {
				fullForm += ' subjunctive';
			} else {
				fullForm += ' indicative';
			}

			switch ( form ) {
				case 'imps':
					fullForm = 'present singular imperative';
					break;
				case 'imppl':
					fullForm = 'present plural imperative';
					break;
				case 'infpr':
					fullForm = 'present infinitive';
					break;
				case 'infpf':
					fullForm = 'perfect infinitive';
					break;
				case 'pap':
					fullForm = 'present active participle';
					break;
				case 'ppp':
					fullForm = 'present passive participle';
					break;
			}
		}

		possibleForms.push( fullForm );
	} );

	if ( possibleForms.length ) {
		let suffix = competitiveMode ? '-competition' : '';
		document.getElementById( 'grammar-form' + suffix ).innerHTML = possibleForms
			.join( ', ' )
			.replace( /,(?=[^,]*$)/, ' and' );
		document.getElementById( 'grammar-info' + suffix ).classList.add( 'is-active' );
	}
}

function getKeysInObject( object, value ) {
	return Object.keys( object ).filter( ( key ) => object[ key ] === value );
}

function endCompetitionTimer() {
	let leaderboardId;
	let endingMessage;
	let score = parseInt( document.getElementById( 'progress-indicator-changing' ).textContent );

	if ( isTestingConjugations ) {
		leaderboardId = document.getElementById( 'first-conjugations-leaderboard-2' ).textContent;
		endingMessage =
			"Time's up! The <strong>" +
			document.getElementById( 'vocab-submit-word-form' ).textContent +
			'</strong> of <strong>' +
			currentWord.word +
			'</strong> was <strong>' +
			currentWord[ vocabConjugation ] +
			'</strong>.';
		checkIncorrectAnswerGrammar();
	} else if ( isTestingDeclensions ) {
		leaderboardId = document.getElementById( 'first-declensions-leaderboard-2' ).textContent;
		endingMessage =
			"Time's up! The <strong>" +
			document.getElementById( 'vocab-submit-word-form' ).textContent +
			'</strong> of <strong>' +
			currentWord.word +
			'</strong> was <strong>' +
			currentWord[ vocabDeclension ] +
			'</strong>.';
		checkIncorrectAnswerGrammar();
	} else {
		leaderboardId = document.getElementById( 'first-vocabulary-leaderboard-2' ).textContent;
		endingMessage =
			"Time's up! The acceptable meanings for <strong>" +
			currentWord.word +
			'</strong> were: <strong>' +
			currentWord.translation +
			'</strong>.';
	}

	if ( ! document.getElementById( 'competition-correction' ).textContent.length ) {
		document.getElementById( 'competition-correction' ).innerHTML = endingMessage;
	}

	if ( innerWidth > 1200 && ( isTestingConjugations || isTestingDeclensions ) ) {
		toggleWordTable( true );
	}

	collectData( 'Competition ended', 'ended_competition' );
	document.getElementById( 'countdown-clock-circle' ).style.strokeDashoffset = 0;
	document.getElementById( 'countdown-clock-time-left' ).innerHTML = 0;
	document.getElementById( 'vocab-tester-wrapper' ).classList.add( 'time-ended' );

	let wordsString = score === 1 ? ' word' : ' words';
	document.getElementById( 'competition-countdown' ).innerHTML =
		'Score: ' + score + wordsString + ' completed';

	document.getElementById( 'vocab-tester-wrapper' ).classList.remove( 'time-started' );

	if ( leaderboardId === 'Loading' ) {
		document.getElementById( 'vocab-tester-wrapper' ).classList.add( 'leaderboard-eligible' );
		return;
	}

	let minimumLeaderboardScore = leaderboardId.substring(
		leaderboardId.lastIndexOf( '-' ) + 1,
		leaderboardId.lastIndexOf( 'words' )
	);

	let neededScore = Math.max( parseInt( minimumLeaderboardScore, 10 ) || 0, 0 );

	if ( parseInt( neededScore ) >= score ) {
		document.getElementById( 'vocab-tester-wrapper' ).classList.add( 'leaderboard-ineligible' );
		document.getElementById( 'competition-leaderboard-text-score' ).innerHTML =
			parseInt( neededScore ) + 1;
	} else {
		document.getElementById( 'vocab-tester-wrapper' ).classList.add( 'leaderboard-eligible' );
	}
}

function startCompetitionTimer() {
	let timeleft = 120;

	clearInterval( timer );

	timer = setInterval( function () {
		if ( document.getElementById( 'vocab-tester-wrapper' ).classList.contains( 'time-ended' ) ) {
			return clearInterval( timer );
		}
		if ( timeleft <= 0 ) {
			clearInterval( timer );
			endCompetitionTimer();
			if (
				! document.getElementById( 'vocab-tester-wrapper' ).classList.contains( 'time-ended' )
			) {
				playAudio( 'complete' );
			}
		} else {
			if ( timeleft < 120 / 4 ) {
				document.getElementById( 'countdown-clock-circle' ).style.stroke = '#eb0001';
			} else if ( timeleft < 120 / 2 ) {
				document.getElementById( 'countdown-clock-circle' ).style.stroke = '#f67c00';
			}

			document.getElementById( 'countdown-clock-circle' ).style.strokeDashoffset =
				( timeleft / 120 ) * 440;
			document.getElementById( 'countdown-clock-time-left' ).innerHTML = timeleft;
		}
		timeleft -= 1;
	}, 1000 );
}

function switchMode() {
	if ( ! document.body.classList.contains( 'is-competitive-mode' ) ) {
		changeMode( 'vocabulary' );
	}

	let currentMode = document.getElementById( 'current-mode' );

	if ( selectedOption === 'literature' ) {
		changeOption( 'alevelocr' );
	}

	if ( currentMode.textContent === 'Practice' ) {
		document.body.classList.add( 'is-competitive-mode' );
		currentMode.innerHTML = 'Competitive';
		document.getElementById( 'switch-to-mode' ).innerHTML = 'Practice mode';
		collectData( 'Switched to Competitive mode', 'switched_mode' );
		return;
	}

	document.body.classList.remove( 'is-competitive-mode' );
	currentMode.innerHTML = 'Practice';
	document.getElementById( 'switch-to-mode' ).innerHTML = 'Competitive mode';

	collectData( 'Switched to Practice mode', 'switched_mode' );
}

function fetchLeaderboard() {
	fetch( 'https://clubpenguinmountains.com/wp-json/latin-vocabulary-tester/leaderboard' )
		.then( ( response ) => {
			if ( ! response.ok ) {
				collectData( 'Failed to load from endpoint' );
			}
			return response.json();
		} )
		.then( ( data ) => {
			leaderboardData = data;
			updateLeaderboard( data.currentData, true );
			populateLeaderboardSelect( data );
		} )
		.catch( ( error ) => {
			populateLeaderboardSelect();
			collectData( 'Failed to load from endpoint' );
			collectData( error.message );
		} );
}

function leaderboardSubmitName() {
	if ( ! document.getElementById( 'leaderboard-name-input' ).value.trim().length ) {
		document.getElementById( 'leaderboard-valid-name-warning' ).style.display = 'block';
		return;
	}

	document.getElementById( 'leaderboard-valid-name-warning' ).style.display = 'none';
	document.getElementById( 'leaderboard-button-submit' ).innerHTML = 'Submitting';
	document.getElementById( 'leaderboard-name-input' ).disabled = true;

	fetch(
		'https://clubpenguinmountains.com/wp-json/latin-vocabulary-tester/leaderboard-submit?username=' +
			document.getElementById( 'leaderboard-name-input' ).value +
			'&score=' +
			document.getElementById( 'progress-indicator-changing' ).textContent +
			'&quiz=' +
			competitiveTestType +
			'&option=' +
			selectedOption +
			'&id=' +
			userId
	)
		.then( ( response ) => {
			return response.json();
		} )
		.then( ( data ) => {
			document.getElementById( 'vocab-tester-wrapper' ).classList.add( 'leaderboard-submitted' );
			if ( data.approved ) {
				fetchLeaderboard();
				document.getElementById( 'vocab-tester-wrapper' ).classList.add( 'leaderboard-approved' );
			}
		} )
		.catch( ( error ) => {
			collectData( 'Error submitting leaderboard' );
			collectData( error.message );
		} );
}

function changeLeaderboardYear() {
	let data = leaderboardData.currentData;
	let yearSelect = document.getElementById( 'leaderboard-year' );

	let selectedYear = parseInt( yearSelect.value );
	let latestYear = Math.max( ...[ ...yearSelect.options ].map( ( option ) => option.value ) );

	collectData( 'Changed leaderboard year to ' + selectedYear, 'changed_leaderboard_year' );

	if ( selectedYear === latestYear ) {
		return updateLeaderboard( data, false );
	}

	data = leaderboardData.historicData[ selectedYear ];
	updateLeaderboard( data, false );
}

function updateLeaderboard( data, duplicate ) {
	updateLeaderboardSection( data, 'declensions', duplicate );
	updateLeaderboardSection( data, 'vocabulary', duplicate );
	updateLeaderboardSection( data, 'conjugations', duplicate );
}

function updateLeaderboardSection( data, type, duplicate ) {
	let prefix = type + '-leaderboard-';
	for ( let i = 0; i < 3; i++ ) {
		document.getElementById( prefix + i ).innerHTML = data[ type ][ i ];

		if ( duplicate ) {
			document.getElementById( 'first-' + prefix + i ).innerHTML = data[ type ][ i ];
		}
	}
}

function populateLeaderboardSelect( data ) {
	let yearSelect = document.getElementById( 'leaderboard-year' );

	if ( data && typeof data === 'object' ) {
		let years = Object.keys( data.historicData ).map( ( year ) => parseInt( year, 10 ) );
		let nextYear = Math.max( ...years ) + 1;

		if ( ! years.includes( nextYear ) ) {
			years.push( nextYear );
		}

		years.sort( ( a, b ) => b - a );

		years.forEach( ( year ) => {
			let option = document.createElement( 'option' );
			option.value = year;
			option.textContent = year;
			yearSelect.appendChild( option );
		} );

		return;
	}

	let currentYear = new Date().getFullYear();
	let option = document.createElement( 'option' );

	option.value = currentYear;
	option.textContent = currentYear;
	yearSelect.appendChild( option );
}

function buildDeclensionOrConjugationTest(
	isConjugationTest = false,
	addToTable = true,
	startTableMode = false
) {
	if ( isConjugationTest ) {
		allVocab = vocabToTest.concat( findAllConjugationVocab() );
		finalVocab = vocabToTest.concat( findConjugationVocab() );
	} else {
		allVocab = vocabToTest.concat( findAllVocab() );
		finalVocab = vocabToTest.concat( findDeclensionVocab() );
	}

	isTestingParticipleParts = true;
	hardDifficulty = false;

	let randomNumber = Math.floor( Math.random() * finalVocab.length );
	currentWord = finalVocab[ randomNumber ];
	if ( isConjugationTest ) {
		isTestingConjugations = true;
		handleVerbConjugations();
	} else {
		isTestingDeclensions = true;
		handleNounDeclensions();
	}
	currentWord.asked = true;

	if ( addToTable && ( isTestingDeclensions || isTestingConjugations ) ) {
		let select = document.getElementById( 'word-table-select' );
		let option = document.createElement( 'option' );

		option.setAttribute( 'data-type', isTestingDeclensions ? vocabDeclension : vocabConjugation );
		option.text = currentWord.word;
		select.add( option );
		select.selectedIndex = select.length - 1;
	}

	document.getElementById( 'vocab-question' ).innerHTML = currentWord.word;
	document.getElementById( 'vocab-question-table-mode' ).innerHTML = currentWord.word;
	document.getElementById( 'vocab-question-details' ).innerHTML = currentWord.translation;
	document.getElementById( 'vocab-question-table-mode-details' ).innerHTML =
		currentWord.translation;

	if ( isTableMode && isTestingConjugations ) {
		resetTableMode();
		constructWordTable( true );
	}

	if ( startTableMode && ! competitiveMode ) {
		toggleTableMode();
	}
}

function handleVerbSelection( e, manualChange = true ) {
	if ( ! document.querySelectorAll( '.select-verbs input[type="checkbox"]:checked' ).length ) {
		e.checked = true;
		return ( document.getElementById( 'verbs-warning' ).style.display = 'block' );
	}

	let verbNumber;
	switch ( e.id ) {
		case 'verbs-pracind':
			verbNumber = [ 0, 2, 4, 6, 8, 10 ];
			break;
		case 'verbs-impacind':
			verbNumber = [ 12, 14, 16, 18, 20, 22 ];
			break;
		case 'verbs-ftacind':
			verbNumber = [ 48, 50, 52, 54, 56, 58 ];
			break;
		case 'verbs-fpacind':
			verbNumber = [ 117, 119, 121, 123, 125, 127 ];
			break;
		case 'verbs-pfacind':
			verbNumber = [ 24, 26, 28, 30, 32, 34 ];
			break;
		case 'verbs-placind':
			verbNumber = [ 36, 38, 40, 42, 44, 46 ];
			break;
		case 'verbs-imp':
			verbNumber = [ 62, 63 ];
			break;
		case 'verbs-inf':
			verbNumber = [ 112, 113, 114, 115, 116 ];
			break;
		case 'verbs-par':
			verbNumber = [ 60, 61 ];
			break;
		case 'verbs-prpaind':
			verbNumber = [ 1, 3, 5, 7, 9, 11 ];
			break;
		case 'verbs-imppaind':
			verbNumber = [ 13, 15, 17, 19, 21, 23 ];
			break;
		case 'verbs-pfpaind':
			verbNumber = [ 25, 27, 29, 31, 33, 35 ];
			break;
		case 'verbs-plpaind':
			verbNumber = [ 37, 39, 41, 43, 45, 47 ];
			break;
		case 'verbs-ftpaind':
			verbNumber = [ 49, 51, 53, 55, 57, 59 ];
			break;
		case 'verbs-fppaind':
			verbNumber = [ 118, 120, 122, 124, 126, 128 ];
			break;
		case 'verbs-pracsuj':
			verbNumber = [ 64, 66, 68, 70, 72, 74 ];
			break;
		case 'verbs-impacsuj':
			verbNumber = [ 76, 78, 80, 82, 84, 86 ];
			break;
		case 'verbs-placsuj':
			verbNumber = [ 100, 102, 104, 106, 108, 110 ];
			break;
		case 'verbs-pfacsuj':
			verbNumber = [ 88, 90, 92, 94, 96, 98 ];
			break;
		case 'verbs-prpasuj':
			verbNumber = [ 65, 67, 69, 71, 73, 75 ];
			break;
		case 'verbs-imppasuj':
			verbNumber = [ 77, 79, 81, 83, 85, 87 ];
			break;
		case 'verbs-pfpasuj':
			verbNumber = [ 89, 91, 93, 95, 97, 99 ];
			break;
		case 'verbs-plpasuj':
			verbNumber = [ 101, 103, 105, 107, 109, 111 ];
			break;
	}

	verbNumber.forEach( ( number ) => {
		e.checked
			? acceptableVerbs.push( number )
			: acceptableVerbs.splice( acceptableVerbs.indexOf( number ), 1 );
	} );

	document.getElementById( 'verbs-warning' ).style.display = 'none';

	if ( manualChange ) {
		collectData( 'Set verb selection ' + e.id + ' to be ' + e.checked, 'set_case_settings' );
		buildDeclensionOrConjugationTest( true, false );
	}
}

function handleVerbConjugations() {
	let verbForm;
	let filteredAcceptableVerbs = acceptableVerbs;

	if ( document.getElementById( 'verbs-fps-option' ).checked ) {
		let firstPersonSingular = [
			0, 1, 12, 13, 24, 25, 36, 37, 48, 49, 60, 61, 62, 64, 65, 76, 77, 88, 89, 100, 101, 112, 113,
			117, 118,
		];
		filteredAcceptableVerbs = acceptableVerbs.filter( function ( id ) {
			return firstPersonSingular.indexOf( id ) > -1;
		} );
	}

	let randomVerbsInteger =
		filteredAcceptableVerbs[ Math.floor( Math.random() * filteredAcceptableVerbs.length ) ];

	// Remove subjunctives from GCSE tests.
	let conjugationNumber = selectedOption === 'alevelocr' ? 128 : 64;

	switch (
		competitiveMode ? Math.floor( Math.random() * conjugationNumber ) : randomVerbsInteger
	) {
		// Present indicative.
		case 0:
			verbForm = 'first-person singular present active indicative';
			vocabConjugation = 'pracind1s';
			break;
		case 1:
			verbForm = 'first-person singular present passive indicative';
			vocabConjugation = 'prpaind1s';
			break;
		case 2:
			verbForm = 'second-person singular present active indicative';
			vocabConjugation = 'pracind2s';
			break;
		case 3:
			verbForm = 'second-person singular present passive indicative';
			vocabConjugation = 'prpaind2s';
			break;
		case 4:
			verbForm = 'third-person singular present active indicative';
			vocabConjugation = 'pracind3s';
			break;
		case 5:
			verbForm = 'third-person singular present passive indicative';
			vocabConjugation = 'prpaind3s';
			break;
		case 6:
			verbForm = 'first-person plural present active indicative';
			vocabConjugation = 'pracind1pl';
			break;
		case 7:
			verbForm = 'first-person plural present passive indicative';
			vocabConjugation = 'prpaind1pl';
			break;
		case 8:
			verbForm = 'second-person plural present active indicative';
			vocabConjugation = 'pracind2pl';
			break;
		case 9:
			verbForm = 'second-person plural present passive indicative';
			vocabConjugation = 'prpaind2pl';
			break;
		case 10:
			verbForm = 'third-person plural present active indicative';
			vocabConjugation = 'pracind3pl';
			break;
		case 11:
			verbForm = 'third-person plural present passive indicative';
			vocabConjugation = 'prpaind3pl';
			break;

		// Imperfect indicative.
		case 12:
			verbForm = 'first-person singular imperfect active indicative';
			vocabConjugation = 'impacind1s';
			break;
		case 13:
			verbForm = 'first-person singular imperfect passive indicative';
			vocabConjugation = 'imppaind1s';
			break;
		case 14:
			verbForm = 'second-person singular imperfect active indicative';
			vocabConjugation = 'impacind2s';
			break;
		case 15:
			verbForm = 'second-person singular imperfect passive indicative';
			vocabConjugation = 'imppaind2s';
			break;
		case 16:
			verbForm = 'third-person singular imperfect active indicative';
			vocabConjugation = 'impacind3s';
			break;
		case 17:
			verbForm = 'third-person singular imperfect passive indicative';
			vocabConjugation = 'imppaind3s';
			break;
		case 18:
			verbForm = 'first-person plural imperfect active indicative';
			vocabConjugation = 'impacind1pl';
			break;
		case 19:
			verbForm = 'first-person plural imperfect passive indicative';
			vocabConjugation = 'imppaind1pl';
			break;
		case 20:
			verbForm = 'second-person plural imperfect active indicative';
			vocabConjugation = 'impacind2pl';
			break;
		case 21:
			verbForm = 'second-person plural imperfect passive indicative';
			vocabConjugation = 'imppaind2pl';
			break;
		case 22:
			verbForm = 'third-person plural imperfect active indicative';
			vocabConjugation = 'impacind3pl';
			break;
		case 23:
			verbForm = 'third-person plural imperfect passive indicative';
			vocabConjugation = 'imppaind3pl';
			break;

		// Perfect indicative.
		case 24:
			verbForm = 'first-person singular perfect active indicative';
			vocabConjugation = 'pfacind1s';
			break;
		case 25:
			verbForm = 'first-person singular perfect passive indicative';
			vocabConjugation = 'pfpaind1s';
			break;
		case 26:
			verbForm = 'second-person singular perfect active indicative';
			vocabConjugation = 'pfacind2s';
			break;
		case 27:
			verbForm = 'second-person singular perfect passive indicative';
			vocabConjugation = 'pfpaind2s';
			break;
		case 28:
			verbForm = 'third-person singular perfect active indicative';
			vocabConjugation = 'pfacind3s';
			break;
		case 29:
			verbForm = 'third-person singular perfect passive indicative';
			vocabConjugation = 'pfpaind3s';
			break;
		case 30:
			verbForm = 'first-person plural perfect active indicative';
			vocabConjugation = 'pfacind1pl';
			break;
		case 31:
			verbForm = 'first-person plural perfect passive indicative';
			vocabConjugation = 'pfpaind1pl';
			break;
		case 32:
			verbForm = 'second-person plural perfect active indicative';
			vocabConjugation = 'pfacind2pl';
			break;
		case 33:
			verbForm = 'second-person plural perfect passive indicative';
			vocabConjugation = 'pfpaind2pl';
			break;
		case 34:
			verbForm = 'third-person plural perfect active indicative';
			vocabConjugation = 'pfacind3pl';
			break;
		case 35:
			verbForm = 'third-person plural perfect passive indicative';
			vocabConjugation = 'pfpaind3pl';
			break;

		// Pluperfect indicative.
		case 36:
			verbForm = 'first-person singular pluperfect active indicative';
			vocabConjugation = 'placind1s';
			break;
		case 37:
			verbForm = 'first-person singular pluperfect passive indicative';
			vocabConjugation = 'plpaind1s';
			break;
		case 38:
			verbForm = 'second-person singular pluperfect active indicative';
			vocabConjugation = 'placind2s';
			break;
		case 39:
			verbForm = 'second-person singular pluperfect passive indicative';
			vocabConjugation = 'plpaind2s';
			break;
		case 40:
			verbForm = 'third-person singular pluperfect active indicative';
			vocabConjugation = 'placind3s';
			break;
		case 41:
			verbForm = 'third-person singular pluperfect passive indicative';
			vocabConjugation = 'plpaind3s';
			break;
		case 42:
			verbForm = 'first-person plural pluperfect active indicative';
			vocabConjugation = 'placind1pl';
			break;
		case 43:
			verbForm = 'first-person plural pluperfect passive indicative';
			vocabConjugation = 'plpaind1pl';
			break;
		case 44:
			verbForm = 'second-person plural pluperfect active indicative';
			vocabConjugation = 'placind2pl';
			break;
		case 45:
			verbForm = 'second-person plural pluperfect passive indicative';
			vocabConjugation = 'plpaind2pl';
			break;
		case 46:
			verbForm = 'third-person plural pluperfect active indicative';
			vocabConjugation = 'placind3pl';
			break;
		case 47:
			verbForm = 'third-person plural pluperfect passive indicative';
			vocabConjugation = 'plpaind3pl';
			break;

		// Future indicative.
		case 48:
			verbForm = 'first-person singular future active indicative';
			vocabConjugation = 'ftacind1s';
			break;
		case 49:
			verbForm = 'first-person singular future passive indicative';
			vocabConjugation = 'ftpaind1s';
			break;
		case 50:
			verbForm = 'second-person singular future active indicative';
			vocabConjugation = 'ftacind2s';
			break;
		case 51:
			verbForm = 'second-person singular future passive indicative';
			vocabConjugation = 'ftpaind2s';
			break;
		case 52:
			verbForm = 'third-person singular future active indicative';
			vocabConjugation = 'ftacind3s';
			break;
		case 53:
			verbForm = 'third-person singular future passive indicative';
			vocabConjugation = 'ftpaind3s';
			break;
		case 54:
			verbForm = 'first-person plural future active indicative';
			vocabConjugation = 'ftacind1pl';
			break;
		case 55:
			verbForm = 'first-person plural future passive indicative';
			vocabConjugation = 'ftpaind1pl';
			break;
		case 56:
			verbForm = 'second-person plural future active indicative';
			vocabConjugation = 'ftacind2pl';
			break;
		case 57:
			verbForm = 'second-person plural future passive indicative';
			vocabConjugation = 'ftpaind2pl';
			break;
		case 58:
			verbForm = 'third-person plural future active indicative';
			vocabConjugation = 'ftacind3pl';
			break;
		case 59:
			verbForm = 'third-person plural future passive indicative';
			vocabConjugation = 'ftpaind3pl';
			break;

		// Participles and imperatives.
		case 60:
			verbForm = 'present active participle';
			vocabConjugation = 'pap';
			break;
		case 61:
			verbForm = 'perfect passive participle';
			vocabConjugation = 'ppp';
			break;
		case 62:
			verbForm = 'singular active imperative';
			vocabConjugation = 'imps';
			break;
		case 63:
			verbForm = 'plural active imperative';
			vocabConjugation = 'imppl';
			break;

		// Present subjunctive.
		case 64:
			verbForm = 'first-person singular present active subjunctive';
			vocabConjugation = 'pracsuj1s';
			break;
		case 65:
			verbForm = 'first-person singular present passive subjunctive';
			vocabConjugation = 'prpasuj1s';
			break;
		case 66:
			verbForm = 'second-person singular present active subjunctive';
			vocabConjugation = 'pracsuj2s';
			break;
		case 67:
			verbForm = 'second-person singular present passive subjunctive';
			vocabConjugation = 'prpasuj2s';
			break;
		case 68:
			verbForm = 'third-person singular present active subjunctive';
			vocabConjugation = 'pracsuj3s';
			break;
		case 69:
			verbForm = 'third-person singular present passive subjunctive';
			vocabConjugation = 'prpasuj3s';
			break;
		case 70:
			verbForm = 'first-person plural present active subjunctive';
			vocabConjugation = 'pracsuj1pl';
			break;
		case 71:
			verbForm = 'first-person plural present passive subjunctive';
			vocabConjugation = 'prpasuj1pl';
			break;
		case 72:
			verbForm = 'second-person plural present active subjunctive';
			vocabConjugation = 'pracsuj2pl';
			break;
		case 73:
			verbForm = 'second-person plural present passive subjunctive';
			vocabConjugation = 'prpasuj2pl';
			break;
		case 74:
			verbForm = 'third-person plural present active subjunctive';
			vocabConjugation = 'pracsuj3pl';
			break;
		case 75:
			verbForm = 'third-person plural present passive subjunctive';
			vocabConjugation = 'prpasuj3pl';
			break;

		// Imperfect subjunctive.
		case 76:
			verbForm = 'first-person singular imperfect active subjunctive';
			vocabConjugation = 'impacsuj1s';
			break;
		case 77:
			verbForm = 'first-person singular imperfect passive subjunctive';
			vocabConjugation = 'imppasuj1s';
			break;
		case 78:
			verbForm = 'second-person singular imperfect active subjunctive';
			vocabConjugation = 'impacsuj2s';
			break;
		case 79:
			verbForm = 'second-person singular imperfect passive subjunctive';
			vocabConjugation = 'imppasuj2s';
			break;
		case 80:
			verbForm = 'third-person singular imperfect active subjunctive';
			vocabConjugation = 'impacsuj3s';
			break;
		case 81:
			verbForm = 'third-person singular imperfect passive subjunctive';
			vocabConjugation = 'imppasuj3s';
			break;
		case 82:
			verbForm = 'first-person plural imperfect active subjunctive';
			vocabConjugation = 'impacsuj1pl';
			break;
		case 83:
			verbForm = 'first-person plural imperfect passive subjunctive';
			vocabConjugation = 'imppasuj1pl';
			break;
		case 84:
			verbForm = 'second-person plural imperfect active subjunctive';
			vocabConjugation = 'impacsuj2pl';
			break;
		case 85:
			verbForm = 'second-person plural imperfect passive subjunctive';
			vocabConjugation = 'imppasuj2pl';
			break;
		case 86:
			verbForm = 'third-person plural imperfect active subjunctive';
			vocabConjugation = 'impacsuj3pl';
			break;
		case 87:
			verbForm = 'third-person plural imperfect passive subjunctive';
			vocabConjugation = 'imppasuj3pl';
			break;

		// Perfect subjunctive.
		case 88:
			verbForm = 'first-person singular perfect active subjunctive';
			vocabConjugation = 'pfacsuj1s';
			break;
		case 89:
			verbForm = 'first-person singular perfect passive subjunctive';
			vocabConjugation = 'pfpasuj1s';
			break;
		case 90:
			verbForm = 'second-person singular perfect active subjunctive';
			vocabConjugation = 'pfacsuj2s';
			break;
		case 91:
			verbForm = 'second-person singular perfect passive subjunctive';
			vocabConjugation = 'pfpasuj2s';
			break;
		case 92:
			verbForm = 'third-person singular perfect active subjunctive';
			vocabConjugation = 'pfacsuj3s';
			break;
		case 93:
			verbForm = 'third-person singular perfect passive subjunctive';
			vocabConjugation = 'pfpasuj3s';
			break;
		case 94:
			verbForm = 'first-person plural perfect active subjunctive';
			vocabConjugation = 'pfacsuj1pl';
			break;
		case 95:
			verbForm = 'first-person plural perfect passive subjunctive';
			vocabConjugation = 'pfpasuj1pl';
			break;
		case 96:
			verbForm = 'second-person plural perfect active subjunctive';
			vocabConjugation = 'pfacsuj2pl';
			break;
		case 97:
			verbForm = 'second-person plural perfect passive subjunctive';
			vocabConjugation = 'pfpasuj2pl';
			break;
		case 98:
			verbForm = 'third-person plural perfect active subjunctive';
			vocabConjugation = 'pfacsuj3pl';
			break;
		case 99:
			verbForm = 'third-person plural perfect passive subjunctive';
			vocabConjugation = 'pfpasuj3pl';
			break;

		// Pluperfect subjunctive.
		case 100:
			verbForm = 'first-person singular pluperfect active subjunctive';
			vocabConjugation = 'placsuj1s';
			break;
		case 101:
			verbForm = 'first-person singular pluperfect passive subjunctive';
			vocabConjugation = 'plpasuj1s';
			break;
		case 102:
			verbForm = 'second-person singular pluperfect active subjunctive';
			vocabConjugation = 'placsuj2s';
			break;
		case 103:
			verbForm = 'second-person singular pluperfect passive subjunctive';
			vocabConjugation = 'plpasuj2s';
			break;
		case 104:
			verbForm = 'third-person singular pluperfect active subjunctive';
			vocabConjugation = 'placsuj3s';
			break;
		case 105:
			verbForm = 'third-person singular pluperfect passive subjunctive';
			vocabConjugation = 'plpasuj3s';
			break;
		case 106:
			verbForm = 'first-person plural pluperfect active subjunctive';
			vocabConjugation = 'placsuj1pl';
			break;
		case 107:
			verbForm = 'first-person plural pluperfect passive subjunctive';
			vocabConjugation = 'plpasuj1pl';
			break;
		case 108:
			verbForm = 'second-person plural pluperfect active subjunctive';
			vocabConjugation = 'placsuj2pl';
			break;
		case 109:
			verbForm = 'second-person plural pluperfect passive subjunctive';
			vocabConjugation = 'plpasuj2pl';
			break;
		case 110:
			verbForm = 'third-person plural pluperfect active subjunctive';
			vocabConjugation = 'placsuj3pl';
			break;
		case 111:
			verbForm = 'third-person plural pluperfect passive subjunctive';
			vocabConjugation = 'plpasuj3pl';
			break;

		// Infinitives.
		case 112:
			verbForm = 'present active infinitive';
			vocabConjugation = 'infpr';
			break;
		case 113:
			verbForm = 'perfect active infinitive';
			vocabConjugation = 'infpf';
			break;
		case 114:
			verbForm = 'future active infinitive';
			vocabConjugation = 'infft';
			break;
		case 115:
			verbForm = 'perfect passive infinitive';
			vocabConjugation = 'infpfpa';
			break;
		case 116:
			verbForm = 'future passive infinitive';
			vocabConjugation = 'infftpa';
			break;

		// Future perfect.
		case 117:
			verbForm = 'first-person singular future perfect active indicative';
			vocabConjugation = 'fpacind1s';
			break;
		case 118:
			verbForm = 'first-person singular future perfect passive indicative';
			vocabConjugation = 'fppaind1s';
			break;
		case 119:
			verbForm = 'second-person singular future perfect active indicative';
			vocabConjugation = 'fpacind2s';
			break;
		case 120:
			verbForm = 'second-person singular future perfect passive indicative';
			vocabConjugation = 'fppaind2s';
			break;
		case 121:
			verbForm = 'third-person singular future perfect active indicative';
			vocabConjugation = 'fpacind3s';
			break;
		case 122:
			verbForm = 'third-person singular future perfect passive indicative';
			vocabConjugation = 'fppaind3s';
			break;
		case 123:
			verbForm = 'first-person plural future perfect active indicative';
			vocabConjugation = 'fpacind1pl';
			break;
		case 124:
			verbForm = 'first-person plural future perfect passive indicative';
			vocabConjugation = 'fppaind1pl';
			break;
		case 125:
			verbForm = 'second-person plural future perfect active indicative';
			vocabConjugation = 'fpacind2pl';
			break;
		case 126:
			verbForm = 'second-person plural future perfect passive indicative';
			vocabConjugation = 'fppaind2pl';
			break;
		case 127:
			verbForm = 'third-person plural future perfect active indicative';
			vocabConjugation = 'fpacind3pl';
			break;
		case 128:
			verbForm = 'third-person plural future perfect passive indicative';
			vocabConjugation = 'fppaind3pl';
			break;
	}

	document.getElementById( 'vocab-submit-word-form' ).innerHTML = verbForm + ' form';

	return vocabConjugation;
}

function handleNounSelection( e ) {
	if ( ! e.checked && e.id === 'declensions-noun-2' ) {
		document.getElementById( 'declensions-noun-2-remove-er' ).checked = false;
	}

	if (
		! document.querySelectorAll( '.noun-types .toggle:not(.other) input[type="checkbox"]:checked' )
			.length
	) {
		e.checked = true;
		return ( document.getElementById( 'declensions-warning' ).style.display = 'block' );
	}

	collectData(
		'Set declension selection ' + e.id + ' to be ' + e.checked,
		'set_declension_settings'
	);

	document.getElementById( 'declensions-warning' ).style.display = 'none';
	buildDeclensionOrConjugationTest( false, false );
}

function handleCaseSelection( e ) {
	if ( ! document.querySelectorAll( '.case-types input[type="checkbox"]:checked' ).length ) {
		e.checked = true;
		return ( document.getElementById( 'declensions-warning' ).style.display = 'block' );
	}

	let caseNumber;
	switch ( e.id ) {
		case 'cases-nominative':
			caseNumber = [ 0, 1 ];
			break;
		case 'cases-vocative':
			caseNumber = [ 2, 3 ];
			break;
		case 'cases-accusative':
			caseNumber = [ 4, 5 ];
			break;
		case 'cases-genitive':
			caseNumber = [ 6, 7 ];
			break;
		case 'cases-dative':
			caseNumber = [ 8, 9 ];
			break;
		case 'cases-ablative':
			caseNumber = [ 10, 11 ];
			break;
	}

	caseNumber.forEach( ( number ) =>
		e.checked
			? acceptableCases.push( number )
			: acceptableCases.splice( acceptableCases.indexOf( number ), 1 )
	);

	collectData( 'Set case selection ' + e.id + ' to be ' + e.checked, 'set_case_settings' );

	document.getElementById( 'declensions-warning' ).style.display = 'none';
	buildDeclensionOrConjugationTest( false, false );
}

function handleNounDeclensions() {
	let wordForm;
	let randomCasesInteger = parseInt(
		acceptableCases[ Math.floor( Math.random() * acceptableCases.length ) ]
	);

	switch ( competitiveMode ? Math.floor( Math.random() * 12 ) : randomCasesInteger ) {
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

function constructWordTable( changingVerbTable = false ) {
	let answer = findWord( document.getElementById( 'word-table-select' ).value ) || currentWord;
	let selectedIndex = document.getElementById( 'word-table-select' ).selectedIndex;
	let optionType = document
		.querySelector( '#word-table-select option:nth-of-type(' + ( selectedIndex + 1 ) + ')' )
		.getAttribute( 'data-type' );

	if ( isTestingDeclensions ) {
		let declensionCells = document.querySelectorAll( '.further-content .noun-table table td' );

		collectData(
			'Answer declension table shown for ' + answer.word,
			'constructed_declension_table'
		);

		declensionCells.forEach( ( cell ) => {
			if ( cell.id && cell.id.endsWith( 'slot' ) ) {
				let key = cell.id.replace( '-slot', '' );
				cell.innerHTML = answer[ key ];
				cell.classList.remove( 'is-highlighted' );
			}
		} );
	}

	if ( isTestingConjugations ) {
		let verbCells = document.querySelectorAll( '.further-content .verb-tables table td' );

		collectData( 'Answer verb table shown for ' + answer.word, 'constructed_verb_table' );

		verbCells.forEach( ( cell ) => {
			if ( cell.id && cell.id.endsWith( 'slot' ) ) {
				let key = cell.id.replace( '-slot', '' );
				if ( cell.childNodes[ 3 ] ) {
					cell.childNodes[ 3 ].innerHTML = answer[ key ];
				}
				cell.classList.remove( 'is-highlighted' );
			}
		} );

		let indicativeOrSubjunctive = optionType.includes( 'suj' ) ? 'suj' : 'ind';
		let wordTableId = optionType.substring( 0, 2 ) + indicativeOrSubjunctive + '-table';

		if ( ! /\d/.test( optionType ) ) {
			wordTableId = 'other-verbs-table';
		}

		if ( ! changingVerbTable ) {
			document.getElementById( 'verb-type-table-select' ).value = wordTableId;
		}

		wordTableId = document.getElementById( 'verb-type-table-select' ).value;

		if ( isTableMode ) {
			wordTableId = document
				.querySelector( '.verb-table-option-button.is-selected' )
				.id.replace( 'button', 'table' );
		}

		let verbTableWrapper = document.querySelectorAll( '.further-content .verb-table' );

		for ( let i = 0; i < verbTableWrapper.length; i++ ) {
			verbTableWrapper[ i ].classList.remove( 'is-active' );
		}

		document
			.querySelector( '.further-content .verb-tables #' + wordTableId )
			.classList.add( 'is-active' );
	}

	let highlightedSlot = document.querySelector( 'td.is-higlighted' );
	let slot = document.getElementById( optionType + '-slot' );

	if ( highlightedSlot ) {
		highlightedSlot.classList.remove( 'is-highlighted' );
	}

	if ( slot ) {
		slot.classList.add( 'is-highlighted' );
	}
}

function toggleTableMode() {
	if ( ! isTableMode ) {
		collectData( 'Toggled table mode to be true', 'toggle_table_mode' );
		isTableMode = true;
		document.body.classList.add( 'is-table-mode' );
		toggleWordTable( true );
		return;
	}

	collectData( 'Toggled table mode to be false', 'toggle_table_mode' );
	isTableMode = false;
	document.body.classList.remove( 'is-table-mode' );
	toggleWordTable( false );
}

function resetTableMode() {
	let markedTables = document.querySelectorAll( '.verb-table.is-marked' );

	for ( let i = 0; i < markedTables.length; i++ ) {
		markedTables[ i ].classList.remove( 'is-marked' );
	}

	let correctAnswers = document.querySelectorAll( '.verb-table .answer-correct' );
	for ( let i = 0; i < correctAnswers.length; i++ ) {
		correctAnswers[ i ].classList.remove( 'answer-correct' );
	}

	let incorrectAnswers = document.querySelectorAll( '.verb-table .answer-incorrect' );
	for ( let i = 0; i < incorrectAnswers.length; i++ ) {
		incorrectAnswers[ i ].classList.remove( 'answer-incorrect' );
	}

	let answerInputs = document.querySelectorAll( '.verb-table input' );
	for ( let i = 0; i < answerInputs.length; i++ ) {
		answerInputs[ i ].value = '';
	}
}

function handleWordTableSelection( e ) {
	let verbTableOptions = document.querySelectorAll( '#verb-type-table-mode-menu button' );

	for ( let i = 0; i < verbTableOptions.length; i++ ) {
		verbTableOptions[ i ].classList.remove( 'is-selected' );
	}

	e.classList.add( 'is-selected' );

	playAudio();

	collectData( 'Switched verb test to ' + e.id.replace( '-button', '' ), 'switch_verb_test' );

	constructWordTable( true );
}

function generateNewTableWord() {
	playAudio();

	const verbTables = document.querySelectorAll(
		'.further-content .verb-tables .verb-table.is-active table td input'
	);

	const hasStartedTable = Array.from( verbTables ).some( ( input ) => {
		return input.value;
	} );

	if (
		hasStartedTable &&
		! document
			.querySelector( '.further-content .verb-tables .verb-table.is-active' )
			.classList.contains( 'is-marked' )
	) {
		document.getElementById( 'warning-continue-action' ).onclick = function () {
			buildDeclensionOrConjugationTest( true );
			warningModalActioned();
		};
		return openWarningModal();
	}

	buildDeclensionOrConjugationTest( true );

	collectData( 'Answer completed and generated new word', 'generate_new_table_word' );
}

function checkTableModeAnswer() {
	if (
		document
			.querySelector( '.further-content .verb-tables .verb-table.is-active' )
			.classList.contains( 'is-marked' )
	) {
		return;
	}

	let currentCount = 0;
	let verbTable = document.querySelectorAll(
		'.further-content .verb-tables .verb-table.is-active table td'
	);

	for ( let i = 0; i < verbTable.length; i++ ) {
		if ( verbTable[ i ].id && verbTable[ i ].id.endsWith( 'slot' ) ) {
			let enteredAnswer = verbTable[ i ].childNodes[ 1 ].value.toLowerCase().trim();
			let realAnswer = verbTable[ i ].childNodes[ 3 ].textContent.toLowerCase();
			let isAnswerCorrect = enteredAnswer === realAnswer;

			if ( isAnswerCorrect ) {
				verbTable[ i ].classList.add( 'answer-correct' );
				currentCount++;
			} else {
				verbTable[ i ].classList.add( 'answer-incorrect' );
				verbTable[ i ].childNodes[ 3 ].innerHTML = enteredAnswer.length
					? '<span>Entered: ' + enteredAnswer + '</span><span>' + realAnswer + '</span>'
					: realAnswer;
			}
		}
	}
	collectData(
		'Answers checked in table mode: ' + currentCount + ' correct',
		'table_mode_answer_checked'
	);

	document
		.querySelector( '.further-content .verb-tables .verb-table.is-active' )
		.classList.add( 'is-marked' );

	playAudio();
}

function constructVocabSelectionTable() {
	let table = '<tbody>';
	for ( i = 0; i < allVocab.length; i++ ) {
		let category = allVocab[ i ].category;

		if ( Number.isInteger( parseInt( allVocab[ i ].category ) ) ) {
			category = 'stage ' + allVocab[ i ].category;
		}

		if ( typeof allVocab[ i ].alternativeCategory === 'string' ) {
			category += ' & ' + allVocab[ i ].alternativeCategory;
		}

		if ( allVocab[ i ].category === 'other' ) {
			category = 'other stage';
		}

		table += '<tr>';
		table += '<td>' + allVocab[ i ].word + '</td>';
		table += '<td>' + category.replace( /^custom-/, '' ) + '</td>';
		table += '<td>' + allVocab[ i ].translation + '</td>';

		table +=
			'<td><div onclick="discardVocabSelection(\'' + i + '\')" class="trash-icon"></div></td>';

		table += '</tr>';
	}
	table += '</tbody>';
	document.getElementById( 'vocabulary-table' ).innerHTML = table;
}

function discardVocabSelection( id ) {
	if ( allVocab.length === 1 ) {
		return ( document.getElementById( 'vocabulary-selection-error' ).style.display = 'block' );
	}

	allVocab.splice( parseInt( id ), 1 );
	constructVocabSelectionTable();
	document.getElementById( 'vocabulary-selection-error' ).style.display = 'none';
	collectData( 'Answer discarded in vocabulary selection', 'discarded_vocabulary_section' );
}

function toggleVocabSelectionTable( display ) {
	if ( display ) {
		constructVocabSelectionTable();
		document.getElementById( 'modal' ).style.display = 'block';
		collectData( 'Displayed vocabulary selection table', 'displayed_vocab_selection_table' );
		return;
	}

	collectData( 'Dismissed vocabulary selection table', 'dismissed_vocab_selection_table' );

	document.getElementById( 'modal' ).style.display = 'none';
}

window.onclick = function ( event ) {
	if ( event.target === document.getElementById( 'modal' ) ) {
		toggleVocabSelectionTable( false );
	}

	if ( event.target === document.getElementById( 'games-modal' ) ) {
		closeGamesModal();
	}

	if ( event.target === document.getElementById( 'warning-modal' ) ) {
		closeWarningModal();
	}

	if ( event.target === document.getElementById( 'about-modal' ) ) {
		closeAboutModal();
	}

	if ( event.target === document.getElementById( 'custom-list-modal' ) ) {
		closeCustomListHelpModal();
	}
};

function openAboutModal() {
	document.getElementById( 'about-modal' ).style.display = 'flex';
	collectData( 'Opened about modal', 'opened_about_modal' );
}

function closeAboutModal() {
	document.getElementById( 'about-modal' ).style.display = 'none';
	collectData( 'Closed about modal', 'closed_about_modal' );
}

function openCustomListHelpModal() {
	document.getElementById( 'custom-list-modal' ).style.display = 'flex';
	collectData( 'Opened custom lists help modal', 'opened_custom_lists_modal' );
}

function closeCustomListHelpModal() {
	document.getElementById( 'custom-list-modal' ).style.display = 'none';
	collectData( 'Closed custom lists help modal', 'closed_custom_lists_modal' );
}

function openGamesModal() {
	document.getElementById( 'games-modal' ).style.display = 'flex';
	collectData( 'Opened games modal', 'opened_games_model' );
}

function closeGamesModal() {
	document.getElementById( 'games-modal' ).style.display = 'none';
	collectData( 'Closed games modal', 'closed_games_model' );
}

function openWarningModal() {
	document.getElementById( 'warning-modal' ).style.display = 'flex';
	collectData( 'Opened games modal', 'opened_games_model' );
}

function closeWarningModal() {
	document.getElementById( 'warning-modal' ).style.display = 'none';
	collectData( 'Closed warning modal', 'closed_warning_model' );
}

function warningModalActioned() {
	document.getElementById( 'warning-modal' ).style.display = 'none';
	collectData( 'Continued action despite warning modal', 'ignored_warning_model' );
}

function sortVocabSelectionTable( column ) {
	allVocab
		.sort( ( a, b ) => a[ column ].localeCompare( b[ column ] ) )
		.sort( function ( a, b ) {
			return (
				parseInt( a[ column ].replace( 'stage', '' ) ) -
				parseInt( b[ column ].replace( 'stage', '' ) )
			);
		} );
	constructVocabSelectionTable();
	collectData( 'Sorted vocabulary selection table by ' + column, 'sorted_vocab_selection_table' );
}

function toggleWordTable( show ) {
	let wordTablePrompt = competitiveMode ? 'word-table-prompt-competitive' : 'word-table-prompt';
	if ( ! show ) {
		document.getElementById( 'word-table' ).classList.remove( 'is-active' );
		document.getElementById( wordTablePrompt ).innerHTML = isTestingDeclensions
			? 'Show declensions table'
			: 'Show verb tables';
		document.getElementById( wordTablePrompt ).onclick = function () {
			toggleWordTable( true );
		};
		document.body.classList.remove( 'is-displaying-word-table' );
		document.body.classList.remove( 'is-displaying-enhanced-word-table' );
		window.scrollTo( 0, 0 );
	} else {
		constructWordTable();
		document.getElementById( 'word-table' ).classList.add( 'is-active' );
		document.getElementById( wordTablePrompt ).innerHTML = isTestingDeclensions
			? 'Hide declensions table'
			: 'Hide verb tables';
		document.getElementById( wordTablePrompt ).onclick = function () {
			toggleWordTable( false );
		};
		document.body.classList.add( 'is-displaying-word-table' );
	}
}

function toggleEnhancedWordTable() {
	if ( competitiveMode ) {
		document.getElementById( 'return-to-test-prompt' ).innerHTML = 'Return to Leaderboard';
	}

	document.body.classList.add( 'is-displaying-enhanced-word-table' );
	window.scrollTo( 0, 0 );
	collectData( 'Displayed enhanced word table', 'displayed_enhanced_word_table' );
}

function handleSubjunctiveTableSelection( e ) {
	if ( e.checked ) {
		document.getElementById( 'word-table' ).classList.add( 'is-displaying-subjunctives' );
	} else {
		document.getElementById( 'word-table' ).classList.remove( 'is-displaying-subjunctives' );
	}
	collectData(
		'Set subjunctive tables on enhanced table display as ' + e.checked,
		'toggled_subjunctive_table'
	);
	window.scrollTo( 0, 0 );
}

function isValidCustomList( list ) {
	return (
		Array.isArray( list ) &&
		list.every(
			( item ) =>
				typeof item.word === 'string' &&
				typeof item.translation === 'string' &&
				typeof item.category === 'string'
		)
	);
}

function csvToJSON( csvString ) {
	const placeholder = '###__PLACEHOLDER__###';

	const replaced = csvString.replace( /"([^"]*)"/g, ( match, p ) => {
		return `"${ p.replace( /,/g, placeholder ) }"`;
	} );

	const lines = replaced.trim().split( '\n' );
	const headers = lines[ 0 ].split( ',' ).map( ( h ) => h.trim() );

	return lines.slice( 1 ).map( ( line ) => {
		const values = line
			.split( ',' )
			.map( ( v ) =>
				v.trim().replace( new RegExp( placeholder, 'g' ), ',' ).replace( /^"|"$/g, '' )
			);
		return headers.reduce( ( obj, header, i ) => {
			obj[ header ] = values[ i ] || '';
			return obj;
		}, {} );
	} );
}

function handleCustomList( list ) {
	let vocabCustomListCategories = [];
	let savedCustomList = localStorage.getItem( 'customList' );
	let updatedCustomList = savedCustomList ? JSON.parse( savedCustomList ) : [];

	list.forEach( ( word ) => {
		word.asked = false;

		if ( ! word.category.startsWith( 'custom-' ) ) {
			word.category = 'custom-' + word.category;
		}

		if ( ! vocabCustomListCategories.includes( word.category ) ) {
			vocabCustomListCategories.push( word.category );
		}

		let wordIsInExistingList = updatedCustomList.some(
			( existingWord ) => existingWord.word === word.word && existingWord.category === word.category
		);

		if ( ! wordIsInExistingList ) {
			updatedCustomList.push( word );
		}
	} );

	vocabCustomListCategories.sort();
	localStorage.setItem( 'customList', JSON.stringify( updatedCustomList ) );
	vocabCustomList = list;
	vocab = list;

	vocabCustomListCategories.forEach( ( category ) => {
		if ( document.getElementById( category ) ) {
			return;
		}

		let button = document.createElement( 'button' );
		button.id = category;
		button.className = 'vocab-type';
		button.onclick = function () {
			formAcceptableVocab( category );
		};

		button.innerHTML =
			'<div class="custom-category"><p>' +
			category.replace( /^custom-/, '' ) +
			'</p><div onclick="removeCustomCategory(\'' +
			category +
			'\')" class="trash-icon"></div></div>';

		document.querySelector( '.custom-lists .row-wrapper .button-group' ).appendChild( button );
	} );

	let formattedCategories = vocabCustomListCategories.map( ( category ) =>
		category.replace( /^custom-/, '' )
	);
	collectData(
		'Added categories from custom list: ' + formattedCategories.join( ', ' ),
		'added_custom_categories'
	);
}

function isJSONFile( list ) {
	try {
		return JSON.parse( list ) && !! list;
	} catch ( e ) {
		return false;
	}
}

function removeCustomCategory( category ) {
	let savedList = JSON.parse( localStorage.getItem( 'customList' ) ) || [];
	wordsInCategory = vocabCustomList.filter( function ( vocab ) {
		return vocab.category === category;
	} );

	collectData( 'Removed category from custom list ' + category, 'removed_custom_category' );

	wordsInCategory.forEach( ( word ) => {
		vocabCustomList.splice(
			vocabCustomList.findIndex( ( item ) => item.word === word.word ),
			1
		);

		let savedListIndex = savedList.findIndex( ( item ) => item.word === word.word );

		if ( savedListIndex !== -1 ) {
			savedList.splice( savedListIndex, 1 );
		}
	} );

	localStorage.setItem( 'customList', JSON.stringify( savedList ) );

	let categoryButton = document.getElementById( category );
	categoryButton.parentNode.removeChild( categoryButton );
	playAudio();

	if ( ! vocabCustomList.length ) {
		collectData( 'Removed all categories from custom list', 'removed_all_custom_categories' );
		document.body.classList.remove( 'has-custom-list-option' );
		changeOption( 'alevelocr', false );
	}
}

function buildTest() {
	finalVocab = vocabToTest.concat( findVocab() );

	let select = document.getElementById( 'max-word-select' );
	let trimmedWordSelection = parseInt( select.options[ select.selectedIndex ].text );

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

	currentWord = finalVocab[ randomNumber ];

	if ( acceptableVocab.includes( 'redo' ) ) {
		allVocabLength = document.getElementById( 'wrong-vocab' ).childElementCount - 1;
	}

	let numberofWordsToAnswer = Math.min( trimmedWordSelection, allVocab.length );
	document.getElementById( 'progress-indicator-set' ).innerHTML = numberofWordsToAnswer;

	let wordString = numberofWordsToAnswer === 1 ? ' word' : ' words';
	document.getElementById( 'celebration-word-count' ).innerHTML =
		numberofWordsToAnswer + wordString;

	// If there are more words to ask, else all words have been asked (so celebrate)
	if ( numberofWordsToAnswer > vocabAnswered.length ) {
		finalVocab[ randomNumber ].asked = true;

		document.getElementById( 'vocab-question' ).innerHTML = currentWord.word;

		if ( hardDifficulty ) {
			document.getElementById( 'vocab-question' ).innerHTML = currentWord.translation;
		}

		let verbsWithParticiples = [
			'verb 1',
			'verb 2',
			'verb 3',
			'verb 1 dep',
			'verb 2 dep',
			'verb 3 dep',
			'verb irreg',
		];
		let wordForm;

		if ( hardDifficulty ) {
			if (
				( verbsWithParticiples.includes( currentWord.category ) &&
					currentWord.word.split( ',' ).length > 2 ) ||
				currentWord.impacsuj1s
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
			} else if ( currentWord.noms ) {
				switch ( Math.floor( Math.random() * 2 ) ) {
					case 0:
						wordForm = 'nominative singular form';
						break;
					case 1:
						wordForm = 'genitive singular form';
						break;
				}
				isTestingParticipleParts = true;
			} else {
				wordForm = 'Latin translation';
				isTestingParticipleParts = false;
			}
		} else {
			isTestingParticipleParts = false;
			wordForm = 'translation';
		}

		document.getElementById( 'vocab-submit-word-form' ).innerHTML = wordForm;

		return;
	}

	let correctReanswerCount = allVocab.filter(
		( item ) => ! item.hasOwnProperty( 'retriedIncorrectly' )
	).length;
	let toggleRetest = correctReanswerCount !== allVocab.length && correctReanswerCount > 0;
	let wordLabel = correctReanswerCount === 1 ? ' word' : ' words';

	document
		.getElementById( 'vocab-tester-wrapper' )
		.classList.toggle( 'show-retest-prompt', toggleRetest );
	document.getElementById( 'retry-count' ).innerHTML = correctReanswerCount + wordLabel;

	if (
		acceptableVocab.every( ( item ) => item === 'redo' ) &&
		correctReanswerCount === allVocab.length
	) {
		document.getElementById( 'vocab-tester-wrapper' ).classList.add( 'show-retest-complete' );
		collectData( 'Completed retest of all incorrect words', 'completed_incorrect_words' );
	}

	document.getElementById( 'vocab-tester-wrapper' ).classList.add( 'is-complete' );
	playAudio( 'complete' );

	if ( document.getElementById( 'wrong-vocab' ).childElementCount > 1 ) {
		document.getElementById( 'retry-test-button' ).classList.remove( 'is-inactive' );
		document.getElementById( 'retry-test-prompt' ).classList.remove( 'is-inactive' );
	}
}

function selectAll( context ) {
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
			'verb irreg',
			'noun 1',
			'noun 2',
			'noun 3',
			'noun 4',
			'noun 5',
			'adj',
			'adverb',
			'conjunction',
			'prep',
			'pron',
			'misc',
			'verb 4 dep',
		];
	}

	if ( selectedOption === 'gcseocr' ) {
		allOptions.splice( 18, 2 );
	}

	if ( selectedOption === 'gcseeduqas' ) {
		for ( let i = 1; i < 35; i++ ) {
			allOptions.push( i.toString() );
		}

		allOptions.push( 'other' );
	}

	if ( selectedOption === 'clc' ) {
		for ( let i = 1; i < 41; i++ ) {
			allOptions.push( i.toString() );
		}
	}

	if ( selectedOption === 'custom-list' ) {
		document
			.querySelector( '.custom-lists' )
			.querySelectorAll( '.vocab-type' )
			.forEach( ( list ) => allOptions.push( list.id ) );
	}

	if ( selectedOption === 'literature' ) {
		for ( let i = 0; i < 11; i++ ) {
			allOptions.push( 'ovid-list-' + i );
			allOptions.push( 'prose-list-' + i );
		}
		allOptions.push( 'prose-list-datives' );
		allOptions.push( 'john-taylor-verse' );
	}

	let isPreviouslyMuted = mute;
	mute = true;

	let deselect = context === 'change-option' || context === 'deselect-all';

	allOptions.forEach( ( option ) => {
		if (
			( ! acceptableVocab.includes( option ) && ! deselect ) ||
			( acceptableVocab.includes( option ) && deselect )
		) {
			formAcceptableVocab( option );
		}
	} );

	if ( ! isPreviouslyMuted ) {
		mute = false;

		if ( context !== 'change-option' ) {
			// Otherwise it'd play at least 50 times at once - not nice for the ears!
			new Audio( './assets/audio/click.mp3' ).play();
		}
	}

	if ( context !== 'change-option' ) {
		deselect
			? collectData( 'Deselected all options', 'deselected_all_options' )
			: collectData( 'Selected all options', 'selected_all_options' );
	}
}

function checkDeclensionOrConjugationAnswer( shouldReveal = false ) {
	let question = document.getElementById( 'vocab-submit-word-form' ).textContent;
	let answerInput = document.getElementById( 'vocab-answer' );
	let enteredAnswer = answerInput.value.toLowerCase().trim();
	let progressIndicator = document.getElementById( 'progress-indicator-changing' );
	let actualAnswer = isTestingConjugations
		? currentWord[ vocabConjugation ]
		: currentWord[ vocabDeclension ];
	let isAnswerCorrect = enteredAnswer === actualAnswer;
	let testType = isTestingConjugations ? 'conjugation' : 'declension';

	if ( ! shouldReveal && enteredAnswer === '' ) {
		return;
	}

	if ( shouldReveal && competitiveMode ) {
		collectData( 'Competitive answered revealed: ' + question );
		return;
	}

	if ( shouldReveal ) {
		answerInput.value = actualAnswer;
		collectData(
			'Answer revealed in ' + testType + ' test for ' + question + ' of ' + currentWord.word,
			'revealed_' + testType + '_answer'
		);
	} else {
		document.getElementById( 'wrong-answer' ).style.display = isAnswerCorrect ? 'none' : 'block';
		document.getElementById( 'grammar-info' ).classList.remove( 'is-active' );
		document.getElementById( 'grammar-info-competition' ).classList.remove( 'is-active' );

		if ( isAnswerCorrect ) {
			answerInput.value = '';
			progressIndicator.innerHTML = parseInt( progressIndicator.textContent ) + 1;
			playAudio( 'correct' );

			if ( competitiveMode ) {
				collectData(
					'Competitive answer: ' +
						enteredAnswer +
						' for ' +
						question +
						' at ' +
						new Date().toLocaleTimeString()
				);
			}

			collectData(
				'Answered ' +
					testType +
					' question correctly by inputting ' +
					enteredAnswer +
					' for ' +
					question,
				'correct_' + testType + '_answer'
			);
			answerInput.focus();
			toggleWordTable( false );
			return buildDeclensionOrConjugationTest( isTestingConjugations );
		}

		if ( ! isAnswerCorrect ) {
			checkIncorrectAnswerGrammar();
		}

		playAudio( 'wrong' );

		collectData(
			'Answered ' +
				testType +
				' question incorrectly by inputting ' +
				enteredAnswer +
				' when expecting ' +
				actualAnswer +
				' for ' +
				question,
			'incorrect_' + testType + '_answer'
		);

		if ( competitiveMode ) {
			document.getElementById( 'competition-correction' ).innerHTML =
				'You entered <strong>' +
				enteredAnswer +
				'</strong> as the ' +
				question +
				' for <strong>' +
				currentWord.word +
				'</strong> instead of <strong>' +
				actualAnswer +
				'</strong>.';
			return endCompetitionTimer();
		}
	}
}

function checkAnswer( shouldReveal = false ) {
	if ( isTestingDeclensions || isTestingConjugations ) {
		return checkDeclensionOrConjugationAnswer( shouldReveal );
	}

	let question = currentWord.word;
	let answer = document.getElementById( 'vocab-answer' ).value.toLowerCase().trim();
	let form = document.getElementById( 'vocab-submit-word-form' ).textContent;
	let answerInput = document.getElementById( 'vocab-answer' );
	let incorrectCount = document.getElementById( 'vocab-incorrect-count' );
	let incorrectCountNumber = parseInt( incorrectCount.textContent );
	let answerArray = hardDifficulty
		? currentWord.word.split( ',' )
		: currentWord.translation.split( ',' );

	if ( ! shouldReveal && answer === '' ) {
		return;
	}

	let additionalAnswers = [];
	for ( let i = 0; i < answerArray.length; i++ ) {
		if ( answerArray[ i ].includes( '(' ) && answerArray[ i ].includes( ')' ) ) {
			additionalAnswers.push( answerArray[ i ].replace( '(', '*' ).split( '*' )[ 0 ] );
		}

		if ( answerArray[ i ].includes( '?' ) ) {
			additionalAnswers.concat( answerArray[ i ].split( '?' ) );
		}

		if (
			answerArray[ i ].includes( '(' ) ||
			answerArray[ i ].includes( ';' ) ||
			answerArray[ i ].includes( '-' ) ||
			answerArray[ i ].includes( '?' )
		) {
			additionalAnswers.push( answerArray[ i ].replace( /\(|\)|\;|\?|\-/gi, '' ) );
		}
	}

	answerArray = answerArray.concat( additionalAnswers );

	for ( let i = 0; i < answerArray.length; i++ ) {
		answerArray[ i ] = answerArray[ i ].toLowerCase().trim();
	}

	let isAnswerCorrect = false;

	if ( ! isTestingParticipleParts ) {
		isAnswerCorrect = answerArray.includes( answer );
	} else {
		if ( form.includes( 'first' ) ) {
			isAnswerCorrect = answer === answerArray[ 0 ] || answer === currentWord.pracind1s;
		} else if ( form.includes( 'second' ) ) {
			isAnswerCorrect = answer === answerArray[ 1 ] || answer === currentWord.infpr;
		} else if ( form.includes( 'third' ) ) {
			isAnswerCorrect = answer === answerArray[ 2 ] || answer === currentWord.pfacind1s;
		} else if ( form.includes( 'nominative' ) ) {
			isAnswerCorrect = answer === currentWord.noms;
		} else if ( form.includes( 'genitive' ) ) {
			isAnswerCorrect = answer === currentWord.gens;
		}
	}

	if ( answer.length === 1 && ! [ 'a', 'e', 'i' ].includes( answer ) ) {
		// Ensures genders aren't accepted as valid answers.
		isAnswerCorrect = false;
	}

	if ( currentWord.didReveal !== true ) {
		currentWord.didReveal = false;
	}

	// Revealed answer.
	if ( shouldReveal ) {
		document.getElementById( 'wrong-answer' ).style.display = 'none';
		document.getElementById( 'no-words-wrong' ).style.display = 'none';
		document.getElementById( 'export-incorrect-vocab-sidebar' ).style.display = 'block';

		collectData( 'Answer revealed for ' + question, 'revealed_answer' );

		if ( competitiveMode ) {
			collectData( 'Competitive answered revealed: ' + question );
			return;
		}

		currentWord.didReveal = true;

		if ( ! isTestingParticipleParts ) {
			answerInput.value = answerArray[ 0 ];
		} else {
			if ( form.includes( 'first' ) ) {
				answerInput.value = currentWord.pracind1s || answerArray[ 0 ];
			} else if ( form.includes( 'second' ) ) {
				answerInput.value = currentWord.infpr || answerArray[ 1 ];
			} else if ( form.includes( 'third' ) ) {
				answerInput.value = currentWord.pfacind1s || answerArray[ 2 ];
			} else if ( form.includes( 'nominative' ) ) {
				answerInput.value = currentWord.noms;
			} else if ( form.includes( 'genitive' ) ) {
				answerInput.value = currentWord.gens;
			}
		}
	}

	// Revealed or wrong answer.
	if ( shouldReveal || ! isAnswerCorrect ) {
		if ( currentWord.category === 'redo' ) {
			currentWord.retriedIncorrectly = true;
		}

		if ( ! vocabToFocusOn.includes( currentWord.word ) ) {
			vocabToFocusOn.push( currentWord.word );
			let node = document.createElement( 'LI' );
			node.appendChild( document.createTextNode( question ) );
			document.getElementById( 'wrong-vocab' ).appendChild( node );
		}

		document.getElementById( 'no-words-wrong' ).style.display = 'none';
		document.getElementById( 'export-incorrect-vocab-sidebar' ).style.display = 'block';

		document.getElementById( 'wrong-vocab' ).scrollTop =
			document.getElementById( 'wrong-vocab' ).scrollHeight;
	}

	// Did not reveal answer (it could be either correct or wrong).
	if ( ! shouldReveal ) {
		// Answer was wrong.
		if ( ! isAnswerCorrect ) {
			playAudio( 'wrong' );

			collectData(
				'Answered vocabulary question incorrectly by inputting ' + answer + ' for ' + question,
				'incorrect_vocabulary_answer'
			);

			if ( competitiveMode ) {
				document.getElementById( 'competition-correction' ).innerHTML =
					'You entered <strong>' +
					answer +
					'</strong> as the translation for <strong>' +
					currentWord.word +
					'</strong> when the accepted answers were: <strong>' +
					currentWord.translation +
					'</strong>.';
				return endCompetitionTimer();
			}

			document.getElementById( 'wrong-answer' ).style.display = 'block';

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

			return;
		}

		// Answer was correct.
		vocabAnswered.push( currentWord );
		document.getElementById( 'vocab-answer' ).value = '';
		document.getElementById( 'wrong-answer' ).style.display = 'none';
		playAudio( 'correct' );

		if ( competitiveMode ) {
			collectData(
				'Competitive answer: ' +
					answer +
					' for ' +
					question +
					' at ' +
					new Date().toLocaleTimeString()
			);
		}

		collectData(
			'Answered vocabulary question correctly by inputting ' + answer + ' for ' + question,
			'correct_vocabulary_answer'
		);

		let select = document.getElementById( 'max-word-select' );
		let trimmedWordSelection = parseInt( select.options[ select.selectedIndex ].text );

		let progress = vocabAnswered.length / Math.min( trimmedWordSelection, allVocab.length );

		document.getElementById( 'progress-indicator-changing' ).innerHTML = vocabAnswered.length;

		currentWord.incorrectlyAnswered = incorrectCountNumber;

		incorrectCount.innerHTML = '0';

		document.getElementById( 'progress-bar-content' ).style.width = progress * 100 + '%';
		answerInput.focus();
		buildTest();
	}
}

function startRetryTest() {
	selectAll( 'deselect-all' );
	allVocab = [];
	vocabAnswered = [];

	vocab.forEach( ( word ) => {
		delete word.retriedIncorrectly;
	} );

	vocabToFocusOn.forEach( ( word ) => {
		let findWordArray = findWord( word );
		allVocab.push( findWordArray );
		findWordArray.asked = false;

		if ( findWordArray.category !== 'redo' ) {
			findWordArray.originalCategory = findWordArray.category;
		}

		findWordArray.category = 'redo';
	} );

	let vocabRetestCorrectAnswerCount = 0;
	document.getElementById( 'progress-indicator-changing' ).innerHTML =
		vocabRetestCorrectAnswerCount;
	document.getElementById( 'progress-indicator-set' ).innerHTML = vocabToFocusOn.length;

	collectData( 'Retried test with ' + vocabToFocusOn.length + ' incorrect words', 'retried_test' );

	formAcceptableVocab( 'redo' );
	buildTest();

	document.getElementById( 'progress-bar-content' ).style.width = 0;

	let vocabTestWrapper = document.getElementById( 'vocab-tester-wrapper' );
	let classesToRemove = [
		'is-complete',
		'show-retest-prompt',
		'show-retest-notice',
		'show-retest-complete',
	];

	classesToRemove.forEach( ( className ) => vocabTestWrapper.classList.remove( className ) );

	if (
		vocabToFocusOn.length !== vocabToFocusOnOriginal.length &&
		vocabToFocusOnOriginal.length > 0
	) {
		vocabTestWrapper.classList.add( 'show-reset-focus-prompt' );
	}
}

function replaceCorrectRetries() {
	vocabToFocusOn = vocabToFocusOnOriginal;

	vocab.forEach( ( word ) => {
		if ( word.hasOwnProperty( 'originalCategory' ) ) {
			word.category = word.originalCategory;
		}

		delete word.retriedIncorrectly;
	} );

	let wrongVocab = document.getElementById( 'wrong-vocab' );
	let noWordsWrongItem = document.getElementById( 'no-words-wrong' );

	wrongVocab.innerHTML = '';
	wrongVocab.appendChild( noWordsWrongItem );

	vocabToFocusOn.forEach( ( vocab ) => {
		let li = document.createElement( 'li' );
		li.textContent = vocab;
		wrongVocab.appendChild( li );
	} );

	collectData( 'Reset incorrect words list', 'reset_incorrect_words' );

	let classesToRemove = [
		'show-reset-focus-prompt',
		'show-retest-prompt',
		'show-retest-notice',
		'show-retest-complete',
	];
	classesToRemove.forEach( ( className ) =>
		document.getElementById( 'vocab-tester-wrapper' ).classList.remove( className )
	);
}

function removeCorrectRetries() {
	let indicesToRemove = [];

	if ( ! vocabToFocusOnOriginal.length ) {
		vocabToFocusOnOriginal = vocabToFocusOn;
	}

	vocabToFocusOn = vocabToFocusOn.filter( ( focusWord, i ) => {
		let vocabItem = allVocab.find( ( item ) => item.word === focusWord );
		let incorrectWord = vocabItem && vocabItem.hasOwnProperty( 'retriedIncorrectly' );

		focusWord.category = focusWord.originalCategory;

		if ( ! incorrectWord ) {
			indicesToRemove.push( i );
		}

		return incorrectWord;
	} );

	let incorrectWordsList = document.getElementById( 'wrong-vocab' );

	indicesToRemove.reverse().forEach( ( index ) => {
		incorrectWordsList.removeChild( incorrectWordsList.children[ index + 1 ] );
	} );

	vocab.forEach( ( word ) => {
		if ( word.category === 'redo' && ! vocabToFocusOn.includes( word.word ) ) {
			word.category = word.originalCategory;
		}

		delete word.retriedIncorrectly;
	} );

	let testWrapper = document.getElementById( 'vocab-tester-wrapper' );
	testWrapper.classList.add( 'show-reset-focus-prompt' );
	testWrapper.classList.remove( 'show-retest-prompt' );

	if ( vocabToFocusOn.length > 0 ) {
		let indicesWordString = indicesToRemove.length === 1 ? ' word' : ' words';
		document.getElementById( 'retry-remove-count' ).innerHTML =
			indicesToRemove.length + indicesWordString;

		let remainingWordString = vocabToFocusOn.length === 1 ? ' word' : ' words';
		document.getElementById( 'retry-remain-count' ).innerHTML =
			vocabToFocusOn.length + remainingWordString;

		testWrapper.classList.add( 'show-retest-notice' );
		collectData(
			'Removed ' + indicesToRemove.length + ' words from incorrect list',
			'removed_incorrect_words'
		);
	}
}

function exportIncorrectVocab() {
	let exportArray = [];
	let labels = [ 'word', 'category', 'translation', 'didReveal', 'incorrectlyAnswered' ];
	for ( let i = 0; i < vocabToFocusOn.length; i++ ) {
		let wordObject = findWord( vocabToFocusOn[ i ] );
		Object.keys( wordObject ).forEach( ( label ) => {
			if ( ! labels.includes( label ) ) {
				delete wordObject[ label ];
			}
		} );
		exportArray.push( wordObject );
	}
	exportArray.push( [
		'selectedOption',
		selectedOption,
		...Array( labels.length - 1 ).fill( '' ),
	] );
	collectData( 'CSV exported with ' + vocabToFocusOn.length + ' words', 'csv_export' );
	csvData = convertToCSV( exportArray );
	let dataBlob = new Blob( [ csvData ], { type: 'text/csv;charset=utf-8' } );
	document.getElementById( 'export-prompt' ).href = window.URL.createObjectURL( dataBlob );
	document.getElementById( 'export-sidebar-prompt' ).href = window.URL.createObjectURL( dataBlob );
}

function startFlashcards() {
	startTest();
	document.body.classList.add( 'is-displaying-flashcards' );
	document.getElementById( 'focus-on-title' ).innerHTML = 'Starred words';
	document.getElementById( 'focus-on-description' ).innerHTML =
		'Press the star on the top right, then click the word below to jump to its flashcard.';

	if ( localStorage.getItem( 'savedFlashcards' ) ) {
		let savedFlashcards = JSON.parse( localStorage.getItem( 'savedFlashcards' ) )
			? JSON.parse( localStorage.getItem( 'savedFlashcards' ) )
			: [];
		savedFlashcards.forEach( ( item ) => {
			vocabToFocusOn.push( item.word );
		} );
	}

	collectData( 'Started flashcards', 'started_flashcards' );
	buildFlashcard();
	starFlashcard( true );

	document.body.addEventListener( 'keyup', flashcardsListener );
}

function flashcardsListener( event ) {
	event.preventDefault();

	if ( event.keyCode === 13 ) {
		flipFlashcard();
	}

	if ( event.keyCode === 83 ) {
		starFlashcard();
	}

	if (
		event.keyCode === 39 &&
		! document.getElementById( 'right-flashcard-button' ).classList.contains( 'is-inactive' )
	) {
		buildFlashcard( 'next' );
	}

	if (
		event.keyCode === 37 &&
		! document.getElementById( 'left-flashcard-button' ).classList.contains( 'is-inactive' )
	) {
		buildFlashcard( 'previous' );
	}
}

function buildFlashcard( context, starred = false ) {
	if ( document.getElementById( 'flashcard' ).classList.contains( 'is-flipped' ) ) {
		flipFlashcard();
		if ( context === 'next' || context === 'previous' ) {
			setTimeout( buildAfterFlip.bind( null, context, starred ), 800 );
		} else {
			buildAfterFlip( context, starred );
		}
	} else {
		buildAfterFlip( context, starred );
	}
}

function buildAfterFlip( context, starred ) {
	let number = parseInt( document.getElementById( 'flashcard' ).getAttribute( 'number' ) );

	if ( context === 'next' ) {
		number = number + 1;
	} else if ( context === 'previous' ) {
		number = number - 1;
	}

	if ( starred ) {
		number = finalVocab.findIndex( ( item ) => item.word === context.textContent );
	}

	let isSavedFlashcard = number === -1;

	if ( context && isSavedFlashcard ) {
		let savedFlashcards = JSON.parse( localStorage.getItem( 'savedFlashcards' ) )
			? JSON.parse( localStorage.getItem( 'savedFlashcards' ) )
			: [];
		let savedIndex = savedFlashcards.findIndex( ( item ) => item.word === context.textContent );

		document.getElementById( 'front-flashcard' ).innerHTML = document.getElementById(
			'flashcard-setting-switch'
		).checked
			? savedFlashcards[ savedIndex ].word
			: savedFlashcards[ savedIndex ].translation;
		document.getElementById( 'back-flashcard' ).innerHTML = document.getElementById(
			'flashcard-setting-switch'
		).checked
			? savedFlashcards[ savedIndex ].translation
			: savedFlashcards[ savedIndex ].word;

		document.getElementById( 'star-flashcard' ).classList.add( 'is-filled' );
		document.getElementById( 'vocab-flashcards' ).classList.add( 'is-saved-flashcard' );
		return;
	}

	document.getElementById( 'vocab-flashcards' ).classList.remove( 'is-saved-flashcard' );
	document.getElementById( 'star-flashcard' ).classList.remove( 'is-filled' );

	if ( !! vocabToFocusOn.includes( finalVocab[ number ].word ) ) {
		document.getElementById( 'star-flashcard' ).classList.add( 'is-filled' );
	}

	document.getElementById( 'front-flashcard' ).innerHTML = document.getElementById(
		'flashcard-setting-switch'
	).checked
		? finalVocab[ number ].word
		: finalVocab[ number ].translation;
	document.getElementById( 'back-flashcard' ).innerHTML = document.getElementById(
		'flashcard-setting-switch'
	).checked
		? finalVocab[ number ].translation
		: finalVocab[ number ].word;

	document.getElementById( 'flashcard-count' ).innerHTML = number + 1 + '/' + allVocab.length;
	document.getElementById( 'flashcard' ).setAttribute( 'number', number );

	let updatedNumber = parseInt( document.getElementById( 'flashcard' ).getAttribute( 'number' ) );

	if ( updatedNumber === 0 ) {
		document.getElementById( 'left-flashcard-button' ).classList.add( 'is-inactive' );
	} else if ( updatedNumber === allVocab.length - 1 ) {
		document.getElementById( 'right-flashcard-button' ).classList.add( 'is-inactive' );
	} else {
		document.getElementById( 'left-flashcard-button' ).classList.remove( 'is-inactive' );
		document.getElementById( 'right-flashcard-button' ).classList.remove( 'is-inactive' );
	}
	collectData(
		'Built flashcard with ' + document.getElementById( 'front-flashcard' ).textContent,
		'built_flashcard'
	);
}

function flipFlashcard() {
	let flashcard = document.getElementById( 'flashcard' );
	collectData(
		'Flipped flashcard with ' + document.getElementById( 'front-flashcard' ).textContent,
		'flip_flashcard'
	);
	flashcard.classList.toggle( 'is-flipped' );
}

function starFlashcard( auto ) {
	let questionText = document.getElementById( 'flashcard-setting-switch' ).checked
		? document.getElementById( 'front-flashcard' ).textContent
		: document.getElementById( 'back-flashcard' ).textContent;
	let index = vocabToFocusOn.indexOf( questionText );

	if ( ! auto ) {
		index !== -1 ? vocabToFocusOn.splice( index, 1 ) : vocabToFocusOn.push( questionText );
	}

	document.getElementById( 'wrong-vocab' ).innerHTML = '';

	vocabToFocusOn.forEach( function ( item ) {
		let a = document.createElement( 'a' );
		let newItem = document.createElement( 'li' );

		a.textContent = item;
		a.setAttribute( 'onclick', 'buildFlashcard(this, true)' );
		newItem.appendChild( a );
		document.getElementById( 'wrong-vocab' ).appendChild( newItem );
	} );

	document.getElementById( 'clear-saved-vocab-sidebar' ).style.display = 'none';
	if ( vocabToFocusOn.length ) {
		document.getElementById( 'clear-saved-vocab-sidebar' ).style.display = 'block';
	}

	if ( auto ) {
		return;
	}

	collectData(
		'Toggled starring of flashcard with ' +
			document.getElementById( 'front-flashcard' ).textContent,
		'starred_flashcard'
	);
	document.getElementById( 'star-flashcard' ).classList.toggle( 'is-filled' );

	let savedFlashcards = (
		JSON.parse( localStorage.getItem( 'savedFlashcards' ) )
			? JSON.parse( localStorage.getItem( 'savedFlashcards' ) )
			: []
	).sort( ( a, b ) => ( a.word > b.word ? 1 : -1 ) );
	vocabToFocusOn = vocabToFocusOn.sort();
	let oldLength = savedFlashcards.length;
	let k1 = 0;
	let k2 = 0;

	while ( k2 < vocabToFocusOn.length ) {
		while ( k1 < oldLength && vocabToFocusOn[ k2 ] > savedFlashcards[ k1 ].word ) {
			savedFlashcards.splice( k1, 1 );
			oldLength--;
		}
		if ( k1 < oldLength && vocabToFocusOn[ k2 ] == savedFlashcards[ k1 ].word ) {
			++k1;
			++k2;
		} else {
			savedFlashcards.push( {
				word: vocabToFocusOn[ k2 ],
				translation: vocabToFocusOn[ k2 ].translation
					? vocabToFocusOn[ k2 ].translation
					: findWord( vocabToFocusOn[ k2 ] ).translation,
			} );
			++k2;
		}
	}
	while ( k1 < oldLength ) {
		savedFlashcards.splice( k1, 1 );
		k1++;
	}

	localStorage.setItem( 'savedFlashcards', JSON.stringify( savedFlashcards ) );
}

function shuffleFlashcards() {
	collectData( 'Shuffled flashcards', 'shuffled_flashcards' );
	finalVocab.sort( () => 0.5 - Math.random() );
	document.getElementById( 'flashcard' ).setAttribute( 'number', '0' );
	buildFlashcard();
}

function clearSavedFlashcards() {
	vocabToFocusOn = [];
	document.getElementById( 'clear-saved-vocab-sidebar' ).style.display = 'none';
	document.getElementById( 'wrong-vocab' ).innerHTML = '';
	document.getElementById( 'star-flashcard' ).classList.remove( 'is-filled' );
	localStorage.setItem( 'savedFlashcards', JSON.stringify( vocabToFocusOn ) );
	collectData( 'Cleared save flashcards', 'cleared_saved_flashcards' );
}

function toggleFlashcardShortcutsGuide() {
	document.getElementById( 'flashcard-keyboard-shortcuts' ).classList.toggle( 'is-inactive' );
	collectData( 'Toggled keyboard flashcard shortcuts guide', 'toggled_flashcard_shortcuts_guide' );

	if (
		document.getElementById( 'flashcard-keyboard-shortcuts' ).classList.contains( 'is-inactive' )
	) {
		document.getElementById( 'flashcard-keyboard-shortcut-prompt' ).innerHTML =
			'View keyboard shortcuts';
	} else {
		document.getElementById( 'flashcard-keyboard-shortcut-prompt' ).innerHTML =
			'Hide keyboard shortcuts';
	}
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
		return (
			( acceptableVocab.includes( vocab.category ) ||
				acceptableVocab.includes( vocab.alternativeCategory ) ) &&
			isWithinValue( vocab.word )
		);
	} );
}

function findVocab() {
	return vocab.filter( function ( vocab ) {
		return (
			( acceptableVocab.includes( vocab.category ) ||
				acceptableVocab.includes( vocab.alternativeCategory ) ) &&
			! vocab.asked &&
			isWithinValue( vocab.word )
		);
	} );
}

function findAllConjugationVocab() {
	return vocab.filter( function ( vocab ) {
		return typeof vocab.impacsuj1s === 'string';
	} );
}

function findConjugationVocab() {
	return vocab.filter( function ( vocab ) {
		return typeof vocab.impacsuj1s === 'string' && ! vocab.asked;
	} );
}

function findDeclensionVocab() {
	let declensionList = vocab.filter( function ( vocab ) {
		if ( competitiveMode ) {
			return typeof vocab.noms === 'string' && ! vocab.asked;
		}

		// Distinguish declensions separately - messy!
		return (
			typeof vocab.noms === 'string' &&
			( ( document.getElementById( 'declensions-noun-1' ).checked &&
				vocab.noms === vocab.abls &&
				vocab.noms !== vocab.accs ) ||
				( document.getElementById( 'declensions-noun-2' ).checked &&
					vocab.dats === vocab.abls &&
					! vocab.ablp.endsWith( 'bus' ) ) ||
				( document.getElementById( 'declensions-noun-3' ).checked &&
					vocab.nomp === vocab.accp &&
					vocab.abls.endsWith( 'e' ) &&
					vocab.dats !== vocab.gens ) ||
				( document.getElementById( 'declensions-noun-4' ).checked &&
					vocab.nomp === vocab.accp &&
					vocab.abls.endsWith( 'u' ) ) ||
				( document.getElementById( 'declensions-noun-5' ).checked &&
					vocab.nomp === vocab.accp &&
					vocab.dats === vocab.gens &&
					vocab.noms !== vocab.accs ) )
		);
	} );

	if ( document.getElementById( 'declensions-neuter' ).checked ) {
		declensionList = declensionList.filter( function ( vocab ) {
			return vocab.accs !== vocab.noms;
		} );
	}

	if ( document.getElementById( 'declensions-noun-2-remove-er' ).checked ) {
		declensionList = declensionList.filter( function ( vocab ) {
			return ! vocab.noms.endsWith( 'er' );
		} );
	}

	return declensionList;
}

function findWord( word ) {
	return vocab.find( ( vocab ) => vocab.word === word );
}

function formAcceptableVocab( receivedCategory ) {
	let category = receivedCategory.toString();

	if ( category !== 'redo' && category !== 'uploaded' ) {
		let button = document.getElementById( category );

		if ( ! button ) {
			return;
		}

		playAudio();
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

		let maxVocabOptions;
		switch ( selectedOption ) {
			case 'alevelocr':
				maxVocabOptions = 20;
				break;
			case 'gcseeduqas':
				maxVocabOptions = 35;
				break;
			case 'gcseocr':
				maxVocabOptions = 18;
				break;
			case 'clc':
				maxVocabOptions = 40;
				break;
			case 'custom-list':
				maxVocabOptions = document.querySelectorAll( '.custom-lists .vocab-type' ).length;
				break;
			case 'literature':
				maxVocabOptions = 24;
				break;
		}

		if ( acceptableVocab.length >= maxVocabOptions ) {
			updateSelectAll( 'select-all-desktop', 'Deselect all', 'deselect-all' );
			updateSelectAll( 'select-all-mobile', 'Deselect all', 'deselect-all' );
		} else {
			updateSelectAll( 'select-all-desktop', 'Select all', undefined );
			updateSelectAll( 'select-all-mobile', 'Select all', undefined );
		}
	} else {
		acceptableVocab.push( category );
	}

	allVocab = vocabToTest.concat( findAllVocab() );
}

function updateSelectAll( elementId, text, onclickArg ) {
	document.getElementById( elementId ).innerHTML = text;
	document.getElementById( elementId ).onclick = function () {
		selectAll( onclickArg );
	};
}

function changeMode( mode ) {
	if (
		document.body.classList.contains( 'has-begun-vocab-test' ) &&
		! isTestingConjugations &&
		! isTestingDeclensions
	) {
		document.getElementById( 'warning-continue-action' ).onclick = function () {
			changeModeAction( mode );
			warningModalActioned();
		};
		return openWarningModal();
	}

	changeModeAction( mode );
}

function changeModeAction( mode ) {
	let allOptions = [ 'vocabulary', 'declensions', 'conjugations' ];

	allOptions.forEach( ( option ) => {
		document.getElementById( option + '-footer-item' ).classList.remove( 'is-active' );
	} );

	document.getElementById( mode + '-footer-item' ).classList.add( 'is-active' );

	if ( selectedOption === 'custom-list' ) {
		changeOption( 'alevelocr', false );
	}

	resetTest();

	if ( mode === 'declensions' ) {
		startTest( true );
	}

	if ( mode === 'conjugations' ) {
		startTest( false, true );
	}
}

function resetState() {
	acceptableVocab = [];
	allVocab = [];
	competitiveMode = false;
	competitiveTestType = undefined;
	finalVocab = [];
	isTableMode = false;
	isTestingConjugations = false;
	isTestingDeclensions = false;
	isTestingParticipleParts = false;
	vocab = [];
	vocabAnswered = [];
	vocabConjugation;
	vocabDeclension = undefined;
	vocabToFocusOn = [];
	vocabToFocusOnOriginal = [];
	vocabToTest = [];
}

function resetTest() {
	selectAll( 'deselect-all' );

	vocab.forEach( ( word ) => {
		word.asked = false;
		delete word.didReveal;
		delete word.incorrectlyAnswered;

		if ( word.category === 'redo' && word.originalCategory ) {
			word.category = word.originalCategory;
		}
	} );

	resetState();

	collectData( 'Reset test', 'reset_test' );

	document.body.classList = [];
	document.getElementById( 'vocab-tester-wrapper' ).classList = [ 'main-content' ];
	changeOption( selectedOption, false );

	let customList = localStorage.getItem( 'customList' );
	if ( customList && JSON.parse( customList ).length > 0 ) {
		document.body.classList.add( 'has-custom-list-option' );
	}

	document.getElementById( 'progress-indicator-changing' ).innerHTML = '0';
	document.getElementById( 'progress-indicator-slash' ).innerHTML = '/';
	document.getElementById( 'progress-indicator-set' ).innerHTML = '';
	document.getElementById( 'progress-bar-content' ).style.width = '0';

	document.getElementById( 'vocab-incorrect-count' ).innerHTML = '0';
	document.getElementById( 'vocab-answer' ).value = '';
	document.getElementById( 'wrong-answer' ).style.display = 'none';
	document.getElementById( 'competition-correction' ).innerHTML = '';

	var ulElement = document.getElementById( 'wrong-vocab' );
	var liElements = Array.from( ulElement.querySelectorAll( 'li' ) );

	liElements.slice( 1 ).forEach( function ( li ) {
		li.remove();
	} );

	document.getElementById( 'focus-on-title' ).innerHTML = 'Words to focus on';
	document.getElementById( 'focus-on-description' ).innerHTML =
		'A list of words either entered incorrectly or for which the answer was revealed:';
	document.getElementById( 'wrong-vocab' ).innerHTML =
		'<li id="no-words-wrong">None so far - well done!</li>	';
	document.getElementById( 'export-incorrect-vocab-sidebar' ).style.display = 'none';
	document.getElementById( 'clear-saved-vocab-sidebar' ).style.display = 'none';
	document.getElementById( 'retry-test-button' ).classList.add( 'is-inactive' );
	document.getElementById( 'retry-test-prompt' ).classList.add( 'is-inactive' );

	document.body.removeEventListener( 'keyup', flashcardsListener );
	document.getElementById( 'flashcard' ).setAttribute( 'number', '0' );
	document.getElementById( 'left-flashcard-button' ).classList.remove( 'is-inactive' );
	document.getElementById( 'right-flashcard-button' ).classList.remove( 'is-inactive' );

	document.getElementById( 'vocab-tester-wrapper' ).classList.remove( 'is-complete' );
	document.getElementById( 'word-table' ).classList.remove( 'is-active' );
	document.getElementById( 'grammar-info' ).classList.remove( 'is-active' );
	document.getElementById( 'grammar-info-competition' ).classList.remove( 'is-active' );
	document.getElementById( 'start-button' ).classList.add( 'is-inactive' );
	toggleWordTable( false );

	document.getElementById( 'word-table-select' ).options.length = '0';

	clearInterval( timer );
	clearInterval( competitionCountdown );
	document.getElementById( 'countdown-clock-circle' ).style.stroke = '';
	document.getElementById( 'countdown-clock-circle' ).style.strokeDashoffset = 440;
	document.getElementById( 'countdown-clock-time-left' ).innerHTML = '120';
	document.getElementById( 'competition-countdown' ).innerHTML = '5';

	document.getElementById( 'leaderboard-valid-name-warning' ).style.display = 'none';
	document.getElementById( 'leaderboard-button-submit' ).innerHTML = 'Submit name';
	document.getElementById( 'leaderboard-name-input' ).disabled = false;

	document.getElementById( 'current-mode' ).innerHTML = 'Practice';
	document.getElementById( 'switch-to-mode' ).innerHTML = 'Competitive mode';

	document.getElementById( 'curtain' ).classList = [ 'curtain is-not-triggered' ];
	document.getElementById( 'fileupload' ).value = '';
	document.getElementById( 'file-upload-notice' ).classList = [ 'is-inactive' ];
	document.getElementById( 'custom-file-upload-notice' ).classList = [ 'is-inactive' ];
}

function updateLetterLimit() {
	setTimeout( function () {
		allVocab = vocabToTest.concat( findAllVocab() );
	}, 150 );

	collectData(
		'Updated letter limit from ' +
			document.getElementById( 'min-vocab-value' ).value +
			' to ' +
			document.getElementById( 'max-vocab-value' ).value,
		'updated_letter_limit'
	);
}

function collectData( content, analyticsID ) {
	if ( analyticsID ) {
		gtag( 'event', analyticsID );
	}

	let request = new XMLHttpRequest();
	if ( navigator.onLine ) {
		request.open( 'POST', 'https://clubpenguinmountains.com/wp-json/latin-vocabulary-tester/data' );
		request.setRequestHeader( 'Content-type', 'text/plain' );
		request.send( content + ' with ID of ' + userId );
	}
}

function muteAudio() {
	let options = document.getElementById( 'option' );

	options.classList.toggle( 'is-muted' );

	mute = options.classList.contains( 'is-muted' );

	if ( ! mute ) {
		localStorage.setItem( 'defaultAudio', 'Unmuted' );
	} else {
		localStorage.setItem( 'defaultAudio', 'Muted' );
	}
	collectData( 'Audio toggled so mute is **' + mute + '**', 'audio_toggled' );
}

function toggleFooter( show ) {
	if ( show === false ) {
		document.body.classList.add( 'hide-footer' );
	} else if ( show ) {
		document.body.classList.remove( 'hide-footer' );
	} else {
		document.body.classList.toggle( 'hide-footer' );
	}
	collectData( 'Footer toggled', 'footer_toggled' );
}

function changeHardDifficulty() {
	let hardCheckbox = document.getElementById( 'hardCheckbox' );
	let extremeCheckbox = document.getElementById( 'extremeCheckbox' );

	if ( extremeCheckbox.checked && hardCheckbox.checked === false ) {
		extremeCheckbox.checked = false;
	}

	collectData(
		'Difficulty changed so that the hard checkbox is ' + hardCheckbox.checked,
		'difficulty_changed'
	);
}

function changeExtremeDifficulty() {
	let hardCheckbox = document.getElementById( 'hardCheckbox' );
	let extremeCheckbox = document.getElementById( 'extremeCheckbox' );

	if ( extremeCheckbox.checked === true ) {
		hardCheckbox.checked = true;
	}

	collectData(
		'Difficulty changed so that the hard checkbox is ' + hardCheckbox.checked,
		'extreme_difficulty_changed'
	);
}

function resetFileUpload() {
	if ( ! document.getElementById( 'fileupload' ).value ) {
		return;
	}

	collectData( 'Reset file upload', 'reset_file_upload' );
	acceptableVocab = acceptableVocab.filter( ( item ) => item !== 'uploaded' );
	document.getElementById( 'file-upload-notice' ).classList = [ 'is-inactive' ];

	if ( ! acceptableVocab.length ) {
		document.getElementById( 'start-button' ).classList.add( 'is-inactive' );
	}
}

function toggleFileUpload() {
	document.getElementById( 'file-upload-section' ).style.display = 'block';
	document.getElementById( 'file-upload-link' ).style.display = 'none';
}

function toggleLimit() {
	let wordLimitCheckbox = document.getElementById( 'wordLimitCheckbox' );
	let maxWordSelect = document.getElementById( 'max-word-select' );

	maxWordSelect.style.display = wordLimitCheckbox.checked ? 'block' : 'none';

	collectData(
		'Limit of words toggled to be marked as ' +
			document.getElementById( 'wordLimitCheckbox' ).checked,
		'word_limit_toggled'
	);
}

function toggleRow( e ) {
	! e.parentNode.parentNode.classList.contains( 'is-collapsed' )
		? e.parentNode.parentNode.classList.add( 'is-collapsed' )
		: e.parentNode.parentNode.classList.remove( 'is-collapsed' );
}
