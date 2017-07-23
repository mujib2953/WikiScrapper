/*
* @Author: Mujib Ansari
* @Date:   2017-07-22 22:15:39
* @Last Modified by:   Mujib Ansari
* @Last Modified time: 2017-07-23 21:37:23
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
			list: 'https://en.wikipedia.org/wiki/Dictionary_of_chemical_formulas'
		},
		fileNames: {
			allElmentList: 'files/allElmentList.json'
		},


		allElmentFile: null,

		dummySuccessRes: { status: '200', response: 'Success.' }
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

	scrappingDetails.call( p_res, function() {

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

	if( oScope.allElmentFile ) {
		recursiveScrap( function() {
				
		} );
	}
	else {
		customRead( oScope.fileNames.allElmentList, p_API_resp, function( p_fileData ) {
			oScope.allElmentFile = JSON.parse( p_fileData );

			recursiveScrap( function() {

			} );
		} );
	}

};

function recursiveScrap( p_fCallback ) {

	
	
};