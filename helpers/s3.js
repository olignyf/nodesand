var util = require( 'util' );
var format = require( 'util' ).format;
var Batch = require( 'batch' );
var knox = require( 'knox' );
var config = require( '../config.js' );
var multiparty = require( 'multiparty' );

var s3Clients = {
};

var onEnd = function ( ) {
    throw new Error( "no uploaded file" );
};

var upload = function ( req, fileName, f_callback ) 
{

    var form = new multiparty.Form( ),
        batch = new Batch( ),
        size = 0,
        type,
        headers = {
            'x-amz-acl': 'public-read',
            'Cache-Control': 'public,max-age=290304000'
        };

    batch.push( function ( cb ) {
        form.on( 'part', function ( part ) {

            if ( !part.filename ) return;
            type = part.headers[ 'content-type' ];

            size += part.byteCount;
            cb( null, part );
        } );
    } );

    batch.push( function ( cb ) {
        form.on( 'field', function ( name, value ) {
            console.log( 'value!!!!' );
            console.log( value );
            cb( null, value );
        } );
    } );

    batch.end( function ( err, results ) {
        if ( err ) throw err;

        form.removeListener( 'close', onEnd );

        var part = results[ 0 ];
        var data = JSON.parse( results[ 1 ] );

        headers[ 'Content-Length' ] = size;
        headers[ 'Content-Type' ] = type;

        if ( true ) {
           fileName = getTimeStamp( ) + '-' + fileName;
        }
        
        if (s3Clients[ config.s3.bucket ] == null)
        {	s3Clients[ config.s3.bucket ] = knox.createClient( config.s3 );
        }
        s3Clients[ config.s3.bucket ].putStream( part, fileName, headers, function ( err, s3Response ) 
        {
            if ( err ) throw err;
            f_callback( null, {
                url: s3Clients[ config.s3.bucket ].url( "/" + fileName ),
                data: data
            } );
        } );
    } );

    form.on( 'close', onEnd );
    form.parse( req );
};

var getTimeStamp = function ( ) {
    return Math.floor( Date.now( ) / 1000 );
};

module.exports = { upload: upload };