let canType = false;
let isDailyWord = true;
let selectedOption = 'any-list';
let selectedList;
let selectedWord;
let unix = 1644624000000;
let userId = localStorage.getItem( 'userID' ) || Math.floor( Math.random() * 9999999 ) + 1;

const VOCAB_LISTS_CACHE_VERSION = 1.2; // Increment when editing vocabulary lists.

loadAllVocabFiles();

window.onload = function () {
	if ( ! localStorage.getItem( 'userID' ) ) {
		localStorage.setItem( 'userID', userId );
	}

	collectData(
		'Loaded site with data ' + navigator.userAgent + ' at ' + new Date(),
		'dictum_load'
	);

	buildStats();

	if ( localStorage.getItem( 'dailyWordLastTime' ) ) {
		let currentDay = parseInt( timeDifference( Date.now(), unix ) );
		let lastPlayedDay = parseInt(
			timeDifference( parseInt( localStorage.getItem( 'dailyWordLastTime' ) ), unix )
		);

		if ( currentDay !== lastPlayedDay ) {
			localStorage.removeItem( 'dailyWord' );
			collectData( 'Stored daily word cleared automatically', 'dictum_auto_clear' );
		}

		if ( currentDay - lastPlayedDay > 1 ) {
			localStorage.setItem( 'dailyWordStreak', 0 );
			collectData(
				'Lost streak with lastPlayedDay of ' + lastPlayedDay + ' and currentDay ' + currentDay,
				'dictum_streak_lost_inactivity'
			);
		}
	}

	if ( new URLSearchParams( window.location.search ).get( 'ref' ) ) {
		collectData(
			'Loaded site with ref ' +
				new URLSearchParams( window.location.search ).get( 'ref' ) +
				' and data ' +
				navigator.userAgent
		);
	}
};

