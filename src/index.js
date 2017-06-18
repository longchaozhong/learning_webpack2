import moment from 'moment';
import _ from 'lodash';
import './style.css';

import './module';

function component () {
  var element = document.createElement('div');
  element.innerHTML = _.join(['Hello', 'webpack'], ' ');
  return element;
}

document.body.appendChild(component());

console.info(moment);
$('body').append('<div>CCCC</div>');
