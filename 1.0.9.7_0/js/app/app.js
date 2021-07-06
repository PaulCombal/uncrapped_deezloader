$(document).ready(function(){
	$('#search__').select();
});

$('.search_btn').click(function(){
	$('.search-bar').submit();
});

$('.search-bar').submit(function(e) {
	e.preventDefault();

	var search = $('#search__').val();



	var term = "https://feed.lookbox.net/s261?q=" + encodeURIComponent(search);

    
	window.location.href = term;

    return false;
});