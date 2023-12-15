let grid = [];
let hasRunEndGame = false;
let isLoaded = false;
let isMultiplayer = false;
let multiplayerData;
let score = 0;
let solvedGrid;
let triedWords = [];
let userId = localStorage.getItem( 'userID' ) || Math.floor( Math.random() * 9999999 ) + 1;
let validWords = [];

window.onload = function () {
	if ( ! localStorage.getItem( 'userID' ) ) {
		localStorage.setItem( 'userID', userId );
	}

	collectData(
		'Loaded site with data ' + navigator.userAgent + ' at ' + new Date(),
		'word_bites_load'
	);

	if ( new URLSearchParams( window.location.search ).get( 'game' ) ) {
		generateBoardFromId();
	} else {
		generateBoard();
	}

	if ( new URLSearchParams( window.location.search ).get( 'ref' ) ) {
		collectData(
			'Loaded site with ref ' +
				new URLSearchParams( window.location.search ).get( 'ref' ) +
				' and data ' +
				navigator.userAgent
		);
	}

	document.getElementById( 'name' ).addEventListener( 'keyup', function ( event ) {
		if ( event.keyCode === 13 ) {
			event.preventDefault();
			generateLink();
		}
	} );
};

function generateBoardFromId() {
	let id = new URLSearchParams( window.location.search ).get( 'game' );
	collectData( 'Generated board from id ' + id, 'word_bites_generate_from_id' );
	isMultiplayer = true;

	fetch( 'https://clubpenguinmountains.com/wp-json/latin-vocabulary-tester/word-bites?id=' + id )
		.then( response => {
			if ( response.ok ) {
				return response.json();
			} else {
				document.body.classList.remove( 'is-welcome' );
				document.body.classList.add( 'is-error' );
				collectData( 'GET Request failed - client', 'word_bites_request_fail_client' );
				collectData( new Error( response.statusText ).message );
			}
		} )
		.then( response => {
			if ( response === 404 ) {
				document.getElementById( 'error-explanation' ).innerHTML =
					"<p>Your friend's score and tiles couldn't be found in our database. There is likely a typo in the link which you've used.</p>";
				document.body.classList.remove( 'is-welcome' );
				document.body.classList.add( 'is-error' );
				collectData( 'Game not found', 'word_bites_game_not_found' );
				return;
			}
			let data = JSON.parse( response );
			multiplayerData = data;

			document.getElementById( 'welcome-title' ).innerHTML =
				data.name + ' challenges you to Latin Word Bites!';
			document.querySelectorAll( 'td' ).forEach( ( item, index ) => {
				let letter = data.grid[ index ];

				if ( letter != '-' ) {
					item.setAttribute( 'data-letter', letter );
				}

				if ( index === 63 ) {
					checkTileConnections();
				}
			} );
			boardFunctions();

			if ( Number.isInteger( data.opponentScore ) ) {
				document.body.classList.remove( 'is-welcome' );
				document.body.classList.add( 'is-game-over-challenger' );
				handleCompleteGame();
				return;
			}
		} )
		.catch( error => {
			document.body.classList.remove( 'is-welcome' );
			document.body.classList.add( 'is-error' );
			collectData( 'GET Request failed - network', 'word_bites_request_fail_network' );
			collectData( error.toString() );
		} );
}

function startGame() {
	if ( ! isLoaded ) {
		collectData( 'Started game before load', 'word_bites_before_load' );
		document.getElementById( 'loading' ).style.display = 'block';
		setTimeout( () => {
			startGame();
		}, 1000 );
		return;
	}
	collectData( 'Started game', 'word_bites_started_game' );
	document.body.classList.remove( 'is-welcome' );
	startTimer();
}

