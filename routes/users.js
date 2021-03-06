var express = require('express');
var mongoose = require('mongoose');
var fs = require('fs');
var gm = require('gm');
var imageMagick = gm.subClass({ imageMagick: true });
var s3 = require('../helpers/s3');
var http = require('http');
var https = require('https');
//var multiparty = require('multiparty');
var router = express.Router();

var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};

var getTimeStamp = function ( ) {
    return Math.floor( Date.now( ) / 1000 );
};

var isSet = function(value)
{
	if (value === undefined || value === null) return false;
	return true;
}
var isNull = function(value)
{
	if (value === undefined || value === null) return true;
	return false;
}

router.route('/').get(function(req, res, next) 
{
	//retrieve all blobs from Monogo
	mongoose.model('User').find({}, function (err, blobs) 
	{
		if (err) 
		{
			return console.error(err);
		}
		else
		{
		   console.log("blobs amount:"+ blobs.length);
			//respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
			res.format(
			{
         	//HTML response will render the index.jade file in the views/blobs folder. We are also setting "blobs" to be an accessible variable in our jade view
				html: function()
				{
					res.render('users/index', 
					{
						title: 'All my Blobs',
						"users" : blobs
					});
				},
				//JSON response will show all blobs in JSON format
				json: function()
				{
					res.json(blobs);
				}
			});
      }     
	});
})
//POST a new blob
.post(function(req, res) 
{
	// Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
	var name = req.body.name;
	var username = req.body.username;
	var password = req.body.password;
	var user_ip = req.connection.remoteaddress;
	console.log("user_ip:"+user_ip);
	//call the create function for our database
	mongoose.model('User').create(
	{
		name : name,
		username: username,
		password: password,
		ip_at_creation: user_ip
	}, 
	function (err, blob) 
	{
		if (err) 
		{
			res.send("There was a problem adding the information to the database.");
			console.log(err);
		}
		else
		{
			//Blob has been created
			console.log('POST creating new blob: ' + blob);
			res.format(
			{
				//HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
				html: function()
				{
					// If it worked, set the header so the address bar doesn't still say /adduser
					res.location("users");
					// And forward to success page
					res.redirect("/users");
				},
				//JSON response will show the newly created blob
				json: function()
				{
					res.json(blob);
				}
			});
		}
	})
});

/* GET New Blob page. */
router.get('/new', function(req, res) {
    res.render('users/new', { title: 'Add New User' });
});

// route middleware to validate :id
router.param('id', function(req, res, next, id) {
    //console.log('validating ' + id + ' exists');
    //find the ID in the Database
    mongoose.model('User').findById(id, function (err, blob) {
        //if it isn't found, we are going to repond with 404
        if (err) {
            console.log(id + ' was not found');
            res.status(404)
            var err = new Error('Not Found');
            err.status = 404;
            res.format({
                html: function(){
                    next(err);
                 },
                json: function(){
                       res.json({message : err.status  + ' ' + err});
                 }
            });
        //if it is found we continue on
        } else {
            //uncomment this next line if you want to see every JSON document response for every GET/PUT/DELETE call
            console.log(blob);
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next(); 
        } 
    });
});

router.route('/:id').get(function(req, res) 
{
    mongoose.model('User').findById(req.id, function (err, blob) 
    {
      if (err) 
      {
        console.log('GET Error: There was a problem retrieving: ' + err);
      } 
      else 
      {
        console.log('GET Retrieving ID: ' + blob._id);
        var blobdob;
        if (isSet(blob.dob))
        {	blobdob = blob.dob.toISOString();
        		blobdob = blobdob.substring(0, blobdob.indexOf('T'))
        }
        res.format({
          html: function(){
              res.render('users/show', {
                "blobdob" : blobdob,
                "user" : blob
              });
          },
          json: function(){
              res.json(blob);
          }
        });
      }
    });
});

