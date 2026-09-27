
$(function () {

	var mapping = (function () {
		var map = {
			'tab1': '#basic',
			'tab2': '#detail',
			'tab3': '#images'
		};
		return function (key) {
			return map[key];
		};
	})();
	var cardData = {
		series: '',
		cardType: '',
		cardClass: '',
		cardName: '',
		hp:'',
		move1_name:'',
		move1_power:'',
		move1_energy:'',
		move1_text:'',
		move2_name:'',
		move2_power:'',
		move2_energy:'',
		move2_text:'',
		weakness: '',
		resitance: '',
		retreat: '',
		pokedex: '',
		evoFrom: '',
		level: '',
		info: '',
		illus: '',
		copyright: '',
		number: '',
		rarity: '',

	};

	var config = {
		drawPotision:{
			cardName: {x:100,y:60},
			hp:{x:280,y:60,maxWidth:52},
			move1_name:{x:110,y:357,maxWidth:138},
			move1_power:{x:317,y:367,maxWidth:40},
			move1_text:{x:111,y:370,maxWidth:192},
			move2_name:{x:110,y:400,maxWidth:138},
			move2_power:{x:317,y:420,maxWidth:40},
			move2_text:{x:111,y:413,maxWidth:192},
			pokedex: {x:248,y:468,maxWidth:100},
			evoFrom: {x:'aaa',y:'bbb'},
			level: {x:'aaa',y:'bbb'},
			info: {x:192,y:321},
			illus: {x:'aaa',y:'bbb'},
			copyright: {x:'aaa',y:'bbb'},
			number: {x:'aaa',y:'bbb'},
		}
	}

	var types = ['none','colorless','grass','fire','water','lightning','phychic','fighting','darkness','metal'],
		siries = ['', 'neo','e'],
		classes = ['basic','stage1','stage2','trainer'];

	var canvas = document.getElementById('sample');

	$('#tab').on('click', 'li', function (e) {
		$('li.selected').removeClass('selected');
		$(this).addClass('selected');
		var color = $(this).css('background-color')
		$('#main').css('background-color', color)
		$('#textarea>dl').hide();
		$(mapping(this.id)).show();
	});


	$('div.typeSelector').blur(function(e) {
		if(!$(this).hasClass('active'))return;
		$(this).find('.optList').addClass('hidden');
		$(this).removeClass('active');
	});
	$('div.typeSelector').focus(function(e) {
		if($(this).hasClass('active'))return;
		$('div.typeSelector').removeClass('active');
		$(this).addClass('active');
	});
	$('div.typeSelector').click(function(e) {
		$(this).find('.optList').toggleClass('hidden');
		if($(e.target).hasClass('option')){
			var type = e.target.classList[1],
				span = $(this).children('span'),
				i = types.indexOf(type);
			span.removeClass();
			span.addClass('value ' + type);
			$(this).prev().val(i).trigger('input');
		}
	})


	$('.move1>button').click(function(){
		$('.move2').show();
		$('.move2').addClass('visible');
		$('.move1>button').hide();
	});

	$('.choiceType').click(function(e){
		var o = $(this).offset(),
			elm = $('#typePicker')[0],
			id = this.id.split('_')[0],
			arr = cardData[id + '_energy'].split(' ');
		$('#typePicker').show();
		$('#typePicker').offset({
			top: o.top + $(this).outerHeight(),
			left: o.left			
		});
		$('#typePicker>div').empty();
		for (var i = 1, len = arr.length ; i < len ; i++) {
			$('<span class="' + arr[i] + '">').appendTo('#typePicker>div');
		}
		elm.dataset.energy = id;
		elm.focus();
	});

	$('#typePicker').click(function(e){
		var elm = e.target,
			data = this.dataset.energy + '_energy',
			arr = cardData[data].split(' ');
		if($(elm).hasClass('button')){
			if($(elm).hasClass('cancel')){
				arr.pop();
				cardData[data] = arr.join(' ');
				console.log(cardData[data])
				$('#typePicker>div').children(':last').remove();
			}else{
				cardData[data] += ' ' + elm.classList[1];
				$('<span class="' + elm.classList[1]+ '">').appendTo('#typePicker>div');
			}
		}
		$('#textarea').trigger('input');
	});
	$('#typePicker').blur(function(e){
		$('#typePicker').hide();
	});

	reset();


	$('#textarea').on('input', function (e) {
		var id = e.target.id,
			type = e.target.type,
			value = e.target.value;
		var file = $('#mainimg')[0].files[0];
		cardData[id] = value;
		if (id === 'siries'){
			if (value == 0){// first siries
				if(cardData.cardType >= 8){
					cardData.cardType = '1';
				}
				$('.typeSelector li').remove('.darkness');
				$('.typeSelector li').remove('.metal');
			}else if($('.typeSelector:first li').length == 7){
				$('.typeSelector>ul').append('<li class="option darkness"></li>','<li class="option metal"></li>' );
			}
		}
		
		
		var ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		drawMainImage(file);
	


	});

	function drawMainImage(blob) {
		if (blob && blob.type.includes('image')) {
			var img = new Image();
			img.onload = function () {
				var ctx = canvas.getContext('2d');
				ctx.drawImage(img, 45, 75);
				URL.revokeObjectURL(img.src);
				drawFrame();
			};
			img.src = URL.createObjectURL(blob);
		}else{
			drawFrame();
		}
		
	}

	function reset() {
		$('#tab1').trigger('click');
		$('select').val('0');
		$('input').val('');
		$('textarea').val('');
		$('.typeSelector li').remove('.darkness');
		$('.typeSelector li').remove('.metal');
	}

	function drawFrame(){
		var stage1, stage2,
			resi = 'images/resistance.png',
			t = cardData.cardType || '1',
			c = classes[cardData.cardClass] || '',
			si = cardData.siries || '0',
			r = cardData.resistance || '0',
			so,p = [];
		if ( classes[cardData.cardClass] === 'trainer' && si <= 1){
			so = 'images/pcardtrainer.png';
		}else if(classes[cardData.cardClass] === 'trainer' && si == 2){
			so = 'images/pcardtrainere.png';
		}else{
			so = 'images/pcard' + siries[si] + t + '.png';		
		}
		if( si == 0){
			stage1 = 'images/stage1.png'
			stage2 = 'images/stage2.png'
		}else if( si == 1 ){
			stage1 = 'images/stageneo1.png'
			stage2 = 'images/stageneo2.png'
		}else{
			stage1 = 'images/stagee1.png'
			stage2 = 'images/stagee2.png'
		}
		
		if(r != 0 && si == 0){
			if (c.includes('stage1') ){
				p = loadImage(so,stage1,resi);
			}else if(c.includes('stage2')){
				p = loadImage(so,stage2,resi);
			}else{
				p = loadImage(so,resi);
			}
		}else{
			if (c.includes('stage1') ){
				p = loadImage(so,stage1);
			}else if(c.includes('stage2')){
				p = loadImage(so,stage2);
			}else{
				p = loadImage(so);
			}
		}
		Promise.all(p).then(function(v){
			var ctx = canvas.getContext('2d');
			for (var i = 0; i < v.length; i++) {
				ctx.drawImage(v[i],0,0);
			}
			
			drawText();
			}
		)

	}

	function drawText() {
		var ctx = canvas.getContext('2d');
		var line;
		var move1height = cardData.move1_text ? ((22 + measureParagraph(cardData.move1_text, 192, 8)) / 2):0;
		var move2height = cardData.move2_text ? ((22 + measureParagraph(cardData.move2_text, 192, 8)) / 2):0;
		var d = $('.move2').hasClass('visible') ? 364:391;
		var e = cardData.move2_text ? move2height - 11 : 0;
		var f = cardData.move1_text ? move1height - 11 : 0;
		if(cardData.cardType == 8){
			ctx.fillStyle = '#ffffff'
		}else{
			ctx.fillStyle = '#000000'
		}
		//draw name
		ctx.textAlign = 'start';
		ctx.font = 'bold 25px sans-serif'
		ctx.fillText(cardData.cardName, 100, 60);
		
		ctx.font = 'bold 22px sans-serif'
		ctx.fillText(cardData.hp, 280, 60 , 52);
		ctx.fillText(cardData.move1_name, 110, d - f, 138);
		ctx.fillText(cardData.move1_power, 317, d, 70);
		ctx.font = 'bold 8px sans-serif'
		drawParagraph(cardData.move1_text, 111, d - f + 10, 192, 8) || 370;
		if($('.move2').hasClass('visible')){
			ctx.beginPath();
			ctx.moveTo(36, 380.5);
			ctx.lineTo(362,380.5);
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.font = 'bold 22px sans-serif'
			ctx.fillText(cardData.move2_name, 110, 418 - e, 138);
			ctx.fillText(cardData.move2_power, 317, 418, 70);
			ctx.font = '100 8px sans-serif'
			drawParagraph(cardData.move2_text, 111, 418 - e + 10, 192, 8);
		}
		ctx.font = '400 10px sans-serif'
		drawParagraph(cardData.pokedex, 248, 468, 100, 11);
		ctx.font = 'bold 10px sans-serif'
		ctx.fillText(cardData.level ,237, 62, 30);
		ctx.fillText(cardData.evoFrom, 87, 32);
		ctx.textAlign = 'center';
		ctx.font = 'bold 10px sans-serif'
		ctx.fillText(cardData.info, 196, 321);

		//
		
	
		var spr = loadImage('images/sprite.png');
		Promise.all(spr).then(function(v){
			if(cardData.move1_energy){
				var arr = cardData.move1_energy.split(' ').slice(1)
				for ( var i = 0, len = arr.length;	i < len; i++){
					var dx = 43 + 28 * i,
						sy = 0  + 28 * (types.indexOf(arr[i]) - 1)
					ctx.drawImage( v[0], 0, sy , 28, 28, dx, 371, 28, 28 );
				}
			}
			changeImage();
		});
		


	}

	function changeImage() {
		var data = canvas.toDataURL();

		$('#cardimg').attr( 'src', data );

	}
	
	function drawParagraph(text, xNumber, yNumber, maxWidth, fontHeight){
		if (!text)return;
		var line = yNumber;
		var width = 0;
		var ctx = canvas.getContext('2d');
		for (var i = 0; i < text.length; i++ ){
			if (text[i] === '\n'){
				line += fontHeight;
				width = 0;
				continue;
			}
			ctx.fillText(text[i], xNumber + width, line );

			width += ctx.measureText(text[i]).width;
			if (width > maxWidth){
				line += fontHeight;
				width = 0;
			}
		}
		return line;
	}

	function loadImage(){
		var promiseArr = [];
		for (var i = 0; i < arguments.length; i++) {
			var elm = arguments[i]
			promiseArr[i] = new Promise(function(resolve,reject){
				try {
					var img = new Image();
					img.onload = function(){
						resolve(img);
					}
					img.src = elm;
				}catch (error) {
					reject(error);
				}
			});
		}
		return promiseArr;
	}

	function measureParagraph(text, maxWidth, fontHeight){
		var ctx = canvas.getContext('2d');
		ctx.font = '100 ' + fontHeight + 'px sans-serif'
		var width = 0;
		var height = fontHeight;
		for (var i = 0; i < text.length; i++ ){
			if (text[i] === '\n'){
				height += fontHeight;
				width = 0;
				continue;
			}
			width += ctx.measureText(text[i]).width;
			if (width >= maxWidth){
				height += fontHeight;
				width = 0;
			}
		}
		return height;
		
	}


	
});