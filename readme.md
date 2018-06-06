A simple lambda calculus interpreter
---

I threw this together in an evening while reading *Types and Programming Languages* so that I see how the various expressions reduce one step at a time.

After installing, there are two entry point scripts:

    npm run reduce <file> - This performs set-by-step reductions and substitutions for all expressions in the passed file.  It renders each step.
    npm run evaluate <file> - This performs a single-step evaluation for all expressions in the pased file.  It renders only the fully evaluated results and performs a bit faster.

The language includes:

    lambdas:                λx. x
    variables:              y
    applications:           (λx. x) y
      or with arrow:        (x -> x) y
    assignments:            fn = λt. λf. t;

An example script file can be found at test/test.lc.  The file extension is irrelevant.

Building/install (Nothing installs outside repo folder)
---
1. clone the repo locally
2. npm install


Run tests
---
    npm test

Notes
---
The lambda notation makes use of the actual lambda greek character which makes it easier to read but more difficult to type.  Its code point U-03BB.  One can use the 
arrow notation for entry instead for input but any reduced expressions will be printed using the lambda character.