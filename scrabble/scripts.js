let blankTilePlacement;
let canUseMultiplayer = true;
let ceasePolling = false;
let currentTurnPlayer = 'player1';
let isMultiplayerGame = true;
let isSwappingTiles = false;
let lockedTile;
let multiplayerId;
let outOfTiles = false;
let passCount = 0;
let placedTiles = [];
let player1FinalPass = false;
let player1Inventory = [];
let player1MultiplayerId;
let player1Name = 'Player 1';
let player1Score = 0;
let player2FinalPass = false;
let player2Inventory = [];
let player2MultiplayerId;
let player2Name = 'Player 2';
let player2Score = 0;
let turnEstimatedScore = 0;
let turnHistory = {};
let turnWordArray = [];
let userId = localStorage.getItem( 'userID' ) || Math.floor( Math.random() * 9999999 ) + 1;
let gameInventory = [
	'e',
	'e',
	'e',
	'e',
	'e',
	'e',
	'e',
	'e',
	'e',
	'e',
	'e',
	'i',
	'i',
	'i',
	'i',
	'i',
	'i',
	'i',
	'i',
	'i',
	'i',
	'i',
	'a',
	'a',
	'a',
	'a',
	'a',
	'a',
	'a',
	'a',
	'a',
	'r',
	'r',
	'r',
	'r',
	'r',
	'r',
	'r',
	'r',
	'r',
	's',
	's',
	's',
	's',
	's',
	's',
	's',
	's',
	't',
	't',
	't',
	't',
	't',
	't',
	't',
	'u',
	'u',
	'u',
	'u',
	'u',
	'u',
	'n',
	'n',
	'n',
	'n',
	'n',
	'n',
	'm',
	'm',
	'm',
	'm',
	'm',
	'o',
	'o',
	'o',
	'o',
	'o',
	'c',
	'c',
	'c',
	'c',
	'd',
	'd',
	'd',
	'l',
	'l',
	'p',
	'p',
	'b',
	'b',
	'v',
	'v',
	'f',
	'g',
	'x',
	'h',
	'q',
	'?',
	'?',
];

window.onload = function () {
	if ( ! localStorage.getItem( 'userID' ) ) {
		localStorage.setItem( 'userID', userId );
	}

	assignInventory( 'player1', true );
	assignInventory( 'player2', false );
	resizeInventoryTiles();

	collectData(
		'Loaded site with data ' + navigator.userAgent + ' at ' + new Date(),
		'scrabble_load'
	);

	if ( new URLSearchParams( window.location.search ).get( 'ref' ) ) {
		collectData(
			'Loaded site with ref ' +
				new URLSearchParams( window.location.search ).get( 'ref' ) +
				' and data ' +
				navigator.userAgent
		);
	}

	canUseMultiplayerCheck();
};

// Scrabble inventory.
function assignInventory( player, display ) {
	if ( display ) {
		document.querySelectorAll( '#inventory td' ).forEach( ( item, index ) => {
			item.removeAttribute( 'data-letter' );
		} );
	}

	let mockInventory = player === 'player1' ? player1Inventory : player2Inventory;

	while ( mockInventory.length < 7 ) {
		if ( gameInventory.length ) {
			// Assign tile from what's left and remove it from game inventory.
			let randomTile = Math.floor( Math.random() * gameInventory.length );
			mockInventory.push( gameInventory[ randomTile ] );
			gameInventory.splice( randomTile, 1 );
		} else {
			// Out of game inventory tiles.
			outOfTiles = true;
			break;
		}
	}

	if ( gameInventory.length < 7 ) {
		document.getElementById( 'inventory-actions' ).classList.add( 'out-of-tiles' );
	}

	if ( player === 'player1' ) {
		player1Inventory = [];
		player1Inventory = mockInventory;
	}

	if ( player === 'player2' ) {
		player2Inventory = [];
		player2Inventory = mockInventory;
	}

	document.getElementById( 'inventory-row' ).setAttribute( 'data-player', player );
	document.getElementById( 'remaining-tile-count-icon' ).innerHTML = gameInventory.length;

	// Display inventory in tiles.
	if ( display ) {
		document.querySelectorAll( '#inventory td' ).forEach( ( item, index ) => {
			if ( mockInventory[ index ] ) {
				item.setAttribute( 'data-letter', mockInventory[ index ] );
			}
		} );
	}
}

function handleInventoryClick( tile ) {
	if ( isSwappingTiles ) {
		tile.classList.toggle( 'is-active' );

		if ( ! document.querySelector( '#inventory td.is-active' ) ) {
			document.getElementById( 'swap-confirm-button' ).classList.add( 'is-invalid' );
		} else {
			document.getElementById( 'swap-confirm-button' ).classList.remove( 'is-invalid' );
		}

		return;
	}

	if ( document.querySelector( '#inventory td.is-active' ) ) {
		let oldLetter = document
			.querySelector( '#inventory td.is-active' )
			.getAttribute( 'data-letter' );
		lockedTile.setAttribute( 'data-letter', tile.getAttribute( 'data-letter' ) );
		tile.setAttribute( 'data-letter', oldLetter );
		lockedTile = null;
		document.getElementById( 'board' ).classList.remove( 'is-placing-tile' );

		document.querySelector( '#inventory td.is-active' ).classList.remove( 'is-active' );
		collectData( 'Rearranged tile', 'scrabble_rearranged_tile' );

		return;
	}

	resetInventory();
	lockedTile = tile;
	tile.classList.add( 'is-active' );
	document.getElementById( 'board' ).classList.add( 'is-placing-tile' );
}

function resetInventory() {
	document.querySelectorAll( '#inventory td' ).forEach( ( item ) => {
		item.classList.remove( 'is-active' );
	} );
	document.getElementById( 'board' ).classList.remove( 'is-placing-tile' );
}

