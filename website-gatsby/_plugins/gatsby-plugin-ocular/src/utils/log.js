const {Log, COLOR} = require('probe.gl');

const log = new Log({id: 'ocular'});

log.log({color: COLOR.CYAN}, 'Loaded ocular gatsby generator')();

module.exports.log = log;
module.exports.COLOR = COLOR;
