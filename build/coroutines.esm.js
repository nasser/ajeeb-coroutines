/**
 * A coroutine schedule.
 *
 * Coroutines are added to a schedule with [[add]] and all scheduled
 * coroutines are advanced with [[tick]].
 */
class Schedule {
    constructor(name = generateNewName()) {
        this.coroutines = [];
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
    add(coro) {
        let c = "next" in coro ? coro : coro();
        this.coroutines.push(c);
        return c;
    }
    /**
     * Stops a single coroutine
     *
     * @param coro coroutine to remove
     */
    remove(coro) {
        this.coroutines.splice(this.coroutines.indexOf(coro), 1);
    }
    /**
     * Discards all scheduled coroutines
     */
    removeAll() {
        this.coroutines = [];
    }
    /**
     * Advances all scheduled coroutines once.
     *
     * Each coroutine added with [[add]] will run up to its next `yield` statement. Finished coroutines are removed
     * from the collection.
     */
    tick() {
        let toRemove = [];
        for (const coro of this.coroutines) {
            let result = coro.next();
            if (result.done) {
                toRemove.push(coro);
            }
        }
        for (const x of toRemove) {
            this.coroutines.splice(this.coroutines.indexOf(x), 1);
        }
    }
}
let generateNewName = () => Math.random().toString(36).replace("0.", "Schedule.");
let _clock = () => Date.now() / 1000;
/**
 * Sets a new clock function.
 *
 * The clock function returns the elapsed application time in seconds. It is called by some coroutines to measure the
 * passage of time. defaults to `performance.now() / 1000`
 *
 * @param f New clock function
 */
function setClock(f) {
    _clock = f;
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
function* wait(seconds, clock = _clock) {
    let startTime = clock();
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
function* waitFrames(n) {
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
function* waitUntil(f) {
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
function* waitWhile(f) {
    while (f()) {
        yield;
    }
}
let advance = (c) => c.next();
let initialize = (c) => typeof c === "function" ? c() : c;
/**
 * Returns a coroutine that waits for every coroutine of `coros` to complete.
 *
 * @category Combinator
 * @param coros The coroutines to wait for
 */
function* waitAll(coros) {
    let coros_ = coros.map(initialize);
    let results = coros_.map(advance);
    while (results.filter(r => r.done).length !== coros_.length) {
        yield;
        for (var i = 0; i < coros_.length; i++) {
            let coro = coros_[i];
            let res = results[i];
            if (!res.done) {
                results[i] = advance(coro);
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
function* waitFirst(coros) {
    let coros_ = coros.map(initialize);
    while (true) {
        for (const c of coros_) {
            let res = c.next();
            if (res.done)
                return res.value;
        }
        yield;
    }
}

export { Schedule, setClock, wait, waitAll, waitFirst, waitFrames, waitUntil, waitWhile };
//# sourceMappingURL=coroutines.esm.js.map