function findLocation( groupingDirection ) {
	let randomRow = Math.floor( Math.random() * 8 + 1 );
	let randomColumn = Math.floor( Math.random() * 8 + 1 );

	if ( groupingDirection === 'horizontal' ) {
		randomColumn = Math.floor( Math.random() * 7 + 1 );
	}

	if ( groupingDirection === 'vertical' ) {
		randomRow = Math.floor( Math.random() * 7 + 1 );
	}

	let random = document.querySelector(
		'#row' + randomRow + ' td[data-column="' + randomColumn + '"]'
	);

	if ( random.hasAttribute( 'data-letter' ) ) {
		return findLocation( groupingDirection );
	}

	if ( groupingDirection ) {
		let groupedTile = getGroupedTile( random, groupingDirection );

		if ( ! groupedTile || groupedTile.hasAttribute( 'data-letter' ) ) {
			return findLocation( groupingDirection );
		}

		let extraGroupVertical = getGroupedTile( groupedTile, 'vertical' );
		let extraGroupHorizontal = getGroupedTile( groupedTile, 'horizontal' );

		if (
			( extraGroupVertical && extraGroupVertical.hasAttribute( 'data-letter' ) ) ||
			( extraGroupHorizontal && extraGroupHorizontal.hasAttribute( 'data-letter' ) )
		) {
			return findLocation( groupingDirection );
		}
	}

	return random;
}

function shuffleGroupItems() {
	document
		.querySelectorAll( 'td[data-letter]:not(.horizontal-right):not(.vertical-bottom)' )
		.forEach( item => {
			let direction = item.getAttribute( 'grouped' );
			let random = findLocation( direction );
			transferTileAttributes( item, random );
			transferTileAttributes(
				getGroupedTile( item, direction ),
				getGroupedTile( random, direction )
			);
		} );
}

function shuffleSingleItems() {
	document.querySelectorAll( '#row9 td[data-letter]' ).forEach( item => {
		transferTileAttributes( item, findLocation() );
	} );
}

function generateBoard() {
	document
		.querySelector( '#row1 td[data-column="3"]' )
		.setAttribute( 'data-letter', generateLetter() );

	if ( Math.floor( Math.random() * 2 ) === 1 ) {
		document
			.querySelector( '#row2 td[data-column="3"]' )
			.setAttribute( 'data-letter', generateLetter() );
	} else {
		document
			.querySelector( '#row1 td[data-column="4"]' )
			.setAttribute( 'data-letter', generateLetter() );
	}

	document
		.querySelector( '#row4 td[data-column="3"]' )
		.setAttribute( 'data-letter', generateLetter( 'rare' ) );

	if ( Math.floor( Math.random() * 2 ) === 1 ) {
		document
			.querySelector( '#row5 td[data-column="3"]' )
			.setAttribute( 'data-letter', generateLetter( 'common' ) );
	} else {
		document
			.querySelector( '#row4 td[data-column="4"]' )
			.setAttribute( 'data-letter', generateLetter( 'common' ) );
	}

	document
		.querySelector( '#row7 td[data-column="3"]' )
		.setAttribute( 'data-letter', generateLetter() );
	document.querySelector( '#row7 td[data-column="4"]' ).setAttribute( 'data-letter', 'i' );

	document
		.querySelector( '#row1 td[data-column="6"]' )
		.setAttribute( 'data-letter', generateLetter( 'rare' ) );
	if ( Math.floor( Math.random() * 2 ) === 1 ) {
		document
			.querySelector( '#row1 td[data-column="7"]' )
			.setAttribute( 'data-letter', generateLetter( 'common' ) );
	} else {
		document
			.querySelector( '#row2 td[data-column="6"]' )
			.setAttribute( 'data-letter', generateLetter( 'common' ) );
	}

	document
		.querySelector( '#row4 td[data-column="6"]' )
		.setAttribute( 'data-letter', generateLetter( 'rare' ) );
	document
		.querySelector( '#row5 td[data-column="6"]' )
		.setAttribute( 'data-letter', generateLetter( 'rare' ) );

	checkTileConnections();

	document.querySelector( '#row9 td[data-column="1"]' ).setAttribute( 'data-letter', 'a' );

	document.querySelector( '#row9 td[data-column="2"]' ).setAttribute( 'data-letter', 'e' );

	document
		.querySelector( '#row9 td[data-column="3"]' )
		.setAttribute( 'data-letter', generateLetter( 'rare' ) );

	document
		.querySelector( '#row9 td[data-column="4"]' )
		.setAttribute( 'data-letter', generateLetter( 'rare' ) );

	document
		.querySelector( '#row9 td[data-column="5"]' )
		.setAttribute( 'data-letter', generateLetter() );

	document.querySelector( '#row9 td[data-column="6"]' ).setAttribute( 'data-letter', 'o' );
	document
		.querySelector( '#row9 td[data-column="7"]' )
		.setAttribute( 'data-letter', generateLetter( 'common' ) );

	document.querySelectorAll( 'td' ).forEach( item => {
		if ( item.hasAttribute( 'data-letter' ) ) {
			grid.push( item.getAttribute( 'data-letter' ) );
		} else {
			grid.push( '-' );
		}
	} );

	boardFunctions();
}

