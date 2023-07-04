let acceptableCases = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ];
let acceptableVerbs = [];
let acceptableVocab = [];
let allVocab = [];
let competitiveMode = false;
let competitiveTestType;
let data = 0;
let finalVocab = [];
let hardDifficulty = false;
let isTableMode = false;
let isTestingConjugations = false;
let isTestingDeclensions = false;
let isTestingParticipleParts = false;
let mute = false;
let selectedOption;
let userId = localStorage.getItem( 'userID' ) || Math.floor( Math.random() * 9999999 ) + 1;
let vocab = vocabGCSEOCR;
let vocabAnswered = [];
let vocabConjugation;
let vocabCustomList = [];
let vocabDeclension;
let vocabToFocusOn = [];
let vocabToTest = [];

window.onload = function () {
	if ( ! localStorage.getItem( 'userID' ) ) {
		localStorage.setItem( 'userID', userId );
	}

	// This is an arbitrary figure, but it ensures parameters can take effect without a jump on the screen.
	setTimeout( function () {
		document.getElementById( 'loading' ).style.display = 'none';
	}, 1200 );

	changeOption( localStorage.getItem( 'defaultOption' ) || 'alevelocr', false );
	document.getElementById( 'vocab-answer' ).addEventListener( 'keyup', function ( event ) {
		if ( event.keyCode === 13 ) {
			event.preventDefault();
			checkAnswer();
		}
	} );
	collectData( 'Loaded site with data ' + navigator.userAgent + ' at ' + new Date(), 'load' );

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
		if ( this.readyState == 4 && this.status == 200 ) {
			let response = this.response.split( ',' );
			for ( let i = 1; i < 4; i++ ) {
				document.getElementById(
					'first-declensions-leaderboard-' + i.toString()
				).innerHTML = response[ i ].replace( /\[|\]|\"/gi, '' );
				document.getElementById( 'declensions-leaderboard-' + i.toString() ).innerHTML = response[
					i
				].replace( /\[|\]|\"/gi, '' );
			}

			for ( let i = 7; i < 10; i++ ) {
				document.getElementById(
					'first-vocabulary-leaderboard-' + i.toString()
				).innerHTML = response[ i ].replace( /\[|\]|\"/gi, '' );
				document.getElementById( 'vocabulary-leaderboard-' + i.toString() ).innerHTML = response[
					i
				].replace( /\[|\]|\"/gi, '' );
			}

			for ( let i = 12; i < 15; i++ ) {
				document.getElementById(
					'first-conjugations-leaderboard-' + i.toString()
				).innerHTML = response[ i ].replace( /\[|\]|\"/gi, '' );
				document.getElementById( 'conjugations-leaderboard-' + i.toString() ).innerHTML = response[
					i
				].replace( /\[|\]|\"/gi, '' );
			}
		} else if ( this.readyState == 4 ) {
			collectData( 'Failed to load from endpoint' );
		}
	};
	if ( navigator.onLine ) {
		xmlhttp.open(
			'GET',
			'https://clubpenguinmountains.com/wp-json/latin-vocabulary-tester/leaderboard',
			true
		);
		xmlhttp.send();
	}

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

	if ( new URLSearchParams( window.location.search ).get( 'advanced' ) ) {
		document.body.classList.add( 'is-advanced-mode' );
		collectData( 'Activated advanced mode', 'activated_advance_mode' );
	} else if ( localStorage.getItem( 'defaultOption' ) === 'custom-list' ) {
		changeOption( 'alevelocr', false );
	}

	if ( new URLSearchParams( window.location.search ).get( 'ovid' ) ) {
		changeOption( 'literature', false );
		collectData( 'Loaded Ovid' );
	}

	if (
		localStorage.getItem( 'defaultAudio' ) &&
		localStorage.getItem( 'defaultAudio' ) === 'Muted'
	) {
		muteAudio();
	}

	for ( let i = 0; i < 128; i++ ) {
		acceptableVerbs.push( i );
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
				collectData( 'CSV file uploaded', 'csv_upload' );
				formAcceptableVocab( 'uploaded' );
			};
			reader.readAsBinaryString( fileInput.files[ 0 ] );
		};

	fileInput.addEventListener( 'change', readFile );

	var advancedFileInput = document.getElementById( 'advancedfileupload' ),
		advancedReadFile = function () {
			var advancedReader = new FileReader();
			advancedReader.onload = function () {
				handleCustomList( advancedReader.result );
				collectData( 'Custom file uploaded in advanced mode', 'custom_file_uploaded' );
			};
			advancedReader.readAsText( advancedFileInput.files[ 0 ] );
		};

	advancedFileInput.addEventListener( 'change', advancedReadFile );
};

function changeOption( option, manualChange = true ) {
	let allOptions = [ 'alevelocr', 'gcseeduqas', 'gcseocr', 'clc', 'custom-list', 'literature' ];

	allOptions.forEach( ( option ) => {
		document.body.classList.remove( 'is-' + option );
	} );

	if ( manualChange ) {
		collectData( 'Changed option from ' + selectedOption + ' to ' + option, 'changed_option' );
	}

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
		case 'clc':
			type = vocabCLC;
			break;
		case 'custom-list':
			type = vocabCustomList;
		case 'literature':
			type = vocabLiterature;
	}
	selectAll( 'change-option' );
	selectedOption = option;

	document.body.classList.add( 'is-' + selectedOption );
	vocab = type;
	localStorage.setItem( 'defaultOption', selectedOption );

	document.getElementById( 'switch-literature' ).innerHTML = 'Switch to literature vocabulary';
	document.getElementById( 'switch-literature' ).onclick = function () {
		changeOption( 'literature' );
	};

	if ( selectedOption === 'custom-list' && localStorage.getItem( 'customList' ) ) {
		handleCustomList( localStorage.getItem( 'customList' ) );
	}

	if ( selectedOption === 'literature' ) {
		document.getElementById( 'switch-literature' ).innerHTML = 'Switch to prescribed vocabulary';

		document.getElementById( 'switch-literature' ).onclick = function () {
			changeOption( 'alevelocr' );
		};
	}

	if ( ! mute && manualChange ) {
		new Audio( './assets/audio/click.mp3' ).play();
	}
}

function startTest( startDeclensionTest = false, startConjugationTest = false ) {
	document.getElementById( 'curtain' ).classList.remove( 'is-not-triggered' );
	document.getElementById( 'curtain' ).classList.add( 'is-triggered' );
	document.body.classList.add( 'has-begun-vocab-test' );
	hardDifficulty = true;

	window.scrollTo( 0, 0 );
	document.getElementById( 'option' ).innerHTML = '<a onclick="resetTest()">Reset test</a>';

	collectData(
		'Started test of ' + selectedOption + ' with competition mode set to ' + competitiveMode,
		'started_test'
	);

	collectData( 'Test categories of ' + acceptableVocab.join(', ') );

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
		if ( selectedOption !== 'alevelocr' ) {
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

function checkIncorrectAnswerGrammar() {
	let grammarForm = getKeysInObject(
		findWord( document.getElementById( 'vocab-question' ).textContent )[ 0 ],
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
	let answerArray = findWord( document.getElementById( 'vocab-question' ).textContent )[ 0 ];
	let score = parseInt( document.getElementById( 'progress-indicator-changing' ).textContent );

	if ( isTestingConjugations ) {
		leaderboardId = document.getElementById( 'conjugations-leaderboard-14' ).textContent;
		endingMessage =
			"Time's up! The <strong>" +
			document.getElementById( 'vocab-submit-word-form' ).textContent +
			'</strong> of <strong>' +
			answerArray.word +
			'</strong> was <strong>' +
			answerArray[ vocabConjugation ] +
			'</strong>.';
		checkIncorrectAnswerGrammar();
	} else if ( isTestingDeclensions ) {
		leaderboardId = document.getElementById( 'declensions-leaderboard-3' ).textContent;
		endingMessage =
			"Time's up! The <strong>" +
			document.getElementById( 'vocab-submit-word-form' ).textContent +
			'</strong> of <strong>' +
			answerArray.word +
			'</strong> was <strong>' +
			answerArray[ vocabDeclension ] +
			'</strong>.';
		checkIncorrectAnswerGrammar();
	} else {
		leaderboardId = document.getElementById( 'vocabulary-leaderboard-9' ).textContent;
		endingMessage =
			"Time's up! The acceptable meanings for <strong>" +
			answerArray.word +
			'</strong> were: <strong>' +
			answerArray.translation +
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
	document.getElementById( 'competition-countdown' ).innerHTML =
		'Score: ' + score + ' words completed';

	if ( score === 1 ) {
		document.getElementById( 'competition-countdown' ).innerHTML = document
			.getElementById( 'competition-countdown' )
			.innerHTML.replace( 'words', 'word' );
	}
	document.getElementById( 'vocab-tester-wrapper' ).classList.remove( 'time-started' );

	if ( leaderboardId === 'Empty' || leaderboardId === 'Loading' ) {
		document.getElementById( 'competition-warning' ).innerHTML =
			'Congratulations! Enter your name below to be included on the Leaderboard - your name will only appear if you are in the top three.';
		return;
	}

	var neededScore = leaderboardId.substring(
		leaderboardId.lastIndexOf( '-' ) + 1,
		leaderboardId.lastIndexOf( 'words' )
	);

	if ( parseInt( neededScore ) >= score ) {
		document.getElementById( 'vocab-tester-wrapper' ).classList.add( 'leaderboard-ineligible' );
		document.getElementById( 'competition-warning' ).innerHTML =
			'Unfortunately, you need a score of <strong>' +
			( parseInt( neededScore ) + 1 ) +
			'</strong> to be added to the Leaderboard - good luck next time! You can <a onclick="resetTest()">try again</a>.';
	} else {
		document.getElementById( 'competition-warning' ).innerHTML =
			'Congratulations! Enter your name below to be included on the Leaderboard.';
	}
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
	var currentMode = document.getElementById( 'current-mode' );

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
			selectedOption +
			'&id=' +
			userId,
		true
	);
	xhttp.send();
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
	let vocabwithNumber = finalVocab[ randomNumber ];
	if ( isConjugationTest ) {
		isTestingConjugations = true;
		handleVerbConjugations();
	} else {
		isTestingDeclensions = true;
		handleNounDeclensions();
	}
	vocabwithNumber.asked = true;

	if ( addToTable && ( isTestingDeclensions || isTestingConjugations ) ) {
		let select = document.getElementById( 'word-table-select' );
		let option = document.createElement( 'option' );

		option.setAttribute( 'data-type', isTestingDeclensions ? vocabDeclension : vocabConjugation );
		option.text = vocabwithNumber.word;
		select.add( option );
		select.selectedIndex = select.length - 1;
	}

	document.getElementById( 'vocab-question' ).innerHTML = vocabwithNumber.word;
	document.getElementById( 'vocab-question-table-mode' ).innerHTML = vocabwithNumber.word;
	document.getElementById( 'vocab-question-details' ).innerHTML = vocabwithNumber.translation;
	document.getElementById( 'vocab-question-table-mode-details' ).innerHTML =
		vocabwithNumber.translation;

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
			0,
			1,
			12,
			13,
			24,
			25,
			36,
			37,
			48,
			49,
			60,
			61,
			62,
			64,
			65,
			76,
			77,
			88,
			89,
			100,
			101,
			112,
			113,
			117,
			118,
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
	let answer = findWord( document.getElementById( 'word-table-select' ).value )[ 0 ];
	let selectedIndex = document.getElementById( 'word-table-select' ).selectedIndex;
	let optionType = document
		.querySelector( '#word-table-select option:nth-of-type(' + ( selectedIndex + 1 ) + ')' )
		.getAttribute( 'data-type' );

	if ( isTestingDeclensions ) {
		let declensionTable = document.querySelectorAll( '.further-content .noun-table table td' );

		collectData(
			'Answer declension table shown for ' + answer.word,
			'constructed_declension_table'
		);

		for ( let i = 0; i < declensionTable.length; i++ ) {
			if ( declensionTable[ i ].id && declensionTable[ i ].id.endsWith( 'slot' ) ) {
				declensionTable[ i ].innerHTML = answer[ declensionTable[ i ].id.replace( '-slot', '' ) ];
				document.getElementById( declensionTable[ i ].id ).classList.remove( 'is-highlighted' );
			}
		}
	}

	if ( isTestingConjugations ) {
		let verbTable = document.querySelectorAll( '.further-content .verb-tables table td' );

		collectData( 'Answer verb table shown for ' + answer.word, 'constructed_verb_table' );

		for ( let i = 0; i < verbTable.length; i++ ) {
			if ( verbTable[ i ].id && verbTable[ i ].id.endsWith( 'slot' ) ) {
				verbTable[ i ].childNodes[ 3 ].innerHTML =
					answer[ verbTable[ i ].id.replace( '-slot', '' ) ];
				document.getElementById( verbTable[ i ].id ).classList.remove( 'is-highlighted' );
			}
		}

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

	document.getElementById( optionType + '-slot' ).classList.add( 'is-highlighted' );
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

	if ( ! mute ) {
		new Audio( './assets/audio/click.mp3' ).play();
	}

	collectData( 'Switched verb test to ' + e.id.replace( '-button', '' ), 'switch_verb_test' );

	constructWordTable( true );
}

function generateNewTableWord() {
	buildDeclensionOrConjugationTest( true );

	if ( ! mute ) {
		new Audio( './assets/audio/click.mp3' ).play();
	}

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
				verbTable[ i ].childNodes[ 3 ].innerHTML =
					'<span>Entered: ' + enteredAnswer + '</span>' + realAnswer;
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

	if ( ! mute ) {
		new Audio( './assets/audio/click.mp3' ).play();
	}
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
		table += '<td>' + category + '</td>';
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
};

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
		document.getElementById( 'word-table' ).style.display = 'none';
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
		document.getElementById( 'word-table' ).style.display = 'block';
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

function csvToJSON( string, headers, quoteChar = '"', delimiter = ',' ) {
	// Credit: csvToJSON function by matthew-e-brown on Stack Overflow.
	const regex = new RegExp( `\\s*(${ quoteChar })?(.*?)\\1\\s*(?:${ delimiter }|$)`, 'gs' );
	const match = ( string ) =>
		[ ...string.matchAll( regex ) ]
			.map( ( match ) => match[ 2 ] )
			.filter( ( _, i, a ) => i < a.length - 1 );

	const lines = string.split( '\n' );
	const heads = headers || match( lines.splice( 0, 1 )[ 0 ] );

	return lines.map( ( line ) =>
		match( line ).reduce(
			( acc, cur, i ) => ( {
				...acc,
				[ heads[ i ] || 'id' ]: cur.length > 0 ? Number( cur.trim() ) || cur.trim() : null,
			} ),
			{}
		)
	);
}

function handleCustomList( list ) {
	let savedList = JSON.parse( localStorage.getItem( 'customList' ) ) || [];
	vocabCustomList = ! isJSONFile( list ) ? csvToJSON( list ) : JSON.parse( list );
	vocabCustomListExistingCategories = [];
	vocabCustomListCategories = [];

	document.querySelectorAll( '.custom-category p' ).forEach( ( word ) => {
		vocabCustomListExistingCategories.push( word.textContent );
	} );

	vocabCustomList.forEach( ( word, index ) => {
		word.asked = false;

		if ( word.noms === '' ) {
			word.noms = null;
		}

		if ( word.impacsuj1s === '' ) {
			word.impacsuj1s = null;
		}

		if (
			savedList &&
			savedList.findIndex(
				( item ) => item.word === word.word && item.category === word.category
			) === -1
		) {
			savedList.push( word );
		}

		if ( ! vocabCustomListCategories.includes( word.category ) ) {
			vocabCustomListCategories.push( word.category );
		}
	} );

	localStorage.setItem( 'customList', JSON.stringify( savedList ) );
	vocab = vocabCustomList;
	let categoriesList = vocabCustomListCategories.filter(
		( item ) => ! vocabCustomListExistingCategories.includes( item )
	);

	categoriesList.forEach( ( category ) => {
		let button = document.createElement( 'button' );
		button.id = category;
		button.className = 'vocab-type';
		button.onclick = function () {
			formAcceptableVocab( category );
		};

		button.innerHTML =
			'<div class="custom-category"><p>' +
			category +
			'</p><div onclick="removeCustomCategory(\'' +
			category +
			'\')" class="trash-icon"></div></div>';

		document.querySelector( '.custom-lists .row-wrapper .button-group' ).appendChild( button );
	} );
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

	var categoryButton = document.getElementById( category );
	categoryButton.parentNode.removeChild( categoryButton );
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
				( verbsWithParticiples.includes( vocabwithNumber.category ) &&
					data.word.split( ',' ).length > 2 ) ||
				data.impacsuj1s
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
			} else if ( data.noms ) {
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
	collectData( 'Reset test', 'reset_test' );
	if ( competitiveMode ) {
		sessionStorage.setItem( 'reset-mode', 'competitive' );
	}
	location.reload();
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
			'noun irreg',
			'noun phrase',
			'noun & adj',
			'verb 4 dep',
		];
	}

	if ( selectedOption === 'gcseocr' ) {
		allOptions.splice( 18, 4 );
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

	var isPreviouslyMuted = mute;
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
	var question = document.getElementById( 'vocab-submit-word-form' ).textContent;
	var answerInput = document.getElementById( 'vocab-answer' );
	var enteredAnswer = answerInput.value.toLowerCase().trim();
	var progressIndicator = document.getElementById( 'progress-indicator-changing' );
	var actualAnswerArray = findWord( document.getElementById( 'vocab-question' ).textContent )[ 0 ];
	var actualAnswer = isTestingConjugations
		? actualAnswerArray[ vocabConjugation ]
		: actualAnswerArray[ vocabDeclension ];
	var isAnswerCorrect = enteredAnswer === actualAnswer;
	var testType = isTestingConjugations ? 'conjugation' : 'declension';

	if ( ! shouldReveal && enteredAnswer === '' ) {
		return;
	}

	if ( shouldReveal ) {
		answerInput.value = actualAnswer;
		collectData(
			'Answer revealed in ' +
				testType +
				' test for ' +
				question +
				' of ' +
				document.getElementById( 'vocab-question' ).textContent,
			'revealed_' + testType + '_answer'
		);
	} else {
		document.getElementById( 'wrong-answer' ).style.display = isAnswerCorrect ? 'none' : 'block';
		document.getElementById( 'grammar-info' ).classList.remove( 'is-active' );
		document.getElementById( 'grammar-info-competition' ).classList.remove( 'is-active' );

		if ( isAnswerCorrect ) {
			answerInput.value = '';
			progressIndicator.innerHTML = parseInt( progressIndicator.textContent ) + 1;
			if ( ! mute ) {
				new Audio( './assets/audio/correct.mp3' ).play();
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

		if ( ! mute ) {
			new Audio( './assets/audio/wrong.mp3' ).play();
		}

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
				actualAnswerArray.word +
				'</strong> when it was actually <strong>' +
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

	let question = document.getElementById( 'vocab-question' ).textContent;
	let answer = document.getElementById( 'vocab-answer' ).value.toLowerCase().trim();
	let form = document.getElementById( 'vocab-submit-word-form' ).textContent;
	let answerInput = document.getElementById( 'vocab-answer' );
	let incorrectCount = document.getElementById( 'vocab-incorrect-count' );
	let incorrectCountNumber = parseInt( incorrectCount.textContent );
	let isAnswerCorrect = false;
	let questionArray = hardDifficulty ? findTranslation( question )[ 0 ] : findWord( question )[ 0 ];
	let answerArray = hardDifficulty ? data.word.split( ',' ) : data.translation.split( ',' );

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

	if ( questionArray.didReveal !== true ) {
		questionArray.didReveal = false;
	}

	document.getElementById( 'wrong-vocab' ).scrollTop = document.getElementById(
		'wrong-vocab'
	).scrollHeight;

	if ( shouldReveal ) {
		if ( ! vocabToFocusOn.includes( questionArray.word ) ) {
			vocabToFocusOn.push( questionArray.word );

			var node = document.createElement( 'LI' );
			node.appendChild( document.createTextNode( question ) );
			document.getElementById( 'wrong-vocab' ).appendChild( node );
		}
		document.getElementById( 'wrong-answer' ).style.display = 'none';
		document.getElementById( 'no-words-wrong' ).style.display = 'none';
		document.getElementById( 'export-incorrect-vocab-sidebar' ).style.display = 'block';

		collectData( 'Answer revealed for ' + question, 'revealed_answer' );

		questionArray.didReveal = true;

		if ( ! isTestingParticipleParts ) {
			answerInput.value = answerArray[ 0 ];
		} else {
			if ( form.includes( 'first' ) ) {
				answerInput.value = data.pracind1s || answerArray[ 0 ];
			} else if ( form.includes( 'second' ) ) {
				answerInput.value = data.infpr || answerArray[ 1 ];
			} else if ( form.includes( 'third' ) ) {
				answerInput.value = data.pfacind1s || answerArray[ 2 ];
			} else if ( form.includes( 'nominative' ) ) {
				answerInput.value = data.noms;
			} else if ( form.includes( 'genitive' ) ) {
				answerInput.value = data.gens;
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
				isAnswerCorrect = answer === answerArray[ 0 ] || answer === data.pracind1s;
			} else if ( form.includes( 'second' ) ) {
				isAnswerCorrect = answer === answerArray[ 1 ] || answer === data.infpr;
			} else if ( form.includes( 'third' ) ) {
				isAnswerCorrect = answer === answerArray[ 2 ] || answer === data.pfacind1s;
			} else if ( form.includes( 'nominative' ) ) {
				isAnswerCorrect = answer === data.noms;
			} else if ( form.includes( 'genitive' ) ) {
				isAnswerCorrect = answer === data.gens;
			}
		}

		if ( answer.length === 1 && answer !== 'a' && answer !== 'e' && answer !== 'i' ) {
			isAnswerCorrect = false;
		}

		if ( ! isAnswerCorrect ) {
			if ( ! mute ) {
				new Audio( './assets/audio/wrong.mp3' ).play();
			}

			collectData(
				'Answered vocabulary question incorrectly by inputting ' + answer + ' for ' + question,
				'incorrect_vocabulary_answer'
			);

			if ( competitiveMode ) {
				document.getElementById( 'competition-correction' ).innerHTML =
					'You entered <strong>' +
					answer +
					'</strong> as the translation for <strong>' +
					questionArray.word +
					'</strong> when the accepted answers were: <strong>' +
					questionArray.translation +
					'</strong>.';
				return endCompetitionTimer();
			}

			document.getElementById( 'wrong-answer' ).style.display = 'block';

			if ( ! vocabToFocusOn.includes( questionArray.word ) ) {
				vocabToFocusOn.push( questionArray.word );
				var node = document.createElement( 'LI' );
				node.appendChild( document.createTextNode( question ) );
				document.getElementById( 'wrong-vocab' ).appendChild( node );
				document.getElementById( 'no-words-wrong' ).style.display = 'none';
				document.getElementById( 'export-incorrect-vocab-sidebar' ).style.display = 'block';
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

			return;
		}

		vocabAnswered.push( questionArray );
		document.getElementById( 'vocab-answer' ).value = '';
		document.getElementById( 'wrong-answer' ).style.display = 'none';
		if ( ! mute ) {
			new Audio( './assets/audio/correct.mp3' ).play();
		}

		collectData(
			'Answered vocabulary question correctly by inputting ' + answer + ' for ' + question,
			'correct_vocabulary_answer'
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

function startRetryTest() {
	selectAll( 'deselect-all' );
	allVocab = [];
	vocabAnswered = [];

	vocabToFocusOn.forEach( ( word ) => {
		let findWordArray = findWord( word )[ 0 ];
		allVocab.push( findWordArray );
		findWordArray.asked = false;
		findWordArray.category = 'redo';
	} );

	let vocabRetestCorrectAnswerCount = 0;
	document.getElementById(
		'progress-indicator-changing'
	).innerHTML = vocabRetestCorrectAnswerCount;
	document.getElementById( 'progress-indicator-set' ).innerHTML = vocabToFocusOn.length;

	collectData( 'Retried test with ' + vocabToFocusOn.length + ' incorrect words', 'retried_test' );

	formAcceptableVocab( 'redo' );
	buildTest();

	document.getElementById( 'progress-bar-content' ).style.width = 0;
	document.getElementById( 'vocab-tester-wrapper' ).classList.remove( 'is-complete' );
}

function exportIncorrectVocab() {
	let exportArray = [];
	let labels = [
		'asked',
		'noms',
		'nomp',
		'gens',
		'genp',
		'dats',
		'datp',
		'accs',
		'accp',
		'vocs',
		'vocp',
		'abls',
		'ablp',
		'pracind1s',
		'pracsuj1s',
		'prpaind1s',
		'prpasuj1s',
		'pracind2s',
		'pracsuj2s',
		'prpaind2s',
		'prpasuj2s',
		'pracind3s',
		'pracsuj3s',
		'prpaind3s',
		'prpasuj3s',
		'pracind1pl',
		'pracsuj1pl',
		'prpaind1pl',
		'prpasuj1pl',
		'pracind2pl',
		'pracsuj2pl',
		'prpaind2pl',
		'prpasuj2pl',
		'pracind3pl',
		'pracsuj3pl',
		'prpaind3pl',
		'prpasuj3pl',
		'impacind1s',
		'impacsuj1s',
		'imppaind1s',
		'imppasuj1s',
		'impacind2s',
		'impacsuj2s',
		'imppaind2s',
		'imppasuj2s',
		'impacind3s',
		'impacsuj3s',
		'imppaind3s',
		'imppasuj3s',
		'impacind1pl',
		'impacsuj1pl',
		'imppaind1pl',
		'imppasuj1pl',
		'impacind2pl',
		'impacsuj2pl',
		'imppaind2pl',
		'imppasuj2pl',
		'impacind3pl',
		'impacsuj3pl',
		'imppaind3pl',
		'imppasuj3pl',
		'ftacind1s',
		'ftpaind1s',
		'ftacind2s',
		'ftpaind2s',
		'ftacind3s',
		'ftpaind3s',
		'ftacind1pl',
		'ftpaind1pl',
		'ftacind2pl',
		'ftpaind2pl',
		'ftacind3pl',
		'ftpaind3pl',
		'pfacind1s',
		'pfacsuj1s',
		'pfpaind1s',
		'pfpasuj1s',
		'pfacind2s',
		'pfacsuj2s',
		'pfpaind2s',
		'pfpasuj2s',
		'pfacind3s',
		'pfacsuj3s',
		'pfpaind3s',
		'pfpasuj3s',
		'pfacind1pl',
		'pfacsuj1pl',
		'pfpaind1pl',
		'pfpasuj1pl',
		'pfacind2pl',
		'pfacsuj2pl',
		'pfpaind2pl',
		'pfpasuj2pl',
		'pfacind3pl',
		'pfacsuj3pl',
		'pfpaind3pl',
		'pfpasuj3pl',
		'placind1s',
		'placsuj1s',
		'plpaind1s',
		'plpasuj1s',
		'placind2s',
		'placsuj2s',
		'plpaind2s',
		'plpasuj2s',
		'placind3s',
		'placsuj3s',
		'plpaind3s',
		'plpasuj3s',
		'placind1pl',
		'placsuj1pl',
		'plpaind1pl',
		'plpasuj1pl',
		'placind2pl',
		'placsuj2pl',
		'plpaind2pl',
		'plpasuj2pl',
		'placind3pl',
		'placsuj3pl',
		'plpaind3pl',
		'plpasuj3pl',
		'imps',
		'imppl',
		'infpr',
		'infpf',
		'pap',
		'ppp',
		'fpacind1s',
		'fpacind2s',
		'fpacind3s',
		'fpacind1pl',
		'fpacind2pl',
		'fpacind3pl',
		'infft',
		'ftpp',
		'infftpa',
		'infpfpa',
		'fppaind1s',
		'fppaind2s',
		'fppaind3s',
		'fppaind1pl',
		'fppaind2pl',
		'fppaind3pl',
	];
	for ( let i = 0; i < vocabToFocusOn.length; i++ ) {
		exportArray.push( findWord( vocabToFocusOn[ i ] )[ 0 ] );

		labels.forEach( ( heading ) => {
			delete exportArray[ i ][ heading ];
		} );
	}
	collectData( 'CSV exported with ' + vocabToFocusOn.length + ' words', 'csv_export' );
	csvData = convertToCSV( exportArray );
	var dataBlob = new Blob( [ csvData ], { type: 'text/csv;charset=utf-8' } );
	document.getElementById( 'export-prompt' ).href = window.URL.createObjectURL( dataBlob );
	document.getElementById( 'export-sidebar-prompt' ).href = window.URL.createObjectURL( dataBlob );
}

function startFlashcards() {
	startTest();
	document.body.classList.add( 'is-displaying-flashcards' );
	document.getElementById( 'option' ).innerHTML = '<a onclick="resetTest()">Reset</a>';
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

	document.body.addEventListener( 'keyup', function ( event ) {
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
	} );
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
	let questionArray = document.getElementById( 'flashcard-setting-switch' ).checked
		? findWord( document.getElementById( 'front-flashcard' ).textContent )[ 0 ]
		: findWord( document.getElementById( 'back-flashcard' ).textContent )[ 0 ];
	let index = vocabToFocusOn.indexOf( questionArray.word );

	if ( ! auto ) {
		index !== -1 ? vocabToFocusOn.splice( index, 1 ) : vocabToFocusOn.push( questionArray.word );
	}

	document.getElementById( 'wrong-vocab' ).innerHTML = '';

	vocabToFocusOn.forEach( function ( item ) {
		var a = document.createElement( 'a' );
		var newItem = document.createElement( 'li' );

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

	let savedFlashcards = ( JSON.parse( localStorage.getItem( 'savedFlashcards' ) )
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
					: findWord( vocabToFocusOn[ k2 ] )[ 0 ].translation,
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
	return vocab.filter( function ( vocab ) {
		return vocab.word === word;
	} );
}

function findTranslation( translation ) {
	return vocab.filter( function ( vocab ) {
		return vocab.translation === translation;
	} );
}

function formAcceptableVocab( receivedCategory ) {
	let category = receivedCategory.toString();

	if ( category !== 'redo' && category !== 'uploaded' ) {
		var button = document.getElementById( category );

		if ( ! button ) {
			return;
		}

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

		let maxVocabOptions;
		switch ( selectedOption ) {
			case 'alevelocr':
				maxVocabOptions = 22;
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
			document.getElementById( 'select-all-desktop' ).innerHTML = 'Deselect all';
			document.getElementById( 'select-all-desktop' ).onclick = function () {
				selectAll( 'deselect-all' );
			};
			document.getElementById( 'select-all-mobile' ).innerHTML = 'Deselect all';
			document.getElementById( 'select-all-mobile' ).onclick = function () {
				selectAll( 'deselect-all' );
			};
		} else {
			document.getElementById( 'select-all-desktop' ).innerHTML = 'Select all';
			document.getElementById( 'select-all-desktop' ).onclick = function () {
				selectAll();
			};
			document.getElementById( 'select-all-mobile' ).innerHTML = 'Select all';
			document.getElementById( 'select-all-mobile' ).onclick = function () {
				selectAll();
			};
		}
	} else {
		acceptableVocab.push( category );
	}

	allVocab = vocabToTest.concat( findAllVocab() );
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

	var request = new XMLHttpRequest();
	if (navigator.onLine) {
		request.open( 'POST', 'https://clubpenguinmountains.com/wp-json/latin-vocabulary-tester/data' );
		request.setRequestHeader( 'Content-type', 'text/plain' );
		request.send( content + ' with ID of ' + userId );
	};
}

function muteAudio() {
	var muteAudioLink = document.getElementById( 'mute-audio' );

	if ( muteAudioLink.textContent.includes( 'Unmute' ) ) {
		muteAudioLink.textContent = 'Mute sound effects';
		mute = false;
		localStorage.setItem( 'defaultAudio', 'Unmuted' );
	} else {
		muteAudioLink.textContent = 'Unmute sound effects';
		localStorage.setItem( 'defaultAudio', 'Muted' );
		mute = true;
	}
	collectData( 'Audio toggled so mute is **' + mute + '**', 'audio_toggled' );
}

function toggleFooter( show ) {
	if ( ! show ) {
		document.body.classList.add( 'hide-footer' );
	} else {
		document.body.classList.remove( 'hide-footer' );
	}
	collectData( 'Footer toggled', 'footer_toggled' );
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
	collectData(
		'Difficulty changed so that the hard checkbox is ' + hardCheckbox.checked,
		'difficulty_changed'
	);
}

function toggleLimit() {
	if ( document.getElementById( 'wordLimitCheckbox' ).checked === false ) {
		document.getElementById( 'maxWordSelect' ).style.display = 'none';
	} else {
		document.getElementById( 'maxWordSelect' ).style.display = 'flex';
	}

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
