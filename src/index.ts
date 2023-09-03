export { createApp } from './app/createApp'
export { createComponent } from './app/createComponent'
export { toFragment } from './app/toFragment'
export { toJsonTemplate } from './app/toJsonTemplate'
export { addUnbinder } from './cleanup/addUnbinder'
export { getBindData } from './cleanup/getBindData'
export { removeNode } from './cleanup/removeNode'
export { unbind } from './cleanup/unbind'
export { computed } from './computed/computed'
export { computeMany } from './computed/computeMany'
export { computeRef } from './computed/computeRef'
export { watchEffect, silence, collectRefs } from './computed/watchEffect'
export { flatten } from './misc/flatten'
export { isRaw } from './misc/isRaw'
export { markRaw } from './misc/markRaw'
export { persist } from './misc/persist'
export { html, raw } from './misc/tagged-html'
export { observe } from './observer/observe'
export { observeMany } from './observer/observeMany'
export { observerCount } from './observer/observerCount'
export { batch, endBatch, startBatch } from './reactivity/batch'
export { isDeepRef } from './reactivity/isDeepRef'
export { isRef } from './reactivity/isRef'
export { pause } from './reactivity/pause'
export { ref } from './reactivity/ref'
export { resume } from './reactivity/resume'
export { sref } from './reactivity/sref'
export { trigger } from './reactivity/trigger'
export { unref } from './reactivity/unref'
export { entangle } from './reactivity/entangle'
export { useScope } from './composition/useScope'
export { onMounted } from './composition/onMounted'
export { onUnmounted } from './composition/onUnmounted'
export { warningHandler } from './log/warnings'
export { ComponentHead } from './app/ComponentHead'
export { RegorConfig } from './app/RegorConfig'

export type {
  SRef,
  Ref,
  RefContent,
  ComputedRef,
  ObserveCallback,
  StopObserving,
  AnyRef,
  IRegorContext,
  ParseResult,
  BindData,
  Unbinder,
  Component,
  Directive,
  FlattenRef,
  IsLazy,
  IsLazyKey,
  JSONTemplate,
  OnCleanup,
  OnMounted,
  OnUnmounted,
  TemplateOptions as Template,
  UnwrapRef,
} from './api/types'
