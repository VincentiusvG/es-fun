const test = require('blue-tape');
const { esfun, Ok } = require('../src/es-fun.js');
const { NumberUnion, DateUnion, UnionError } = esfun.union('NumberUnion', Number).onError(e => UnionError(e) )
                                        .union('DateUnion', Date).onError(e => UnionError(e) )
                                        .union('UnionError', Error)
                                        .create();

test('Promise as single value union type', function (t) {
  
  const p = new Promise(function(resolve){
    setTimeout(()=> resolve(3));
  });

  const aPromiseOf3 = Ok(p);
  let outerVal;

  aPromiseOf4 = aPromiseOf3.map( (v) => v + 1 );

  aPromiseOf4.map( (v) => {
    t.equal(v, 4, 'The promise of 3 added by one shoud be 4');
    return v;
  });

  return p;
});

test('Promise in a multi value union type', function (t) {
  const p = new Promise(function(resolve){
    setTimeout(()=> resolve(3));
  });

  let MultiUnion = esfun
  .union('Multi', 'val1', 'val2', 'val3').onError(() => MultiUnion.Err)
  .union('Err', Error)
  .create();

  const multi = MultiUnion.Multi(2, p, 4);
  //map on multi value union should map on array of the values 
  //and return an array of result values
  //add one to all items in arra, return array of values
  multiPlus1 = multi.map( (vv) => vv.map((v) => v + 1));

  multiPlus1.map( (vv) => {
    t.deepEqual(vv, [3, 4, 5], 'Multiple parameters including a promise should also have correct result');
    return vv;
  });

  return p;
});

test('Binding on single value union type with promise', function (t) {
  
  const p = new Promise(function(resolve){
    setTimeout(()=> resolve(3));
  });

  const aPromiseOf3 = Ok(p);

  aPromiseOf4 = aPromiseOf3.bind( (v) => Ok(v + 1) );

  aPromiseOf4.return( (v) => {
    t.equal(v, 4, 'Binding on the Just of a promise shoud return a promise of a Just result');
  });

  return p;
});

test('Binding on multi value union type with promise', function (t) {
  const p = new Promise(function(resolve){
    setTimeout(()=> resolve(3));
  });

  let { Multi, Err } = esfun
  .union('Multi', 'val1', 'val2', 'val3').onError(() => MultiUnion.Err)
  .union('Err', Error)
  .create();

  const multi = Multi(2, p, 4);

  const multiPlus1 = multi.bind( ( [ a, b, c ] ) => Multi(a+1, b+1, c+1) );
  multiPlus1.return( (vv) => {
    t.deepEqual(vv, [3, 4, 5], 'Binding on a multi param union shoud return a multi param union');
  });

  return p;
});

test('Promise a typed result', function (t) {
  const p = new Promise(function(resolve){
    setTimeout(()=> resolve(3));
  });

  const number3 = NumberUnion(p);
  number3.return(v => t.equal(v, 3, 'Promising a typed result shoud return a uniontype wrapping the correctly typed value'))

  return p;
});

test('Mapping over a promise of a typed result', function (t) {
  const p = new Promise(function(resolve){
    setTimeout(()=> resolve(3));
  });

  const errSituation = DateUnion(p);
  
  errSituation.map(() => t.fail('Should be an err type and this should not map'))

  return p;
});

test('Returning on a promise of a typed result', function (t) {
  const p = new Promise(function(resolve){
    setTimeout(()=> resolve(3));
  });

  const errSituation = DateUnion(p);
  errSituation.return(() => t.fail('Returning over the promise of an incorrect type should throw on resolving promise'));

  return p;
});