const test = require('tape-catch');
const { esfun } = require('../src/es-fun.js');

//fefine initial type
const TestMaybe = esfun.union('TestJust', 'value')
                       .union('TestNothing')
                       .create();

test('Union type creation', function (t) {

  t.true(TestMaybe !== undefined, 'Union type object created');
  t.true(TestMaybe.TestJust instanceof Function, 'Just constructor created');
  t.true(TestMaybe.TestNothing instanceof Function, 'Nothing constructor created');

  t.end();
});

test('Union type construction', function (t) {
  const TestOther = esfun.union('TestOtherFirst', 'value')
                         .union('TestOtherSecond')
                         .create();
  const justInstance = TestMaybe.TestJust(3);
  const nothingInstance = TestMaybe.TestNothing();

  t.true(justInstance.isOfType(TestMaybe), 'TestMaybe instance of main type');
  t.true(justInstance.isOfType(TestMaybe.TestJust), 'TestMaybe instance of union type');
  
  t.false(justInstance.isOfType(TestMaybe.TestNothing), 'TestMaybe not an instance of TestNothing');
  t.false(justInstance.isOfType(TestOther), 'TestMaybe not an instance of TestNothing');
  t.false(justInstance.isOfType(TestOther.TestOtherFirst), 'TestMaybe not an instance of TestNothing');

  t.true(nothingInstance.isOfType(TestMaybe), 'TestNothing instance of main type');
  t.true(nothingInstance.isOfType(TestMaybe.TestNothing), 'TestNothing instance of union type');
  t.false(nothingInstance.isOfType(TestMaybe.TestJust), 'TestNothing not an instance of TestMaybe');

  t.end();
});

test('Union type error fallback', function (t) {
  TestMaybe.TestJust.onErrorValue(() => TestMaybe.TestNothing());

  const undefinedInstance = TestMaybe.TestJust(undefined);
  const nullInstance = TestMaybe.TestJust(null);

  t.true(undefinedInstance.isOfType(TestMaybe.TestNothing), 'Correct fallback of undefined error value');
  t.true(nullInstance.isOfType(TestMaybe.TestNothing), 'Correct fallback of null error value');

  t.end();
});

test('Union types can be global', function (t) {
  
  var GlobalType = esfun.union('IsGlobal').create(this); //create global
  var NotGlobalType = esfun.union('NotGlobal').create(); //create global

  t.isEqual(this.IsGlobal, GlobalType.IsGlobal, 'Should also be created in the \'this\' context');
  t.isEqual(this.NotGlobal, undefined, 'Should not be created in the \'this\' context');

  t.end();
});

test('Union type should be unique', function (t) {
  t.throws(()=> {
    var ShouldFail = esfun.union('NotUnique')
                          .union('NotUnique')
                          .create();
  }, 'Creating non unique union combinations should throw error');

  t.end();
});

test('Union not unique in own scope', function (t) {
  var FirstOne = esfun.union('NotGlobalUnique', 'withvalue')
                      .union('AlsoNotGlobalUnique')
                      .create();
  
  t.doesNotThrow(()=> {
    var ShouldSucceed = esfun.union('NotGlobalUnique', 'withvalue')
                          .union('AlsoNotGlobalUnique')
                          .create();
  });

  t.end();
});

test('Unions must be unique in global scope', function (t) {
  const scope = this;
  var FirstOne = esfun.union('NotGlobalUnique', 'withvalue')
                      .union('AlsoNotGlobalUnique')
                      .create(scope);
  
  t.throws(()=> {
    var ShouldFail = esfun.union('NotGlobalUnique', 'withvalue')
                          .union('AlsoNotGlobalUnique')
                          .create(scope);
  }, 'Union type must not overwrite existing union type in scope');

  t.end();
});