window.onerror = function ( message, source, line, col, error ) {
	collectData( 'Dictum console error logged', 'dictum_console_error_logged' );
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

function loadAllVocabFiles() {
	let fileVariableMapping = {
		'all.json': 'anyList',
		'as-level.json': 'asLevelList',
		'gcse.json': 'gcseList',
		'valid.json': 'validGuesses',
	};

	let dictumCache = caches.open( 'dictumCache' );

	let promises = Object.entries( fileVariableMapping ).map( ( [ fileName, variableName ] ) => {
		let filePath = `./vocab-lists/${ fileName }`;

		return dictumCache
			.then( ( cache ) => {
				return cache.match( fileName ).then( ( cacheResponse ) => {
					if (
						cacheResponse &&
						parseFloat( localStorage.getItem( 'dictumFilesCacheVersion' ) ) ===
							VOCAB_LISTS_CACHE_VERSION
					) {
						return cacheResponse.json();
					} else {
						return fetch( filePath )
							.then( ( response ) => {
								if ( ! response.ok ) {
									collectData( 'Dictum files failed to load' );
									collectData( error.message || error );
								}
								return response.json();
							} )
							.then( ( data ) => {
								cache.put( fileName, new Response( JSON.stringify( data ) ) );
								localStorage.setItem( 'dictumFilesCacheVersion', VOCAB_LISTS_CACHE_VERSION );

								return data;
							} )
							.catch( ( error ) => {
								collectData( 'Dictum files failed to load' );
								collectData( error.message || error );
							} );
					}
				} );
			} )
			.then( ( data ) => {
				window[ variableName ] = data;

				if ( variableName === 'anyList' ) {
					selectedList = anyList;
				}
			} );
	} );

	return Promise.all( promises );
}

function startGame( type ) {
	if ( typeof anyList === 'undefined' || typeof validGuesses === 'undefined' ) {
		document.getElementById( 'loading-warning' ).style.display = 'block';
		collectData( 'Started before initialisation', 'dictum_initialisation_error' );
		checkVocabLoaded( type );
		return;
	}

	if ( type === 'streaks' ) {
		isDailyWord = false;
		document.body.classList.add( 'is-streaks' );
		collectData( 'Started Streaks', 'dictum_started_streaks' );
	}

	if ( type !== 'streaks' && localStorage.getItem( 'dailyWord' ) ) {
		document.getElementById( 'game' ).innerHTML = localStorage.getItem( 'dailyWord' );
		collectData( 'Continued Daily Word', 'dictum_continued_daily_word' );
	}

	if ( type !== 'streaks' ) {
		selectedList = asLevelList;
		localStorage.setItem( 'dailyWordLastTime', Date.now() );
		collectData( 'Started Daily Word', 'dictum_started_daily_word' );
	}

	document.body.classList.add( 'is-daily-word' );
	document.body.classList.remove( 'is-displaying-modal' );
	selectedWord = findWord();
	canType = ! document.getElementById( 'game-board' ).classList.contains( 'is-completed' );
}

function checkVocabLoaded( type ) {
	if ( typeof anyList !== 'undefined' && typeof validGuesses !== 'undefined' ) {
		startGame( type );
	} else {
		setTimeout( function () {
			checkVocabLoaded( type );
		}, 100 );
	}
}

function findWord() {
	if ( ! isDailyWord ) {
		let max = 0;

		switch ( selectedOption ) {
			case 'gcse-list':
				max = 471;
				break;
			case 'as-list':
				max = 1009;
				break;
			case 'any-list':
				max = 1745;
		}

		let chosenWord = selectedList[ Math.floor( Math.random() * max ) ];
		return chosenWord;
	}

	let day = parseInt( timeDifference( Date.now(), unix ) );
	let chosenWord = selectedList[ day ];
	collectData( 'Selected word: ' + chosenWord.word );
	return chosenWord;
}

function toggleStats() {
	buildStats();
	document.body.classList.toggle( 'is-displaying-stats' );
	document.body.classList.toggle( 'is-displaying-modal' );
	collectData( 'Toggled stats', 'dictum_toggled_stats' );
}

function toggleInstructions() {
	document.body.classList.toggle( 'is-displaying-instructions' );
	document.body.classList.toggle( 'is-displaying-modal' );
	collectData( 'Toggled instructions', 'dictum_toggled_instructions' );
}

function buildStats() {
	let dailyGamesPlayed = localStorage.getItem( 'gamesPlayed' )
		? localStorage.getItem( 'gamesPlayed' )
		: 0;
	let streakGamesPlayed = localStorage.getItem( 'streaksGamesPlayed' )
		? localStorage.getItem( 'streaksGamesPlayed' )
		: 0;
	document.getElementById( 'daily-games-played' ).innerHTML = dailyGamesPlayed;
	document.getElementById( 'streaks-games-played' ).innerHTML = streakGamesPlayed;

	let percentageStreak = localStorage.getItem( 'percentageStreak' )
		? localStorage.getItem( 'percentageStreak' ) + '%'
		: 0;
	let streaksPercentageStreak = localStorage.getItem( 'streaksPercentageStreak' )
		? localStorage.getItem( 'streaksPercentageStreak' ) + '%'
		: 0;

	document.getElementById( 'daily-answers-correct' ).innerHTML = percentageStreak;
	document.getElementById( 'streaks-answers-correct' ).innerHTML = streaksPercentageStreak;

	let dailyWordStreak = localStorage.getItem( 'dailyWordStreak' )
		? localStorage.getItem( 'dailyWordStreak' )
		: 0;
	let streaksHighScore = localStorage.getItem( 'streaksHighScore' )
		? localStorage.getItem( 'streaksHighScore' )
		: 0;
	document.getElementById( 'daily-streak-count' ).innerHTML = dailyWordStreak;
	document.getElementById( 'streaks-highest' ).innerHTML = streaksHighScore;

	let defaultScores = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, fail: 0 };

	let streaksScoreArray = localStorage.getItem( 'streaksScoreArray' )
		? JSON.parse( localStorage.getItem( 'streaksScoreArray' ) )
		: defaultScores;
	let dailyScoreArray = localStorage.getItem( 'scoresArray' )
		? JSON.parse( localStorage.getItem( 'scoresArray' ) )
		: defaultScores;

	let streaksScoreTotal = 0;
	let dailyScoreTotal = 0;

	collectData(
		'dailyGamesPlayed: ' +
			dailyGamesPlayed +
			'\nstreakGamesPlayed: ' +
			streakGamesPlayed +
			'\npercentageStreak: ' +
			percentageStreak +
			'\nstreaksPercentageStreak: ' +
			streaksPercentageStreak +
			'\ndailyWordStreak: ' +
			dailyWordStreak +
			'\nstreaksHighScore: ' +
			streaksHighScore +
			'\ndailyScoreTotal: ' +
			dailyScoreTotal +
			'\nstreaksScoreTotal: ' +
			streaksScoreTotal +
			'\ndailyScoreArray: ' +
			JSON.stringify( dailyScoreArray ) +
			'\nstreaksScoreArray: ' +
			JSON.stringify( streaksScoreArray )
	);

	streaksScoreTotal = Object.values( streaksScoreArray ).reduce( ( acc, score ) => acc + score, 0 );
	dailyScoreTotal = Object.values( dailyScoreArray ).reduce( ( acc, score ) => acc + score, 0 );

	for ( let i = 1; i < 7; i++ ) {
		document.getElementById( 'streaks-bar-' + i ).style.width =
			( streaksScoreArray[ i ] / streaksScoreTotal ) * 100 + '%';
		document.getElementById( 'daily-bar-' + i ).style.width =
			( dailyScoreArray[ i ] / dailyScoreTotal ) * 100 + '%';

		if ( streaksScoreArray[ i ] === 0 ) {
			document.getElementById( 'streaks-bar-' + i ).style.width = '1%';
		}

		if ( dailyScoreArray[ i ] === 0 ) {
			document.getElementById( 'daily-bar-' + i ).style.width = '1%';
		}
	}

	document.getElementById( 'streaks-bar-7' ).style.width =
		( streaksScoreArray.fail / streaksScoreTotal ) * 100 + '%';
	document.getElementById( 'daily-bar-7' ).style.width =
		( dailyScoreArray.fail / dailyScoreTotal ) * 100 + '%';

	if ( streaksScoreArray.fail === 0 ) {
		document.getElementById( 'streaks-bar-7' ).style.width = '1%';
	}

	if ( dailyScoreArray.fail === 0 ) {
		document.getElementById( 'daily-bar-7' ).style.width = '1%';
	}
}

