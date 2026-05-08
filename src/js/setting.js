/*----------------------------------------
	Header
----------------------------------------*/
$('.main-header__mobile-icon').on('click', function () {
	$(this).toggleClass("mobile-close");
	$(".main-header__navGlobal").fadeToggle(300).toggleClass("is-show");
});


$(window).scroll(function() {
	if ($(this).scrollTop() > 0) {
		$('.main-header').addClass('is-active');
	} else {
		$('.main-header').removeClass('is-active');
	}
});



/*----------------------------------------
	Size
----------------------------------------*/

// object fit
$(function () {
	objectFitImages('.u-img-of');
});


// matchHeight
jQuery(function ($) {
	$('.mh').matchHeight();
	$(window).on("load resize", function () {
		$('.mh-child').matchHeight();
	});
});



/*----------------------------------------
	Common Utility
----------------------------------------*/

// Top page ページ読み込み後のクラス付与
$(window).on('load',function() {
	setTimeout(function(){
		$('.top-mainvisual').addClass('is-active');
	},1000);
});


// Scroll animation
$(function(){
	$(window).scroll(function (){
		$('.js-scrollin').each(function(){
			var elemPos = $(this).offset().top;
			var scroll = $(window).scrollTop();
			var windowHeight = $(window).height();
			if (scroll > elemPos - windowHeight + 200){
				$(this).addClass('is-visible');
			}
		});
	});
});


// Smooth Scroll
var headerHeight = $('#main-header').outerHeight();
    
var urlHash = location.hash;
if(urlHash) {
    $('body,html').stop().scrollTop(0);
    setTimeout(function(){
        var target = $(urlHash);
        var position = target.offset().top - headerHeight;
        $('body,html').stop().animate({scrollTop:position}, 500);
    }, 100);
}

$(function(){
    $('a[href*="#"], area[href*="#"]').not(".noScroll").click(function() {
        var speed = 400,
            href = $(this).prop("href"),
            hrefPageUrl = href.split("#")[0],
            currentUrl = location.href,
            currentUrl = currentUrl.split("#")[0];

        if(hrefPageUrl == currentUrl){

            href = href.split("#");
            href = href.pop();
            href = "#" + href;

            var target = $(href == "#" || href == "" ? 'html' : href),
                position = target.offset().top - headerHeight;
               $('body,html').stop().animate({scrollTop:position}, 500);
            return false;
        }

    });
});


//Footer fixed button
$(function() {
	var btn = $('.js-contact');
	$(window).on('load scroll', function(){
		if($(this).scrollTop() > 200) {
			btn.addClass('is-show');
		}else{
			btn.removeClass('is-show');
		}
	});
  
  $(window).on('load scroll', function(){
      var height = $(document).height(),
          position = window.innerHeight + $(window).scrollTop(),
          footer = $(".main-footer").height();
      if ( height - position  < footer ){ 
      	btn.addClass('absolute');
      } else { 
      	btn.removeClass('absolute');
      }
  });  
});


/*----------------------------------------
	Pages
----------------------------------------*/
