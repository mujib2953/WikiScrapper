/*
* @Author: Mujib Ansari
* @Date:   2017-07-22 22:15:39
* @Last Modified by:   Mujib Ansari
* @Last Modified time: 2017-08-06 15:25:06
*/

'use strict';
var fs = require( 'fs' ),
	express = require( 'express' ),
	request = require( 'request' ),
	cheerio = require( 'cheerio' ),

	app = express(),
	port = 8035,
	oScope = {
		url: {
			list: 'https://en.wikipedia.org/wiki/Dictionary_of_chemical_formulas',
			baseUrl: 'https://en.wikipedia.org'
		},
		fileNames: {
			allElmentList: 'files/allElmentList.json',
			alldetails: 'files/allDetails.json'
		},


		allElmentFile: null,

		dummySuccessRes: { status: '200', response: 'Success.' },
		gCount: 481
	};

app.get( '/v1/api/list', function( p_req, p_res ) {

	if( oScope.allElmentFile )
		p_res.json( oScope.allElmentFile )
	else {
		extractList( p_res, function() {
			p_res.send( oScope.dummySuccessRes );
		} );
	}

} );

app.get( '/v1/api/details', function( p_req, p_res ) {
	console.log( '------------------- Started ----------------' );
	scrappingDetails( p_res, function( p_response ) {
		// customWrite( oScope.fileNames.alldetails, JSON.stringify( p_response ), p_res, function() { 
			p_res.send( p_response );
		// });
		
	} )

} );

function customRead( fileName, p_res, p_fCallback ) {
	
	fs.readFile( fileName, function( p_err, p_fileData ) {

		if( p_err ) p_res.send( p_err );

		console.log( '*** --- ' + fileName + ' file is read successfully. --- ***' );
		if( p_fCallback )
			p_fCallback.call( oScope, p_fileData )
	} );

};

function customWrite( fileName, p_data, p_res, p_fCallback ) {

	fs.writeFile( fileName, JSON.stringify( p_data ), function( p_err ) {

		if( p_err ) p_res.send( p_err );
		console.log( '*** --- ' + fileName + ' file is saved successfully. --- ***' );
		if( p_fCallback )
			p_fCallback.call( oScope );

	} );

};

app.listen( port );
console.log( 'Scrapper is running on the http:localhost:' + port );

/*===================================
*====================================*
=====================================*/
function extractList( p_API_res, p_fCallback ) {

	request( oScope.url.list, function( p_err, p_htmlResp, p_html ) {

		if( !p_err ) {
			console.log( 'Page is loaded.' );
			var $ = cheerio.load( p_html );
				
			getAllList( $, function( p_data ) {

				customWrite( oScope.fileNames.allElmentList, p_data, p_API_res, function() {
					if( p_fCallback )
						p_fCallback.call( oScope );
				} );
				
			} );
			
		}

	} );

};

function getAllList( $, p_fCallback ) {

	var i,
		j,
		aAllTables = $( '.wikitable' ),
		aAll_tr,
		aAll_td,

		retArr = [],
		saveObj;

	for( i in aAllTables ) {
		if( isValid( i ) ) {

			aAll_tr = $( aAllTables[ i ] ).find( 'tbody tr' );

			for( j in aAll_tr ) {
				if( isValid( j ) ) {

					saveObj = {};

					aAll_td = $( aAll_tr[ j ] ).find( 'td' );

					saveObj.formula = $( aAll_td[ 0 ] ).html();
					saveObj.link = $( $( aAll_td[ 1 ] ).find( 'a' ) ).attr( 'href' );
					saveObj.name = $( $( aAll_td[ 1 ] ).find( 'a' ) ).text();
					saveObj.cas = $( aAll_td[ 2 ] ).text();

					if( saveObj.formula != null )
						retArr.push( saveObj );
				}
			}			
		}
	}

	if( p_fCallback )
		p_fCallback.call( oScope, retArr )
};

function isValid( p_i ) {
	return ( !isNaN( parseInt( p_i ) ) );
};
/*===================================
*====================================*
=====================================*/
function scrappingDetails( p_API_resp, p_fCallback ) {
	

	oScope.resJson = {};

	if( oScope.allElmentFile ) {
		recursiveScrap.call( oScope, p_API_resp, function( p_reponse ) {
			p_fCallback( p_reponse )
		} );
	}
	else {
		customRead( oScope.fileNames.allElmentList, p_API_resp, function( p_fileData ) {
			oScope.allElmentFile = JSON.parse( p_fileData );

			recursiveScrap.call( oScope, p_API_resp, function( p_reponse ) {
				
				p_fCallback( p_reponse )
			} );
		} );
	}

};

