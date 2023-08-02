// import { Hexgate } from 'hexgate'

// let hexgate: Hexgate | null = null

// const log = (...args: any[]) => console.log(`[connection]`, ...args)

// import { Queue, QueueEvents, FlowProducer, Worker } from 'bullmq'

// const REDIS_CONNECTION = {
//   host: 'localhost',
//   port: 6379
// } as const

// const queue = new Queue('status', {
//   connection: REDIS_CONNECTION
// })

// const worker = new Worker('status', async (job) => {}, {
//   connection: REDIS_CONNECTION,
//   removeOnComplete: { count: 0 },
//   removeOnFail: { count: 0 }
// })

// worker.on('completed', (job) => {
//   log(`job ${job.id} completed`)
// })

// async function initJobs() {
//   await queue.add(
//     'check-connection',
//     {},
//     {
//       repeat: {
//         every: 2500
//       }
//     }
//   )
// }
