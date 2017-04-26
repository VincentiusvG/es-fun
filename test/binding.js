const test = require('tape-catch');
const { esfun, curry, _, Just, Ok, Err } = require('../src/es-fun.js');

divide = curry((a, b) =>
  b == 0 ? Err(Error('Division by zero in function divide'))
         : Ok(a/b)
);

test('Union type binding', function (t) {
  let ok24 = Ok(24); 

  let ok12 = ok24.bind(divide(_, 2));
  t.true(ok12.isOfType(Ok), 'Binding function for normal input returning lifted result');

  let outerValue;
  ok12.bind(function ( v ) {
    outerValue = v;
  });
  t.equal(outerValue, 12, 'Binding function should have correct result');

  let err = ok24.bind(divide(_, 0));
  t.true(err.isOfType(Err), 'Binding with error');
  
  t.end()
});

test('Union type binding into other functor type', function (t) {
  let just24 = Just(24);

  let ok12 = just24.bind(divide(_, 2));
  t.true(ok12.isOfType(Ok), 'Binding function on Maybe which returns a Result should return a Result');

  t.end()
});

test('Union type binding over multiple parameters', function (t) {
  let { Multi } = esfun.union('Multi', 'val1', 'val2', 'val3').create();

  const multi = Multi(2, 3, 4);
  //map on multi value union should map on array of the values 
  //and return an array of result values
  //add one to all items in arra, return array of values
  multiPlus1 = multi.bind( ([a, b, c]) => Multi(a + 1, b + 1, c + 1) );
  multiPlus1.return( (vv) => {
    t.deepEqual(vv, [3, 4, 5], 'Binding on multiple parameters should also have correct result');
  });

  t.end();
});