function changeOption( chosenOption ) {
	document.getElementById( 'gcse-list' ).classList.remove( 'is-selected' );
	document.getElementById( 'as-list' ).classList.remove( 'is-selected' );
	document.getElementById( 'any-list' ).classList.remove( 'is-selected' );
	document.getElementById( chosenOption ).classList.add( 'is-selected' );
	selectedOption = chosenOption;
	collectData( 'Changed option to ' + chosenOption, 'dictum_changed_option' );

	switch ( chosenOption ) {
		case 'gcse-list':
			selectedList = gcseList;
			break;
		case 'as-list':
			selectedList = asLevelList;
			break;
		case 'any-list':
			selectedList = anyList;
	}
}

function addLetter( letter ) {
	let gameBoard = document.querySelectorAll( '.game-tile-letter' );

	if ( ! canType ) {
		return;
	}

	for ( let i = 0; i < gameBoard.length; i++ ) {
		if ( 4 < i && ! document.getElementById( 'row1' ).classList.contains( 'is-completed' ) ) {
			break;
		}

		if ( 9 < i && ! document.getElementById( 'row2' ).classList.contains( 'is-completed' ) ) {
			break;
		}

		if ( 14 < i && ! document.getElementById( 'row3' ).classList.contains( 'is-completed' ) ) {
			break;
		}

		if ( 19 < i && ! document.getElementById( 'row4' ).classList.contains( 'is-completed' ) ) {
			break;
		}

		if ( 24 < i && ! document.getElementById( 'row5' ).classList.contains( 'is-completed' ) ) {
			break;
		}

		if ( 29 < i && ! document.getElementById( 'row6' ).classList.contains( 'is-completed' ) ) {
			break;
		}

		if ( ! gameBoard[ i ].childNodes.length ) {
			document.querySelectorAll( '.game-tile-letter' )[ i ].innerHTML = letter;
			break;
		}
	}
}