function swapTiles() {
	if ( ! isSwappingTiles ) {
		// Let user select tiles and re-click Swap.
		isSwappingTiles = true;
		document.getElementById( 'inventory-actions' ).classList.add( 'is-swapping-tiles' );
		document.querySelectorAll( '#board td[data-active]' ).forEach( ( tile ) => {
			handleTileClick( tile );
		} );

		collectData( 'Select swap tiles', 'scrabble_select_swap_tiles' );

		return;
	}

	let arrayToRemove = [];
	document.querySelectorAll( '#inventory td.is-active' ).forEach( ( tile ) => {
		arrayToRemove.push( tile.getAttribute( 'data-letter' ) );
		tile.removeAttribute( 'data-letter' );
		tile.classList.remove( 'is-active' );
	} );

	if ( currentTurnPlayer === 'player1' ) {
		player1Inventory = player1Inventory.filter( ( el ) => ! arrayToRemove.includes( el ) );
	}

	if ( currentTurnPlayer === 'player2' ) {
		player2Inventory = player2Inventory.filter( ( el ) => ! arrayToRemove.includes( el ) );
	}

	isSwappingTiles = false;
	document.getElementById( 'inventory-actions' ).classList.remove( 'is-swapping-tiles' );

	assignInventory( currentTurnPlayer, true );

	arrayToRemove.forEach( ( tile ) => {
		gameInventory.push( tile );
	} );

	if ( arrayToRemove.length > 0 ) {
		submitTurn( true, false, arrayToRemove.length, false );
	}
	collectData( 'Swapped tiles', 'scrabble_swapped_tiles' );
}

function cancelTileSwap() {
	document.querySelectorAll( '#inventory td.is-active' ).forEach( ( tile ) => {
		tile.classList.remove( 'is-active' );
	} );

	swapTiles();

	collectData( 'Cancel swapped', 'scrabble_cancel_swap' );
}

function shuffleTiles() {
	let currentInventory = [];

	document.querySelectorAll( '#inventory td[data-letter]' ).forEach( ( tile ) => {
		currentInventory.push( tile.getAttribute( 'data-letter' ) );
	} );
	currentInventory.sort( () => 0.5 - Math.random() );

	currentInventory.forEach( ( letter, i ) => {
		document
			.querySelectorAll( '#inventory td[data-letter]' )
			[ i ].setAttribute( 'data-letter', letter );
	} );

	collectData( 'Shuffled tiles', 'scrabble_shuffled_tiles' );
}

function buildTileBag() {
	let alphabet = 'abcdefghilmnopqrstuvx?';

	alphabet.split( '' ).forEach( ( letter ) => {
		let count = gameInventory.filter( ( el ) => el === letter ).length;
		let element = document.getElementById( letter + '-count' );
		element.innerHTML = count;

		if ( count === 0 ) {
			element.parentElement.classList.add( 'has-run-out' );
		} else {
			element.parentElement.classList.remove( 'has-run-out' );
		}

		document.getElementById( 'remaining-tile-count' ).innerHTML = gameInventory.length;
	} );
}

function resizeInventoryTiles() {
	// Keeps them square.
	document.getElementById( 'inventory-row' ).style.height =
		document.querySelector( '#inventory td' ).offsetWidth + 'px';
	collectData( 'Resized inventory tiles', 'scrabble_resize_inventory' );
}

window.addEventListener( 'resize', resizeInventoryTiles );

function displayTileBag() {
	buildTileBag();
	document.body.classList.add( 'is-displaying-modal' );
	document.body.classList.add( 'is-tile-bag' );
	collectData( 'Displayed tile bag', 'scrabble_displayed_tile_bag' );
}

function closeModal() {
	document.body.classList.remove( 'is-displaying-modal' );
	document.body.classList.remove( 'is-tile-bag' );
	document.body.classList.remove( 'is-blank-tile-screen' );
	collectData( 'Clsoed modal', 'scrabble_close_modal' );
}

// Scrabble board.
function handleTileClick( tile, isBlankTile = false ) {
	if ( tile.hasAttribute( 'data-active' ) && tile.hasAttribute( 'data-letter' ) ) {
		placedTiles.forEach( ( placedTile, i ) => {
			if (
				parseInt( placedTile[ 0 ] ) === parseInt( tile.parentElement.getAttribute( 'data-row' ) ) &&
				parseInt( placedTile[ 1 ] ) === parseInt( tile.getAttribute( 'data-column' ) )
			) {
				placedTiles.splice( i, 1 );
			}
		} );

		let attribute = tile.classList.contains( 'blank-tile' )
			? '?'
			: tile.getAttribute( 'data-letter' );
		document
			.querySelector( '#inventory td:not([data-letter])' )
			.setAttribute( 'data-letter', attribute );
		collectData( 'Removed tile ' + attribute, 'scrabble_removed_tile' );
		tile.removeAttribute( 'data-letter' );
		tile.removeAttribute( 'data-active' );
		tile.classList.remove( 'blank-tile' );
		document.getElementById( 'invalid-word' ).classList.remove( 'is-visible' );
		updateScore();

		if ( ! checkInvalidTileConnections() ) {
			document.getElementById( 'confirm-button' ).classList.add( 'is-invalid' );
		} else {
			document.getElementById( 'confirm-button' ).classList.remove( 'is-invalid' );
		}

		return;
	}

	if ( ! lockedTile ) {
		return;
	}

	if ( lockedTile.getAttribute( 'data-letter' ) === '?' ) {
		blankTilePlacement = tile;
		document.body.classList.add( 'is-displaying-modal' );
		document.body.classList.add( 'is-blank-tile-screen' );
		collectData( 'Placed blank tile', 'scrabble_place_blank_tile' );
		return;
	}

	tile.setAttribute( 'data-letter', lockedTile.getAttribute( 'data-letter' ) );
	tile.setAttribute( 'data-active', 'true' );
	collectData( 'Placed tile ' + lockedTile.getAttribute( 'data-letter' ), 'scrabble_place_tile' );

	if ( isBlankTile ) {
		tile.classList.add( 'blank-tile' );
	}

	lockedTile.removeAttribute( 'data-letter' );
	lockedTile.classList.remove( 'is-active' );
	lockedTile = null;

	document.getElementById( 'board' ).classList.remove( 'is-placing-tile' );

	placedTiles.push( [
		tile.parentElement.getAttribute( 'data-row' ),
		tile.getAttribute( 'data-column' ),
	] );
	updateScore();

	if ( ! checkInvalidTileConnections() ) {
		document.getElementById( 'confirm-button' ).classList.add( 'is-invalid' );
	} else {
		document.getElementById( 'confirm-button' ).classList.remove( 'is-invalid' );
	}
}

function handleBlankTile( letter ) {
	let tile = document.querySelector( '#inventory td.is-active[data-letter="?"]' );

	tile.setAttribute( 'data-letter', letter );
	collectData( 'Selected blank tile as ' + letter, 'scrabble_select_blank_tile' );

	closeModal();
	handleTileClick( blankTilePlacement, true );
}

