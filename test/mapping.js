const test = require('tape-catch');
const { esfun, Just, Nothing } = require('../src/es-fun.js');

test('Union type mapping', function (t) {
  Just.onErrorValue(() => Nothing());

  const justInstance = Just(3);

  //map add one
  const mappedInstance = justInstance.map((a) => a + 1);
  mappedInstance.return((a) => {
    t.equal(a, 4, 'Mapping a function over a unionType should return a unionType with the function result');
  });

  //map to null
  const nullInstance = justInstance.map(() => null);
  //test value to be nothing
  t.true(nullInstance.isOfType(Nothing), 'Correct fallback to TestNothing for mapping to null');

  t.end();
});

test('Union type mapping over multiple parameters', function (t) {
  let MultiUnion = esfun.union('Multi', 'val1', 'val2', 'val3').create();

  const multi = MultiUnion.Multi(2, 3, 4);
  //map on multi value union should map on array of the values 
  //and return an array of result values
  //add one to all items in arra, return array of values
  multiPlus1 = multi.map( (vv) => vv.map((v) => v + 1));
  multiPlus1.return( (vv) => {
    t.deepEqual(vv, [3, 4, 5], 'Multiple parameters should also have correct result');
  });

  t.end();
});