function removeLetter() {
	let gameBoard = document.querySelectorAll( '.game-tile-letter' );

	for ( let i = gameBoard.length - 1; i >= 0; i-- ) {
		if ( gameBoard[ i ].childNodes.length ) {
			if (
				document
					.getElementById( gameBoard[ i ].id.substring( 0, 4 ) )
					.classList.contains( 'is-completed' )
			) {
				break;
			}

			document.querySelectorAll( '.game-tile-letter' )[ i ].innerHTML = '';
			break;
		}
	}
}

function checkAnswer() {
	let targetWord = selectedWord.word;
	let wordSplit = targetWord.split( '' );

	let gameBoardId = document.querySelectorAll( '.game-row.is-not-completed' )[ 0 ].id;
	let fullSubmission = [];

	for ( let i = 0; i < 5; i++ ) {
		let tile = document.getElementById( gameBoardId + 'tile' + i );
		if ( tile.textContent.length ) {
			fullSubmission.push( tile.textContent );
		}
	}

	collectData(
		'Entered ' + fullSubmission.join( '' ) + ' for ' + selectedWord.word + ' on ' + gameBoardId,
		'dictum_checked_answer'
	);

	if ( fullSubmission.length !== 5 ) {
		return;
	}

	if ( ! validGuesses.includes( fullSubmission.join( '' ) ) ) {
		document.getElementById( 'game-notice-text' ).innerHTML = 'Invalid word';
		document.getElementById( 'game-notice' ).classList.remove( 'is-hidden' );
		document.getElementById( gameBoardId ).classList.add( 'shake-animation' );
		setTimeout( function () {
			document.getElementById( 'game-notice' ).classList.add( 'is-hidden' );
			document.getElementById( gameBoardId ).classList.remove( 'shake-animation' );
		}, 1400 );
		return;
	}

	canType = false;
	document.getElementById( 'game-notice' ).classList.add( 'is-hidden' );

	let correctionClasses = Array( 5 );
	let letterCounts = new Map();

	for ( let i = 0; i < 5; ++i ) {
		if ( targetWord[ i ] == fullSubmission[ i ] ) {
			correctionClasses[ i ] = 'is-correct-place';
		} else if ( letterCounts.has( targetWord[ i ] ) ) {
			letterCounts.set( targetWord[ i ], letterCounts.get( targetWord[ i ] ) + 1 );
		} else {
			letterCounts.set( targetWord[ i ], 1 );
		}
	}

	for ( let i = 0; i < 5; ++i ) {
		if ( correctionClasses[ i ] != 'is-correct-place' ) {
			if ( letterCounts.get( fullSubmission[ i ] ) > 0 ) {
				correctionClasses[ i ] = 'is-contained';
				letterCounts.set( fullSubmission[ i ], letterCounts.get( fullSubmission[ i ] ) - 1 );
			} else {
				correctionClasses[ i ] = 'is-not-contained';
			}
		}
	}

	for ( let i = 0; i < 5; i++ ) {
		setTimeout( function timer() {
			let tile = document.getElementById( gameBoardId + 'tile' + i );
			tile.parentNode.classList.add( correctionClasses[ i ] );
			document.getElementById( tile.textContent + '-key' ).classList.add( correctionClasses[ i ] );
			tile.parentNode.classList.add( 'animate' );

			if ( i === 4 ) {
				canType = true;
				if ( fullSubmission.join( '' ) === targetWord ) {
					document.getElementById( 'copy-stats' ).style.display = 'flex';
					document.getElementById( gameBoardId ).classList.add( 'is-answer' );
					document.getElementById( 'game-board' ).classList.add( 'is-completed' );
					finishAnswer( 'correct' );
					correctAnswer();
					collectData(
						'Correctly answered - isDailyWord: ' + isDailyWord,
						'dictum_correct_answer'
					);
					collectData( copyDailyStat( true ) );
					document.getElementById( 'next-streak' ).style.display = 'block';
				} else if ( document.querySelectorAll( '.game-row.is-completed' ).length === 6 ) {
					document.getElementById( 'copy-stats' ).style.display = 'flex';
					canType = false;
					finishAnswer( 'wrong' );
					collectData(
						'Failed to answer - isDailyWord: ' + isDailyWord,
						'dictum_failed_to_answer'
					);
					collectData( copyDailyStat( true ) );
					document.getElementById( 'game-notice-text' ).innerHTML = targetWord.toUpperCase();
					document.getElementById( 'game-notice' ).classList.remove( 'is-hidden' );
					document.getElementById( 'next-streak' ).style.display = 'block';
				}
			}

			if ( isDailyWord ) {
				localStorage.setItem( 'dailyWord', document.getElementById( 'game' ).innerHTML );
			}
		}, i * 600 );
	}

	document.getElementById( gameBoardId ).classList.add( 'is-completed' );
	document.getElementById( gameBoardId ).classList.remove( 'is-not-completed' );

	if ( isDailyWord ) {
		localStorage.setItem( 'dailyWord', document.getElementById( 'game' ).innerHTML );
	}
}