function updateScore() {
	turnWordArray = [];
	document.querySelectorAll( 'td[data-letter][data-active]' ).forEach( ( item ) => {
		let columnCheck = checkWords( item, 'column', true );
		if ( columnCheck ) {
			turnWordArray.push( columnCheck );
		}

		let rowCheck = checkWords( item, 'row', true );
		if ( rowCheck ) {
			turnWordArray.push( rowCheck );
		}
	} );

	turnWordArray = Array.from( new Set( turnWordArray.map( JSON.stringify ) ), JSON.parse );
	let score = calculateScore( turnWordArray );
	turnEstimatedScore = score;

	collectData( 'Estimated score as ' + turnEstimatedScore, 'scrabble_estimate_score' );

	let scoreCount = document.getElementById( 'turn-score' );
	animateValue( scoreCount, parseInt( scoreCount.textContent ), score, 200 );
}

function animateValue( obj, start, end, duration ) {
	let startTimestamp = null;
	const step = ( timestamp ) => {
		if ( ! startTimestamp ) startTimestamp = timestamp;
		const progress = Math.min( ( timestamp - startTimestamp ) / duration, 1 );
		obj.innerHTML = Math.floor( progress * ( end - start ) + start );
		if ( progress < 1 ) {
			window.requestAnimationFrame( step );
		}
	};
	window.requestAnimationFrame( step );
}

function playTurn() {
	collectData( 'Played turn', 'scrabble_played_turn' );
	let invalidWords = [];
	document.querySelectorAll( 'td[data-letter][data-active]' ).forEach( ( item ) => {
		let columnCheck = checkWords( item, 'column' );
		let rowCheck = checkWords( item, 'row' );

		if ( ! Array.isArray( columnCheck ) || ! Array.isArray( rowCheck ) ) {
			if ( Array.isArray( columnCheck ) ) {
				invalidWords.push( columnCheck[ 0 ] );
			}

			if ( Array.isArray( rowCheck ) ) {
				invalidWords.push( rowCheck[ 0 ] );
			}
		}
	} );

	invalidWords = invalidWords.filter( ( element ) => element !== undefined );

	invalidWords = invalidWords.filter( ( value, index, self ) => {
		return self.indexOf( value ) === index;
	} );

	if ( invalidWords.length > 0 ) {
		let finalString = '';
		if ( invalidWords.length === 1 ) {
			finalString = invalidWords[ 0 ];
		} else if ( invalidWords.length === 2 ) {
			finalString = invalidWords[ 0 ] + ' and ' + invalidWords[ 1 ];
		} else {
			let lastItem = invalidWords.pop();
			finalString = invalidWords.join( ', ' ) + ', and ' + lastItem;
		}

		let startString = invalidWords.length === 1 ? 'Invalid word: ' : 'Invalid words: ';
		document.getElementById( 'invalid-word-list' ).innerHTML = startString + finalString;
		document.getElementById( 'invalid-word' ).classList.add( 'is-visible' );

		collectData( 'Invalid words played: ' + finalString, 'scrabble_invalid_words_played' );
		return;
	}

	document.getElementById( 'invalid-word' ).classList.remove( 'is-visible' );

	collectData( 'Played words successfully', 'scrabble_words' );

	submitTurn( false );
}

function submitTurn( isSkip = false, isPass = false, tilesSwapped = 0, multiplayer = false ) {
	if ( isSkip ) {
		document.querySelectorAll( 'td[data-letter][data-active]' ).forEach( ( tile ) => {
			handleTileClick( tile );
		} );
	}

	if ( isPass ) {
		collectData( 'Passed turn', 'scrabble_passed_turn' );
		passCount++;
	} else if ( ! isSkip ) {
		passCount = 0;
	}

	let valid = checkInvalidTileConnections() || isSkip;

	if ( valid ) {
		let multiplayerScore =
			Object.getOwnPropertyNames( turnHistory ).length !== 0
				? turnHistory[ 'turn' + Object.keys( turnHistory ).length ].score
				: 0;
		let score = ! multiplayer ? turnEstimatedScore : multiplayerScore;

		if ( currentTurnPlayer === 'player1' || multiplayer ) {
			if ( ! multiplayer ) {
				player1Score += score;
			}
			let player1Count = document.getElementById( 'score1' );
			animateValue( player1Count, parseInt( player1Count.textContent ), player1Score, 200 );
		}

		if ( currentTurnPlayer === 'player2' || multiplayer ) {
			if ( ! multiplayer ) {
				player2Score += score;
			}
			let player2Count = document.getElementById( 'score2' );
			animateValue( player2Count, parseInt( player2Count.textContent ), player2Score, 200 );
		}

		if ( ! multiplayer ) {
			let currentTurn = Object.keys( turnHistory ).length + 1;

			let now = new Date();
			let hours = now.getHours();
			let minutes = String( now.getMinutes() ).padStart( 2, '0' );
			let period = hours >= 12 ? 'pm' : 'am';
			hours = hours % 12 || 12;

			turnHistory[ 'turn' + currentTurn ] = {
				player: currentTurnPlayer,
				score,
				tilesSwapped,
				words: turnWordArray.map( ( arr ) => arr.map( ( innerArr ) => innerArr[ 0 ] ).join( '' ) ),
				time: hours + ':' + minutes + period,
			};

			collectData( JSON.stringify( turnHistory[ 'turn' + currentTurn ] ) );
		}

		buildTurnHistory();

		document.querySelectorAll( 'td[data-letter][data-active]' ).forEach( ( tile ) => {
			tile.removeAttribute( 'class' );
			tile.classList.add( 'colour-' + currentTurnPlayer.replace( 'player', '' ) );
			tile.removeAttribute( 'data-active' );
			tile.setAttribute( 'data-locked', true );

			if ( currentTurnPlayer === 'player1' ) {
				player1Inventory.splice(
					player1Inventory.indexOf( tile.getAttribute( 'data-letter' ) ),
					1
				);
			}

			if ( currentTurnPlayer === 'player2' ) {
				player2Inventory.splice(
					player2Inventory.indexOf( tile.getAttribute( 'data-letter' ) ),
					1
				);
			}
		} );

		// Make sure Player 2 does not miss out on a final turn.
		if ( ! multiplayer ) {
			collectData( 'Nearing the end game', 'scrabble_near_end_game' );
			if ( outOfTiles && player1FinalPass && currentTurnPlayer === 'player2' ) {
				player2FinalPass = player2FinalPass === 'penultimate' ? 'final' : 'penultimate';
				collectData( 'Avoided Player 2 missing final turn', 'scrabble_player2_final_turn_case' );
			}

			if ( outOfTiles && currentTurnPlayer === 'player1' ) {
				player1FinalPass = player1FinalPass === 'penultimate' ? 'final' : 'penultimate';
			}
		}

		if ( ! multiplayer ) {
			assignInventory( currentTurnPlayer, true );
		}

		placedTiles = [];
		turnWordArray = [];
		document.body.classList.remove( 'player1-turn' );
		document.body.classList.remove( 'player2-turn' );

		let scoreCount = document.getElementById( 'turn-score' );
		animateValue( scoreCount, parseInt( scoreCount.textContent ), 0, 200 );

		if ( ! multiplayer ) {
			if ( currentTurnPlayer === 'player1' ) {
				currentTurnPlayer = 'player2';
				document.getElementById( 'player-turn' ).innerHTML =
					player2FinalPass === 'penultimate'
						? player2Name + "'s final turn"
						: player2Name + "'s turn";
			} else if ( currentTurnPlayer === 'player2' ) {
				currentTurnPlayer = 'player1';
				document.getElementById( 'player-turn' ).innerHTML =
					player1FinalPass === 'penultimate'
						? player1Name + "'s final turn"
						: player1Name + "'s turn";
			}
		} else {
			if ( currentTurnPlayer === 'player1' ) {
				document.getElementById( 'player-turn' ).innerHTML =
					player1FinalPass === 'penultimate'
						? player1Name + "'s final turn"
						: player1Name + "'s turn";
			} else if ( currentTurnPlayer === 'player2' ) {
				document.getElementById( 'player-turn' ).innerHTML =
					player2FinalPass === 'penultimate'
						? player2Name + "'s final turn"
						: player2Name + "'s turn";
			}
		}

		if ( ! multiplayer && ! isMultiplayerGame ) {
			assignInventory( currentTurnPlayer, true );
		}

		document.body.classList.add( currentTurnPlayer + '-turn' );
		document.getElementById( 'confirm-button' ).classList.add( 'is-invalid' );
		turnEstimatedScore = 0;

		if ( isMultiplayerGame ) {
			document.title = 'Latin Scrabble';
			pollOnlineStatus();
		}

		if ( player1FinalPass === 'final' && player2FinalPass === 'final' ) {
			endGame( multiplayer );
		}

		if ( passCount === 4 ) {
			endGame( multiplayer );
		}

		if ( ! multiplayer && isMultiplayerGame ) {
			sendData( generateGameData(), multiplayerId );
		}
	}
}