//GET the individual blob by Mongo ID
router.get('/:id/edit', function(req, res) 
{
    //search for the blob within Mongo
    mongoose.model('User').findById(req.id, function (err, blob) 
    {
        if (err) 
        {
            console.log('GET Error: There was a problem retrieving: ' + err);
        }
         else 
        {
            //Return the blob
            console.log('GET Retrieving ID: ' + blob._id);
            //format the date properly for the value to show correctly in our edit form
          var blobdob;
          if (isSet(blob.dob))
          {	blobdob = blob.dob.toISOString();
           		blobdob = blobdob.substring(0, blobdob.indexOf('T'))
          }
             res.format({
                //HTML response will render the 'edit.jade' template
                html: function(){
                       res.render('users/edit', {
                          title: 'User ID ' + blob._id,
                        "blobdob" : blobdob,
                          "user" : blob
                      });
                 },
                 //JSON response will return the JSON output
                json: function(){
                       res.json(blob);
                 }
            });
        }
    });
});

var postEditUser = function(req, res)
{
    // Get our REST or form values. These rely on the "name" attributes
    var name = req.body.name;
    var Banner = req.body.Banner;
    var BannerFullRes = req.body.BannerFullRes;
    var Logo = req.body.Logo;
    var LogoFullRes = req.body.LogoFullRes;
    console.log("Saving BannerFullRes:"+BannerFullRes);

   //find the document by ID
   mongoose.model('User').findById(req.id, function (err, blob) 
   {
      //update it
      blob.update({
         name : name,
         Banner : Banner,
         BannerFullRes : BannerFullRes,
         Logo : Logo,
         LogoFullRes : LogoFullRes
      }, function (err, blobID) {
         if (err) {
             res.send("There was a problem updating the information to the database: " + err);
         } 
         else {
             //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
             res.format({
                 html: function(){
                     res.redirect("/users/" + blob._id);
                 },
                 //JSON responds showing the updated values
                 json: function(){
                     res.json(blob);
                 }
             });
         }
      }) 
   });
};

//PUT to update a blob by ID
router.post('/:id/edit', function(req, res) 
{
	postEditUser(req, res);
});

//PUT to update a blob by ID
router.put('/:id/edit', function(req, res) 
{
	postEditUser(req, res);
});

