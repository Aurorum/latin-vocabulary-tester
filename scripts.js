let acceptableCases = [];
let acceptableVocab = [];
let allVocab = [];
let competitiveMode = false;
let competitiveTestType;
let data = 0;
let finalVocab = [];
let hardDifficulty = false;
let isTestingConjugations = false;
let isTestingDeclensions = false;
let isTestingParticipleParts = false;
let mute = false;
let selectedOption;
let userId = localStorage.getItem( 'userID' ) || Math.floor( Math.random() * 9999999 ) + 1;
let vocab = vocabGCSEOCR;
let vocabAnswered = [];
let vocabConjugation;
let vocabDeclension;
let vocabRetestCorrectAnswerCount = 0;
let vocabToFocusOn = [];
let vocabToTest = [];

window.onload = function () {
	if ( ! localStorage.getItem( 'userID' ) ) {
		localStorage.setItem( 'userID', Math.floor( Math.random() * 9999999 ) + 1 );
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
	collectData( 'Loaded site with data ' + navigator.userAgent, 'load' );

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

	if (
		localStorage.getItem( 'defaultAudio' ) &&
		localStorage.getItem( 'defaultAudio' ) === 'Muted'
	) {
		muteAudio();
	}

	for ( let i = 0; i < 12; i++ ) {
		acceptableCases.push( i );
	}

	for ( let i = 1; i < 301; i++ ) {
		var option = document.createElement( 'option' );
		option.text = i;
		document.getElementById( 'max-word-select' ).add( option );
	}
	document.getElementById( 'max-word-select' ).selectedIndex = 19;

	if ( window.innerWidth < 480 ) {
		let rowWrapper = document.querySelectorAll( '.row-wrapper' );
		for ( let i = 0; i < rowWrapper.length; i++ ) {
			rowWrapper[ i ].classList.add( 'is-collapsed' );
		}
	}

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
};

function changeOption( option, playAudio = true ) {
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
	selectAll( 'change-option' );
	document.body.classList.add( 'is-' + option );
	localStorage.setItem( 'defaultOption', option );
	selectedOption = option;
	vocab = type;

	if ( ! mute && playAudio ) {
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
	document.getElementById( 'vocab-answer' ).focus();

	collectData(
		'Started test of ' + selectedOption + ' with competition mode set to ' + competitiveMode,
		'started_test'
	);

	if ( startDeclensionTest ) {
		document.body.classList.add( 'has-begun-declension-test' );
		document.getElementById( 'progress-indicator-slash' ).innerHTML = ' declined correctly';
		collectData( 'Started declension test', 'started_declension_test' );
		return buildDeclensionOrConjugationTest( false );
	}

	if ( startConjugationTest ) {
		document.body.classList.add( 'has-begun-conjugation-test' );
		document.getElementById( 'progress-indicator-slash' ).innerHTML = ' conjugated correctly';
		collectData( 'Started conjugation test', 'started_conjugation_test' );
		return buildDeclensionOrConjugationTest( true );
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
			break;
		case 'conjugation':
			challenge = 'conjugate as many verbs as possible';
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

function buildDeclensionOrConjugationTest( isConjugationTest = false ) {
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
	finalVocab[ randomNumber ].asked = true;

	document.getElementById( 'vocab-question' ).innerHTML = vocabwithNumber.word;
}

function handleVerbConjugations() {
	let verbForm;
	let firstPersonWarning = true;

	// Remove subjunctives from GCSE tests.
	let conjugationNumber = selectedOption === 'alevelocr' ? 20 : 11;

	switch ( Math.floor( Math.random() * conjugationNumber ) ) {
		case 0:
			verbForm = 'present active indicative';
			vocabConjugation = 'pracind';
			break;
		case 1:
			verbForm = 'imperfect active indicative';
			vocabConjugation = 'impacind';
			break;
		case 2:
			verbForm = 'future active indicative';
			vocabConjugation = 'ftacind';
			break;
		case 3:
			verbForm = 'perfect active indicative';
			vocabConjugation = 'pfacind';
			break;
		case 4:
			verbForm = 'pluperfect active indicative';
			vocabConjugation = 'placind';
			break;
		case 5:
			verbForm = 'present singular imperative';
			vocabConjugation = 'imp';
			firstPersonWarning = false;
			break;
		case 6:
			verbForm = 'present active participle';
			vocabConjugation = 'pap';
			firstPersonWarning = false;
			break;
		case 7:
			verbForm = 'present passive indicative';
			vocabConjugation = 'prpaind';
			break;
		case 8:
			verbForm = 'imperfect passive indicative';
			vocabConjugation = 'imppaind';
			break;
		case 9:
			verbForm = 'perfect passive indicative';
			vocabConjugation = 'pfpaind';
			break;
		case 10:
			verbForm = 'pluperfect passive indicative';
			vocabConjugation = 'plpaind';
			break;
		case 11:
			verbForm = 'present active subjunctive';
			vocabConjugation = 'pracsuj';
			break;
		case 12:
			verbForm = 'imperfect active subjunctive';
			vocabConjugation = 'impacsuj';
			break;
		case 13:
			verbForm = 'pluperfect active subjunctive';
			vocabConjugation = 'placsuj';
			break;
		case 14:
			verbForm = 'future passive indicative';
			vocabConjugation = 'ftpaind';
			break;
		case 15:
			verbForm = 'perfect active subjunctive';
			vocabConjugation = 'pfacsuj';
			break;
		case 16:
			verbForm = 'present passive subjunctive';
			vocabConjugation = 'prpasuj';
			break;
		case 17:
			verbForm = 'imperfect, passive, subjunctive';
			vocabConjugation = 'imppasuj';
			break;
		case 18:
			verbForm = 'perfect, passive, subjunctive';
			vocabConjugation = 'pfpasuj';
			break;
		case 19:
			verbForm = 'pluperfect, passive, subjunctive';
			vocabConjugation = 'plpasuj';
			break;
	}

	document.getElementById( 'vocab-submit-word-form' ).innerHTML = verbForm + ' form';

	if ( firstPersonWarning ) {
		document.getElementById( 'vocab-submit-first-person-warning' ).innerHTML =
			' first-person singular ';
	} else {
		document.getElementById( 'vocab-submit-first-person-warning' ).innerHTML = '';
	}

	return vocabConjugation;
}

function handleNounSelection( e ) {
	if ( ! document.querySelectorAll( '.noun-types input[type="checkbox"]:checked' ).length ) {
		e.checked = true;
		return ( document.getElementById( 'declensions-warning' ).style.display = 'block' );
	}

	collectData(
		'Set declension selection ' + e.id + ' to be ' + e.checked,
		'set_declension_settings'
	);

	document.getElementById( 'declensions-warning' ).style.display = 'none';
	buildDeclensionOrConjugationTest( false );
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

	caseNumber.forEach( ( number ) => {
		e.checked
			? acceptableCases.push( number )
			: acceptableCases.splice( acceptableCases.indexOf( number ), 1 );
	} );

	collectData( 'Set case selection ' + e.id + ' to be ' + e.checked, 'set_case_settings' );

	document.getElementById( 'declensions-warning' ).style.display = 'none';
	buildDeclensionOrConjugationTest( false );
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
			allOptions.push( i );
		}

		allOptions.push( 'other' );
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

	collectData( 'Selected all options', 'selected_all_options' );
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
			'Answered revealed in ' +
				testType +
				' test for ' +
				question +
				' of ' +
				document.getElementById( 'vocab-question' ).textContent,
			'revealed_' + testType + '_answer'
		);
	} else {
		document.getElementById( 'wrong-answer' ).style.display = isAnswerCorrect ? 'none' : 'block';

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
			return buildDeclensionOrConjugationTest( isTestingConjugations );
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
		} else {
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

	collectData( 'Retried test with ' + vocabToFocusOn.length + ' incorrect words', 'retried_test' );

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
	collectData( 'CSV exported with ' + vocabToFocusOn.length + ' words', 'csv_export' );
	csvData = convertToCSV( exportArray );
	var dataBlob = new Blob( [ csvData ], { type: 'text/csv;charset=utf-8' } );
	document.getElementById( 'export-prompt' ).href = window.URL.createObjectURL( dataBlob );
	document.getElementById( 'export-sidebar-prompt' ).href = window.URL.createObjectURL( dataBlob );
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
		return acceptableVocab.includes( vocab.category ) && isWithinValue( vocab.word );
	} );
}

function findVocab() {
	return vocab.filter( function ( vocab ) {
		return (
			acceptableVocab.includes( vocab.category ) && ! vocab.asked && isWithinValue( vocab.word )
		);
	} );
}

function findAllConjugationVocab() {
	return vocab.filter( function ( vocab ) {
		return typeof vocab.placsuj === 'string';
	} );
}

function findConjugationVocab() {
	return vocab.filter( function ( vocab ) {
		return typeof vocab.placsuj === 'string' && ! vocab.asked;
	} );
}

function findDeclensionVocab() {
	return vocab.filter( function ( vocab ) {
		if ( competitiveMode ) {
			return typeof vocab.noms === 'string' && ! vocab.asked;
		}

		// This isn't pretty, but Eduqas doesn't split words into categories, so it must be done manually.
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

function collectData( content, analyticsID ) {
	if ( analyticsID ) {
		gtag( 'event', analyticsID );
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