function endGame( multiplayer ) {
	let player1OriginalScore = player1Score;
	let player2OriginalScore = player2Score;

	// Subtract scores in inventory.
	let player1Subtract = calculateScore( [ player1Inventory ] );
	let player2Subtract = calculateScore( [ player2Inventory ] );

	// Check if already handled.
	if ( ! multiplayer ) {
		player1Score = player1OriginalScore - player1Subtract;
		player2Score = player2OriginalScore - player2Subtract;
	} else {
		player1OriginalScore = player1Score + player1Subtract;
		player2OriginalScore = player2Score + player2Subtract;
	}

	collectData(
		'Finished game with player1OriginalScore ' +
			player1OriginalScore +
			' and player2OriginalScore ' +
			player2OriginalScore,
		'scrabble_finished_game'
	);
	collectData(
		'Subtracted ' + player1Subtract + ' from Player 1 and ' + player2Subtract + ' from Player 2'
	);

	let winner = player1Score > player2Score ? player1Name : player2Name;
	let draw = player1Score === player2Score;

	if ( draw ) {
		document.getElementById( 'winner-text' ).innerHTML =
			"It's a draw! Both players scored " + player1Score + ' points.';
		collectData( 'Game was a draw', 'scrabble_draw' );
	}

	if ( ! draw ) {
		document.getElementById( 'winner-name' ).innerHTML = winner;
		document.getElementById( 'final-point-calculation' ).innerHTML = Math.abs(
			player1Score - player2Score
		);
		collectData( 'Game had a winner as ' + winner, 'scrabble_victory' );
	}

	document.getElementById( 'end-name-player1' ).innerHTML = player1Name;
	document.getElementById( 'end-name-player2' ).innerHTML = player2Name;
	document.getElementById( 'end-score-player1' ).innerHTML = player1Score + ' points';
	document.getElementById( 'end-score-player2' ).innerHTML = player2Score + ' points';
	document.getElementById( 'end-score-calc-player1' ).innerHTML =
		'(' + player1OriginalScore + ' - ' + player1Subtract + ')';
	document.getElementById( 'end-score-calc-player2' ).innerHTML =
		'(' + player2OriginalScore + ' - ' + player2Subtract + ')';
	document.getElementById( 'player-turn' ).innerHTML = 'Game over';

	document.body.classList.add( 'is-game-over' );
	document.body.classList.add( 'is-displaying-modal' );

	ceasePolling = true;
}

function buildTurnHistory( option ) {
	let lastTurnCount = Object.keys( turnHistory ).length;
	let lastTurn = turnHistory[ 'turn' + lastTurnCount ];

	collectData( 'Built turn history', 'scrabble_built_turn_history' );

	if ( option === 'previous' ) {
		lastTurnCount =
			parseInt( document.getElementById( 'turn-history' ).getAttribute( 'data-turn' ) ) - 1;
		lastTurn = turnHistory[ 'turn' + lastTurnCount ];
		collectData( 'Gone back in turn history', 'scrabble_previous_turn_history' );
	}

	if ( option === 'next' ) {
		lastTurnCount =
			parseInt( document.getElementById( 'turn-history' ).getAttribute( 'data-turn' ) ) + 1;
		lastTurn = turnHistory[ 'turn' + lastTurnCount ];
		collectData( 'Gone forward in turn history', 'scrabble_forward_turn_history' );
	}

	if ( lastTurn ) {
		if ( lastTurnCount === Object.keys( turnHistory ).length ) {
			document.getElementById( 'turn-history' ).classList.add( 'is-last-turn' );
		} else {
			document.getElementById( 'turn-history' ).classList.remove( 'is-last-turn' );
		}

		if ( lastTurnCount === 1 ) {
			document.getElementById( 'turn-history' ).classList.add( 'is-first-turn' );
		} else {
			document.getElementById( 'turn-history' ).classList.remove( 'is-first-turn' );
		}

		if ( lastTurnCount > 1 ) {
			document.getElementById( 'turn-history' ).classList.remove( 'no-other-turns' );
		}

		document.getElementById( 'turn-history' ).classList.remove( 'is-zero-turn' );
		document.getElementById( 'turn-history' ).setAttribute( 'data-turn', lastTurnCount );

		let passedOrSwapped = lastTurn.tilesSwapped > 0 ? 'Swapped ' + lastTurn.tilesSwapped : 'Passed';
		document.getElementById( 'turn-history-name' ).innerHTML =
			lastTurn.player === 'player2' ? player2Name : player1Name;
		document.getElementById( 'turn-history-count' ).innerHTML = 'Turn #' + lastTurnCount;
		document.getElementById( 'turn-history-word-count' ).innerHTML =
			lastTurn.words.length === 1 ? '1 word' : lastTurn.words.length + ' words';
		document.getElementById( 'turn-history-score' ).innerHTML =
			lastTurn.words.length === 0 ? passedOrSwapped : lastTurn.score + ' points';
		document.getElementById( 'turn-history-time' ).innerHTML = lastTurn.time;
		document.getElementById( 'turn-history-words' ).innerHTML = '';

		lastTurn.words.forEach( ( item ) => {
			var node = document.createElement( 'LI' );
			var wrappedText = item
				.split( '' )
				.map( ( letter ) => `<span>${ letter }</span>` )
				.join( '' );
			node.innerHTML = wrappedText;
			document.getElementById( 'turn-history-words' ).appendChild( node );
		} );
	}
}

