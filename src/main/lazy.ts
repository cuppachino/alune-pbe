// import type { DeepMergeAllRight, UnionToTuple } from '@cuppachino/type-space'

// /**
//  * Map a union of [K, V] entries to a single type.
//  * Entries are deeply merged from left to right.
//  */
// export type DeepMergeUnionEntries<T> = DeepMergeAllRight<
//   Extract<
//     UnionToTuple<T> extends infer U
//       ? {
//           [K in keyof U]: U[K] extends [infer A extends PropertyKey, infer B]
//             ? { [K in A]: B }
//             : never
//         }
//       : never,
//     any[] | readonly any[]
//   >
// >

type UnwrapFunctions<T> = {
  [K in keyof T]: T[K] extends () => infer U ? U : T[K]
} & {}

// // export function createLazyObject<T extends [A, B], const A extends string, B extends () => any>(
// //   ...fns: T[]
// // ): UnwrapFunctions<DeepMergeUnionEntries<T>> {
// //   return fns.reduce(
// //     (acc, [name, fn]) => {
// //       lazy(acc, name, fn)
// //       return acc
// //     },
// //     {} as UnwrapFunctions<DeepMergeUnionEntries<T>>
// //   )
// // }

type Prettify<T> = { [k in keyof T]: T[k] & {} }
type Entry = [string, () => unknown]
type EntryTupleToObj<T extends Entry[], obj = {}> = T extends [
  infer first extends Entry,
  ...infer rest extends Entry[]
]
  ? EntryTupleToObj<rest, obj & { [k in first[0]]: first[1] }>
  : Prettify<obj>

export function createLazyObject<
  A extends string,
  T extends [[A, () => object], ...[A, () => object][]]
>(...fns: T): UnwrapFunctions<EntryTupleToObj<T>> {
  return fns.reduce(
    (acc, [name, fn]) => {
      lazy(acc, name, fn as any)
      return acc
    },
    {} as UnwrapFunctions<EntryTupleToObj<T>>
  )
}

/**
 * Lazily initialize a property on an object.
 */
export function lazy<T extends Record<string, any>>(target: T, key: string, fn: () => T[keyof T]) {
  let defined = false
  Object.defineProperty(target, key, {
    get: function () {
      if (!defined) {
        defined = true
        Object.defineProperty(target, key, {
          configurable: true,
          enumerable: true,
          writable: true,
          value: fn.apply(target)
        })
        return target[key]
      }
    },
    configurable: true,
    enumerable: true
  })
}
