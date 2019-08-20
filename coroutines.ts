
/**
 * A container for running coroutines.
 * 
 * @remarks this might be renamed "Timeline" in the future  
 * 
 */
export class Coroutines {
    private coroutines : Iterator<any>[] = []
    
    /**
     * Set to `false` to exit a [[startTicking]] loop
     */
    public active = true

    /**
     * For debugging
     */
    public readonly name : string;
    
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
     * let coro = new Coroutines()
     * coro.start(coroutineFunction()) // this works
     * coro.start(coroutineFunction)   // so does this
     * ```
     * 
     * @param coro coroutine to start
     */
    public start(coro:Iterator<any>|(()=>Iterator<any>)) {
        let c = "next" in coro ? coro : coro();
        this.coroutines.push(c)
        return c
    }

    /**
     * Stops a single coroutine
     * 
     * @param coro coroutine to stop
     */
    public stop(coro: Iterator<any>) {
        this.coroutines.splice(this.coroutines.indexOf(coro), 1)
    }

    /**
     * Discards all scheduled coroutines
     */
    public stopAll() {
        this.coroutines = []
    }

    /**
     * Runs all scheduled coroutines once.
     * 
     * Each coroutine added with [[start]] will run up to its next `yield` statement. Finished coroutines are removed
     * from the collection.
     */
    public tick() {
        let toRemove = []
        for(const coro of this.coroutines) {
            let result = coro.next()
            if(result.done) {
                toRemove.push(coro)
            }
      }
      for (const x of toRemove) {
        this.coroutines.splice(this.coroutines.indexOf(x), 1)
      }
    }

    /**
     * Start running coroutines every frame.
     * 
     * Calls [[tick]] every "frame" as long as [[active]] is true.
     * 
     * The meaning of "a frame" depends on the scheduling function. In a browser, requestAnimationFrame is the default 
     * and a frame happens every 1/60 seconds or 16.6ms or 60Hz. In node, process.nextTick is the default and a frame
     * happens every iteration of the event loop, which is typically much faster than 1/60 seconds. Coroutines that
     * measure physical time are not affected by this difference.
     * 
     * @param scheduleFunction defaults to
     * [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
     * in a browser and [setImmediate](https://developer.mozilla.org/en-US/docs/Web/API/Window/setImmediate) otherwise.
     */
    public startTicking(scheduleFunction:Function=_scheduleFunction) {
        let runCoroutines = () => {
            this.tick()
            if(this.active)
                scheduleFunction(runCoroutines)
        }
        runCoroutines()
    }
}
/**
 * @hidden until typedoc can check "only exported" by default
 */
let generateNewName = () => Math.random().toString(36).replace("0.", "Coroutines.")

/**
 * @hidden until typedoc can check "only exported" by default
 */
let _scheduleFunction = typeof window === "undefined" ? setImmediate : requestAnimationFrame

if(typeof window === "undefined") {
    global["performance"] = require("perf_hooks").performance;
}

/**
 * @hidden until typedoc can check "only exported" by default
 */
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
export function* wait(seconds: number, clock = _clock) {
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
export function* waitFrames(n: number) {
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
export function* waitUntil(f: () => boolean) {
    while(!f()) {
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
export function* waitWhile(f: () => boolean) {
    while(f()) {
        yield;
    }
}

/**
 * Animate a parameter.
 * 
 * @category Coroutine
 * 
 * 
 * @param obj The object to mutate
 * @param prop The property on `obj` to mutate
 * @param to The final value of `obj.prop`
 * @param map A function to shape the animation curve. Given a value between 0 and 1 returns a value between 0 and 1. Defaults to the identity function (no shaping).
 * @param map.x A value between 0 and 1
 * @param clock The clock function used to measure time. Defaults to the function set by [[setClock]]
 * @param interpolate Interpolating function. Given values `a` and `b` returns their interpolated value at `t`, a number between 0 and 1. Defaults to linear interpolation.
 * @param interpolate.a The starting value
 * @param interpolate.b The final value
 * @param interpolate.t The interpolation value, a number between 0 and 1
 * @todo needs way to specify animation speed or time
 * @see [[setClock]]
 */
export function* animate(obj: any, prop: string, to:any, { clock = _clock, map = (x:number) => x, interpolate = (a:any, b:any, t:number) => b * t + a * (1 - t) } ) {
    let from = obj[prop];
    let t = 0
    let lastTime = clock()
    while(t < 1) {
        let nowTime = clock()
        let delta = nowTime - lastTime
        lastTime = nowTime
        obj[prop] = interpolate(from, to, map(t))
        t += delta
        yield;
    }
}