// Mechanisms for checking full words (and their validity)
function checkWords( tile, direction, returnArray ) {
	let array = [];

	if ( direction === 'row' ) {
		let children = tile.parentElement.children;
		for ( let i = 0; i < children.length; i++ ) {
			let rowChild = children[ i ];
			if ( rowChild.hasAttribute( 'data-letter' ) ) {
				array.push( [
					rowChild.getAttribute( 'data-letter' ),
					rowChild.getAttribute( 'class' ) || null,
					rowChild.parentElement.getAttribute( 'data-row' ),
					rowChild.getAttribute( 'data-column' ),
				] );
			} else {
				array.push( null );
			}
		}
	}

	if ( direction === 'column' ) {
		document
			.querySelectorAll( 'td[data-column="' + tile.getAttribute( 'data-column' ) + '"]' )
			.forEach( ( item ) => {
				array.push( [
					item.getAttribute( 'data-letter' ),
					item.getAttribute( 'class' ) || null,
					item.parentElement.getAttribute( 'data-row' ),
					item.getAttribute( 'data-column' ),
				] );
			} );
	}

	let number =
		direction === 'row'
			? parseInt( tile.getAttribute( 'data-column' ) ) - 1
			: parseInt( tile.parentElement.getAttribute( 'data-row' ) ) - 1;

	array = findSurroundedItems( array, number );

	if ( array.length < 2 ) {
		return;
	}

	if ( returnArray ) {
		return array;
	}

	word = array.map( ( item ) => item[ 0 ] ).join( '' );

	if ( word.length > 1 ) {
		let validWord = isWordValid( word );

		if ( validWord ) {
			return true;
		} else {
			return [ word ];
		}
	}
}

function isWordValid( word ) {
	collectData( 'Checked word for validity: ' + word, 'scrabble_word_check' );
	return validWords.includes( word );
}

function findSurroundedItems( array, startingIndex ) {
	const result = [];
	let startIndex = startingIndex;
	let endIndex = startingIndex;

	while ( startIndex >= 0 && array[ startIndex ] && array[ startIndex ][ 0 ] !== null ) {
		result.unshift( array[ startIndex ] );
		startIndex--;
	}

	endIndex++;
	while ( endIndex < array.length && array[ endIndex ] && array[ endIndex ][ 0 ] !== null ) {
		result.push( array[ endIndex ] );
		endIndex++;
	}

	return result.filter( ( item ) => item[ 0 ] !== null );
}

function calculateScore( wordsArray ) {
	let turnScore = 0;

	let alphabet = {
		a: 1,
		b: 5,
		c: 2,
		d: 3,
		e: 1,
		f: 6,
		g: 6,
		h: 10,
		i: 1,
		l: 4,
		m: 2,
		n: 1,
		o: 2,
		p: 4,
		q: 10,
		r: 1,
		s: 1,
		t: 1,
		u: 1,
		v: 5,
		x: 6,
		[ '?' ]: 0,
	};

	wordsArray.forEach( ( word ) => {
		let scores = [];

		let doubleWord = false;
		let tripleWord = false;
		word.forEach( ( item ) => {
			let score = alphabet[ item[ 0 ] ];

			if ( item[ 1 ] ) {
				let bonus = item[ 1 ];

				if ( bonus === 'l2' ) {
					score = score * 2;
				}

				if ( bonus === 'l3' ) {
					score = score * 3;
				}

				if ( bonus.endsWith( 'blank-tile' ) ) {
					score = 0;
				}

				if ( bonus === 'w2' || bonus === 'star' ) {
					doubleWord = true;
				}

				if ( bonus === 'w3' ) {
					tripleWord = true;
				}
			}
			scores.push( score );
		} );

		let finalScore = scores.reduce( ( a, b ) => a + b, 0 );

		if ( doubleWord ) {
			finalScore = finalScore * 2;
		}

		if ( tripleWord ) {
			finalScore = finalScore * 3;
		}

		turnScore += finalScore;
	} );

	if ( document.querySelectorAll( '#board td[data-active]' ).length === 7 ) {
		turnScore += 50;
		collectData( '50 point bonus invoked', 'scrabble_all_tiles_placed' );
	}

	collectData( 'Calculated score as ' + turnScore, 'scrabble_score_check' );

	return turnScore;
}

