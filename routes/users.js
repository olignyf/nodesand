var express = require('express');
var mongoose = require('mongoose');
//var user = require('../models/user');
var router = express.Router();

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
        if (blob.dob != null)
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
          if (blob.dob != null)
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

//PUT to update a blob by ID
router.put('/:id/edit', function(req, res) 
{
    // Get our REST or form values. These rely on the "name" attributes
    var name = req.body.name;
    var badge = req.body.badge;
    var dob = req.body.dob;
    var company = req.body.company;
    var isloved = req.body.isloved;

   //find the document by ID
   mongoose.model('User').findById(req.id, function (err, blob) 
   {
            //update it
            blob.update({
                name : name,
                badge : badge,
                dob : dob,
                isloved : isloved
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
});

//PUT to update a blob by ID
router.post('/:id/edit', function(req, res) 
{
    // Get our REST or form values. These rely on the "name" attributes
    var name = req.body.name;
    var badge = req.body.badge;
    var dob = req.body.dob;
    var company = req.body.company;
    var isloved = req.body.isloved;

   //find the document by ID
   mongoose.model('User').findById(req.id, function (err, blob) 
   {
            //update it
            blob.update({
                name : name,
                badge : badge,
                dob : dob,
                isloved : isloved
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


module.exports = router;
