const { ROOM_ID_LENGTH } = require('./constants');

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function makeRoomId() {
    let roomId = '';
    let charsLen = chars.length;
    for(let i = 0; i < ROOM_ID_LENGTH; i++) {
        let pos = Math.floor(Math.random() * charsLen);
        roomId += chars.charAt(pos);
    }
    return roomId;
}

module.exports = {
    makeRoomId
}