function boardFunctions() {
	shuffleGroupItems();
	shuffleSingleItems();
	assignColours();
	setTimeout( () => {
		solvedGrid = solveGrid();
		document.getElementById( 'total-count' ).innerHTML = ' / ' + solvedGrid.length;
	}, 150 );
}

function solveGrid() {
	let horizontal = [];
	let vertical = [];
	let single = [];
	document.querySelectorAll( 'td.horizontal-left' ).forEach( item => {
		let letterOne = item.getAttribute( 'data-letter' );
		let letterTwo = getGroupedTile( item, 'horizontal' ).getAttribute( 'data-letter' );
		horizontal.push( letterOne + letterTwo );
	} );

	document.querySelectorAll( 'td.vertical-top' ).forEach( item => {
		let letterOne = item.getAttribute( 'data-letter' );
		let letterTwo = getGroupedTile( item, 'vertical' ).getAttribute( 'data-letter' );
		vertical.push( letterOne + letterTwo );
	} );

	document.querySelectorAll( 'td[data-letter]:not(.is-grouped)' ).forEach( item => {
		single.push( item.getAttribute( 'data-letter' ) );
	} );

	let tiles = {
		horizontal,
		vertical,
		single,
	};

	let grid = validGuesses.filter( word => can_make_word( word, tiles ) );
	isLoaded = true;

	return grid;
}

function assignColours() {
	document.querySelectorAll( 'td.horizontal-left' ).forEach( item => {
		let number = Math.floor( Math.random() * 6 ) + 1;
		item.classList.add( 'colour-' + number );
		getGroupedTile( item, 'horizontal' ).classList.add( 'colour-' + number );
	} );

	document.querySelectorAll( 'td.vertical-top' ).forEach( item => {
		let number = Math.floor( Math.random() * 6 ) + 1;
		item.classList.add( 'colour-' + number );
		getGroupedTile( item, 'vertical' ).classList.add( 'colour-' + number );
	} );

	document.querySelectorAll( 'td[data-letter]:not(.is-grouped)' ).forEach( ( item, index ) => {
		let number = Math.floor( Math.random() * 6 ) + 1;
		item.classList.add( 'colour-' + number );
	} );
}

function generateLetter( type ) {
	let letters = [
		'a',
		'b',
		'c',
		'd',
		'e',
		'f',
		'g',
		'h',
		'i',
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
		'x',
	];
	let commonLetters = [ 'a', 'e', 'i', 'o', 'r', 's', 't' ];

	if ( type === 'common' ) {
		letters = commonLetters;
	}

	if ( type === 'rare' ) {
		letters = letters.filter( letter => ! commonLetters.includes( letter ) );
	}

	return letters[ Math.floor( Math.random() * letters.length ) ];
}

function checkTileConnections() {
	document.querySelectorAll( '#board td' ).forEach( item => {
		if ( item.hasAttribute( 'data-letter' ) ) {
			let verticalTile = getGroupedTile( item, 'vertical' );

			if ( verticalTile && verticalTile.hasAttribute( 'data-letter' ) ) {
				verticalTile.classList.add( 'is-grouped' );
				verticalTile.classList.add( 'vertical-bottom' );
				verticalTile.setAttribute( 'grouped', 'vertical' );

				item.classList.add( 'is-grouped' );
				item.classList.add( 'vertical-top' );
				item.setAttribute( 'grouped', 'vertical' );
			}

			let horizontalTile = getGroupedTile( item, 'horizontal' );

			if ( horizontalTile && horizontalTile.hasAttribute( 'data-letter' ) ) {
				horizontalTile.classList.add( 'is-grouped' );
				horizontalTile.classList.add( 'horizontal-right' );
				horizontalTile.setAttribute( 'grouped', 'horizontal' );

				item.classList.add( 'is-grouped' );
				item.classList.add( 'horizontal-left' );
				item.setAttribute( 'grouped', 'horizontal' );
			}
		}
	} );
}