// Mechanisms for tile connections.
function checkInvalidTileConnections() {
	let rows = [];
	let columns = [];

	placedTiles.forEach( ( i ) => {
		rows.push( i[ 0 ] );
		columns.push( i[ 1 ] );
	} );

	let connectedToExistingTile = placedTiles.some( ( tile ) => {
		let row = tile[ 0 ];
		let column = tile[ 1 ];

		let up = document.querySelector(
			'#row' + ( parseInt( row ) - 1 ) + ' td[data-column="' + parseInt( column ) + '"]'
		);
		let down = document.querySelector(
			'#row' + ( parseInt( row ) + 1 ) + ' td[data-column="' + parseInt( column ) + '"]'
		);
		let right = document.querySelector(
			'#row' + parseInt( row ) + ' td[data-column="' + ( parseInt( column ) + 1 ) + '"]'
		);
		let left = document.querySelector(
			'#row' + parseInt( row ) + ' td[data-column="' + ( parseInt( column ) - 1 ) + '"]'
		);

		return (
			( up && up.hasAttribute( 'data-letter' ) && ! up.hasAttribute( 'data-active' ) ) ||
			( down && down.hasAttribute( 'data-letter' ) && ! down.hasAttribute( 'data-active' ) ) ||
			( right && right.hasAttribute( 'data-letter' ) && ! right.hasAttribute( 'data-active' ) ) ||
			( left && left.hasAttribute( 'data-letter' ) && ! left.hasAttribute( 'data-active' ) )
		);
	} );

	// No tiles placed yet.
	let isCentreTile = placedTiles.some( ( subArr ) =>
		subArr.every( ( val, index ) => val === [ '8', '8' ][ index ] )
	);

	if ( ! document.querySelector( '#board td[data-letter]:not([data-active])' ) && isCentreTile ) {
		connectedToExistingTile = true;
	}

	if ( ! connectedToExistingTile ) {
		return false;
	}

	// Check to see new tiles form a single row or column.
	let columnsValid = isConsecutive( rows ) && isEqual( columns );
	let rowsValid = isConsecutive( columns ) && isEqual( rows );

	let valid = rowsValid || columnsValid;

	// Check to see if existing tiles are filling the gaps.
	if ( ! rowsValid && isEqual( rows ) ) {
		valid = findMissingTiles( columns ).every( ( item ) => {
			let missingTile = document.querySelector(
				'#row' + rows[ 0 ] + ' td[data-column="' + item + '"]'
			);
			return missingTile.hasAttribute( 'data-letter' );
		} );
	}

	if ( ! columnsValid && isEqual( columns ) ) {
		valid = findMissingTiles( rows ).every( ( item ) => {
			let missingTile = document.querySelector(
				'#row' + item + ' td[data-column="' + columns[ 0 ] + '"]'
			);
			return missingTile.hasAttribute( 'data-letter' );
		} );
	}

	return valid;
}

function isConsecutive( arr ) {
	let differenceAry = arr
		.sort( function ( a, b ) {
			return a - b;
		} )
		.slice( 1 )
		.map( function ( n, i ) {
			return n - arr[ i ];
		} );
	return differenceAry.every( ( value ) => value == 1 );
}

function isEqual( arr ) {
	return arr.every( ( val ) => val === arr[ 0 ] );
}

function findMissingTiles( arr ) {
	let sortedArr = arr.map( Number ).sort( ( a, b ) => a - b );
	let missingTiles = [];

	for ( let i = 0; i < sortedArr.length - 1; i++ ) {
		let current = sortedArr[ i ];
		let next = sortedArr[ i + 1 ];
		if ( next - current > 1 ) {
			for ( let j = current + 1; j < next; j++ ) {
				missingTiles.push( j.toString() );
			}
		}
	}

	return missingTiles;
}

// Multiplayer functions.
function generateGameData() {
	collectData( 'Generated game data', 'scrabble_generate_game_data' );
	let board = [];
	document.querySelectorAll( '#board td:not([data-active])' ).forEach( ( tile ) => {
		let letter = tile.hasAttribute( 'data-letter' ) ? tile.getAttribute( 'data-letter' ) : '-';
		let classList = letter !== '-' ? tile.getAttribute( 'class' ) : null;
		board.push( [ letter, classList ] );
	} );

	return {
		board,
		gameInventory,
		player1Inventory,
		player2Inventory,
		player1Name,
		player2Name,
		player1Score,
		player2Score,
		player1MultiplayerId,
		player2MultiplayerId,
		multiplayerId,
		currentTurnPlayer,
		passCount,
		outOfTiles,
		player1FinalPass,
		player2FinalPass,
		turnHistory,
	};
}

function buildGameWithData( data ) {
	collectData( 'Built game with data', 'scrabble_build_game_with_data' );
	document.querySelectorAll( '#board td' ).forEach( ( tile, index ) => {
		if ( data.board[ index ][ 0 ] !== '-' ) {
			tile.setAttribute( 'data-letter', data.board[ index ][ 0 ] );
			tile.removeAttribute( 'data-active' );
			tile.removeAttribute( 'class' );
			tile.classList = data.board[ index ][ 1 ];
			tile.setAttribute( 'data-locked', true );
		}
	} );

	gameInventory = data.gameInventory;
	player1Inventory = data.player1Inventory;
	player2Inventory = data.player2Inventory;
	player1Name = data.player1Name;
	player2Name = data.player2Name;
	player1Score = data.player1Score;
	player2Score = data.player2Score;
	currentTurnPlayer = data.currentTurnPlayer;
	outOfTiles = data.outOfTiles;
	passCount = data.passCount;
	player1FinalPass = data.player1FinalPass;
	player2FinalPass = data.player2FinalPass;
	player1MultiplayerId = data.player1MultiplayerId;
	player2MultiplayerId = data.player2MultiplayerId;
	multiplayerId = data.multiplayerId;
	turnHistory = data.turnHistory;
	isMultiplayerGame = true;

	submitTurn( true, false, 0, true );
	assignInventory( currentTurnPlayer, true );
	collectData( JSON.stringify( data ) );
}

function sendData( data, id ) {
	fetch( 'https://clubpenguinmountains.com/wp-json/latin-vocabulary-tester/scrabble?id=' + id, {
		method: 'POST',
		headers: {
			'Content-Type': 'text/plain',
		},
		body: JSON.stringify( data ),
	} )
		.then( ( response ) => {
			if ( ! response.ok ) {
				handleMultiplayerError();
			}
		} )
		.catch( ( e ) => {
			handleMultiplayerError();
		} );
}