// save on s3 but do not save in organisation, waiting to crop
var postImageCrop = function ( whichItem, req, res ) 
{
      var curWidth;
      var curHeight;

      // console.log('req:'); console.log(req);
      console.log('req.body:'); console.log(req.body);
      var crop = req.body.crop;
      var sourceUrl = req.body.sourceUrl;
      console.log('sourceUrl:'+sourceUrl);
      console.log('crop:'); console.log(crop);
      
      var tempFile = 'tmpFile-'+req.body.organization.Id + '-' + getRandomInt(1,5000); ///FRANK, do we have a temp folder that gets cleaned up periodically?
      var tempOutputFile = 'tmpOutFile-'+req.body.organization.Id + '-' + getRandomInt(1,5000); ///FRANK, do we have a temp folder that gets cleaned up periodically?
      var f_croppingCallback = function(whichItem, req, res)
      {
          //var Image = imageMagick("c:\\temp\\source.jpg")
          var Image = imageMagick(tempFile)
          
          // Rotate before cropping
          if (isSet(crop) && isSet(crop.rotate)) {
              console.log('Going to rotate, rotate:'+crop.rotate);
              Image = Image.rotate('#000000', parseInt(crop.rotate, 10)); // The color is the background in case image doesn't fill all canvas after rotate.
          }
          
          if (isSet(crop)) {
              if (isNull(crop.width)) {
                  res.send( {
                      err: "crop.width is undefined"
                  } );
                  return;
              }
              if (isNull(crop.height)) {
                  res.send( {
                      err: "crop.height is undefined"
                  } );
                  return;
              }
              if (isNull(crop.x)) {
                  res.send( {
                      err: "crop.x is undefined"
                  } );
                  return;
              }
              if (isNull(crop.y)) {
                  res.send( {
                      err: "crop.y is undefined"
                  } );
                  return;
              }
               
              console.log('Going to crop, width:'+crop.width+' height:'+crop.height+' x:'+crop.x+' y:'+crop.y);
              Image = Image.crop(crop.width, crop.height, crop.x, crop.y);
              curWidth = crop.width;
              curHeight = crop.height;
          }
          
          var f_imageWriteRoutine = function(whichItem, req, res, Image)
          {
	          console.log('Final write out to disk before upload to S3');
	          Image.write(tempOutputFile, function(err)
	          {
		           if (err) throw err;
	              /// Upload to S3 this temporary tempOutputFile file
	              console.log("going to upload "+tempOutputFile+" to S3");
	              
					  //find the document by ID
					  mongoose.model('User').findById(req.id, function (err, blob) 
					  {
					     if (err) throw err;
					     
		         	  s3.putFile(tempOutputFile, 'banner-cropped-' + req.id + '-' + getRandomInt(1,5000), function(err, s3res) 
		         	  {
	                    if (err) throw err;
	                    
						     // Always either do something with `res` or at least call `res.resume()`.	
						     console.log("Success uploading cropped banner to S3");
						     console.log(s3res);				     
						     
			              console.log('Going to updateOrganizationProfile');
			              
			              //var orgupdate = {
			              //    Id: req.body.organization.Id,
			              //    Banner: 'TBD-new S3 URL'
			              //};		              
			              //orgRepo.updateOrganizationProfile( orgupdate, req.session.token, function ( ) {
			              //    res.send( {
			              //        url: orgupdate.Banner
			              //    } );
			              //} );
			              console.log("going to update user with "+whichItem+":"+s3res.url);
		              
						     //update it
						     var update = {};
						     if (whichItem == "banner") {
						        blob.Banner = s3res.url;
						        update.Banner = s3res.url;
						     }
						     else if (whichItem == "logo") {
						        blob.Logo = s3res.url;
						        update.Logo = s3res.url;
						     }
						     
						     blob.update(update , function (err, blobID)
						     {
						         if (err) {
						             res.send("There was a problem updating the information to the database: " + err);
						         } 
						         else {
						             //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
						             res.format({
						                 html: function(){
						                     res.redirect("/users/" + blob._id);
						                 },
						                 //JSON responds showing the updated values
						                 json: function() {
						                     res.json(blob);
						                 }
						             });
						         }
						      });
						   });
					   });
	           } );
	   	 };
          
          if (isSet(crop.maxWidth) || isSet(crop.maxHeight)) {
          
              var f_resizeImage = function(whichItem, req, res, Image, width, height) 
              {
                 var newWidth = width;
                 var newHeight = height;
		           console.log("original image size:"+width+"x"+height);
		           if (isSet(crop.maxWidth) && newWidth > crop.maxWidth) {
		               newWidth = crop.maxWidth;
		               newHeight = crop.maxWidth * height / width;
		           }
		           if (isSet(crop.maxHeight) && newHeight > crop.maxHeight) {
		               newHeight = crop.maxHeight;
		               newWidth = crop.maxHeight * width / height;
		           }
	             
	              console.log("last verif before resize");
		           if (newWidth != width || newHeight != height) {
		              newHeight = Number(Math.round(newHeight));
		              newWidth = Number(Math.round(newWidth));
		              console.log("going to resize to "+newWidth+"x"+newHeight);
		              Image = Image.resize(newWidth, newHeight);
		           }
		              
	              f_imageWriteRoutine(whichItem, req, res, Image);
	           };
	           
              if (curWidth === undefined) {
                 // we don't have image size so we need to fetch image size 
	              Image.size(function (err, size) 
   	           {
   	              if (err) throw err;
   	              f_resizeImage(whichItem, req, res, Image, size.width, size.height);
	              });
	           }
	           else { 
	              f_resizeImage(whichItem, req, res, Image, curWidth, curHeight);
	           }
          }
          else
          {
              f_imageWriteRoutine(whichItem, req, res, Image);
          }
      };
      
      console.log("going to createWriteStream");
      var file = fs.createWriteStream(tempFile);
      console.log("going to download sourceUrl, file:");
      console.log(file);
      var protocol = sourceUrl.indexOf('https') === 0 ? https : http;
      var request = protocol.get(sourceUrl, function(response) {
        console.log("Downloading original image");
        response.pipe(file);
        console.log("piping...");
        file.on('finish', function()
        {
           console.log("finished");
           file.close(function() {
              f_croppingCallback(whichItem, req, res); // pass parameters here again to enclose them
           });
        });
    });
};