function getGroupedTile( item, direction, handlingTileClick = false ) {
	let tile;
	let orderNumber = 1;
	if (
		handlingTileClick &&
		( item.classList.contains( 'horizontal-right' ) ||
			item.classList.contains( 'vertical-bottom' ) )
	) {
		orderNumber = -1;
	}

	if ( direction === 'vertical' ) {
		let nextRow = parseInt( item.parentElement.getAttribute( 'data-row' ) ) + orderNumber;
		tile = document.querySelector(
			'#row' + nextRow + ' td[data-column="' + item.getAttribute( 'data-column' ) + '"]'
		);
	}

	if ( direction === 'horizontal' ) {
		let nextColumn = parseInt( item.getAttribute( 'data-column' ) ) + orderNumber;
		tile = document.querySelector(
			'#row' +
				item.parentElement.getAttribute( 'data-row' ) +
				' td[data-column="' +
				nextColumn +
				'"]'
		);
	}

	return tile;
}

function handleTileClick( item ) {
	if ( ! item || ! item.hasAttribute( 'data-letter' ) ) {
		if ( document.body.classList.contains( 'is-tile-active' ) ) {
			moveTile( item );
		}
		return;
	}

	if ( document.body.classList.contains( 'is-tile-active' ) ) {
		document.querySelectorAll( '#board td[data-active="true"]' ).forEach( item => {
			item.removeAttribute( 'data-active' );
			item.removeAttribute( 'data-active-grouped' );
		} );

		document.body.classList.remove( 'is-tile-active' );
	}

	if ( item.hasAttribute( 'data-letter' ) && ! item.hasAttribute( 'data-active' ) ) {
		item.setAttribute( 'data-active', true );

		if ( item.hasAttribute( 'grouped' ) ) {
			getGroupedTile( item, item.getAttribute( 'grouped' ), true ).setAttribute(
				'data-active',
				true
			);

			item.setAttribute( 'data-active-grouped', true );
		}

		document.body.classList.add( 'is-tile-active' );
	}
}

function transferTileAttributes( oldItem, newItem ) {
	if ( ! oldItem || ! newItem ) {
		return;
	}

	[ 'data-letter', 'grouped', 'class' ].forEach( attribute => {
		if ( oldItem.hasAttribute( attribute ) ) {
			newItem.setAttribute( attribute, oldItem.getAttribute( attribute ) );
			oldItem.removeAttribute( attribute );
		}
	} );
	oldItem.removeAttribute( 'data-active' );
	oldItem.removeAttribute( 'data-active-grouped' );
}

function moveTile( newItem ) {
	let oldItem = document.querySelector( '#board td[data-active="true"]' );
	let oldSecondItem;
	let integer = 1;

	if ( ! oldItem ) {
		return;
	}

	if ( oldItem.hasAttribute( 'grouped' ) ) {
		oldSecondItem = getGroupedTile( oldItem, oldItem.getAttribute( 'grouped' ) );
	}

	if ( oldSecondItem === document.querySelector( '#board td[data-active-grouped="true"]' ) ) {
		integer = -1;
	}

	if ( oldSecondItem ) {
		let vertical = document.querySelector(
			'#row' +
				( parseInt( newItem.parentElement.getAttribute( 'data-row' ) ) + integer ) +
				' td[data-column="' +
				newItem.getAttribute( 'data-column' ) +
				'"]'
		);
		let horizontal = document.querySelector(
			'#row' +
				newItem.parentElement.getAttribute( 'data-row' ) +
				' td[data-column="' +
				( parseInt( newItem.getAttribute( 'data-column' ) ) + integer ) +
				'"]'
		);
		let newSecondItem =
			oldSecondItem.getAttribute( 'grouped' ) === 'vertical' ? vertical : horizontal;

		if ( ! newSecondItem ) {
			// edge of board.
			return;
		}

		if ( newSecondItem === oldItem ) {
			transferTileAttributes( oldItem, newItem );
			transferTileAttributes( oldSecondItem, oldItem );
			checkBoard();
			return;
		}

		if ( integer === -1 ) {
			if ( newSecondItem.hasAttribute( 'data-letter' ) && newSecondItem !== oldSecondItem ) {
				return;
			}

			transferTileAttributes( oldSecondItem, newItem );
			transferTileAttributes( oldItem, newSecondItem );
			checkBoard();
			return;
		}

		if ( newSecondItem.hasAttribute( 'data-letter' ) ) {
			return;
		}

		transferTileAttributes( oldSecondItem, newSecondItem );
	}

	transferTileAttributes( oldItem, newItem );
	checkBoard();
}

