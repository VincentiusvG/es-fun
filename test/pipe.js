const test = require('tape-catch');
const { esfun, map, curry, Just } = require('../src/es-fun.js');

const add = curry((a, b) => a + b);
const multiply = curry((a, b) => a * b);

test('Piping and functions', function (t) {
  const result = esfun(3)
  .pipe(add(2))
  .pipe(multiply(5))
  .result();

  t.equal(result, 25, 'Piping functions should result in applying functions');

  t.end();
});

test('Use pipe on a mapper function', function (t) {
  const just25 = esfun(3)
  .pipe(add(2))
  .pipe(Just)
  .pipe(map(multiply(5)))
  .result();

  just25.return(function(v){
    t.equal(v, 25, 'Piping a map function');
  });

  t.end();
});

test('Use bind on a mapper function', function (t) {
  const multiplyToJust = curry((a, b) => Just(a * b));
  const just25 = esfun(3)
  .pipe(add(2))
  .pipe(Just)
  .bind(multiplyToJust(5))
  .result();

  just25.return(function(v){
    t.equal(v, 25, 'Binding functions to lifted context should result in applying function to lifted value');
  });

  t.end();
});