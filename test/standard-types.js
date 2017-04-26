const test = require('tape-catch');
const { esfun, Ok, Err, Just, Nothing } = require('../src/es-fun.js');

test('Testing Ok and Err', function (t) {
  const ok3 = Ok(3);
  err3 = ok3.map((v) => { throw new Error('whoops') });
  t.true(err3.isOfType(Err), 'Mapping error throwing function on an Ok should return an Err ');

  err3.return((err) => t.true(err instanceof Error, 'Err should contain corresponding Error object'));

  t.throws(() => {
    const err = Err('should throw error');
  }, 'Not providing Err with an Error object should throw error');
  t.end();
});


test('Testing Maybe', function (t) {
  let just3 = Just(3);
  t.true(just3.isOfType(Just), 'Mapping error throwing function on an Ok should return an Err ');

  just4 = just3.map((value) => value + 1);
  t.true(just4.isOfType(Just), 'Mapping a just with a value should return a Just');

  nothing3 = just3.map((value) => undefined);
  t.true(nothing3.isOfType(Nothing), 'Mapping a just with an undefined should return a Nothing');

  t.end();
});
