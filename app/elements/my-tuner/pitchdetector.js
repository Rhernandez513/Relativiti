(function() {
//This will take audio input and display the note. Used for tuning devices
var noteStrings = ['C', 'C#/D♭', 'D', 'D#/E♭', 'E', 'F', 'F#/G♭', 'G', 'G#/A♭', 'A', 'A#/B♭', 'B'];

//used by frequency to string to calculate which note 
function frequencyToNote(frequency) {
  //returns the index of the note from the freequency we read in, correlates to the above array
  var noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  return Math.round(noteNum) + 69;
}
//used to map a frequency to our array
function frequencyToString(frequency) {
  var note = frequencyToNote(frequency);
  //The first part is returning the name, the second part is calculating the octave
  return noteStrings[note % 12] + Math.floor((note - 12) / 12);
}

//takes the index of the note and converts it to the frequency
function noteToFrequency(note) {
  return 440 * Math.pow(2,(note - 49) / 12);
}

//by dividing the sample rate of our audio by the frequency, we can get the period of a single wave
function noteToPeriod(note, sampleRate) {
  return sampleRate / noteToFrequency(note);
}
//Calculates how far off the object we want to tune is from the actual frequency we want to match to
function centsOffFromPitch(frequency, note) {
  return Math.floor(1200 * Math.log(frequency / noteToFrequency(note)) / Math.log(2));
}
function getLiveInput(context, callback) {
  try {
    navigator.getUserMedia(
    {
      'audio':
        {
          'mandatory':
             {
               'googEchoCancellation': 'false',
               'googAutoGainControl': 'false',
               'googNoiseSuppression': 'false',
               'googHighpassFilter': 'false'
             },
          'optional': []
        },
    }, 
    function(stream) {
      var liveInputNode = context.createMediaStreamSource(stream);
      callback(null,liveInputNode);
    }, 
    function(error) {
      console.error('getUserMedia error',error);
      callback(error,null);
    });
  } catch (e) {
    console.error('getUserMedia exception',e);
    callback(e,null);
  }
}

// prefix fixes
//The Window.requestAnimationFrame() method tells 
//the browser that you wish to perform an animation
//and requests that the browser call a specified 
//function to update an animation before the next repaint. 
//The method takes as an argument a callback 
//to be invoked before the repaint.
//You should call this method whenever you're 
//ready to update your animation onscreen. 
//This will request that your animation function 
//be called before the browser performs the next repaint. 
//The number of callbacks is usually 60 times per 
//second, but will generally match the display refresh rate 
//in most web browsers as per W3C recommendation. 
//The callback rate may be reduced to a lower rate when
// running in background tabs or in hidden 
//<iframe>s in order to improve performance and battery life.
var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
//The Navigator.getUserMedia() method prompts the
// user for permission to use 0 or 1 video and 0 or 1 audio 
//input device such as a camera, a shared screen, or a 
//microphone. If the user provides permission, then the 
//successCallback is invoked with the resulting MediaStream
// object as its argument. If the user denies permission
// or media is not available, then the errorCallback is
// called with PermissionDeniedError or NotFoundError respectively.
// Note that it is possible for neither completion callback 
//to be called, as the user is not required to make a choice.
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia; 
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia;

function PitchDetector(options) {
  // Options:
  this.options = {
    minRms: 0.01,
    interpolateFrequency: true,
    stopAfterDetection: false,
    normalize: false,
    minCorrelation: false,
    length: options.length,
    minCorrelationIncrease: false
  };
  // Internal Variables
  this.context = options.context; // AudioContext
  this.sampleRate = this.context.sampleRate; // sampleRate
  this.MAX_SAMPLES = Math.floor(options.length / 2); // MAX_SAMPLES number
  this.correlations = new Array(this.MAX_SAMPLES); // correlation array
  this.update = this.update.bind(this); // update function (bound to this)
  this.started = false; // state flag (to cancel requestAnimationFrame)
  this.input = null; // Audio Input Node
  this.output = null; // Audio Output Node
  // Stats:
  this.stats = {
    detected: false,
    frequency: -1,
    bestPeriod: 0,
    worstPeriod: 0,
    bestCorrelation: 0.0,
    worstCorrelation: 0.0,
    time: 0.0,
    rms: 0.0,
  };
  this.lastOnDetect = 0.0;
  // Set input
  if (!options.input) {
    var self = this;
    getLiveInput(this.context,function(err, input) {
      if (err) {
        console.error('getUserMedia error:',err);
      } else {
        self.input = input;
        self.start();
      }
    });
  } else {
    this.input = options.input;
  }
  // Set output
  if (options.output) {
    this.output = options.output;
  }
  // Set options
  options.input = undefined;
  // 'input' option only allowed in constructor
  options.output = undefined;
  // 'output' option only allowed in constructor
  options.context = undefined;
  // 'context' option only allowed in constructor
  options.length = undefined;
  // 'length' option only allowed in constructor
  this.setOptions(options);
}

PitchDetector.prototype.setOptions = function(options, ignoreConstructorOnlyProperties) {
  var self = this;

  // Override options (if defined)
  ['minCorrelation','minCorrelationIncrease','minRms',
  'normalize','stopAfterDetection','interpolateFrequency',
  'onDebug','onDetect','onDestroy'
  ].forEach(function(option) {
    if (typeof options[option] !== 'undefined') {
      self.options[option] = options[option];
    }
  });

  if (ignoreConstructorOnlyProperties !== true) {
    // Warn if you're setting Constructor-only options!
    ['input','output','length','context'].forEach(function(option) {
      if (typeof options[option] !== 'undefined') {
        console.warn('PitchDetector: Cannot set option "' + option + '"" after construction!');
      }
    });
  }

  // Set frequency domain (i.e. min-max period to detect frequencies on)
  var minPeriod = options.minPeriod || this.options.minPeriod || 2;
  var maxPeriod = options.maxPeriod || this.options.maxPeriod || this.MAX_SAMPLES;
  if (options.note) {
    var period = Math.round(noteToPeriod(options.note,this.sampleRate));
    minPeriod = period;
    maxPeriod = period;
  }
  if (options.minNote) {
    maxPeriod = Math.round(noteToPeriod(options.minNote,this.sampleRate));	
  }
  if (options.maxNote) {
    minPeriod = Math.round(noteToPeriod(options.maxNote,this.sampleRate));	
  }
  if (options.minFrequency) {
    maxPeriod = Math.floor(this.sampleRate / options.minFrequency);
  }
  if (options.maxFrequency) {
    minPeriod = Math.ceil(this.sampleRate / options.maxFrequency);
  }
  if (options.periods) {
    this.periods = options.periods;
  } else {
    this.periods = [];
    if (maxPeriod < minPeriod) {
      var tmp = maxPeriod;
      maxPeriod = minPeriod;
      minPeriod = tmp;
    }
    var range = [1,1];
    if (this.options.minCorrelation) {
      range = [1,1];
    } else if (this.options.minCorrelationIncrease) {
      range = [10,1];
    }
    if (maxPeriod - minPeriod < 1 + range[0] + range[1]) {
      minPeriod = Math.floor(minPeriod - range[0]);
      maxPeriod = Math.ceil(maxPeriod + range[1]);
    }
    maxPeriod = Math.min(maxPeriod,this.MAX_SAMPLES);
    minPeriod = Math.max(2,minPeriod);
    this.options.minPeriod = minPeriod;
    this.options.maxPeriod = maxPeriod;
    for (var i = minPeriod; i <= maxPeriod; i++) {
      this.periods.push(i);
    }
  }
  // keep track of stats for visualization
  if (options.onDebug) {
    this.debug = {
      detected: false,
      frequency: -1,
      bestPeriod: 0,
      worstPeriod: 0,
      bestCorrelation: 0.0,
      worstCorrelation: 0.0,
      time: 0.0,
      rms: 0.0,
    };
  }
  // Autostart
  if (options.start) {
    this.start();
  }
};

PitchDetector.prototype.start = function() {
  // Wait until input is defined (when waiting for microphone)
  if (!this.analyser && this.input) {		
    this.analyser = this.context.createScriptProcessor(this.options.length);
    this.analyser.onaudioprocess = this.autoCorrelate.bind(this);
    this.input.connect(this.analyser);
    if (this.output) {
      this.analyser.connect(this.output);
    } else {
      // webkit but, it requires an output....
      // dummyOutput.gain.value= 0;
      // dummyOutput.connect(this.context.destination);
      var dummyOutput = this.context.createAnalyser();
      dummyOutput.fftSize = 32;
      this.analyser.connect(dummyOutput);
    }
  }
  if (!this.started) {
    this.started = true; 
    requestAnimationFrame(this.update);
  }
};

PitchDetector.prototype.update = function(event) {
  if (this.lastOnDetect !== this.stats.time) {
    this.lastOnDetect = this.stats.time;
    if (this.options.onDetect) {
      this.options.onDetect(this.stats,this);
    }
  }
  if (this.options.onDebug) {
    this.options.onDebug(this.debug,this);
  }
  if (this.started === true) {
    requestAnimationFrame(this.update);
  }
};

PitchDetector.prototype.stop = function() {
  this.started = false;
};

// Free op resources
// 
// Note: It's not tested if it actually frees up resources
PitchDetector.prototype.destroy = function() {
  this.stop();
  if (this.options.onDestroy) {
    this.options.onDestroy();
  }
  if (this.input && this.input.stop) {
    try {
      this.input.stop(0);
    } catch (e) {}
  }
  if (this.input) {
    this.input.disconnect();
  }
  if (this.analyser) {
    this.analyser.disconnect();
  }
  this.input = null;
  this.analyser = null;
  this.context = null;
  this.buffer = null;
};

/**
 * Sync methoc to retrieve latest pitch in various forms:
 */
PitchDetector.prototype.getFrequency = function() {
  return this.stats.frequency;
};

PitchDetector.prototype.getNoteNumber = function() {
  return frequencyToNote(this.stats.frequency);
};

PitchDetector.prototype.getNoteString = function() {
  return frequencyToString(this.stats.frequency);
};

PitchDetector.prototype.getPeriod = function() {
  return this.stats.bestPeriod;
};

PitchDetector.prototype.getCorrelation = function() {
  return this.stats.bestCorrelation;
};

PitchDetector.prototype.getCorrelationIncrease = function() {
  return this.stats.bestCorrelation - this.stats.worstCorrelation;
};

PitchDetector.prototype.getDetune = function() {
  return centsOffFromPitch(this.stats.frequency,frequencyToNote(this.stats.frequency));
};
/**
 * AutoCorrelate algorithm
 */
PitchDetector.prototype.autoCorrelate = function AutoCorrelate(event) {
  if (!this.started) {
    return;
  }
  // Keep track of best period/correlation
  var bestPeriod = 0;
  var bestCorrelation = 0;
  // Keep track of local minima (i.e. nearby low correlation)
  var worstPeriod = 0;	
  var worstCorrelation = 1;
  // Remember previous correlation to determine if
  // we're ascending (i.e. getting near a frequency in the signal)
  // or descending (i.e. moving away from a frequency in the signal)
  var lastCorrelation = 1;
  // iterators
  var i = 0; // for the different periods we're checking
  var j = 0; // for the different "windows" we're checking
  var period = 0; // current period we're checking.
  // calculated stuff
  var rms = 0;
  var correlation = 0;
  var peak = 0;
  // early stop algorithm
  var foundPitch = !this.options.minCorrelationIncrease && !this.options.minCorrelation;
  var findLocalMaximum = this.options.minCorrelationIncrease;
  // Constants
  this.buffer = event.inputBuffer.getChannelData(0);
  var NORMALIZE = 1;
  var BUFFER_LENGTH = this.buffer.length;
  var PERIOD_LENGTH = this.periods.length;
  var MAX_SAMPLES = this.MAX_SAMPLES;
  // Check if there is enough signal
  for (i = 0; i < BUFFER_LENGTH; i++) {
    rms += this.buffer[i] * this.buffer[i];
    // determine peak volume
    if (this.buffer[i] > peak) {
      peak = this.buffer[i];
    }
  }
  rms = Math.sqrt(rms / BUFFER_LENGTH); 
  // Abort if not enough signal
  if (rms < this.options.minRms) {
    return false;
  }

  // Normalize (if configured)
  if (this.options.normalize === 'rms') {
    NORMALIZE = 2 * rms;
  } else if (this.options.normalize === 'peak') {
    NORMALIZE = peak;
  }

  for (i = 0; i < PERIOD_LENGTH; i++) {		
    period = this.periods[i];
    correlation = 0;
    for (j = 0; j < MAX_SAMPLES; j++) {
      // Version 1: Absolute values
      correlation += Math.abs((this.buffer[j]) - (this.buffer[j + period])) / NORMALIZE;
			
      // Version 2: Squared values (exagarates difference, works better)
      //correlation += Math.pow((this.buffer[j]-this.buffer[j+period]) / NORMALIZE,2);
    }
    // Version 1: Absolute values
    correlation = 1 - (correlation / MAX_SAMPLES);	
    // Version 2: Squared values
    //correlation = 1 - Math.sqrt(correlation/MAX_SAMPLES);
    // Save Correlation
    this.correlations[period] = correlation; 
    // We're descending (i.e. moving towards frequencies that are NOT in here)
    if (lastCorrelation > correlation) {  
      // We already found a good correlation, so early stop!
      if (this.options.minCorrelation && bestCorrelation > this.options.minCorrelation) {
        foundPitch = true;
        break;
      }
      // We already found a good correlationIncrease, so early stop!
      if (this.options.minCorrelationIncrease) {
        if (bestCorrelation - worstCorrelation > this.options.minCorrelationIncrease) {
          foundPitch = true;
          break;
        }
      }

      // Save the worst correlation of the latest descend (local minima)
      worstCorrelation = correlation;
      worstPeriod = period;
      // we're ascending, and found a new high!
    } else if (findLocalMaximum || correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestPeriod = period;
    }
    lastCorrelation = correlation;
  }
  if (this.options.onDebug) {
    this.debug.detected = false;
    this.debug.rms = rms;
    this.debug.time = this.context.currentTime;
    this.debug.bestPeriod = bestPeriod;
    this.debug.worstPeriod = worstPeriod;
    this.debug.bestCorrelation = bestCorrelation;
    this.debug.worstCorrelation = worstCorrelation;
    this.debug.frequency = bestPeriod > 0 ? this.sampleRate / bestPeriod : 0;
  }
  if (bestCorrelation > 0.01 && foundPitch) {
    this.stats.detected = true;
    this.stats.bestPeriod = bestPeriod;
    this.stats.worstPeriod = worstPeriod;
    this.stats.bestCorrelation = bestCorrelation;
    this.stats.worstCorrelation = worstCorrelation;
    this.stats.time = this.context.currentTime;
    this.stats.rms = rms;
    var shift = 0;
    var boolean1 = this.options.interpolateFrequency && i >= 3;
    var boolean2 = period >= bestPeriod + 1;
    var boolean3 = this.correlations[bestPeriod + 1] && this.correlations[bestPeriod - 1];
    if (boolean1 && boolean2 && boolean3) {
      // Now we need to tweak the period - by interpolating 
      //between the values to the left and right of the
      // best period, and shifting it a bit.  This is complex, 
      //and HACKY in this code (happy to take PRs!) -
      // we need to do a curve fit on this.correlations[] around
      // bestPeriod in order to better determine precise
      // (anti-aliased) period.
      // we know bestPeriod >=1, 
      // since foundPitch cannot go to true until the second pass (period=1), and 
      // we can't drop into this clause until the following pass (else if).
      shift = (this.correlations[bestPeriod + 1] - this.correlations[bestPeriod - 1]);
      shift = shift / bestCorrelation;  
      shift = shift * 8;
    }
    this.stats.frequency = this.sampleRate / (bestPeriod + shift);
    if (this.options.onDebug) {
      this.debug.detected = true;
      this.debug.frequency = this.stats.frequency;
    }
    if (this.options.stopAfterDetection) {
      this.started = false;
    }
    return true;
  } else {		
    return false;
  }
};

// Export on Window or as CommonJS module
if (typeof module !== 'undefined') {
  module.exports = PitchDetector;
} else {
  window.PitchDetector = PitchDetector;
}

})();