function fetchData( id ) {
	fetch(
		'https://clubpenguinmountains.com/wp-json/latin-vocabulary-tester/scrabble?id=' +
			id +
			'&force=true&hasName=false'
	)
		.then( ( response ) => {
			if ( response.ok ) {
				return response.json();
			} else {
				handleMultiplayerError();
			}
		} )
		.then( ( response ) => {
			if ( response === 404 ) {
				document.body.classList.add( 'is-error-screen' );
				document.body.classList.remove( 'is-game-start' );
				document.getElementById( 'error-explanation' ).innerHTML =
					"<p>This game couldn't be found in our database. Please check the link you've used for typos or alternatively create a new game.</p>";
				collectData( 'Game not found', 'scrabble_game_not_found' );
				return;
			}

			collectData( 'Fetched data for ' + id, 'scrabble_fetch_data' );
			buildGameWithData( JSON.parse( response ) );

			let receivedPlayerId = new URLSearchParams( window.location.search )
				.get( 'game' )
				.slice( -3 );

			document.getElementById( 'player1-name' ).innerHTML = player1Name;
			document.getElementById( 'player2-name' ).innerHTML = player2Name;

			if ( receivedPlayerId === player1MultiplayerId ) {
				document.getElementById( 'player1-name' ).innerHTML = player1Name + ' (You)';
				document.body.classList.add( 'is-player1' );
				document.getElementById( 'last-seen-player1' ).innerHTML = 'Online';
				assignInventory( 'player1', true );
			}

			if ( receivedPlayerId === player2MultiplayerId ) {
				document.getElementById( 'player2-name' ).innerHTML = player2Name + ' (You)';
				document.body.classList.add( 'is-player2' );
				assignInventory( 'player2', true );
				document.body.classList.add( 'is-multiplayer-name-selection' );
				document.getElementById( 'multiplayer-name-title' ).innerHTML =
					player1Name + ' challenges you to Latin Scrabble';
				collectData( 'Player 2 opened challenge', 'scrabble_player_two_opens' );
				document.getElementById( 'last-seen-player2' ).innerHTML = 'Online';
			}

			if (
				receivedPlayerId !== player1MultiplayerId &&
				receivedPlayerId !== player2MultiplayerId
			) {
				document.body.classList.add( 'is-spectator' );
				collectData( 'Spectator opened game', 'scrabble_spectator_opened' );
			}

			document.body.classList.add( 'is-multiplayer-game' );

			if ( receivedPlayerId === player2MultiplayerId && player2Name === 'Player 2' ) {
				document.body.classList.add( 'is-multiplayer-name-selection' );
			} else {
				document.body.classList.remove( 'is-displaying-modal' );
				document.body.classList.remove( 'is-game-start' );
				document.body.classList.remove( 'is-multiplayer-name-selection' );
			}

			pollOnlineStatus();
			setInterval( function () {
				pollData( multiplayerId );
			}, 1000 );
			setInterval( function () {
				pollOnlineStatus();
			}, 30000 );
		} )
		.catch( ( error ) => {
			handleMultiplayerError();
		} );
}

function canUseMultiplayerCheck() {
	fetch( 'https://clubpenguinmountains.com/wp-json/latin-vocabulary-tester/scrabble?test=y' )
		.then( ( response ) => {
			if ( ! response.ok ) {
				handleMultiplayerError();
				return;
			}
		} )
		.catch( ( error ) => {
			handleMultiplayerError();
			collectData( error );
			return;
		} );

	fetch( 'https://clubpenguinmountains.com/wp-json/latin-vocabulary-tester/scrabble?test=y', {
		method: 'POST',
		headers: {
			'Content-Type': 'text/plain',
		},
		body: 'Test',
	} )
		.then( ( response ) => {
			if ( ! response.ok ) {
				handleMultiplayerError();
				return;
			}
		} )
		.catch( ( e ) => {
			handleMultiplayerError();
			collectData( e );
			return;
		} );

	if ( new URLSearchParams( window.location.search ).get( 'game' ) ) {
		fetchData( new URLSearchParams( window.location.search ).get( 'game' ).slice( 0, 5 ) );
	}
}

function handleMultiplayerError() {
	canUseMultiplayer = false;
	collectData( 'Multiplayer error - API connection problem', 'scrabble_multiplayer_error' );
	if ( new URLSearchParams( window.location.search ).get( 'game' ) ) {
		document.body.classList.add( 'is-error-screen' );
		document.body.classList.add( 'is-displaying-modal' );
		document.body.classList.remove( 'is-game-start' );
	}
}

function pollOnlineStatus() {
	if ( ceasePolling ) {
		return;
	}

	let selfId = null;
	let opponentId = null;
	if ( document.body.classList.contains( 'is-player1' ) ) {
		selfId = player1MultiplayerId;
		opponentId = player2MultiplayerId;
	}

	if ( document.body.classList.contains( 'is-player2' ) ) {
		selfId = player2MultiplayerId;
		opponentId = player1MultiplayerId;
	}

	if ( ! selfId ) {
		return;
	}

	fetch(
		'https://clubpenguinmountains.com/wp-json/latin-vocabulary-tester/scrabble-online?game=' +
			multiplayerId +
			'&self=' +
			selfId +
			'&opponent=' +
			opponentId +
			'&unix=' +
			Date.now()
	)
		.then( ( response ) => {
			if ( response.ok ) {
				return response.json();
			}
		} )
		.then( ( response ) => {
			if ( response === 404 ) {
				return;
			}

			let difference = Date.now() - parseInt( response );
			let text = 'Online';

			if ( difference > 90000 ) {
				text = 'Last seen: ' + formatTime( difference ) + ' ago';
			}

			if ( selfId === player1MultiplayerId ) {
				document.getElementById( 'last-seen-player2' ).innerHTML = text;
			}

			if ( selfId === player2MultiplayerId ) {
				document.getElementById( 'last-seen-player1' ).innerHTML = text;
			}

			collectData( 'Player last seen returned: ' + text, 'scrabble_last_seen' );
		} )
		.catch( ( error ) => {
			handleMultiplayerError();
			collectData( error );
		} );
}

function pollData( id ) {
	if ( ceasePolling ) {
		return;
	}
	let hasName = player2Name !== 'Player 2';
	fetch(
		'https://clubpenguinmountains.com/wp-json/latin-vocabulary-tester/scrabble?id=' +
			id +
			'&turn=' +
			Object.keys( turnHistory ).length +
			'&hasName=' +
			hasName
	)
		.then( ( response ) => {
			if ( response.ok ) {
				return response.json();
			}
		} )
		.then( ( response ) => {
			if ( response === 304 ) {
				return;
			}

			buildGameWithData( JSON.parse( response ) );

			let receivedPlayerId = new URLSearchParams( window.location.search )
				.get( 'game' )
				.slice( -3 );

			if ( receivedPlayerId === player1MultiplayerId ) {
				document.getElementById( 'player1-name' ).innerHTML = player1Name + ' (You)';
				document.getElementById( 'player2-name' ).innerHTML = player2Name;
				document.body.classList.add( 'is-player1' );
			}

			if ( receivedPlayerId === player2MultiplayerId ) {
				document.getElementById( 'player2-name' ).innerHTML = player2Name + ' (You)';
				document.body.classList.add( 'is-player2' );
			}

			let isYourTurn =
				( currentTurnPlayer === 'player1' && document.body.classList.contains( 'is-player1' ) ) ||
				( currentTurnPlayer === 'player2' && document.body.classList.contains( 'is-player2' ) );

			if ( isYourTurn ) {
				document.title = 'Your turn - Latin Scrabble';
			} else {
				document.title = 'Latin Scrabble';
			}

			if ( ! hasName ) {
				document.getElementById( 'player2-name' ).innerHTML = player2Name;

				if ( document.getElementById( 'player-turn' ).innerHTML === "Player 2's turn" ) {
					document.getElementById( 'player-turn' ).innerHTML = player2Name + "'s turn";
				}

				document.body.classList.remove( 'is-invite-screen' );
				document.body.classList.remove( 'is-displaying-modal' );
			}

			let inventory = document.getElementById( 'inventory-row' );
			if (
				inventory.getAttribute( 'data-player' ) === 'player1' &&
				document.body.classList.contains( 'is-player2' )
			) {
				assignInventory( 'player2', true );
			}

			if (
				inventory.getAttribute( 'data-player' ) === 'player2' &&
				document.body.classList.contains( 'is-player1' )
			) {
				assignInventory( 'player1', true );
			}
		} )
		.catch( ( error ) => {
			handleMultiplayerError();
			collectData( error );
		} );
}

