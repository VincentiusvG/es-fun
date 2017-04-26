const test = require('tape-catch');
const { esfun } = require('../src/es-fun.js');

const { TypedUnion } = esfun.union('TypedUnion', Number).create();
                                          

test('Create union type of correct type', function (t) {
  t.doesNotThrow(() => {
    try {
      const number3 = TypedUnion(3);
    } catch (ex) {
      console.log(ex);
    }
  });
  t.end();
});

test('Create union type of incorrect type', function (t) {
  t.throws(() => {
    const number3 = TypedUnion('this is not a number');
  });
  t.end();
});