function streakCalculation( isCorrect ) {
	if ( isDailyWord ) {
		return;
	}

	let currentStreak = parseInt( document.getElementById( 'current-streak' ).textContent );

	if ( isCorrect ) {
		document.getElementById( 'current-streak' ).innerHTML = currentStreak + 1;
		collectData( 'Streak continued at ' + currentStreak, 'dictum_streak_continued' );
		document.getElementById( 'next-streak' ).innerHTML =
			'<a id="next-word-link" onclick="resetGame()">Next word</a>';
	} else {
		collectData( 'Streak ended at ' + currentStreak, 'dictum_streak_ended' );
		document.getElementById( 'next-streak' ).innerHTML =
			'eheu! <a onclick="resetStreak()">Try again</a>';
	}
}

function copyDailyStat( string ) {
	let board = [];
	document.querySelectorAll( '.game-row.is-completed .game-tile' ).forEach( ( tile ) => {
		if ( tile.classList.contains( 'is-correct-place' ) ) {
			board.push( '🟩' );
		} else if ( tile.classList.contains( 'is-contained' ) ) {
			board.push( '🟨' );
		} else {
			board.push( '⬜' );
		}
	} );

	let digit = isDailyWord ? parseInt( timeDifference( Date.now(), unix ) ) + ' ' : '';
	let int = document.querySelectorAll( '.game-row.is-answer' ).length
		? parseInt( document.querySelectorAll( '.game-row.is-answer' )[ 0 ].id.substring( 3, 4 ) )
		: 'X';

	let boardString = 'Dictum (Latin Wordle) ' + digit + int + '/6\n';
	for ( let i = 0; i < board.length; i++ ) {
		boardString += board[ i ];

		if ( [ 4, 9, 14, 19, 24, 29 ].includes( i ) ) {
			boardString += '\n';
		}
	}

	if ( string ) {
		return boardString;
	}

	boardString += '\nhttps://latinvocabularytester.com/dictum/';

	navigator.clipboard.writeText( boardString );

	document.getElementById( 'copy-stats-link' ).innerHTML = 'Copied to clipboard';
	collectData( 'Copied to clipboard', 'dictum_copied_clipboard' );
}

function correctAnswer() {
	canType = false;
	setTimeout( function () {
		document.querySelectorAll( '.game-row.is-answer' )[ 0 ].classList.add( 'bounce-animation' );
	}, 300 );

	let completedIn = parseInt(
		document.querySelectorAll( '.game-row.is-answer' )[ 0 ].id.substring( 3, 4 )
	);
	let completionText = '';

	switch ( completedIn ) {
		case 1:
			completionText = 'ingeniosum!';
			break;
		case 2:
			completionText = 'optimum!';
			break;
		case 3:
			completionText = 'splendidum!';
			break;
		case 4:
			completionText = 'mirabile!';
			break;
		case 5:
			completionText = 'bonum!';
			break;
		case 6:
			completionText = 'felix!';
			break;
	}

	document.getElementById( 'game-notice-text' ).innerHTML = completionText;
	document.getElementById( 'game-notice' ).classList.remove( 'is-hidden' );
}

