
$('#menu-action').click(function() {
  $('.sidebar').toggleClass('active');
  $('.main').toggleClass('active');
  $(this).toggleClass('active');

  if ($('.sidebar').hasClass('active')) {
    $(this).find('i').addClass('fa-close');
    $(this).find('i').removeClass('fa-bars');
  } else {
    $(this).find('i').addClass('fa-bars');
    $(this).find('i').removeClass('fa-close');
  }
});

$('.tuts').click(function() {
  $('.tuts-list').slideToggle();
});

//  $(document).mouseup(function (e) { 
//   var tutslist = $(".tuts-list"); 
//   if(!tutslist.is(e.target) &&  
//   tutslist.has(e.target).length === 0) { 
//       tutslist.hide(); 
//   } 
// }); 

$('.samples').click(function() {
  $('.samples-list').slideToggle();
});

//  $(document).mouseup(function (e) { 
//   var sampleslist = $(".samples-list"); 
//   if(!sampleslist.is(e.target) &&  
//   sampleslist.has(e.target).length === 0) { 
//       sampleslist.hide(); 
//   } 
// }); 

$('.circuit-gates ul li').click(function() {
  $(this).find('.gate-desc').show();

});

 $(document).mouseup(function (e) { 
  var container = $(".gate-desc"); 
  if(!container.is(e.target) &&  
  container.has(e.target).length === 0) { 
      container.hide(); 
  } 
}); 


  // $(".sidebar").mouseout(function(){
  //   $('.tuts-list').hide();
  //   $('.samples-list').hide();
  // });

// Add hover feedback on menu
$('#menu-action').hover(function() {
    $('.sidebar').toggleClass('hovered');
});