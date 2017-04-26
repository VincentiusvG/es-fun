const test = require('tape-catch');
const { esfun, _ } = require('../src/es-fun.js');

const add4 = function add4(a, b, c, d) {
  return a + b + c + d;
};

const curriedAdd4 = esfun.curry(add4);

test('Partial application', function (t) {
  const partial = curriedAdd4('a', 'b', 'c');
  t.true(partial instanceof Function, 'Partial application should result in new function');
  t.end();
});

test('Full application', function (t) {
  t.true(curriedAdd4('a', 'b', 'c', 'd'), 'abcd', 'Full application should be possible');
  t.end();
});

test('Partially curried', function (t) {
  const partialCurried = esfun.curry(add4, 'a', 'b');
  t.equal(partialCurried('c', 'd'), 'abcd', 'Functions can be partially curried');
  t.end();
});

test('Result of complete call', function (t) {
  const partial = curriedAdd4('a', 'b');
  t.equal(partial('c', 'd'), 'abcd', 'Complete application should return result');
  const partialToo = partial('c');
  t.equal(partialToo('d'), 'abcd', 'Partial application can be applied more than once');
  t.end();
});

test('Too many parameters application', function (t) {
  const partial = curriedAdd4('a', 'b', 'c');
  t.equal(partial('d', 'e', 'f'), 'abcd', 'Partial application should result in new function');
  t.end();
});

test('Underscore to skip parameter', function (t) {
  const partial = curriedAdd4('a', esfun._, 'c', 'd');
  t.equal(partial('b'), 'abcd', 'Esfun underscore should not count as parameter');
  const fullPartial = curriedAdd4('a', 'b', 'c', esfun._);
  t.true(fullPartial instanceof Function, 'Esfun underscore as last parameter should return function');
  t.equal(fullPartial('d'), 'abcd', 'Esfun underscore as last parameter should work when last parameter is applied');
  t.end();
});
