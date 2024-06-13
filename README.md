# Ajeeb Coroutines

Unity-inspired Coroutines for the browser and nodejs.

**All work has moved to the monorepo on sourcehut: https://git.sr.ht/~nasser/ajeeb**

Ajeeb Coroutines are a TypeScript implementation of [a similar idea][unicoro]
from [the Unity 3D engine][unity]. They use [ES6 generators][es6gen] to turn
code that *reads synchronously* into code that *runs across multiple frames*.
They were designed for the [Ajeeb Game Engine][ajeeb] but have no dependencies
and can be used anywhere.

## Installation

```
npm install nasser/ajeeb-coroutines
```

Or in a browser you can link to the CDN, using either legacy script tags

```html
<script src="https://cdn.jsdelivr.net/gh/nasser/ajeeb-coroutines@master/build/coroutines.iife.js"></script>
```

or ES6 modules

```html
<script type="module">
import * as coro from "https://cdn.jsdelivr.net/gh/nasser/ajeeb-coroutines@master/build/coroutines.esm.js"
</script>
```

## Usage

An instance of an ES6 generator is treated as [*a coroutine*][wikicoro]. An
instance of the [[Schedule]] class schedules and runs coroutines.

[[Schedule.add]] adds a couroutine to the collection. [[Schedule.tick]]
runs every coroutine in the collection up to their next [yield][yielddoc]
statement. Each coroutine remembers the last [yield][yielddoc] they reached, and
the next time [[Schedule.tick]] is called they resume execution from that
point.

```js
import { Schedule } from "ajeeb-coroutines"

let sched = new Schedule()

sched.add(function* () {
    console.log("hello")    // prints "hello"
    yield;                  // waits until next tick
    console.log("world")  
    console.log("how")      // prints "world" and "how"
    yield; yield;           // waits for two ticks
    console.log("are you?") // prints "are you?"
})

sched.tick()
// prints "hello"
sched.tick()
// prints "world"
// prints "how"
sched.tick()
// does nothing
sched.tick()
// prints "are you?"
// further calls to sched.tick() will do nothing
```

Coroutines are designed to run across multiple frames. [[tick]] can be scheduled
to run regularly [setInterval][si] or [requestAnimationFrame][raf] in a browser. 
This advances every coroutine in the collection automatically once per frame.
When scheduled like this, you can think of [yield][yielddoc] as a way of
"waiting one frame".

```js
import { Schedule } from "ajeeb-coroutines"

let sched = new Schedule()

sched.add(function* () {
    console.log("hello")    // prints "hello" and waits one frame
    yield;
    console.log("world")    // prints "world" and waits two frames
    yield; yield;
    console.log("how")      // prints "how" and waits three frames
    yield; yield; yield;
    console.log("are")      // prints "are" and waits four frames
    yield; yield; yield; yield;
    console.log("you?")     // prints "you?"
})

setInterval(() => sched.tick(), 1000 / 60) // tick 60 times a second
```

Generators are normal JavaScript functions. They have access to local variables,
closures, arguments, and more. [yield][yielddoc] can appear anywhere.

```js
import { Schedule } from "ajeeb-coroutines"

let sched = new Schedule()

function* hello(repeat) {
    console.log("hello")    // prints "hello" and waits one frame
    yield;
    for(let i=0; i<repeat; i++) { 
        console.log("world")    // prints "world" and wait one frame
        yield;                  // execution will resume from this point 
    }
    console.log("!")     // prints "!"
}

sched.add(hello)

setInterval(() => sched.tick(), 1000 / 60) // tick 60 times a second
```

This library also exports a number of generically useful coroutines, like [[wait]],
that can be combined with your own in powerful ways. A coroutine can be made to
wait for another coroutine with the [yield*][yieldstar] statement. If
[yield][yielddoc] is read as "wait one frame" [yield*][yieldstar] is read as
"wait until this other coroutine completes"

```js
import { Schedule, wait } from "ajeeb-coroutines"

let sched = new Schedule()

// schedule coroutines to tick every frame
// in the browser
function runCoroutines() {
    requestAnimationFrame( runCoroutines )
    sched.tick()
}
runCoroutines()

// in node
setInterval(() => sched.tick(), 1000/60)

// you can add coroutines afterwards
sched.add(function* () {
    console.log("hello")  // prints "hello"
    yield* wait(2)        // wait for 2 seconds
    console.log("world")  // prints "world"
    yield* wait(3)        // waits 3 seconds
    console.log("!!!")    // prints "!!!"
})

// prints "hello" immediately 
// waits 2 seconds
// prints "world" 
// waits 3 seconds
// prints "!!!" 
```

Coroutines can be treated as normal functions. They take arguments, and can be as complex as needed.

```js
import fs from "fs"
import { Schedule, waitUntil } from "ajeeb-coroutines"

let sched = new Schedule()

function* waitForFile(path) {
    console.log("waiting for", path);
    yield* waitUntil(() => fs.existsSync(path))
    console.log("ok");
}

sched.add(waitForFile("nice.txt"))

// in the browser
function runCoroutines() {
    requestAnimationFrame( runCoroutines )
    sched.tick()
}
runCoroutines()

// in node
setInterval(() => sched.tick(), 1000/60)
```

[es6gen]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator
[ajeeb]: http://ajeeb.games
[yieldstar]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*
[yielddoc]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield
[unity]: https://www.unity3d.com/
[unicoro]: https://docs.unity3d.com/Manual/Coroutines.html
[wikicoro]: https://en.wikipedia.org/wiki/Coroutine
[raf]: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
[si]: https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setInterval
