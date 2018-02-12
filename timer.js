/* Timer object */
// Written by Gilad Barkan January, 2017
// Covered by the "Do whatever the heck you want with it" licence, 
// the full text of which is: Do whatever the heck you want with it. 
// [Attributed to http://stackoverflow.com/users/14860/paxdiablo]

// Methods: start(), stop(), reset([true]), info(), set(paramsObj,[compensate<boolean>])
// Useful properties:
//		.startAt<integer>,
//		.countDown<boolean>, (this will count up to zero if startAt is negative)
//		.countdownCallback<function(timer)>, // will get called at countdown zero
//		.startCallback<function(timer)>, // will get called at start
//		.stopCallback<function(timer)>, // will get called at stop and at countdown zero
//		.resetCallback<function>(timer), // will get called on reset
//		.formatTime<function(time, decreasing<boolean>),
//		.displayFunction<function(formattedTime)>,
//		.updateInterval<integer>, (milliseconds)
//		.time<integer>, (milliseconds)

//		set() can be called any time and sets the timer to the new parameters.
//		If the optional property,'compensate', is set to 'true' the set() method
//		will take into account the current time in relation to lastEventTime
//		Parameters:
//			time<integer>,
//			startAt<integer>,
//			countDown<boolean>,
//			running<boolean>,
//			lastEventTime<UNIX Time Stamp>,
//			action<string>,
//			delayAction<integer>,
//			compensate<boolean>

/* Example use

var t = new Timer({
	startAt: -(10000),
	countDown: true,
	updateInterval: 50,
	displayFunction: function (time){													
  [minus,hours,minutes,seconds] = time;

		document.getElementById('minutes').innerHTML = minus + ('' + minutes).padLeft('00');
		document.getElementById('seconds').innerHTML = ('' + seconds).padLeft('00');
	}
});

t.start()
*/

var Timer = function(params){

	var timer = this;

	// Initialize
	timer.countDown = params.countDown || false;
	
	timer.countdownCallback = params.countdownCallback || function(timer){};
	
	timer.startCallback = params.startCallback || function(timer){};
	
	timer.stopCallback = params.stopCallback || function(timer){};

	timer.resetCallback = params.resetCallback || function(timer){};

	timer.updateInterval = params.updateInterval || 10;

	timer.timeout = null;

	timer.lastTime = null;

	timer.startAt = params.startAt || 0;

	timer.lastEventTime = + new Date();

	timer.decreasing = function (){ return timer.startAt > 0 && timer.countDown; };

	timer.update = function(){
		if (!(timer.countDown && timer.time <= 0)){
			var now = +new Date();
			timer.time += timer.decreasing() ? -(now - timer.lastTime) : now - timer.lastTime;
			timer.lastTime = now;
			timer.display();
			timer.timeout = setTimeout(function(){
				timer.update();
			}, timer.updateInterval);

		} else {
			timer.stop();
			timer.time = 0;
			timer.display();
			timer.time = timer.startAt;
			timer.countdownCallback(timer);
		}
	}

	timer.time = params.startAt || 0;
	
	// Default, returns array [minus,hours,minutes,seconds]
	timer.formatTime = params.formatTime || function(time, decreasing){
	  const steps = [null,3600000,60000,1000,10],
          bases = [null,24     ,60   ,60  ,100];
        
    var result = new Array(steps.length - 1),
        _time = Math.abs(time);

    // Minus prefix
    result[0] = time < 0 ? '-' : '';
      
    for (var i=1; i<steps.length-2; i++){
      result[i] = Math.floor(_time / steps[i]);
      _time = _time - result[i] * steps[i];
    }
  
    if (time < 0 || decreasing){
      result[i] = Math.ceil(_time / steps[i]);
      while (result[i] === bases[i]){
        result[i] = 0;
        result[i - 1] = result[i - 1] + 1;
        i = i - 1;
      }
   
    } else {
      result[i] = Math.floor(_time / steps[i]);
    }
  
    return result;
  }

	timer.displayFunction = params.displayFunction || function(time){};

	timer.display = function(){
	  timer.displayFunction(
			  timer.formatTime(timer.time, timer.decreasing())
			);
	}

	timer.running = function (){ return !!timer.timeout; };

	timer.info = function(){
 		return {
 			running: timer.running(),
			time: timer.time,
			startAt: timer.startAt,
			countDown: timer.countDown,
			decreasing: timer.decreasing(),
			lastEventTime: timer.lastEventTime
		}
	};

	timer.start = function(toAdd=0){
		if (!timer.running()){
			timer.time += toAdd;
			timer.lastTime = +new Date();
			timer.timeout = setTimeout(function(){
				timer.update();
			}, timer.updateInterval);

			timer.lastEventTime = timer.lastTime;
			
			timer.startCallback(timer);
		}
	};

	timer.stop = function(){
		if (timer.timeout) {
			clearTimeout(timer.timeout);
			timer.lastEventTime = + new Date();
			timer.timeout = null;
			timer.stopCallback(timer);
		}
		timer.display();
	};

	timer.reset = function(preventCallback){
		timer.time = timer.startAt;
		if (!timer.running())
			timer.display();
		if (!preventCallback)
			timer.resetCallback();
	};

	timer.stopAndReset = function(){
		timer.stop();
		timer.reset();
	};

	timer.resetAndStart = function(toAdd){
		timer.reset(true);
		timer.start(toAdd);
	};

	timer.set = function(setParams){
		if (setParams.time !== undefined) timer.time = setParams.time;
		if (setParams.startAt !== undefined) timer.startAt = setParams.startAt;
		if (setParams.countDown !== undefined) timer.countDown = setParams.countDown;
		setParams.lastEventTime = setParams.lastEventTime || +new Date();
		setParams.delayAction = setParams.delayAction || 0;

		var toAdd = 0;

		if (setParams.action){
			var delay = (setParams.lastEventTime + setParams.delayAction) - new Date();
		
			if (delay < 0)
				toAdd = -delay;
			
			if (setParams.compensate){
				if (!toAdd)
					toAdd = new Date() - new Date(setParams.lastEventTime);

				toAdd = timer.decreasing() ? -toAdd : toAdd;
			}

			setTimeout(() => timer[setParams.action](toAdd), Math.max(delay,0));
		}

	}

	timer.display();
}
