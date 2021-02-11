
/**
 * A Coroutine is a regular [ES6 Generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator)
 * returned by a [generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*).
 * 
 * ```typescript
 * function* simpleCoroutine() {
 *   console.log('hello')
 *   yield
 *   console.log('world')
 * }
 * 
 * let coro : Coroutine = simpleCoroutine()
 * ```
 */
export type Coroutine = Generator<any>

/**
 * Some functions accept either a [[Coroutine]] or a function that can be called
 * with no arguments to produce a [[Coroutine]]. This enables passing `function*`
 * in addition to instantiated [[Coroutine]]s.
 * 
 * ```js
 * function* namedCoroutine() { ... }
 * const sched = new coro.Schedule()
 * // invoking namedCoroutine produces a Coroutine instance
 * sched.add(namedCoroutine())
 * // function* literal is not a Coroutine instance, but can
 * // be invoked to produce one. It is a CoroutineOrFunction.
 * sched.add(function* () { ... })
 * ```
 */
export type CoroutineOrFunction = Coroutine | ((...any) => Coroutine)

/**
 * A coroutine schedule.
 * 
 * Coroutines are added to a schedule with [[add]] and all scheduled
 * coroutines are advanced with [[tick]].
 */
export class Schedule {
    private coroutines: Coroutine[] = []
    /**
     * For debugging
     */
    public readonly name: string;

    constructor(name = generateNewName()) {
        this.name = name;
    }

    /**
     * Schedules a coroutine for evaluation.
     * 
     * Future calls to [[tick]] will run `coro` up to its next `yield` until it is completed.
     * 
     * As a convenience if `coro` is a generator function and not a generator, it will be evaluated to produce a generator.
     * 
     * ```js
     * function* coroutineFunction() { ... }
     * let schedule = new Schedule()
     * schedule.add(coroutineFunction()) // this works
     * schedule.add(coroutineFunction)   // so does this
     * ```
     * 
     * @param coro coroutine to add
     */
    public add(coro: CoroutineOrFunction) {
        let c = "next" in coro ? coro : coro();
        this.coroutines.push(c)
        return c
    }

    /**
     * Stops a single coroutine
     * 
     * @param coro coroutine to remove
     */
    public remove(coro: Coroutine) {
        this.coroutines.splice(this.coroutines.indexOf(coro), 1)
    }

    /**
     * Discards all scheduled coroutines
     */
    public removeAll() {
        this.coroutines = []
    }

    /**
     * Advances all scheduled coroutines once.
     * 
     * Each coroutine added with [[add]] will run up to its next `yield` statement. Finished coroutines are removed
     * from the collection.
     */
    public tick() {
        let toRemove = []
        for (const coro of this.coroutines) {
            let result = coro.next()
            if (result.done) {
                toRemove.push(coro)
            }
        }
        for (const x of toRemove) {
            this.coroutines.splice(this.coroutines.indexOf(x), 1)
        }
    }
}

let generateNewName = () => Math.random().toString(36).replace("0.", "Schedule.")

if (typeof window === "undefined") {
    global["performance"] = require("perf_hooks").performance;
}

let _clock = () => performance.now() / 1000

/**
 * Sets a new clock function.
 * 
 * The clock function returns the elapsed application time in seconds. It is called by some coroutines to measure the
 * passage of time. defaults to `performance.now() / 1000`
 *
 * @param f New clock function
 */
export function setClock(f: () => number) {
    _clock = f
}

/**
 * Wait for a number of seconds.
 * 
 * @category Coroutine
 * 
 * @param seconds How many seconds to wait
 * @param clock A function that returns the elapsed application time in seconds, defaults to the function assigned by [[setClock]]
 * @see [[setClock]]
 */
export function* wait(seconds: number, clock = _clock): Coroutine {
    let startTime = clock()
    while (clock() - startTime < seconds) {
        yield;
    }
}

/**
 * Wait for a number of frames.
 * 
 * @category Coroutine
 * 
 * @param n How many frames to wait
 */
export function* waitFrames(n: number): Coroutine {
    while (n-- > 0) {
        yield;
    }
}

/**
 * Wait until a function `f` returns true.
 * 
 * @category Coroutine
 * 
 * @param f A function to execute every frame. When `f` returns truthy this coroutine completes.
 */
export function* waitUntil(f: (...any) => boolean): Coroutine {
    while (!f()) {
        yield;
    }
}

/**
 * Wait while a function `f` returns true.
 * 
 * @category Coroutine
 * 
 * @param f A function to execute every frame. When `f` returns falsey this coroutine completes.
 */
export function* waitWhile(f: (...any) => boolean): Coroutine {
    while (f()) {
        yield;
    }
}

let advance = (c: Coroutine) => c.next()

let initialize = (c: CoroutineOrFunction) => typeof c === "function" ? c() : c

/**
 * Returns a coroutine that waits for every coroutine of `coros` to complete.
 * 
 * @category Combinator
 * @param coros The coroutines to wait for
 */
export function* waitAll(coros: CoroutineOrFunction[]): Coroutine {
    let coros_ = coros.map(initialize)
    let results = coros_.map(advance)
    while (results.filter(r => r.done).length !== coros_.length) {
        yield;
        for (var i = 0; i < coros_.length; i++) {
            let coro = coros_[i]
            let res = results[i]
            if (!res.done) {
                results[i] = advance(coro)
            }
        }
    }
}

/**
 * Returns a coroutine that waits for the first coroutine of `coros` to complete.
 * 
 * @category Combinator
 * @param coros The coroutines to wait for
 * @returns When complete, returns the value returned by the first completed coroutine in `coros`.
 */
export function* waitFirst(coros: CoroutineOrFunction[]): Coroutine {
    let coros_ = coros.map(initialize)
    while (true) {
        for (const c of coros_) {
            let res = c.next()
            if (res.done)
                return res.value;
        }
        yield
    }
}