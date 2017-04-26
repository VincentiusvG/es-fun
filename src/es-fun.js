esfun = (function(global){

  //return available functions after piping a value
  function pipeBuilder(fn, value) {
    return {
      //log the intermediate result
      //and return the same value
      log(message) {
        return pipeBuilder((v) => { 
          console.log(message, v);
          return v;
        }, fn(value))
      },
      //pipe another function to the chain
      pipe(newFn) {
        return pipeBuilder(newFn, fn(value))
      },
      //bind another function to the chain
      //lift the value, expect an already lifted result
      bind(newFn) {
        return pipeBuilder((v) => v.bind(newFn), fn(value))
      },
      //get the result of all pipes
      result() {
        return fn(value)
      }
    }
  }
  //esfun is our main object. 
  esfun = function(value){
    const expressionBuilder = {
      when() { return expressionBuilder; },
      match() { return undefined; },
      pipe(fn) { return pipeBuilder(fn, value) }
    }
    return expressionBuilder;
  };

  //enable function prettyprint when outputting to the console
  //this should make it easier to debug curried functions
  function prettyPrintFn (fn, name, ...args) {
    fn.toString = () => `${name||'fn'} ( ${args.join(', ')} )`
    return fn
  }

  //enable curry, union and _ as global so they can be used without the esfun.___
  //usage: curry(fn) instead of esfun.curry(fn)
  //       fn(a, _, c) instead of fn(a, esfun._, c)
  //       union('MyUnion').create() instead of esfun.union('MyUnion').create()
  function curry (fn, ...initialArgs) {
    const paramProvided = (a => a !== esfun._);
    //return function to get more args
    return prettyPrintFn( function curriedFn(...curriedArgs){
      const newFn = function (...remainingArgs) {
        curriedArgs = curriedArgs.map(function(a){
          if(a === esfun._){
            a = remainingArgs[0];
            remainingArgs[0] = esfun._;
          }
          return a;
        });
        return curriedFn(...curriedArgs,...remainingArgs.filter(paramProvided)) 
      };
      return initialArgs.length + curriedArgs.filter(paramProvided).length < fn.length
        //call curriedFn with all args curried so far to get more
        ? prettyPrintFn(newFn, fn.name, ...curriedArgs)
        //call stored function with all args
        : fn(...initialArgs, ...curriedArgs)
    }, fn.name, ...initialArgs)
  }

  //create instance pf type <unionType> of <basetype> 
  //created as const <baseType> = esfun.union('<unionType>', ...args).create()
  function instanceCreator( baseType, unionType, ...args ) {
    //this instance is the return value of instanceCreator
    //create const so it can be referenced from instance methods
    const instance = Object.freeze({
      //we allow to check if current instance is of union type or of target type <- todo: add consistent name for naming and comment
      isOfType(type) {
        return type === baseType || type === unionType.public;
      },
      //binding function to type.
      //when only one argument, use the argument for calling fn
      //when more arguments, call fn with array
      //allways assume result will return another functor
      bind( fn ) {
        try {
          const [ first, ...rest ] = args;
          if(args.some(a => a instanceof Promise)) {
            //we get a promise of a unionType and have to return a promise of its values
            const pResult = new Promise((resolve) => {
              promiseOfValues = (rest.length > 0  ? Promise.all(args) : first  ).then((r) => {
                fn(r).return((v) => resolve(v));
              })
            });
            return unionType.public(pResult.catch(err => unionType.convertOnError(err)));
          } else {
            return fn(rest.length ? args : first);
          }
        } catch (err) {
          return unionType.convertOnError(err);
        }
      },
      //map function over instance value.
      //when only one argument, use the argument for calling fn, expect one result.
      //when more arguments, call fn with array, expect array result
      map( fn ) {
        if(unionType.isErrorType || unionType.isEmptyType)
          return instance;
        try {
          const [ first, ...rest ] = args;
          if(args.some(a => a instanceof Promise)) {
            return unionType.public(
              ( rest.length > 0  ? Promise.all(args) : first  )
              .then((v) => { unionType.checkArgs(rest.length ? v : [v]); return v;})
              .then(fn)
              .catch(err => unionType.convertOnError(err))
            );
          }
          else {
            const result = fn(rest.length > 0 ? args : first);
            const returnArgs = rest.length > 0 ? result : [ result ];
            return unionType.public(...returnArgs||[]);
          }
        } catch (err) {
          return unionType.convertOnError(err);
        }
      },
      //lift fn to be able to use the values
      return( fn ) {
        //map without returning new instance
        instance.map(fn);
      },
    });
    return instance;
  }

  //check if value is of a constructor type
  //value types like string and number won'nt match on instanceof
  function isTypeOf(value, constructor) {
    switch(typeof value) {
      case 'number': return constructor === Number;
      case 'string': return constructor === String;
      default: return value instanceof constructor;
    }
  }
  //When argument is not a pomise and the defined argument is a function (eg type)
  //check if argument is instance of the defined argument
  const checkArgs = curry(function checkArgs(unionType, definedArgs, actualArgs) {
    definedArgs
    .map((definedArg, index) => ({ defined: definedArg, actual: actualArgs[index] }))
    .filter( ( { defined } ) => defined instanceof Function )
    .forEach( ( { defined, actual } ) => {
      if(!(actual instanceof Promise) && !(isTypeOf(actual, defined))) {
        throw new Error(`Expected value '${actual}' to be of type ${defined.name}`);                   
      }
    });
    if(!unionType.convertOnError && actualArgs.some(a => a instanceof Promise)){
      throw new Error(`Union type ${unionType.typeName} can only reveive promise when an onError union conversion function is defined for the type`);
    }
    //return actualArgs to enable function chaining
    return actualArgs;
  });

  //Add union type with name <typeName> to target typeObject
  function union( typeObject, typeName, createdTypes, ...typeArgs ) {
    //create public constructor function to create objects of type <typeName>
    const unionType = {
      typeName,
      convertOnErrorValue: undefined,
      convertOnError: undefined,
      isErrorType: typeArgs.length === 1 && typeArgs[0] === Error,
      isEmptyType: typeArgs.length === 0,
      public: function (...args) { 
        checkArgs(unionType, typeArgs, args)
        if(unionType.convertOnErrorValue && !args.every(a => a !== null && a !== undefined)) {
          return unionType.convertOnErrorValue(...args);
        } else {
          return instanceCreator(typeObject, unionType, ...args);
        }
      }, 
    };

    //enable to check initial or mapped arguments
    unionType.checkArgs = checkArgs(unionType, typeArgs);
    //set properties
    //on error value we may need to convert to other union type
    unionType.public.onErrorValue = function(fn) {
      unionType.convertOnErrorValue = fn;
    };
    //on error value we may need to convert to an error union type containing the error
    unionType.public.onError = function(fn) {
      unionType.convertOnError = fn;
    };
    //Assign unionType to allow TargetType.TypeName
    typeObject[typeName] = Object.freeze(unionType.public);
    //append type to createdTypes list
    createdTypes.push(unionType);
    //return union builder to create TargetType or add other union option
    return unionBuilder(typeObject, createdTypes); 
  }

  //return object to add another union option 
  //or return the target type object we have created
  function unionBuilder( typeObject, createdTypes ) {
    const builder = Object.freeze({
      union( typeName, ...typeArgs ) {
        if(createdTypes.some(t => t.typeName === typeName)){
          throw new Error(`his union already contains a type with name ${typeName}.`);
        }
        return union(typeObject, typeName, createdTypes, ...typeArgs);
      },
      //on error value handles undefined and null values
      //They may or should lead to specific null value union type
      onErrorValue(fn) {
        createdTypes[createdTypes.length-1].public.onErrorValue(fn);
        return builder;
      },
      //on error value handles undefined and null values
      //They can lead to specific error union type
      onError(fn){
        createdTypes[createdTypes.length-1].public.onError(fn);
        return builder;
      },
      //create the container type after declaring all contained union types
      //todo: use correct term for container type
      create(scope) {
        if(scope) {
          createdTypes.forEach((t) => {
            if(scope[t.typeName] !== undefined) {
              throw new Error(`Name ${t.name} already defined in creation scope.`);
            }
            scope[t.typeName] = t.public;
          });
        }
        return typeObject; 
      }
    });
    return builder;
  }

  //enable union type
  esfun.union = function( typeName, ...typeArgs ) { 
    //create union type base
    const typeObject = function() { return typeObject };
    //build or create union
    return union(typeObject, typeName, [], ...typeArgs);
  };
  //enable binding functions to union types
  esfun.bind = curry(function( fn, item ) { 
    if(item.bind && item.bind instanceof Function) {
      return item.bind(fn);
    } else {
      throw new Error(`unable to bind function ${fn.name || 'provided'}`)
    }
  });
  //enable mapping functions to union types
  esfun.map = curry(function( fn, item ) { 
    if(item.map && item.map instanceof Function) {
      return item.map(fn);
    } else {
      throw new Error(`unable to map function ${fn.name || 'provided'}`)
    }
  });
  //enable underscore
  esfun._ = Symbol('es-fun underscore');
  //enable curry function
  esfun.curry = curry;
  //predefine identity, maybe and result types
  esfun.union('Identity', 'value').create(esfun)
  esfun.Maybe  = esfun.union('Just', 'value').onErrorValue(() => esfun.Nothing())
                      .union('Nothing').create(esfun);
  esfun.Result = esfun.union('Ok', 'value').onError((err) => esfun.Err(err))
                      .union('Err', Error).create(esfun);

  //freeze esfun
  Object.freeze(esfun);

  //whenever we can, we make esfun a global object
  //yeah, we are important! :)
  if(global && !global.esfun) {
    global.esfun = esfun;
  }

  //return to global scope
  return esfun

})(this);

//when in context of node.js, export as node module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    esfun,
    _: esfun._,
    curry: esfun.curry,
    map: esfun.map,
    Just: esfun.Maybe.Just,
    Nothing: esfun.Maybe.Nothing, 
    Ok: esfun.Result.Ok,
    Err: esfun.Result.Err, 
  };
}