function checkBoard() {
	document.querySelectorAll( 'td[data-letter]' ).forEach( item => {
		checkWords( item, 'column' );
		checkWords( item, 'row' );
	} );
}

function checkWords( tile, direction ) {
	let array = [];

	if ( direction === 'row' ) {
		let children = tile.parentElement.children;
		for ( let i = 0; i < children.length; i++ ) {
			let rowChild = children[ i ];
			if ( rowChild.hasAttribute( 'data-letter' ) ) {
				array.push( rowChild.getAttribute( 'data-letter' ) );
			} else {
				array.push( null );
			}
		}
	}

	if ( direction === 'column' ) {
		document
			.querySelectorAll( 'td[data-column="' + tile.getAttribute( 'data-column' ) + '"]' )
			.forEach( item => {
				array.push( item.getAttribute( 'data-letter' ) );
			} );
	}

	let number =
		direction === 'row'
			? parseInt( tile.getAttribute( 'data-column' ) ) - 1
			: parseInt( tile.parentElement.getAttribute( 'data-row' ) ) - 1;

	let index = array.findIndex( ( item, index ) => item === null && index >= number );

	if ( index !== -1 ) {
		array.length = index;
	}

	let firstIndex;

	for ( var i = array.length - 1; i >= 0; i-- ) {
		if ( array[ i ] === null ) {
			firstIndex = i;
			break;
		}
	}

	array = array.slice( firstIndex + 1 );
	word = array.join( '' );

	if ( word.length > 2 && ! triedWords.includes( word ) ) {
		triedWords.push( word );

		let validWord = isWordValid( word );

		if ( validWord ) {
			validWords.push( word );
			document.getElementById( 'word-count' ).innerHTML = validWords.length;
			scorePoints( word );
			collectData( 'Made word ' + word, 'word_bites_successful_word' );
			document.getElementById( 'added-word' ).innerHTML = word.toUpperCase();
		}
	}
}

function scorePoints( word ) {
	let points;

	switch ( word.length ) {
		case 3:
			points = 100;
			break;
		case 4:
			points = 400;
			break;
		case 5:
			points = 800;
			break;
		case 6:
			points = 1400;
			break;
		case 7:
			points = 1800;
			break;
		case 8:
			points = 2200;
			break;
		case 9:
			points = 2600;
			break;
	}

	score += points;

	let scoreCount = document.getElementById( 'score-count' );
	animateValue( scoreCount, parseInt( scoreCount.textContent ), score, 500 );
	document.getElementById( 'added-score' ).innerHTML = '(+' + points + ')';
}

function animateValue( obj, start, end, duration ) {
	let startTimestamp = null;
	let step = timestamp => {
		if ( ! startTimestamp ) startTimestamp = timestamp;
		let progress = Math.min( ( timestamp - startTimestamp ) / duration, 1 );
		let value = Math.floor( progress * ( end - start ) + start );

		let formattedValue = value >= 10000 ? value.toLocaleString() : value;
		obj.innerHTML = formattedValue;

		if ( progress < 1 ) {
			window.requestAnimationFrame( step );
		}
	};
	window.requestAnimationFrame( step );
}

function isWordValid( word ) {
	collectData( 'Checked valid word for ' + word, 'word_bites_valid_word_check' );
	return validGuesses.includes( word );
}