function resetStreak() {
	document.getElementById( 'current-streak' ).innerHTML = '0';
	resetGame();
	collectData( 'Reset streak', 'dictum_reset_streak' );
}

function resetGame() {
	document.querySelectorAll( '.game-row' ).forEach( ( tile ) => {
		tile.classList.remove( 'is-completed' );
		tile.classList.remove( 'is-answer' );
		tile.classList.remove( 'bounce-animation' );
		tile.classList.add( 'is-not-completed' );
	} );

	document.querySelectorAll( '.game-tile' ).forEach( ( tile ) => {
		tile.classList.remove( 'is-contained' );
		tile.classList.remove( 'is-not-contained' );
		tile.classList.remove( 'is-correct-place' );
		tile.classList.remove( 'animate' );
	} );

	document.querySelectorAll( '.keyboard button' ).forEach( ( tile ) => {
		tile.classList.remove( 'is-contained' );
		tile.classList.remove( 'is-not-contained' );
		tile.classList.remove( 'is-correct-place' );
	} );

	document.querySelectorAll( '.game-tile-letter' ).forEach( ( tile ) => {
		tile.innerHTML = '';
	} );

	document.getElementById( 'game-notice' ).classList.add( 'is-hidden' );
	document.getElementById( 'copy-stats' ).style.display = 'none';
	document.getElementById( 'next-streak' ).style.display = 'none';
	document.getElementById( 'word-meaning' ).classList.add( 'is-hidden' );
	document.getElementById( 'copy-stats-link' ).innerHTML = 'Copy score to clipboard';
	canType = true;
	selectedWord = findWord();
}

function finishAnswer( answer ) {
	streakCalculation( answer === 'correct' );

	document.getElementById( 'word-inflection' ).innerHTML = findInflection( selectedWord.type );
	document.getElementById( 'word-definition' ).innerHTML = selectedWord.translation;
	document.getElementById( 'word-root' ).innerHTML = selectedWord.full;
	document.getElementById( 'word-meaning' ).classList.remove( 'is-hidden' );

	if ( isDailyWord ) {
		let gamesPlayed = parseInt( localStorage.getItem( 'gamesPlayed' ) ) + 1 || 1;
		let answeredCorrectly = parseInt( localStorage.getItem( 'answeredCorrectly' ) ) || 0;
		let scoresArray = JSON.parse( localStorage.getItem( 'scoresArray' ) ) || {
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
			6: 0,
			fail: 0,
		};

		if ( answer === 'correct' ) {
			let answeredOn = parseInt(
				document.querySelectorAll( '.game-row.is-answer' )[ 0 ].id.substring( 3, 4 )
			);
			scoresArray[ answeredOn ] = scoresArray[ answeredOn ] + 1;
			answeredCorrectly = answeredCorrectly + 1;
		} else {
			scoresArray.fail = scoresArray.fail + 1;
		}

		let percentageStreak = Math.round( ( answeredCorrectly / gamesPlayed ) * 100 );
		let dailyWordStreak;

		if ( ! localStorage.getItem( 'dailyWordStreak' ) ) {
			dailyWordStreak = answer === 'correct' ? 1 : 0;
		} else {
			if ( answer === 'correct' ) {
				dailyWordStreak = parseInt( localStorage.getItem( 'dailyWordStreak' ) ) + 1;
			} else {
				dailyWordStreak = 0;
			}
		}

		localStorage.setItem( 'gamesPlayed', gamesPlayed );
		localStorage.setItem( 'answeredCorrectly', answeredCorrectly );
		localStorage.setItem( 'percentageStreak', percentageStreak );
		localStorage.setItem( 'dailyWordStreak', dailyWordStreak );
		localStorage.setItem( 'dailyWordLastTime', Date.now() );
		localStorage.setItem( 'scoresArray', JSON.stringify( scoresArray ) );
		return;
	}

	let streaksGamesPlayed = parseInt( localStorage.getItem( 'streaksGamesPlayed' ) ) + 1 || 1;
	let streaksAnsweredCorrectly =
		parseInt( localStorage.getItem( 'streaksAnsweredCorrectly' ) ) || 0;
	let streaksScoreArray = JSON.parse( localStorage.getItem( 'streaksScoreArray' ) ) || {
		1: 0,
		2: 0,
		3: 0,
		4: 0,
		5: 0,
		6: 0,
		fail: 0,
	};
	let streaksHighScore = parseInt( localStorage.getItem( 'streaksHighScore' ) ) || 0;

	if ( answer === 'correct' ) {
		let answeredOn = parseInt(
			document.querySelectorAll( '.game-row.is-answer' )[ 0 ].id.substring( 3, 4 )
		);
		streaksScoreArray[ answeredOn ] = streaksScoreArray[ answeredOn ] + 1;
		streaksAnsweredCorrectly = streaksAnsweredCorrectly + 1;
	} else {
		streaksScoreArray.fail = streaksScoreArray.fail + 1;
	}

	if ( parseInt( document.getElementById( 'current-streak' ).textContent ) > streaksHighScore ) {
		streaksHighScore = parseInt( document.getElementById( 'current-streak' ).textContent );
	}

	let streaksPercentageStreak = Math.round(
		( streaksAnsweredCorrectly / streaksGamesPlayed ) * 100
	);
	localStorage.setItem( 'streaksGamesPlayed', streaksGamesPlayed );
	localStorage.setItem( 'streaksAnsweredCorrectly', streaksAnsweredCorrectly );
	localStorage.setItem( 'streaksPercentageStreak', streaksPercentageStreak );
	localStorage.setItem( 'streaksHighScore', streaksHighScore );
	localStorage.setItem( 'streaksScoreArray', JSON.stringify( streaksScoreArray ) );
}