// save on s3 but do not save in organisation, waiting to crop
router.post( '/:id/organization/logo/crop', function ( req, res ) 
{
   postImageCrop( "logo", req, res );
});

// save on s3 but do not save in organisation, waiting to crop
router.post( '/:id/organization/banner/crop', function ( req, res ) 
{
   postImageCrop( "banner", req, res );
});

//DELETE a Blob by ID
router.delete('/:id/edit', function (req, res){
    //find blob by ID
    mongoose.model('User').findById(req.id, function (err, blob) {
        if (err) {
            return console.error(err);
        } else {
            //remove it from Mongo
            blob.remove(function (err, blob) {
                if (err) {
                    return console.error(err);
                } else {
                    //Returning success messages saying it was deleted
                    console.log('DELETE removing ID: ' + blob._id);
                    res.format({
                        //HTML returns us back to the main page, or you can create a success page
                          html: function(){
                               res.redirect("/users");
                         },
                         //JSON returns the item with the message that is has been deleted
                        json: function(){
                               res.json({message : 'deleted',
                                   item : blob
                               });
                         }
                      });
                }
            });
        }
    });
});


//PUT to update a blob by ID
router.post('/:id/organization/logo/upload', function(req, res) 
{
    s3.upload( req, "logo" + req.id, function ( err, uploadResult ) 
    {
       console.log( 'after uploading logo' );
       console.log( uploadResult.data );
       console.log( 'url' );
       console.log( uploadResult.url );
       console.log( 'uploadResult:' );
       console.log( uploadResult );

       if (isNull(err) && isSet(uploadResult) && isSet(uploadResult.url))
       {
			  mongoose.model('User').findById(req.id, function (err, blob) 
			  {
			     //update it
				  blob.LogoFullRes = blob.url = uploadResult.url;
			     blob.update({
			        LogoFullRes: uploadResult.url
			     }, function (err, blobID) {
			        if (err) {
				        res.send("There was a problem updating the information to the database: " + err);
				     } 
				     else {
				        //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
				        res.format({
				            html: function(){
				               res.redirect("/users/" + blob._id);
				            },
				            //JSON responds showing the updated values
				            json: function() {
				                res.json(blob);
				            }
				         });
				      }
				  });
			 });
       }
    });
});

//PUT to update a blob by ID
router.post('/:id/organization/banner/upload', function(req, res) 
{
    s3.upload( req, "banner" + req.id, function ( err, uploadResult ) 
    {
       console.log( 'after uploading banner' );
       console.log( uploadResult.data );
       console.log( 'url' );
       console.log( uploadResult.url );
       console.log( 'uploadResult:' );
       console.log( uploadResult );

       if (isNull(err) && isSet(uploadResult) && isSet(uploadResult.url))
       {
			  mongoose.model('User').findById(req.id, function (err, blob) 
			  {
			     //update it
				  blob.BannerFullRes = blob.url = uploadResult.url;
			     blob.update({
			        BannerFullRes: uploadResult.url
			     }, function (err, blobID) {
			        if (err) {
				        res.send("There was a problem updating the information to the database: " + err);
				     } 
				     else {
				        //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
				        res.format({
				            html: function(){
				               res.redirect("/users/" + blob._id);
				            },
				            //JSON responds showing the updated values
				            json: function() {
				                res.json(blob);
				            }
				         });
				      }
				  });
			 });
       }
    });
});

module.exports = router;