function endGame() {
	if ( hasRunEndGame ) {
		return;
	}

	collectData(
		'Finished game with score ' +
			score +
			', and ' +
			validWords.length +
			' out of ' +
			solvedGrid.length +
			' words',
		'word_bites_finished_game'
	);
	let gameOverClass = isMultiplayer ? 'is-game-over-challenger' : 'is-game-over';
	document.body.classList.add( gameOverClass );
	document.body.classList.remove( 'is-instruction' );
	hasRunEndGame = true;

	if ( isMultiplayer ) {
		endMultiplayerGame();
	}

	document.getElementById( 'final-score' ).innerHTML =
		score >= 10000 ? score.toLocaleString() : score;
	document.getElementById( 'final-word-count' ).innerHTML = validWords.length;
	document.getElementById( 'all-word-count' ).innerHTML = solvedGrid.length;

	document.getElementById( 'name' ).value = '';

	generateWordsTable();
}

function endMultiplayerGame() {
	let title;
	collectData( 'Finished multiplayer game', 'word_bites_finished_multiplayer_game' );

	if ( multiplayerData.score === score ) {
		title = "It's a draw!";
		collectData( 'Multiplayer game: draw', 'word_bites_draw' );
	} else if ( multiplayerData.score > score ) {
		title = 'eheu! ' + multiplayerData.name + ' has won!';
		collectData( 'Multiplayer game: ' + multiplayerData.name + ' wins', 'word_bites_victory' );
	} else {
		title = 'euge! You beat ' + multiplayerData.name + '!';
		collectData(
			'Multiplayer game: ' + multiplayerData.name + "'s opponent wins",
			'word_bites_defeat'
		);
	}

	document.getElementById( 'game-over-title' ).innerHTML = title;

	document.getElementById( 'challenger-count' ).innerHTML = validWords.length;
	document.getElementById( 'opponent-count' ).innerHTML = multiplayerData.foundWords.length;
	document.getElementById( 'opponent-name' ).innerHTML = multiplayerData.name;
	document.getElementById( 'challenger-score' ).innerHTML =
		score >= 10000 ? score.toLocaleString() : score;
	document.getElementById( 'opponent-points' ).innerHTML =
		multiplayerData.score >= 10000 ? multiplayerData.score.toLocaleString() : multiplayerData.score;
	document.getElementById( 'opponent-name-list' ).innerHTML = multiplayerData.name + "'s words";

	if ( multiplayerData.score === score ) {
		document.getElementById( 'game-over-scores' ).innerHTML =
			'You both scored ' + score + ' points.';
	}

	let challengerWords = validWords.sort();
	challengerWords.forEach( item => {
		var node = document.createElement( 'LI' );
		node.appendChild( document.createTextNode( item ) );
		document.getElementById( 'challenger-words' ).appendChild( node );
	} );

	let opponentWords = multiplayerData.foundWords.sort();
	opponentWords.forEach( item => {
		var node = document.createElement( 'LI' );
		node.appendChild( document.createTextNode( item ) );
		document.getElementById( 'opponent-words' ).appendChild( node );
	} );

	document.getElementById( 'all-words-count' ).innerHTML = solvedGrid.length;
	solvedGrid.forEach( item => {
		var node = document.createElement( 'LI' );
		node.appendChild( document.createTextNode( item ) );
		document.getElementById( 'all-words' ).appendChild( node );
	} );

	multiplayerData.opponentScore = score;
	multiplayerData.opponentFoundWords = validWords;

	fetch(
		'https://clubpenguinmountains.com/wp-json/latin-vocabulary-tester/word-bites?id=' +
			multiplayerData.id,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain',
			},
			body: JSON.stringify( multiplayerData ),
		}
	)
		.then( response => {
			if ( response.ok ) {
				collectData( 'POST Request successful (opponent)', 'word_bites_post_success' );
			} else {
				document.getElementById( 'multiplayer-error' ).style.display = 'block';
				collectData( 'POST Request failed - client (opponent)', 'word_bites_post_fail_client' );
				collectData( new Error( response.statusText ).message );
			}
		} )
		.catch( error => {
			document.getElementById( 'multiplayer-error' ).style.display = 'block';
			collectData( 'POST Request failed - network (opponent)', 'word_bites_post_fail_network' );
			collectData( error.toString() );
		} );
}

