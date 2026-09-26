// Localization guard (no GPU): the dictionaries agree with each other, every t() key used in the
// source exists, the placeholders match, and the data tables stay translatable.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { en } from '../src/i18n/en.js';
import { zh } from '../src/i18n/zh.js';
import { FISH } from '../src/game/FishTable.js';
import { UPGRADES } from '../src/game/Gear.js';

let fails = 0;
const ok = ( c, msg ) => {

	if ( ! c ) { fails ++; console.log( 'FAIL', msg ); } else console.log( 'ok  ', msg );

};

const ROOT = join( dirname( fileURLToPath( import.meta.url ) ), '..' );

// ---- every zh key exists in en, and the placeholders of the two agree
for ( const key of Object.keys( zh ) ) ok( key in en, `zh key in en: ${ key }` );
for ( const key of Object.keys( en ) ) {

	ok( key in zh, `en key in zh: ${ key }` );
	const holes = ( s ) => ( String( s ).match( /\{\w+\}/g ) || [] ).sort().join( ',' );
	if ( key in zh ) ok( holes( en[ key ] ) === holes( zh[ key ] ), `placeholders match: ${ key }` );

}

// ---- every t()/th() key in the source exists (dynamic keys are checked by hand below)
function* walk( dir ) {

	for ( const name of readdirSync( dir ) ) {

		const p = join( dir, name );
		if ( statSync( p ).isDirectory() ) yield* walk( p );
		else if ( name.endsWith( '.js' ) ) yield p;

	}

}

const used = new Set();
const re = /\b(?:t|th)\(\s*'([a-z][\w.]*)'/g;
for ( const file of walk( join( ROOT, 'src' ) ) ) {

	const code = readFileSync( file, 'utf8' );
	if ( file.includes( join( 'i18n', 'en.js' ) ) || file.includes( join( 'i18n', 'zh.js' ) ) ) continue;
	let m;
	while ( ( m = re.exec( code ) ) ) used.add( m[ 1 ] );

}

for ( const key of used ) ok( key in en, `key used in source: ${ key }` );
ok( used.size > 100, `found ${ used.size } translated strings in the source` );

// ---- data tables: every species and gear level has a translation
for ( const id of Object.keys( FISH ) ) ok( en[ `fish.${ id }` ] !== undefined, `species translated: ${ id }` );
for ( const [ key, track ] of Object.entries( UPGRADES ) ) {

	const i18nKey = { fishFinder: 'finder' }[ key ] || key;
	ok( en[ `gear.${ i18nKey }` ] !== undefined, `gear track translated: ${ key }` );
	track.levels.forEach( ( l, i ) => ok( en[ `gear.${ i18nKey }.${ i }` ] !== undefined, `gear level translated: ${ key }[${ i }]` ) );

}

console.log( fails ? `\n${ fails } failure(s)` : '\nall i18n checks passed' );
process.exit( fails ? 1 : 0 );
