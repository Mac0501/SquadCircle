import moment from 'moment';
import 'moment-timezone';
import 'moment/locale/en-gb';



export function displayTime(timeString: string) { // timeString = HH:mm:ss
    return moment(timeString, 'HH:mm:ss').format('LT');
}

export function displayDate(dateString: string) { // dateString = YYYY-MM-DD
    return moment(dateString, 'YYYY-MM-DD').format('LL');
}

export function displayDateTime(dateTimeString: string) { // dateTimeString = YYYY-MM-DD HH:mm:ss
    return moment(dateTimeString, 'YYYY-MM-DD HH:mm:ss').format('lll');;
}