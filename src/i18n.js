// Localization (see i18n/en.js, i18n/zh.js).
//
//   t( 'hud.cooler' )                  -> a translated string
//   t( 'toast.sold', { count, total } ) -> '{count} fish for ${total}' in the active language
//   th( 'guide.tip.rodOut' )           -> same lookup; the result contains markup (<b>, <kbd>) and is
//                                         inserted with innerHTML
//   L( 'Hold', '鱼舱' )                 -> picks the second argument in a non-English language, for
//                                         data tables that carry their own translation
//   setLang( 'zh' )                    -> stores the choice and reloads (the UI builds most of its
//                                         text once, at construction, so a live re-render would mean
//                                         rebuilding every panel)
//
// The language is read once, before the first frame: ?lang=zh wins over the stored choice.
import { STRINGS } from './i18n/strings.js';

const STORAGE_KEY = 'tidewater.lang';
export const LANGS = { en: 'English', zh: '中文' };

let _lang = 'en';

function initialLang() {

	// node (the tests import the data tables, which import this file): no browser globals
	const q = typeof location !== 'undefined' ? new URLSearchParams( location.search ).get( 'lang' ) : null;
	if ( q && STRINGS[ q ] ) return q;
	try {

		const saved = localStorage.getItem( STORAGE_KEY );
		if ( saved && STRINGS[ saved ] ) return saved;

	} catch ( e ) { /* private mode */ }
	const nav = typeof navigator !== 'undefined' ? ( navigator.language || 'en' ) : 'en';
	return STRINGS[ nav.slice( 0, 2 ).toLowerCase() ] ? nav.slice( 0, 2 ).toLowerCase() : 'en';

}

_lang = initialLang();

export function getLang() {

	return _lang;

}

export function setLang( lang ) {

	if ( ! STRINGS[ lang ] || lang === _lang ) return;
	try {

		localStorage.setItem( STORAGE_KEY, lang );

	} catch ( e ) { /* private mode */ }
	location.reload();

}

// The string in the active language; an unknown key falls back to English, then to the key itself,
// so a missing translation shows English instead of breaking the layout.
export function t( key, vars ) {

	const dict = STRINGS[ _lang ] || {};
	let s = dict[ key ];
	if ( s === undefined ) s = STRINGS.en[ key ];
	if ( s === undefined ) {

		if ( typeof console !== 'undefined' ) console.warn( `i18n: missing key ${ key }` );
		return key;

	}
	if ( ! vars ) return s;
	return s.replace( /\{(\w+)\}/g, ( m, name ) => ( name in vars ? vars[ name ] : m ) );

}

// A translated string that carries markup; kept as a separate name so call sites read honestly
// about inserting it with innerHTML.
export const th = t;

// For data tables: the English text is the default, the translation rides along beside it.
export function L( en, translated ) {

	return _lang === 'en' || ! translated ? en : translated;

}

// Fills the parts of index.html that are static markup: [data-i18n] text, [data-i18n-html] markup.
export function applyDom( root = document ) {

	for ( const el of root.querySelectorAll( '[data-i18n]' ) ) el.textContent = t( el.dataset.i18n );
	for ( const el of root.querySelectorAll( '[data-i18n-html]' ) ) el.innerHTML = t( el.dataset.i18nHtml );
	document.documentElement.lang = _lang === 'zh' ? 'zh-CN' : 'en';

}

// Shows the dictionary's own gaps in the console once, at startup.
export function reportMissing() {

	if ( _lang === 'en' ) return;
	const missing = Object.keys( STRINGS.en ).filter( ( k ) => STRINGS[ _lang ][ k ] === undefined );
	if ( missing.length ) console.warn( `i18n: ${ missing.length } string(s) untranslated in ${ _lang }:`, missing );

}
