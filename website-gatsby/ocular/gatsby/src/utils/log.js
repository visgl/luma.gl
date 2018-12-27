import {Log, COLOR} from 'probe.gl';

const log = new Log({id: 'ocular'});

log.log({color: COLOR.CYAN}, 'Loaded ocular gatsby generator')();

export default log;
export {COLOR};
