 (function(){

	let playerScore = 0;
	let liveCubes = 0;
	let timeLeft = 60000;
	let intervalID;
	let gameStart = false;

	//Shows the preloader 
	document.body.onload = function(){
			setTimeout(function (){
				$("#site-preloared").addClass("done");
			}, 1000);
		}

	$(document).ready(function(){
		//Adds smooth scrolling
		$("a").on("click", function(event) {
    		if (this.hash !== "") 
    		{
	     		event.preventDefault();
	      	    let hash = this.hash;
	      		$("html, body").animate({scrollTop: $(hash).offset().top}, 800, function(){
	      			window.location.hash = hash;
				});
			}
		});

		$("#play-pause").click(function() {
			if (getButtonText(this) === "Play")
			{
				if (!gameStart)
				{
					startNewGame();
					gameStart = true;

				}
				else
				{
					resumeGame();
				}
			}
			else
			{
				pauseGame();
			}

			updateButton();

			function getButtonText(btn){
				return $(btn).text();
			}	
		});

		$("#modal-result").on("shown.bs.modal", function () {
			//Focuses on the input field
	  		$("#input-user-name").focus();
		})

		$("#restart").click(function(){
			startNewGame();
			if ($("#play-pause").text() == "Play")
				updateButton();
		})

		$("#save-name").click(function() {
			//Saves if the name isn't empty
			if ($("#input-user-name").val())
			{
				hideModal();
				saveResult();
				//updateStatTable();
			}
		});

		//updateStatTable();

		$.get('getTop', (data, status) => {
			updateStatTable(data);
		});
	});

	function saveResult(){
		let userName = $("#input-user-name").val();
		let playerStat = JSON.stringify({name: userName, score: playerScore});

		$.post('/', playerStat, () => {
			$.get('getTop', (data, status) => {
				updateStatTable(data);
			});

		});
	}

	function updateStatTable(results){
		let tableBody = $("#table-body");
		tableBody.text("");

		let currentName;
		let currentScore;
		let tableRow;
		for (let i = 0; i < results.length; i++)
		{
			currentName = results[i].name;
			currentScore = results[i].score;
			tableRow = `<tr><td>${i + 1}</td><td>${currentName}</td><td>${currentScore}</td></tr>`;
			tableBody.append(tableRow);
		}

	}

	function pauseGame() {
		stopTime();
		$("div.game-field").addClass("pause");
	}

	function resumeGame(){
		resumeTime();
		$("div.game-field").removeClass("pause");
	}

	function startNewGame() {
		$("div.game-field").removeClass("pause");
		$("div.cube").remove();
		timeLeft = 60000;
		playerScore = 0;
		liveCubes = 0;
		clearInterval(intervalID);
		updateScore();
		updateTimeLeft();

		generateCube();
		resumeTime();
	}

	function resumeTime() {
		intervalID = setInterval(function(){
			if (timeLeft >= 1000){
				timeLeft -= 1000;
				updateTimeLeft();
			}
			else
			{
				//Game over
				stopTime();
				showSaveDialog();

				//Clears the battlefield
				$("div.cube").remove();
				updateButton();
				gameStart = false;
				liveCubes = 0;
			}
		}, 1000);
	}

	function stopTime() {
		clearInterval(intervalID);
	}

	function generateCube(numberOfCubes = 1) {

		const CUBE_COLORS = ["bg-red", "bg-blue", "bg-ultramarine", "bg-mauve"];
		const CUBE_SIZES = ["cube-lg", "cube-md", "cube-sm", "cube-xs"];
		const MAX_CUBE_HEIGHT = 40;
		const MAX_CUBE_WIDTH = 40;

		let field = $(".game-field");
		let height = field.height();
		let width = field.width();

		for (let i = 0; i < numberOfCubes; i++) {
			let cube = $("<div></div>"),
		   	    size = getRandomSize(),
		   	    color = getRandomColor();

		   	//Adds basic classes for the cube
			cube.addClass("cube");
			cube.addClass(size[0]);
			cube.addClass(color[0]);

			//The experience depends on size and color
			cube.attr("data-experience", size[1] + color[1]);

			//Determines the position of the cube
			let top = getRandomInt(0, height - MAX_CUBE_HEIGHT);
			let left = getRandomInt(0, width - MAX_CUBE_WIDTH);

			//Positions the cube
			cube.css({"top" : top + "px", "left" : left + "px"});
			field.append(cube);
			liveCubes++;

			//Generates a different cube kill-mode(one or two clicks) with a probability of 50%
			if (getRandomInt(0, 2))
			{
				cube.click(function(){
					onCubeDeath(this);
				});
			}
			else
			{
				cube.addClass("cube-dblClick");
				cube.dblclick(function(){
					onCubeDeath(this, 2);
				});
			}

			//Creates an extra time cube with a probability of 8% 
			//if the field doesn't contain this cube
			if (getRandomInt(0, 12) === 0 && !$("div.cube-extra-time").length){
				generateExtraTimeCube();
			}
		}


		function onCubeDeath(cubeToKill, experienceModifier = 1) {
			playerScore += +$(cubeToKill).attr("data-experience") * experienceModifier;
			updateScore();

			$(cubeToKill).remove();
			document.getElementById("sound-on-death").play();
			liveCubes--;

			generateCube(getRandomInt(0, 3));

			if (liveCubes === 0)
			{
				generateCube(getRandomInt(1, 3));
			}
		}

		function generateExtraTimeCube() {
			let cubeExtraTime = $("<div></div>"),
			extraTop = getRandomInt(0, height - MAX_CUBE_HEIGHT),
			extraLeft = getRandomInt(0, width - MAX_CUBE_WIDTH);

	   	    cubeExtraTime.addClass("cube cube-extra-time");

	   	    cubeExtraTime.css({"top" : extraTop + "px", "left" : extraLeft + "px"});
			field.append(cubeExtraTime);

			//Destroys the cube after 3 seconds
			setTimeout(() => $(cubeExtraTime).remove(), 3000);

	   	    cubeExtraTime.click(function() {
	   	    	timeLeft += getRandomInt(2,6) * 1000;
	   	    	$(this).remove();
	   	    	document.getElementById("sound-extra").play();
	   	    });
		}

		function getRandomColor(){ 
			let experienceOnKill;
			return [CUBE_COLORS[experienceOnKill = getRandomInt(0, CUBE_COLORS.length)], ++experienceOnKill];
		}

		function getRandomSize(){
			let experienceOnKill;
			return [CUBE_SIZES[experienceOnKill = getRandomInt(0, CUBE_SIZES.length)], ++experienceOnKill];
		}

	}

	let updateButton = (function() {
		let btnIcon = $("#play-pause-icon");
		restartBtn = $("#restart"),
		btn = $("#play-pause"),
		btnText = $("#play-pause-text");

		return function(input) {
			if (input === undefined)
			{
				//Restart's button activation
				restartBtn.prop('disabled', false);

				//Toggles button classes
				btn.toggleClass("btn-outline-info");
				
				//Changes button icon
				btnIcon.toggleClass("fa-pause");
				btnIcon.toggleClass("fa-play");
				//Changes button text
				btnText.text((btnText.text() === "Play") ? "Pause" : "Play");
			}
			else
			{
				//Resets the button
				btnText.text("Play");
				btn.removeClass("btn-outline-info");
				btn.addClass("btn-outline-primary");
				btnIcon.addClass("fa-play");
				btnIcon.removeClass("fa-pause");
			}

		}

	}());

	function showSaveDialog(){
		$("#modal-score").text(" " + playerScore);
		$("#modal-result").modal({
	  		backdrop: "static",
	  		keyboard: false 
	  		});
	}

	function hideModal(){
		$("#modal-result").modal("hide");
	}

	function updateScore(){
		$("#score").text(playerScore);
	}

	function updateTimeLeft() {
		$("#time-left").text(formatTime());

		function formatTime(){
			let seconds = timeLeft / 1000,
			minutes = seconds / 60 << 0;
			if (!minutes)
				minutes = "00";

			if (!seconds || !(seconds % 60))
				seconds = "00";
			else
			{
				seconds = seconds - minutes * 60;
				if (seconds < 10)
					seconds = "0" + seconds;
			}
			return minutes + ":" + seconds;

		}
	}

	function getRandomInt(min, max){
		return Math.floor(Math.random() * (max - min)) + min;
	}
})();
