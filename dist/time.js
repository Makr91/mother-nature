let listeners = [];
console.log("Time is running!");

const tick = function() {
  listeners.forEach(function(listener) {
    listener();
  });
}

let gameTick = setInterval(tick, 50);

exports.addListener = (listener) => {
  listeners.push(listener);
}

exports.getCurrentMilliseconds = () => {
  return new Date().getTime();
}

exports.stopTime = () => {
  clearInterval(this.gameTick);
  console.log("Time has stopped.");
}
