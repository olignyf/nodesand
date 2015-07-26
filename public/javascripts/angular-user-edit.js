
//module.exports = function ( $scope, $timeout, $rootScope, $C_accountService, Upload, $http ) {

var app = angular.module('nodesand', ['ngFileUpload', 'ui.bootstrap']);
app.controller('organizationProfileCtrl', function ($scope, $http, Upload)
{
    var vm = this;
    vm.ready = false;
    vm.organization = {};
    vm.organization.geo = '';
    vm.success = false;
    vm.error = false;
    vm.errorMessage = '';
//    vm.domain = $rootScope.global.domain;

    var inProgress = function ( evt ) {
        console.log( 'percent: ' + parseInt( 100.0 * evt.loaded / evt.total ) );
    };

    var clearFileUpload = function ( selector ) {
        var $upload = $( selector ).find( ':file' );
        $upload.val( '' );
        $upload.parent( ).find( ':text' ).val( '' );
        $upload.parent( ).find( '.badge' ).remove( );
    };

    $scope.save = function ( organizationProfileForm ) {
        if ( organizationProfileForm.$valid ) {

            $C_entityService.saveOrganiztion( vm.organization ).then( function ( data ) {
                if ( data !== 200 ) {
                    vm.success = false;
                    vm.error = true;
                    vm.errorMessage = data;
                } else {
                    vm.success = true;
                    vm.error = false;
                    $timeout( function ( ) {
                        vm.success = false;
                    }, 2000 );
                }
            } );
        } else {
            alert( 'invalid' );
        }
    };
    
    $scope.onOpenModalUpload = function (whichItem, url, aspectRatio) {
        
        var $cropperModal = $('#cropper-modal');
        $cropperModal.modal( {
           show: false
        } );
        
        if (vm.cropperActive) {
            vm.cropperActive.cropper('destroy');
            $('.jsBannerUploadCropping').empty();
        }
                
        $cropperModal.modal('show');
        $scope.modalOpenFor = whichItem;
        
        if (url !== undefined)
        {
           $('.jsUploadProgressDiv').hide();
           //url = 'https://cphdaytodaytest.s3.amazonaws.com/sitecoreLogo1435201872.png?abc=true';
           prefillImageCropper(whichItem, url, aspectRatio);
        }
        
        if (whichItem === 'banner') {
          $cropperModal.removeClass('logo').addClass('banner');
        }
        else if (whichItem === 'logo') {
          $cropperModal.removeClass('banner').addClass('logo');
        }
        $cropperModal.find('.jsButtonUploadLogo').hide();
        $cropperModal.find('.jsButtonUploadBanner').show();
//      this.initPreview();
    };
    
    $scope.onOpenModalLogoUpload = function () {
        
        var $cropperModal = $('#cropper-modal');
        $cropperModal.modal( {
           show: false
        } );
        
        if (vm.cropperActive) {
            vm.cropperActive.cropper('destroy');
            $cropperModal.find('.jsBannerUploadCropping').empty();
        }
      
        $cropperModal.modal('show');
        
        $cropperModal.removeClass('banner').addClass('logo');
        $cropperModal.find('.jsButtonUploadLogo').show();
        $cropperModal.find('.jsButtonUploadBanner').hide();
//        this.initPreview();
    };

    var fixUpCanvasAfterPluginLoaded = function($img)
    {
        var getImageData = $img.cropper('getImageData');
        //console.log('getImageData:');
        //console.log(getImageData);
        if (getImageData !== undefined)
        {
           var width = $('.jsBannerUploadCropping').width();
           var height = $('.jsBannerUploadCropping').height();
           
           var newHeight = (getImageData.naturalHeight / getImageData.naturalWidth) * width;
           console.log('height'+height+', newHeight:'+newHeight);
           if (newHeight < height)
           {
               $('.jsBannerUploadCropping, .cropper-container').height(newHeight+'px');
               setTimeout(function()
               {
                   $img.cropper('setCanvasData', {top:0, left:0});
                   var canvasData = $img.cropper('getCanvasData');
                   $img.cropper('setCropBoxData', {left:0, width:canvasData.width, top: 0.1*newHeight/2, height: 0.9*newHeight});
               }, 10);
           }
           else if (newHeight > height)
           {
               var newWidth = (getImageData.naturalWidth / getImageData.naturalHeight) * height;
               $('.jsBannerUploadCropping, .cropper-container').width(newWidth+'px');
               setTimeout(function()
               {
                   $img.cropper('setCanvasData', {top:0, left:0, width:newWidth});
                   var canvasData = $img.cropper('getCanvasData');
                   $img.cropper('setCropBoxData', {left:0, width:canvasData.width, top:0.2*height/2, height: 0.8*height});
               }, 10);
           }
        }
    };
    
    // item = 'banner' or 'logo'
    var prefillImageCropper = function(item, url, aspectRatio) {
        if (console) {
          console.log('prefillImageCropper with url: '+ url);
        }
        
        $('body').css('cursor', 'wait');
        
        var $img = $('<img src="' + url + '">');
        $( '.jsBannerUploadCropping' ).empty().html($img);
        var $bannerPreview =  $( '.jsCropperBannerUpload .cropper-preview' );
        var $bannerBtns = $('.jsCropperBannerUpload .cropper-btns');
        $bannerBtns.on('click', function(e)
        {
           var data;
           if (vm.cropperActive) {
               data = $(e.target).data();
               if (data.method) {
                  $img.cropper(data.method, data.option);
               }
           }
        } );
            
        if (vm.cropperActive) {
           // does not work well, previews are not updated $img.cropper('replace', data.url);
           $img.cropper('destroy');
        }
            
        var params = {
           preview: $bannerPreview.selector,
           strict: false,
           zoomable: true,
           responsive: false,
           crop: function (data) 
           {
              var json = {
                'x': data.x,
                'y': data.y,
                'height': data.height,
                'width': data.width,
                'rotate': data.rotate
              };
              
              $scope.cropData = json;
           },
           built: function () 
           {
              $('body').css('cursor', 'auto');
                 
              fixUpCanvasAfterPluginLoaded($img);
           }
        };
        
        if (aspectRatio !== undefined)
        {	params.aspectRatio = aspectRatio;
        }
        
        $img.cropper( params );
        
        vm.cropperActive = $img;
    };
      
    $scope.saveCrop = function ( ) {
       
       var params = $scope.cropData;
       var sourceUrl = vm.organization.BannerFullRes;
       if ($scope.modalOpenFor === 'logo') {
          sourceUrl = vm.organization.LogoFullRes;
          params.maxWidth = 50;
          params.maxHeight = 50;
       }
       else if ($scope.modalOpenFor === 'banner') {
          sourceUrl = vm.organization.BannerFullRes;
          params.maxWidth = null;
          params.maxHeight = 150;
       }
       
       $http( {
          method: 'POST',
          data: {organization: vm.organization, crop:params, sourceUrl: sourceUrl},
          url: 'organization/'+$scope.modalOpenFor+'/crop',
       } ).success( function ( data, status, headers, cfg ) {
         //  deferred.resolve( status );
          if (console) 
          {  console.log('success banner crop');
          }
          
          // close modal
          $('#cropper-modal').modal('hide');
         
          if ($scope.modalOpenFor === 'banner') {
             vm.organization.Banner = data.Banner;
          }
          if ($scope.modalOpenFor === 'logo') {
             vm.organization.Logo = data.Logo;
          }
          
       } ).error( function ( err, status ) {
          //   deferred.reject( status );
          if (console) 
          {  console.log('failure banner crop');
          }
       } );
    };
    
    
    $scope.onLogoChange = function() {
    
    	if (vm.organization.LogoFullRes === undefined || vm.organization.LogoFullRes === '')
    	{
    		// start upload
    		$('.jsTriggerUploadLogo').click();
    	}
    	else
    	{
        $scope.onOpenModalUpload('logo', vm.organization.LogoFullRes/*, no ratio*/); 
    	}
    };
    
    $scope.onBannerChange = function() {
    
    	if (vm.organization.BannerFullRes === undefined || vm.organization.BannerFullRes === '')
    	{
    		// start upload
    		$('.jsTriggerUploadBanner').click();
    	}
    	else
    	{
        $scope.onOpenModalUpload('banner', vm.organization.BannerFullRes/*, no ratio*/); 
    	}
    };
    
    
    $scope.onBannerFileSelect = function ( $files ) {
        var file = $files[ 0 ];

        if ( !file ) {
            return;
        }

        vm.loadingBanner = true;

        // reset modal in case it was already openned in the past
        $('.jsUploadProgress').addClass('progress-striped');
        $('.jsBannerUploadCropping, .cropper-container').css({'width':'','height':''});
        $scope.dynamic = 0;
        // reset ends
        
        $scope.onOpenModalUpload('banner');

        Upload.upload( {
            url: 'organization/banner/upload',
            file: file,
            data: vm.organization
        } ).progress(function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
            $scope.dynamic = progressPercentage;
            if (progressPercentage >= 100.0)
            {
               $('.jsUploadProgress').removeClass('progress-striped');
            }
        } ).success( function ( data, status, headers, config ) {
            // file is uploaded successfully
            if (data.url !== undefined) {
            	vm.organization.BannerFullRes = data.url;
        	   }
            else {
            	vm.organization.BannerFullRes = data.BannerFullRes;
            }
            vm.loadingBanner = false;
            //clearFileUpload( '.pictureUploaderPreviewBanner' );
                        
            prefillImageCropper('banner', vm.organization.BannerFullRes/*, aspectRatio*/);

        } );
    };
    
    $scope.onImageReUploadSelect = function ( $files ) {
        var file = $files[ 0 ];

        if ( !file ) {
            return;
        }

        // reset modal in case it was already openned in the past
        $('.jsUploadProgress').addClass('progress-striped');
        $('.jsUploadProgressDiv').show();
        $('.jsBannerUploadCropping, .cropper-container').css({'width':'','height':''});
        $scope.dynamic = 0;
        
        $scope.onOpenModalUpload($scope.modalOpenFor);
        
        // reset ends
        Upload.upload( {
            url: 'organization/'+$scope.modalOpenFor+'/upload',
            file: file,
            data: vm.organization
        } ).progress(function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
            $scope.dynamic = progressPercentage;
            if (progressPercentage >= 100.0)
            {
               $('.jsUploadProgress').removeClass('progress-striped');
            }
        } ).success( function ( data, status, headers, config ) {
            // file is uploaded successfully
            
            if ($scope.modalOpenFor === 'banner') {
	            if (data.url !== undefined) {
	            	vm.organization.BannerFullRes = data.url;
	        	   }
	            else {
	            	vm.organization.BannerFullRes = data.BannerFullRes;
	            }
              vm.loadingBanner = false;
              //clearFileUpload( '.pictureUploaderPreviewBanner' );
              prefillImageCropper('banner', vm.organization.BannerFullRes/*, aspectRatio*/);
            }
            else {	            
	            if (data.url !== undefined) {
	            	vm.organization.LogoFullRes = data.url;
	        	   }
	            else {
	            	vm.organization.LogoFullRes = data.LogoFullRes;
	            }
              vm.loadingBanner = false;
              //clearFileUpload( '.pictureUploaderPreviewBanner' );
              var aspectRatio = 1;
              prefillImageCropper('logo', vm.organization.LogoFullRes, aspectRatio);
            }

        } );
    };
    

    $scope.onLogoFileSelect = function ( $files ) {
        var file = $files[ 0 ];

        if ( !file ) {
            return;
        }

        vm.loadingLogo = true;
        
        // reset modal in case it was already openned in the past
        $('.jsUploadProgress').addClass('progress-striped');
        $('.jsBannerUploadCropping, .cropper-container').css({'width':'','height':''});
        $scope.dynamic = 0;
        // reset ends
        
        $scope.onOpenModalLogoUpload('logo');

        Upload.upload( {
            url: 'organization/logo/upload',
            file: file,
            data: vm.organization
        } ).progress(function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
            $scope.dynamic = progressPercentage;
            if (progressPercentage >= 100.0)
            {
               $('.jsUploadProgress').removeClass('progress-striped');
            }
        } ).success( function ( data, status, headers, config ) {
            // file is uploaded successfully
            if (data.url !== undefined) {
            	vm.organization.LogoFullRes = data.url;
        	   }
            else {
            	vm.organization.LogoFullRes = data.LogoFullRes;
            }
            vm.loadingLogo = false;
            //clearFileUpload( '.pictureUploaderPreviewLogo' );
                        
            var aspectRatio = 1;
            prefillImageCropper('logo', vm.organization.LogoFullRes, aspectRatio);
            
        } );
    };

    var data = {};
    data.Banner = $("#inputBanner").val();
    data.BannerFullRes = $("#inputBannerFullRes").val();
    data.Logo = $("#inputLogo").val();
    data.LogoFullRes = $("#inputLogoFullRes").val();
    data.Id = $("#inputId").val();
    console.log(data);
    vm.organization = data;
    vm.organization.geo = '';
    vm.ready = true;
    console.log('loaded organization:');console.log(data);
    //vm.organization.BannerFullRes = 'https://cphdaytodaytest.s3.amazonaws.com/sitecoreBanner1435274505.png';
});
