import openSocket from 'socket.io-client';
const  socket = openSocket('http://localhost:8000'),
lectureIdKey = 'lIdKey',
range = 9999

function imageBus(imgData, cb) {
  // var lectureId = localStorage.getItem(lectureIdKey);
  // if (!lectureId) {
  //   // create new lecture id and save
  //   lectureId = Math.floor(Math.random() * range);
  //   localStorage.setItem(lectureIdKey, data.key);
  // }
  // imgData['id'] = lectureId;

  socket.on('results', results => cb(null, results));
  socket.emit('imagePost', imgData);
}

export default imageBus;