function collectData( content, analyticsID ) {
	if ( analyticsID ) {
		gtag( 'event', analyticsID );
	}

	var request = new XMLHttpRequest();
	request.open(
		'POST',
		'https://clubpenguinmountains.com/wp-json/latin-vocabulary-tester/scrabble-data'
	);
	request.setRequestHeader( 'Content-type', 'text/plain' );
	request.send( content + ' with ID of ' + userId );
}

function formatTime( milliseconds ) {
	let minutes = Math.floor( milliseconds / 60000 );

	if ( minutes < 60 ) {
		return minutes + ' minutes';
	} else if ( minutes < 1440 ) {
		let hours = Math.floor( minutes / 60 );
		if ( hours === 1 ) {
			return '1 hour';
		} else {
			return hours + ' hours';
		}
	} else {
		let days = Math.floor( minutes / 1440 );
		if ( days === 1 ) {
			return '1 day';
		} else {
			return days + ' days';
		}
	}
}

function changeGameOption( chosenOption ) {
	document.getElementById( 'online-option' ).classList.remove( 'is-selected' );
	document.getElementById( 'screen-option' ).classList.remove( 'is-selected' );
	document.getElementById( chosenOption ).classList.add( 'is-selected' );

	document.getElementById( 'option-tagline' ).innerHTML =
		chosenOption === 'screen-option'
			? 'Challenge another opponent on the same device'
			: 'Send a link to your opponent and play online';

	if ( chosenOption === 'online-option' ) {
		document.getElementById( 'p2name' ).value = '';
		document.getElementById( 'setup-name-options' ).classList.add( 'is-online-selected' );
		document.getElementById( 'p1namelabel' ).innerHTML = 'Enter your name';
	} else {
		document.getElementById( 'setup-name-options' ).classList.remove( 'is-online-selected' );
		document.getElementById( 'p1namelabel' ).innerHTML = "Enter Player 1's name";
	}
}

function startGame() {
	player1Name = document.getElementById( 'p1name' ).value.trim() || 'Player 1';
	player2Name = document.getElementById( 'p2name' ).value.trim() || 'Player 2';

	document.getElementById( 'player1-name' ).innerHTML = player1Name;
	document.getElementById( 'player2-name' ).innerHTML = player2Name;
	document.getElementById( 'player-turn' ).innerHTML = player1Name + "'s turn";
	document.body.classList.remove( 'is-game-start' );

	collectData( 'Started game', 'scrabble_started_game' );

	if ( document.getElementById( 'online-option' ).classList.contains( 'is-selected' ) ) {
		if ( ! canUseMultiplayer ) {
			document.body.classList.add( 'is-error-screen' );
			document.body.classList.add( 'is-displaying-modal' );
			document.body.classList.remove( 'is-game-start' );
			return;
		}

		multiplayerId = generateId( 5 );
		player1MultiplayerId = generateId( 3 );
		let params = new URLSearchParams( window.location.search );
		params.append( 'game', multiplayerId + player1MultiplayerId );
		let newUrl = window.location.origin + window.location.pathname + '?' + params.toString();
		history.pushState( {}, '', newUrl );

		player2MultiplayerId = generateId( 3 );
		document.getElementById( 'link-input' ).value =
			'https://latinvocabularytester.com/scrabble/?game=' + multiplayerId + player2MultiplayerId;
		document.body.classList.add( 'is-player1' );
		document.body.classList.add( 'is-multiplayer-game' );
		document.body.classList.add( 'is-invite-screen' );
		sendData( generateGameData(), multiplayerId );
		document.body.classList.add( 'player1-turn' );
		document.getElementById( 'last-seen-player1' ).innerHTML = 'Online';
		pollOnlineStatus();
		collectData( 'Started multiplayer game', 'scrabble_started_multiplayer_game' );
		setInterval( function () {
			pollData( multiplayerId );
		}, 1000 );

		setInterval( function () {
			pollOnlineStatus();
		}, 30000 );
		return;
	}

	document.body.classList.remove( 'is-displaying-modal' );
}

function copyInviteLink() {
	let copyId = document.body.classList.contains( 'is-player1' )
		? player2MultiplayerId
		: player1MultiplayerId;

	navigator.clipboard.writeText(
		'https://latinvocabularytester.com/scrabble/?game=' + multiplayerId + copyId
	);
	document.getElementById( 'copy-label' ).innerHTML = 'Copied';
	document.getElementById( 'second-copy-label' ).innerHTML = 'Copied invite link';
	collectData( 'Copied invite link', 'scrabble_copied_invite_link' );
}

function startGameAsPlayerTwo() {
	player2Name = document.getElementById( 'inputtedname' ).value.trim();

	if ( ! player2Name ) {
		document.getElementById( 'error-name' ).classList.add( 'is-active' );
		return;
	}

	document.getElementById( 'error-name' ).classList.remove( 'is-active' );
	sendData( generateGameData(), multiplayerId );

	document.getElementById( 'player2-name' ).innerHTML = player2Name + ' (You)';

	if ( document.getElementById( 'player-turn' ).innerHTML === "Player 2's turn" ) {
		document.getElementById( 'player-turn' ).innerHTML = player2Name + "'s turn";
	}

	document.body.classList.remove( 'is-displaying-modal' );
	document.body.classList.remove( 'is-game-start' );
	document.body.classList.remove( 'is-multiplayer-name-selection' );
	collectData( 'Started game as player two', 'scrabble_player_two_start' );
}

function generateId( length ) {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for ( var i = 0; i < length; i++ ) {
		result += characters.charAt( Math.floor( Math.random() * charactersLength ) );
	}
	collectData( 'Generated ID ' + result, 'scrabble_generated_id' );
	return result;
}
