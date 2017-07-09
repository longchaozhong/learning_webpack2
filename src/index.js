import moment from 'moment';
import _ from 'lodash';
import './style.css';

import './module';
import './main.scss';

function component () {
  var element = document.createElement('div');
  element.innerHTML = _.join(['Hello', 'webpack'], ' ');
  return element;
}


$('body').on('click','.blunk',function () {
    $('body').append('<div>DDDAAA</div>');
});

document.body.appendChild(component());




