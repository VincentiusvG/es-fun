const p = new Promise((r) => { 
  throw new Error ('arghhh');
});

p.catch(x => {throw x});