function handleCompleteGame() {
	let subtitle =
		multiplayerData.name +
		' scored a total of ' +
		multiplayerData.score +
		' points, whereas their opponent scored ' +
		multiplayerData.opponentScore +
		' points.';
	let title;

	collectData( 'Loading completed game', 'word_bites_handle_completed_game' );

	if ( multiplayerData.score === multiplayerData.opponentScore ) {
		title = 'The game was a draw!';
		subtitle =
			'Both ' +
			multiplayerData.name +
			' and their opponent scored ' +
			multiplayerData.score +
			' points each.';
	} else if ( multiplayerData.score > multiplayerData.opponentScore ) {
		title = multiplayerData.name + ' won!';
	} else {
		title = multiplayerData.name + ' was defeated!';
	}

	document.getElementById( 'game-over-title' ).innerHTML = title;
	document.getElementById( 'game-over-scores' ).innerHTML = subtitle;
	document.getElementById( 'challenger-name-list' ).innerHTML = multiplayerData.name + "'s words";
	document.getElementById( 'opponent-name-list' ).innerHTML = "Opponent's words";

	multiplayerData.foundWords.forEach( item => {
		var node = document.createElement( 'LI' );
		node.appendChild( document.createTextNode( item ) );
		document.getElementById( 'challenger-words' ).appendChild( node );
	} );

	multiplayerData.opponentFoundWords.forEach( item => {
		var node = document.createElement( 'LI' );
		node.appendChild( document.createTextNode( item ) );
		document.getElementById( 'opponent-words' ).appendChild( node );
	} );

	document.getElementById( 'challenger-count' ).innerHTML = multiplayerData.foundWords.length;
	document.getElementById( 'opponent-count' ).innerHTML = multiplayerData.opponentFoundWords.length;
}

function startTimer() {
	let time = 89;
	let minutes, seconds;

	let timerInterval = setInterval( () => {
		minutes = Math.floor( time / 60 );
		seconds = time % 60;

		let formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
		let formattedSeconds = seconds < 10 ? '0' + seconds : seconds;

		document.getElementById( 'timer' ).innerHTML = formattedMinutes + ':' + formattedSeconds;

		time--;

		if ( time < 0 ) {
			clearInterval( timerInterval );
			endGame();
		}
	}, 1000 );
}

function generateWordsTable() {
	validWords.forEach( item => {
		var node = document.createElement( 'LI' );
		node.appendChild( document.createTextNode( item ) );
		document.getElementById( 'user-words' ).appendChild( node );
	} );

	let missingWords = solvedGrid.filter( item => ! validWords.includes( item ) );
	missingWords.forEach( item => {
		var node = document.createElement( 'LI' );
		node.appendChild( document.createTextNode( item ) );
		document.getElementById( 'missed-words' ).appendChild( node );
	} );
}

function viewAllWordsChallenger() {
	modalChange( 'all-words-challenger' );
	if ( ! solvedGrid ) {
		solvedGrid = solveGrid();
	}
	document.getElementById( 'all-words-count' ).innerHTML = solvedGrid.length;
	solvedGrid.forEach( item => {
		var node = document.createElement( 'LI' );
		node.appendChild( document.createTextNode( item ) );
		document.getElementById( 'all-words' ).appendChild( node );
	} );
}

function collectData( content, analyticsID ) {
	if ( analyticsID ) {
		gtag( 'event', analyticsID );
	}

	var request = new XMLHttpRequest();
	request.open(
		'POST',
		'https://clubpenguinmountains.com/wp-json/latin-vocabulary-tester/word-bites-data'
	);
	request.setRequestHeader( 'Content-type', 'text/plain' );
	request.send( content + ' with ID of ' + userId );
}

function modalChange( label ) {
	document.body.classList.remove( 'is-challenge-friend' );
	document.body.classList.remove( 'is-game-over' );
	document.body.classList.remove( 'is-game-over-challenger' );
	document.body.classList.remove( 'is-all-words' );
	document.body.classList.remove( 'is-all-words-challenger' );
	document.body.classList.remove( 'is-instruction' );

	document.body.classList.add( 'is-' + label );
	collectData( 'Switched modal to ' + label, 'word_bites_switch_modal_' + label );
}