function timeDifference( date1, date2 ) {
	var difference = date1 - date2;

	return Math.floor( difference / 1000 / 60 / 60 / 24 );
}

function findInflection( form ) {
	let fullForm = '';
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
	} else if ( form.startsWith( 'pf' ) ) {
		fullForm += ' perfect';
	} else if ( form.startsWith( 'pl' ) ) {
		fullForm += ' pluperfect';
	}

	if ( ! form.includes( 'acc' ) && form.includes( 'ac' ) ) {
		fullForm += ' active';
	} else if ( form.includes( 'pa' ) ) {
		fullForm += ' passive';
	}

	if ( form.includes( 'suj' ) ) {
		fullForm += ' subjunctive';
	} else if ( form.includes( 'ind' ) ) {
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
		case 'adj':
			fullForm = 'adjective';
			break;
		case 'adv':
			fullForm = 'adverb';
			break;
		case 'conjunction':
			fullForm = 'conjunction';
			break;
		case 'pronoun':
			fullForm = 'pronoun';
			break;
	}

	return fullForm;
}

function collectData( content, analyticsID ) {
	if ( analyticsID ) {
		gtag( 'event', analyticsID );
	}

	var request = new XMLHttpRequest();
	request.open(
		'POST',
		'https://clubpenguinmountains.com/wp-json/latin-vocabulary-tester/dictum-data'
	);
	request.setRequestHeader( 'Content-type', 'text/plain' );
	request.send( content + ' with ID of ' + userId );
}

function keyPress( e, manual ) {
	let keyNo;

	if ( ! manual ) {
		if ( window.event ) {
			keyNo = e.keyCode;
		} else if ( e.which ) {
			keyNo = e.which;
		}

		if ( keyNo === 8 ) {
			return removeLetter();
		}

		if ( keyNo === 13 ) {
			return checkAnswer();
		}
	}

	let keyCode = manual ? e : String.fromCharCode( keyNo ).toLowerCase();

	let validKeys = [
		'a',
		'b',
		'c',
		'd',
		'e',
		'f',
		'g',
		'h',
		'i',
		'j',
		'k',
		'l',
		'm',
		'n',
		'o',
		'p',
		'q',
		'r',
		's',
		't',
		'u',
		'v',
		'w',
		'x',
		'y',
		'z',
	];

	if ( validKeys.includes( keyCode ) ) {
		addLetter( keyCode );
	}
}
