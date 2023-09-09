//50135458, 50949601

function getAirTime(tracks) {
  let accumTime = 0;
  if (tracks && tracks.length > 0) {
    let prev = tracks[0];
    let initialTime;
    let track;

    if (tracks.length === 1) {
      return (prev.onGround === false) ? prev.time : 0;
    }

    if (prev.onGround === false) {
      initialTime = 0;
      // console.log('initialTime', initialTime, prev.time);
    }
    for (let index = 1; index < tracks.length; index++) {
      track = tracks[index];
      if (prev.onGround !== track.onGround) {
        if (isInitialTimeSet(initialTime)) {
          accumTime += Math.round((prev.time + track.time) / 2) - initialTime;

          // console.log('accumTime', accumTime, prev.time, track.time);
          initialTime = undefined;
        } else {
          initialTime = Math.round((prev.time + track.time) / 2);
          // console.log('initialTime', initialTime, prev.time, track.time);
        }
      }
      prev = track;
    }
    if (!track.onGround && isInitialTimeSet(initialTime)) {
      accumTime += track.time - initialTime;
      // console.log('accumTime', accumTime, track.time);
    }

  }
  return accumTime;

}

function isInitialTimeSet(num) {
  return Number.isInteger(num);
}

function calculateTime(tracks) {
  // const states = getShortStates(tracks);
  // const depTime = getDepartingTime(states);
  // const arrTime = getOnBlocksTime(states);
  // console.log((arrTime - depTime));
  // const time = ((arrTime - depTime));
  // console.log('time :>> ', `${Math.trunc(time  / 60 / 60)}h ${Math.round((time % 1) * 60)}m`, );
  // return time;
  return getAirTime(tracks);
}

function getShortStates(tracks) {
  let short = [];
  if (tracks && tracks.length > 0) {
    let track;
    let prev = tracks[0];
    short.push(getTrace(prev));
    let index = 1;
    for (; index < tracks.length - 1; index++) {
      track = tracks[index];
      if (prev.onGround !== track.onGround || prev.state !== track.state) {
        short.push(getTrace(track))
      }
      prev = track;
    }

    short.push(getTrace(tracks[index]))

  }

  return short;

  // if (!tracks || tracks.length === 0) {
  //   return [];
  // }

  // while (tracks[0] && tracks[0].state === 'En Route') {
  //   tracks.shift();
  // }

  // if (tracks.length === 0) {
  //   return [];
  // }

  // let lastState = '';
  // let lastOnGround;
  // let short = [];
  // let states = [];
  // let lastPushed = -1;
  // let index = 0;
  // let prevTrack;

  // for (; index < tracks.length; index++) {
  //   const track = tracks[index];
  //   if (index > 0) {
  //     prevTrack = tracks[index - 1];
  //   }
  //   if (track.state !== lastState || track.onGround !== lastOnGround) {
  //     console.log(index, lastPushed);
  //     if (index > 0 && index > lastPushed - 1) {
  //       states.push(getTrace(prevTrack));
  //     }
  //     short.push(track);
  //     states.push(getTrace(track));
  //     lastPushed = index;
  //     lastState = track.state;
  //     lastOnGround = track.onGround;
  //   }
  // }
  // if (index > 0 && index > lastPushed) {
  //   states.push(getTrace(tracks[index - 1]));
  // }
  // return states;
}

function getTrace(track) {
  const {
    state,
    time,
    onGround,
    groundSpeed,
    altitude,
    arrivalDistance,
    departureDistance,
    latitude,
    longitude,
    pitch,
  } = track;
  return {
    state,
    time,
    onGround,
    groundSpeed,
    altitude,
    arrivalDistance,
    departureDistance,
    latitude,
    longitude,
    pitch,
  };
}

function getDepartingTime(states) {
  const prevState = 'Boarding';
  const nextState = 'Departing';

  for (let index = 1; index < states.length; index++) {
    const prev = states[index - 1];
    const state = states[index];
    if (prev.state === prevState && state.state === nextState) {
      return Math.round((state.time + prev.time) / 2);
    }
  }
  return -1;
}

function getOnBlocksTime(states) {
  const STATE = 'On Blocks';
  const PREV_STATE = 'Landed';
  let time = -1;

  for (let index = 1; index < states.length; index++) {
    const state = states[index];
    const prev = states[index - 1];
    if (prev.state === PREV_STATE && state.state === STATE) {
      time = Math.round((state.time + prev.time) / 2);
    }
  }
  return time;
}

module.exports = {
  calculateTime,
  getShortStates,
  getDepartingTime,
  getOnBlocksTime,
  getAirTime,
};