function generateLink() {
	let error = document.getElementById( 'error' );
	let input = document.getElementById( 'name' );

	error.style.display = 'none';

	if ( input.disabled ) {
		document.getElementById( 'success' ).style.display = 'block';
		navigator.clipboard.writeText( 'Can you beat my score in Latin Word Bites? ' + input.value );
		collectData( 'Challenge player: Copy button click', 'word_bites_generate_link_copy_click' );
		return;
	}

	if ( ! input.value ) {
		error.innerHTML =
			"Error: name not included. This is only used to distinguish you from your opponent - that's all!";
		error.style.display = 'block';
		collectData( 'Challenge player: name not included', 'word_bites_generate_link_name_error' );
		return;
	}

	document.getElementById( 'submit-api' ).style.display = 'block';

	let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';

	for ( let i = 0; i < 6; i++ ) {
		let randomIndex = Math.floor( Math.random() * characters.length );
		result += characters[ randomIndex ];
	}

	let data = {
		id: result,
		name: input.value.trim(),
		score,
		grid,
		foundWords: validWords,
	};

	collectData(
		'Submitted board to server with data ' + JSON.stringify( data ),
		'word_bites_submitted_board'
	);

	fetch(
		'https://clubpenguinmountains.com/wp-json/latin-vocabulary-tester/word-bites?id=' + result,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain',
			},
			body: JSON.stringify( data ),
		}
	)
		.then( response => {
			if ( response.ok ) {
				let link = 'https://latinvocabularytester.com/word-bites/?game=' + result;
				input.value = link;
				input.disabled = true;

				navigator.clipboard.writeText( 'Can you beat my score in Latin Word Bites? ' + link );
				document.getElementById( 'submit-api' ).style.display = 'none';
				document.getElementById( 'success' ).style.display = 'block';

				document.getElementById( 'generate-label' ).innerHTML = 'Copy';
				collectData( 'POST Request successful', 'word_bites_post_success' );
			} else {
				document.getElementById( 'submit-api' ).style.display = 'none';
				error.innerHTML = 'Error: failed to submit data to server.';
				error.style.display = 'block';
				collectData( 'POST Request failed - client', 'word_bites_post_fail_client' );
				collectData( new Error( response.statusText ).message );
			}
		} )
		.catch( e => {
			document.getElementById( 'submit-api' ).style.display = 'none';
			error.innerHTML =
				'Error: failed to submit data. It is likely your network blocks requests to the server.';
			error.style.display = 'block';
			collectData( 'POST Request failed - network', 'word_bites_post_fail_network' );
			collectData( e.toString() );
		} );
}

// Much thanks to my friend for writing the below functions.
function exists_bipartite_matching( letter_set, pair_set ) {
	let dp = Array.from( Array( letter_set.length ), () => new Array( 1 << pair_set.length ) );

	function exists_bp_matching_recursive( letter_idx, pairs_left ) {
		if ( letter_idx == letter_set.length ) {
			return true;
		} else if ( dp[ letter_idx ][ pairs_left ] !== undefined ) {
			return dp[ letter_idx ][ pairs_left ];
		} else {
			let result = false;
			for ( let i = 0; i < pair_set.length; ++i ) {
				if (
					( pairs_left & ( 1 << i ) ) > 0 &&
					pair_set[ i ].includes( letter_set[ letter_idx ] )
				) {
					if ( exists_bp_matching_recursive( letter_idx + 1, pairs_left ^ ( 1 << i ) ) ) {
						result = true;
						break;
					}
				}
			}
			dp[ letter_idx ][ pairs_left ] = result;
			return dp[ letter_idx ][ pairs_left ];
		}
	}

	return (
		pair_set.length >= letter_set.length &&
		exists_bp_matching_recursive( 0, ( 1 << pair_set.length ) - 1 )
	);
}

function can_make_word_axis( word, parallel_tiles, perpendicular_tiles, single_tiles ) {
	for ( let pair of parallel_tiles ) {
		word = word.replace( pair, '' );
	}
	for ( let single of single_tiles ) {
		word = word.replace( single, '' );
	}

	return (
		word == '' ||
		exists_bipartite_matching(
			word,
			perpendicular_tiles.filter( tile => word.includes( tile[ 0 ] ) || word.includes( tile[ 1 ] ) )
		)
	);
}

function can_make_word( word, tiles ) {
	return (
		can_make_word_axis( word, tiles.horizontal, tiles.vertical, tiles.single ) ||
		can_make_word_axis( word, tiles.vertical, tiles.horizontal, tiles.single )
	);
}