function recursiveScrap( p_API_resp, p_fCallback ) {

	var nLen = this.allElmentFile.length,
		currentElem = this.allElmentFile[ this.gCount ],
		sKeyName = Math.floor( Math.random()*10000 );

	oScope.resJson = {};
	request( this.url.baseUrl + currentElem.link, function( p_err, p_htmlRes, p_html ) {

		if( p_err )
			p_fCallback( p_err )

		var $ = cheerio.load( p_html ),
			respJson = {},
			tTable = $( '.infobox' ),
			allTr = tTable.find( 'tr' ),
			i = 0;


		respJson.name = $( '#firstHeading' ).text().trim();
		respJson.desc = removeRefrences( $( '#mw-content-text' ).find( 'p' ).eq( 0 ) );
		respJson.images = [];
		respJson.link = currentElem.link;

		console.log( 'Scarpping count :: ' + oScope.gCount + '/' + nLen + '. Current :: ' + respJson.name );
		for( ; i < allTr.length - 3; i++ ) {

			if( $( allTr[ i ] ).find( 'th' ).length == 0 ) {

				if( $( $( allTr[ i ] ).find( 'td' ).eq( 0 ) ).attr( 'colspan' ) ) {
					//--- found the colspan

					// --- checks for Image
					if( $( allTr[ i ] ).find( 'img' ).length != 0 ) {
						// --- found Images
						var image = $( allTr[ i ] ).find( 'img' ),
							imgObj = {
							alt: $( image ).attr( 'alt' ),
							src: $( image ).attr( 'src' )
						}

						if( imgObj.alt.toLowerCase() != 'yes' )
							respJson.images.push( imgObj );
					} else {
						/*
						*--- Assume there is no Image
						*--- And have 2 child
						*--- 1st will be an anchor tag represents the heading
						*--- 2nd will be a div having multiple values
						*/

						// --- this line doesn't allows to add the collapsable menus
						if( $( $( allTr[ i ] ).find( 'div' ) ).hasClass( 'NavHead' ) )
							continue;

						var aValue = $( $( allTr[ i ] ).find( 'a' ) ).text().trim() ||  $( $( allTr[ i ] ).find( 'td' ) ).clone().children().remove().end().text().trim(),
							divValue = $( $( allTr[ i ] ).find( 'div' ) ).text().trim();


						if( $( $( allTr[ i ] ).find( 'div' ) ).find( 'a' ) )
							// console.log( 'Despacito :: ' + $( $( allTr[ i ] ).find( 'div' ) ).find( 'a' ).text() );


						respJson[ aValue ] = divValue;

					}

				} else {

					/*
					*--- Here all the normal td will continues
					*--- Assuming first is the key
					*--- second is the value
					*/

					if( $( allTr[ i ] ).children().length == 2 && $( allTr[ i ] ).find( 'td' ).length ) {
						var sKey = $( allTr[ i ] ).find( 'td' ).eq( 0 ).text().trim(),
							sValue = $( allTr[ i ] ).find( 'td' ).eq( 1 ).text().trim();

						if( sKey.toLowerCase() == 'chemical formula' || sKey.toLowerCase() == 'density' )
							sValue = $( allTr[ i ] ).find( 'td' ).eq( 1 ).html().trim();
						respJson[ sKey ] = sValue;

						if( sKey.toLowerCase() == 'chemical formula' )
							sKeyName = $( allTr[ i ] ).find( 'td' ).eq( 1 ).text().trim();
					}
					

				}

			}

		}

		// oScope.resJson[ sKeyName ] =  respJson;
		
		if( oScope.gCount <= nLen ) {
			

			// customRead( oScope.fileNames.alldetails, p_API_resp, function( p_fileData ) {

				// p_fileData = JSON.parse( p_fileData );
				// console.log( '--- --- --- --- --- --- --- --- --- --- --- ---' );
				// console.log( p_fileData );
				// p_fileData[ sKeyName ] =  respJson;
				console.log( 'Writting ' + respJson.name + '.json' + ' size is :: ' + Object.keys( respJson ).length );
				customWrite( 'files/' + respJson.name + '.json', respJson, p_API_resp, function() { 
					oScope.gCount++;
					recursiveScrap.call( oScope, p_API_resp, p_fCallback );
				});
			// });
				
			
		} else {
			if( p_fCallback ) {
				console.log( oScope.resJson )
				p_fCallback( oScope.resJson );	
			}
		}
		
	} );


	
};

function removeRefrences( $elm ) {
	$elm.find( '.reference' ).remove();
	return $elm.text();
};