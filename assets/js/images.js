  // Gallery
var gallery = {
  album: null,
  currentImageIndex: 0,
  maxHeight: screen.availHeight,
  maxWidth: screen.availWidth,

  close: function() {
    $("body").removeClass("overlay");
  },

  showNextImage: function() {
    var nextIndex = this.currentImageIndex + 1;
    this.showImageByIndex((nextIndex == this.album.length) ? 0 : nextIndex); // circular navigation
  },

  showPreviousImage: function() {
    var prevIndex = this.currentImageIndex - 1;
    this.showImageByIndex((prevIndex == -1) ? this.album.length - 1 : prevIndex); // circular navigation
  },

  showImageByName: function(name) {
    var image = this.album.filter(function(photo, index) {
      gallery.currentImageIndex = (photo.name == name) ? index : gallery.currentImageIndex; // set current index
      return (photo.name == name);
    })[0];

    this._showImage(image);
  },

  findImage: function(name) {
    return gallery.album.filter(function(el){return el.name == name})[0]
  },

  showImageByIndex: function(index) {
    this.currentImageIndex = index; // set current index
    this._showImage(this.album[index]);
  },

  _showImage: function(image) {
    var dimensions = this._getDimensions(image),
      height = dimensions.height,
      width = dimensions.width;

    $('.gallery-image-container').css('margin-top', -1 * height / 2);

    $('.gallery-image')
      .removeAttr('src')
      .attr({
        src: image.src,
        height: height,
        width: width
      })
      .fadeIn();

    $('.gallery-image-caption')
      .find('p')
      .css('width', width)
      .html(unescape(image.caption));

    $('.prev-image, .next-image')
      .css('width', ($(document).width() - width) / 2)

    $('body').addClass('overlay');
  },

  _getDimensions: function(image) {
    var aspectRatio = $(window).width() / $(window).height(),
      minHeight = Math.min(image.height, $(window).height()),
      minWidth = Math.min(image.width, $(window).width());

    return {
      height: (aspectRatio > 1) ? minHeight : minWidth * (image.height / image.width),
      width: (aspectRatio > 1) ? minHeight * (image.width / image.height) : minWidth
    }
  },

  loadAlbum: function(album_id, gallery_enabled) {
    $.getJSON("https://api.flickr.com/services/rest/?&format=json&jsoncallback=?&api_key=cfff126f86dcd7009dbce5fe2e253f57&method=flickr.photosets.getPhotos&extras=url_t,url_c,url_o,url_s,url_l,url_z,description&photoset_id=" + album_id, function(data) {
      gallery.album = data.photoset.photo.map(function(photo) {
        return {
          name: photo.title,
          src: photo.url_l,
          width: photo.width_l,
          height: photo.height_l,
          t_src: photo.url_t,
          c_src: photo.url_c,
          z_src: photo.url_z,
          caption: photo.description._content
        }
      });
      gallery.initializeBlogImages();
      gallery.initializeLazyLoading();
      if(!isMobile() && gallery_enabled){
        $('body').addClass('gallery-loaded');
        gallery.loadThumbnails();
        gallery.bindEvents();
        gallery.makeImagesClickable();
      }
    });
  },

  initializeBlogImages: function(){
    $('.post-content img').each(function(){
      var name=$(this).attr('name');
      var image = gallery.findImage(name);
      var imageSrc = (!!image.c_src) ? image.c_src : image.z_src;
      $(this).attr('data-src', imageSrc);
      $(this).wrap('<div class="image"></div>').after("<div class='image-caption'>" + image.caption + "</div>")
    });
  },

  initializeLazyLoading: function(){
    $("img").unveil();
  }, 

  loadThumbnails: function() {
    var listOfImages = gallery.album
    var blogImages = listOfImages.filter(function(el){return $(".image img[name='"+ el.name + "']").length != 0})
    var newImages = listOfImages.filter(function(el){return $(".image img[name='"+ el.name + "']").length == 0})
    var album = newImages.concat(blogImages);
    for (var i = 0, len = album.length; i < len; i++) {
      $(".carousel").append("<div class='thumbnail' style='background-image:url(" + album[i].t_src + "); background-size:cover' name='" + album[i].name + "'></div>");
    }
    
    gallery.initializeCarousel();
  },

  initializeCarousel: function(){
    $(".carousel").slick({
      infinite: true,
      speed: 300,
      slidesToShow: 4,
      variableWidth: true
    });
  },

  makeImagesClickable: function(){
    $("header").addClass("clickable");

    $(".image").each(function(){
      $(this).addClass("clickable");
    })
  },

  bindEvents: function() {
    $('.post-content img, .thumbnail').click(function() {
      var name = $(this).attr("name");
      gallery.enableAccessibility();
      gallery.showImageByName(name);
    });

    $(".prev-image").click(function() {
      gallery.showPreviousImage();
    });

    $(".next-image").click(function() {
      gallery.showNextImage();
    });

    $(".post-header").click(function() {
      gallery.enableAccessibility();
      gallery.showImageByName("feature-image");
    });

    $(".close-button").click(function() {
      gallery.disableAccessibility();
      gallery.close();
    });
  },

  enableAccessibility: function(){
    $(document).keydown(function(e) {
      if (e.which == 27) {
        gallery.disableAccessibility();
        gallery.close();
      } else if (e.which == 37) {
        gallery.showPreviousImage();
      } else if (e.which == 39) {
        gallery.showNextImage();
      }
    });
  },

  disableAccessibility: function(){
    $(document).unbind('keydown');
  }
}

var isMobile= function() { 
  return screen.availWidth <= 600
}

// On DOM ready, load the gallery if albumId is present in the post
$(function() {
  var album_id = $('.post').data('album-id');
  var gallery_enabled = $('.post').data('gallery-enabled');
  if (!!album_id) {
    gallery.loadAlbum(album_id, gallery_enabled);
  }
})