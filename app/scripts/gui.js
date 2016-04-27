window.AudioContext = window.AudioContext || window.webkitAudioContext;

$(function() {
  // Global Variables
  var audioContext = new AudioContext();
  var osc = null;
  var options = {start: true};
  var needsReset = true;
  var pitchDetector = null;
  var theBuffer = null;

  // Form Input Elements
  var inputs = {
    draw: $('#draw')
  };
  // GUI Elements
  var gui = {
    detector: $('#detector'),
    canvas: $('#waveform'),
    pitch: $('#pitch'),
    note: $('#note'),
    detuneBox: $('#detune'),
    detune: $('#detune_amt')
  };

  window.stop = function stop(button) {
    if (pitchDetector) { 
      pitchDetector.destroy(); 
    }
    button.disabled = true;
    button.previousElementSibling.disabled = false;
    pitchDetector = null;
  };

  window.start = function start(button) {
    if (needsReset && pitchDetector) {
      pitchDetector.destroy();
      pitchDetector = null;
    }
    button.disabled = true;
    button.nextElementSibling.disabled = false;
    var sourceNode;
    options.input = sourceNode;
    options.output = audioContext.destination;

    options.length = 2048;
    options.stopAfterDetection = false;
    options.minRms = 0.01;
    options.normalize = false;
    options.minCorrelationIncrease = false;
    options.minCorrelation = false;
    options.onDebug = draw2;
    options.onDetect = false;
    options.context = audioContext;
    if (needsReset || !pitchDetector) {
      console.log('created PitchDetector', options);
      pitchDetector = new PitchDetector(options);
      needsReset = false;
    } else {
      pitchDetector.setOptions(options,true);
    }
    delete options.context;
    delete options.output;
    delete options.input;
    $('#settings').text(JSON.stringify(options,null,4));
    window.pitchDetector = pitchDetector;
    
  };

  function draw2(stats, detector) {
    // Update Pitch Detection GUI
    if (!stats.detected) {
      gui.detector.attr('class', 'vague');
      gui.pitch.text('--');
      gui.note.text('-');
      gui.detuneBox.attr('class', '');
      gui.detune.text('--');
    } else {
      gui.detector.attr('class', 'confident');
      var note =  detector.getNoteNumber();
      var detune = detector.getDetune();
      gui.pitch.text(Math.round(stats.frequency));
      gui.note.text(detector.getNoteString());
      if (detune === 0) {
        gui.detuneBox.attr('class', '');
        gui.detune.text('--');
      } else {
        if (detune < 0) {
          gui.detuneBox.attr('class', 'flat');
        } else {
          gui.detuneBox.attr('class', 'sharp');
        }
        gui.detune.text(Math.abs(detune));
      }
    }
  }
});
