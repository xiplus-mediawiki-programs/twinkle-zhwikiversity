/**
 * vim: set noet sts=0 sw=8:
 * General initialization code
 */

var scriptpathbefore = mw.util.wikiScript( "index" ) + "?title=",
    scriptpathafter = "&action=raw&ctype=text/javascript&happy=yes";

// Retrieve the user's Twinkle preferences
$.ajax({
	url: scriptpathbefore + "User:" + encodeURIComponent( mw.config.get("wgUserName")) + "/twinkleoptions.js" + scriptpathafter,
	dataType: "text",
	error: function () { mw.util.jsMessage( "不能加载twinkleoptions.js" ); },
	success: function ( optionsText ) {

		// Quick pass if user has no options
		if ( optionsText === "" ) {
			return;
		}

		// Twinkle options are basically a JSON object with some comments. Strip those:
		optionsText = optionsText.replace( /(?:^(?:\/\/[^\n]*\n)*\n*|(?:\/\/[^\n]*(?:\n|$))*$)/g, "" );

		// First version of options had some boilerplate code to make it eval-able -- strip that too. This part may become obsolete down the line.
		if ( optionsText.lastIndexOf( "window.Twinkle.prefs = ", 0 ) === 0 ) {
			optionsText = optionsText.replace( /(?:^window.Twinkle.prefs = |;\n*$)/g, "" );
		}

		try {
			var options = $.parseJSON( optionsText );

			// Assuming that our options evolve, we will want to transform older versions:
			//if ( options.optionsVersion === undefined ) {
			// ...
			// options.optionsVersion = 1;
			//}
			//if ( options.optionsVersion === 1 ) {
			// ...
			// options.optionsVersion = 2;
			//}
			// At the same time, twinkleconfig.js needs to be adapted to write a higher version number into the options.

			if ( options ) {
				Twinkle.prefs = options;
			}
		}
		catch ( e ) {
			mw.util.jsMessage("不能解析twinkleoptions.js");
		}
	},
	complete: function () {
		$( Twinkle.load );
	}
});

// Developers: you can import custom Twinkle modules here
// For example, mw.loader.load(scriptpathbefore + "User:UncleDouggie/morebits-test.js" + scriptpathafter);

Twinkle.load = function () {
	    // Don't activate on special pages other than "Contributions" so that they load faster, especially the watchlist.
	var isSpecialPage = ( mw.config.get('wgNamespaceNumber') === -1
	    	&& mw.config.get('wgCanonicalSpecialPageName') !== "Contributions"
	    	&& mw.config.get('wgCanonicalSpecialPageName') !== "Prefixindex" ),

	    // Also, Twinkle is incompatible with Internet Explorer versions 8 or lower, so don't load there either.
	    isOldIE = ( $.client.profile().name === 'msie' );

    // Prevent users that are not autoconfirmed from loading Twinkle as well.
	if ( isSpecialPage || isOldIE || !twinkleUserAuthorized ) {
		return;
	}

	// Load the modules in the order that the tabs should appears
	// User/user talk-related
	Twinkle.warn();
	Twinkle.shared();
	Twinkle.talkback();
	// Deletion
	Twinkle.speedy();
	Twinkle.copyvio();
	Twinkle.xfd();
	Twinkle.image();
	// Maintenance
	Twinkle.protect();
	Twinkle.tag();
	// Misc. ones last
	Twinkle.diff();
	Twinkle.unlink();
	Twinkle.config.init();
	Twinkle.fluff.init();
	if ( Morebits.userIsInGroup('sysop') ) {
		Twinkle.delimages();
		Twinkle.batchdelete();
	}
	// Run the initialization callbacks for any custom modules
	$( Twinkle.initCallbacks ).each(function ( k, v ) { v(); });
	Twinkle.addInitCallback = function ( func ) { func(); };

	// Increases text size in Twinkle dialogs, if so configured
	if ( Twinkle.getPref( "dialogLargeFont" ) ) {
		mw.util.addCSS( ".morebits-dialog-content, .morebits-dialog-footerlinks { font-size: 100% !important; } " +
			".morebits-dialog input, .morebits-dialog select, .morebits-dialog-content button { font-size: inherit !important; }" );
	}

	// Override any user-defined summaryAd, for the sake of AbuseFilter
	// Need to init all prefs here, or twinkleconfig would fail
	if (typeof(Twinkle.prefs) !== "object") {
		Twinkle.prefs = {};
	}
	if (typeof(Twinkle.prefs.twinkle) !== "object") {
		Twinkle.prefs.twinkle = {};
	}
	if (typeof(Twinkle.prefs.friendly) !== "object") {
		Twinkle.prefs.friendly = {};
	}
	Twinkle.prefs.twinkle.summaryAd = Twinkle.defaultConfig.twinkle.summaryAd;
	Twinkle.prefs.twinkle.deletionSummaryAd = Twinkle.defaultConfig.twinkle.deletionSummaryAd;
	Twinkle.prefs.twinkle.protectionSummaryAd = Twinkle.defaultConfig.twinkle.protectionSummaryAd;
};

} ( window, document, jQuery )); // End wrap with anonymous function

// </nowiki>
