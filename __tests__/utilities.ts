import * as coro from '../coroutines'

test('waitFrames', () => {
    let value = 0
    const sched = new coro.Schedule()
    sched.add(function* () { 
        value = 1
        yield* coro.waitFrames(4)
        value = 2
    })
    expect(value).toBe(0)
    sched.tick()
    expect(value).toBe(1)
    sched.tick()
    expect(value).toBe(1)
    sched.tick()
    expect(value).toBe(1)
    sched.tick()
    expect(value).toBe(1)
    sched.tick()
    expect(value).toBe(2)
})

test('waitUntil', () => {
    let value = 0
    let flag = false
    const sched = new coro.Schedule()
    sched.add(function* () { 
        value = 1
        yield* coro.waitUntil(_ => flag)
        value = 2
    })
    sched.tick()
    expect(value).toBe(1)
    sched.tick()
    expect(value).toBe(1)
    flag = true
    sched.tick()
    expect(value).toBe(2)
})

test('waitWhile', () => {
    let value = 0
    let flag = true
    const sched = new coro.Schedule()
    sched.add(function* () { 
        value = 1
        yield* coro.waitWhile(_ => flag)
        value = 2
    })
    sched.tick()
    expect(value).toBe(1)
    sched.tick()
    expect(value).toBe(1)
    flag = false
    sched.tick()
    expect(value).toBe(2)
})

test('waitAll coroutines runs in order', () => {
    let value = []
    const sched = new coro.Schedule()
    sched.add(coro.waitAll([
        function* () { value.push(1) },
        function* () { value.push(2) },
        function* () { value.push(3) }
    ]))
    sched.tick()
    expect(value).toStrictEqual([1, 2, 3])
})

test('waitAll coroutines are removed', () => {
    let value = []
    const sched = new coro.Schedule()
    sched.add(coro.waitAll([
        function* () { while(true) { value.push(1); yield } },
        function* () { value.push(2) },
        function* () { value.push(3) }
    ]))
    sched.tick()
    sched.tick()
    sched.tick()
    expect(value).toStrictEqual([1, 2, 3, 1, 1])
})

test('waitAll completes when all coroutines complete', () => {
    let value = []
    const sched = new coro.Schedule()
    const coros = 
    [
        function* () { for(let i=0; i<3; i++) { value.push(`A${i}`); yield } },
        function* () { for(let i=0; i<2; i++) { value.push(`B${i}`); yield } },
        function* () { for(let i=0; i<1; i++) { value.push(`C${i}`); yield } },
    ]

    sched.add(function* () {
        value.push('a')
        yield* coro.waitAll(coros)
        value.push('b')
    })

    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'B0', 'C0'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'B0', 'C0', 'A1', 'B1'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'B0', 'C0', 'A1', 'B1', 'A2'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'B0', 'C0', 'A1', 'B1', 'A2', 'b'])
})

test('for-of loop evaluates sequentially', () => {
    let value = []
    const sched = new coro.Schedule()
    const coros = 
    [
        function* () { for(let i=0; i<3; i++) { value.push(`A${i}`); yield } },
        function* () { for(let i=0; i<2; i++) { value.push(`B${i}`); yield } },
        function* () { for(let i=0; i<1; i++) { value.push(`C${i}`); yield } },
    ]

    sched.add(function* () {
        value.push('a')
        for (const c of coros)
            yield* c()
        value.push('b')
    })

    sched.tick()
    expect(value).toStrictEqual(['a', 'A0'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'A1'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'A1', 'A2'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'A1', 'A2', 'B0'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'A1', 'A2', 'B0', 'B1'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'A1', 'A2', 'B0', 'B1', 'C0'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'A1', 'A2', 'B0', 'B1', 'C0', 'b'])
})

test('waitFirst completes when first coroutine completes', () => {
    let value = []
    const sched = new coro.Schedule()
    const coros = 
    [
        function* () { for(let i=0; i<3; i++) { value.push(`A${i}`); yield } },
        function* () { for(let i=0; i<2; i++) { value.push(`B${i}`); yield } },
        function* () { for(let i=0; i<1; i++) { value.push(`C${i}`); yield } },
    ]

    sched.add(function* () {
        value.push('a')
        yield* coro.waitFirst(coros)
        value.push('b')
    })

    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'B0', 'C0'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'B0', 'C0', 'A1', 'B1', 'b'])
})

test('waitFirst coroutines evaluate in order', () => {
    let value = []
    const sched = new coro.Schedule()
    const coros = 
    [
        function* () { for(let i=0; i<1; i++) { value.push(`C${i}`); yield } },
        function* () { for(let i=0; i<2; i++) { value.push(`B${i}`); yield } },
        function* () { for(let i=0; i<3; i++) { value.push(`A${i}`); yield } },
    ]

    sched.add(function* () {
        value.push('a')
        yield* coro.waitFirst(coros)
        value.push('b')
    })

    sched.tick()
    expect(value).toStrictEqual(['a', 'C0', 'B0', 'A0'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'C0', 'B0', 'A0', 'b'])
})

test('waitFirst coroutines return values', () => {
    let value = []
    const sched = new coro.Schedule()
    const coros = 
    [
        function* () { for(let i=0; i<3; i++) { value.push(`A${i}`); yield } return 'AA' },
        function* () { for(let i=0; i<2; i++) { value.push(`B${i}`); yield } return 'BB' },
        function* () { for(let i=0; i<1; i++) { value.push(`C${i}`); yield } return 'CC' },
    ]

    sched.add(function* () {
        value.push('a')
        value.push(yield* coro.waitFirst(coros))
        value.push('b')
    })

    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'B0', 'C0'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'B0', 'C0', 'A1', 'B1', 'CC', 'b'])
})

test('waitFirst coroutines return values, order matters', () => {
    let value = []
    const sched = new coro.Schedule()
    const coros = 
    [
        function* () { for(let i=0; i<1; i++) { value.push(`C${i}`); yield } return 'CC' },
        function* () { for(let i=0; i<2; i++) { value.push(`B${i}`); yield } return 'BB' },
        function* () { for(let i=0; i<3; i++) { value.push(`A${i}`); yield } return 'AA' },
    ]

    sched.add(function* () {
        value.push('a')
        value.push(yield* coro.waitFirst(coros))
        value.push('b')
    })

    sched.tick()
    expect(value).toStrictEqual(['a', 'C0', 'B0', 'A0'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'C0', 'B0', 'A0', 'CC', 'b'])
})

test('time passes during wait', done => {
    const sched = new coro.Schedule()
    let interval
    sched.add(function* () {
        let start = process.hrtime.bigint()
        yield* coro.wait(1)
        let end = process.hrtime.bigint()
        expect(end - start).toBeGreaterThanOrEqual(1000000000)
        clearInterval(interval)
        done()
    })
    interval = setInterval(_ => sched.tick(), 200)
})