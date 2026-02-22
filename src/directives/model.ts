import {
  type AnyRef,
  type Directive,
  type ParseResult,
  type SRef,
  type Unbinder,
} from '../api/types'
import { isArray, isFunction, isSet, isString } from '../common/is-what'
import { looseEqual, looseIndexOf, looseToNumber } from '../common/looseEqual'
import { warning, WarningType } from '../log/warnings'
import { isRef } from '../reactivity/isRef'
import { pause } from '../reactivity/pause'
import { resume } from '../reactivity/resume'
import { trigger } from '../reactivity/trigger'

/**
 * @internal
 */
export const modelDirective: Directive = {
  onChange: (el: HTMLElement, values: any[]) => {
    updateDomElementValue(el, values[0])
  },
  onBind: (
    el: HTMLElement,
    parseResult: ParseResult,
    _expr: string,
    _option?: string,
    _dynamicOption?: ParseResult,
    flags?: string[],
  ): Unbinder => {
    return attachDOMChangeListener(el, parseResult, flags)
  },
}

const updateDomElementValue = (el: HTMLElement, value: any): void => {
  const isAnInput = isInput(el)
  if (isAnInput && isCheckBox(el)) {
    if (isArray(value)) {
      value = looseIndexOf(value, getValue(el)) > -1
    } else if (isSet(value)) {
      value = value.has(getValue(el))
    } else {
      value = getCheckboxChecked(el, value)
    }
    el.checked = value
  } else if (isAnInput && isRadio(el)) {
    el.checked = looseEqual(value, getValue(el))
  } else if (isAnInput || isTextArea(el)) {
    if (isNumberInput(el)) {
      if (el.value !== value?.toString()) {
        el.value = value
      }
    } else if (el.value !== value) {
      el.value = value
    }
  } else if (isSelect(el)) {
    const options = el.options
    const len = options.length
    const isMultiple = el.multiple
    for (let i = 0; i < len; i++) {
      const option = options[i]
      const optionValue = getValue(option)
      if (isMultiple) {
        if (isArray(value)) {
          option.selected = looseIndexOf(value, optionValue) > -1
        } else {
          option.selected = value.has(optionValue)
        }
      } else {
        if (looseEqual(getValue(option), value)) {
          if (el.selectedIndex !== i) el.selectedIndex = i
          return
        }
      }
    }
    if (!isMultiple && el.selectedIndex !== -1) {
      el.selectedIndex = -1
    }
  } else {
    warning(WarningType.ModelNotSupportOnElement, el)
  }
}

interface ModelFlags {
  trim: boolean
  lazy: boolean
  number: boolean
  int: boolean
}
const getFlags = (flag: any): ModelFlags => {
  if (isRef(flag)) flag = flag()
  if (isFunction(flag)) flag = flag()
  if (!flag)
    return {
      trim: false,
      lazy: false,
      number: false,
      int: false,
    }
  if (isString(flag)) {
    return {
      trim: flag.includes('trim'),
      lazy: flag.includes('lazy'),
      number: flag.includes('number'),
      int: flag.includes('int'),
    }
  }
  return {
    trim: !!flag.trim,
    lazy: !!flag.lazy,
    number: !!flag.number,
    int: !!flag.int,
  }
}

const isCheckBox = (el: HTMLInputElement): el is HTMLInputElement =>
  el.type === 'checkbox'

const isRadio = (el: HTMLInputElement): el is HTMLInputElement =>
  el.type === 'radio'

const isNumberInput = (
  el: HTMLInputElement | HTMLTextAreaElement,
): el is HTMLInputElement => el.type === 'number' || el.type === 'range'

const isInput = (el: HTMLElement): el is HTMLInputElement =>
  el.tagName === 'INPUT'

const isTextArea = (el: HTMLElement): el is HTMLTextAreaElement =>
  el.tagName === 'TEXTAREA'

const isSelect = (el: HTMLElement): el is HTMLSelectElement =>
  el.tagName === 'SELECT'

const attachDOMChangeListener = (
  el: HTMLElement,
  parseResult: ParseResult,
  directiveFlags?: string[],
): Unbinder => {
  const parsedValue = parseResult.value
  const f1 = getFlags(directiveFlags?.join(','))
  const f2 = getFlags(parsedValue()[1])
  const flags: ModelFlags = {
    int: f1.int || f2.int,
    lazy: f1.lazy || f2.lazy,
    number: f1.number || f2.number,
    trim: f1.trim || f2.trim,
  }
  if (!parseResult.refs[0]) {
    warning(WarningType.ModelRequiresRef, el)
    return () => {}
  }
  const getModelRef = (): AnyRef | undefined => parseResult.refs[0]
  const isAnInput = isInput(el)
  if (isAnInput && isCheckBox(el)) {
    return handleCheckBox(el, getModelRef)
  } else if (isAnInput && isRadio(el)) {
    return handleRadio(el, getModelRef)
  } else if (isAnInput || isTextArea(el)) {
    return handleInputAndTextArea(el, flags, getModelRef, parsedValue)
  } else if (isSelect(el)) {
    return handleSelect(el, getModelRef, parsedValue)
  } else {
    warning(WarningType.ModelNotSupportOnElement, el)
    return () => {}
  }
}

const decimalSeparators = /[.,' ·٫]/

const handleInputAndTextArea = (
  el: HTMLInputElement | HTMLTextAreaElement,
  flags: ModelFlags,
  getModelRef: () => AnyRef | undefined,
  parsedValue: SRef<unknown[]>,
): Unbinder => {
  const isLazy = flags.lazy
  const eventType = isLazy ? 'change' : 'input'
  const isNumber = isNumberInput(el)
  const trimmer = (): void => {
    if (!flags.trim && !getFlags(parsedValue()[1]).trim) return
    el.value = el.value.trim()
  }
  const onCompositionStart = (e: Event): void => {
    const target = e.target as any
    target.composing = 1
  }

  const onCompositionEnd = (e: Event): void => {
    const target = e.target as any
    if (target.composing) {
      target.composing = 0
      target.dispatchEvent(new Event(eventType))
    }
  }

  const unbinder = (): void => {
    el.removeEventListener(eventType, listener)
    el.removeEventListener('change', trimmer)
    el.removeEventListener('compositionstart', onCompositionStart)
    el.removeEventListener('compositionend', onCompositionEnd)
    el.removeEventListener('change', onCompositionEnd)
  }

  const listener = (event: Event): void => {
    const modelRef = getModelRef()
    if (!modelRef) return
    const target = event.target as any
    if (!target || target.composing) return
    let value = target.value
    const flags = getFlags(parsedValue()[1])
    if (isNumber || flags.number || flags.int) {
      if (flags.int) {
        value = parseInt(value)
      } else {
        const endsWithDecimalSeparator =
          decimalSeparators.test(value[value.length - 1]) &&
          value.split(decimalSeparators).length === 2
        if (endsWithDecimalSeparator) {
          value += '0'
          value = parseFloat(value)
          if (isNaN(value)) value = ''
          else if (modelRef() === value) return
        }
        value = parseFloat(value)
      }
      if (isNaN(value)) value = ''
      el.value = value
    } else if (flags.trim) {
      value = value.trim()
    }
    modelRef(value)
  }
  el.addEventListener(eventType, listener)
  el.addEventListener('change', trimmer)
  el.addEventListener('compositionstart', onCompositionStart)
  el.addEventListener('compositionend', onCompositionEnd)
  el.addEventListener('change', onCompositionEnd)
  return unbinder
}

const handleCheckBox = (
  el: HTMLInputElement,
  getModelRef: () => AnyRef | undefined,
): Unbinder => {
  const eventType = 'change'
  const unbinder = (): void => {
    el.removeEventListener(eventType, listener)
  }

  const listener = (): void => {
    const modelRef = getModelRef()
    if (!modelRef) return
    const elementValue = getValue(el)
    const checked = el.checked
    const modelValue = modelRef()
    if (isArray(modelValue)) {
      const index = looseIndexOf(modelValue, elementValue)
      const found = index !== -1
      if (checked && !found) {
        modelValue.push(elementValue)
      } else if (!checked && found) {
        modelValue.splice(index, 1)
      }
    } else if (isSet(modelValue)) {
      if (checked) {
        modelValue.add(elementValue)
      } else {
        modelValue.delete(elementValue)
      }
    } else {
      modelRef(getCheckboxValue(el, checked))
    }
  }
  el.addEventListener(eventType, listener)
  return unbinder
}

const getValue = (
  el:
    | (HTMLOptionElement & { rawValue?: any })
    | (HTMLInputElement & { rawValue?: any }),
): unknown => {
  // bind _value prop to enable object value assignment => :prop="{rawValue: obj }"
  return '_value' in el ? el._value : el.value
}

// 3 use cases: attr key, attr key bind and prop key bind
// => true-value="my true value" false-value="my false value"
// => :attr="{'true-value'="my true value",'false-value'="my false value" }
// => :prop="{trueValueKey: trueObj, falseValueKey: falseObj }"
const trueValueKey = 'trueValue'
const falseValueKey = 'falseValue'
const trueValueAttrKey = 'true-value'
const falseValueAttrKey = 'false-value'
const getCheckboxValue = (
  el: HTMLInputElement & { trueValue?: any; falseValue?: any },
  checked: boolean,
): any => {
  const key = checked ? trueValueKey : falseValueKey
  if (key in el) {
    return el[key]
  }
  const attrKey = checked ? trueValueAttrKey : falseValueAttrKey
  if (el.hasAttribute(attrKey)) return el.getAttribute(attrKey)

  return checked
}

const getCheckboxChecked = (
  el: HTMLInputElement & { trueValue?: any; falseValue?: any },
  value: any,
): boolean => {
  const key = trueValueKey
  if (key in el) {
    return looseEqual(value, el.trueValue)
  }
  const attrKey = trueValueAttrKey
  if (el.hasAttribute(attrKey))
    return looseEqual(value, el.getAttribute(attrKey))
  return looseEqual(value, true)
}

const handleRadio = (
  el: HTMLInputElement,
  getModelRef: () => AnyRef | undefined,
): Unbinder => {
  const eventType = 'change'
  const unbinder = (): void => {
    el.removeEventListener(eventType, listener)
  }

  const listener = (): void => {
    const modelRef = getModelRef()
    if (!modelRef) return
    const elementValue = getValue(el)
    modelRef(elementValue)
  }
  el.addEventListener(eventType, listener)
  return unbinder
}

const handleSelect = (
  el: HTMLSelectElement,
  getModelRef: () => AnyRef | undefined,
  parsedValue: SRef<unknown[]>,
): Unbinder => {
  const eventType = 'change'
  const unbinder = (): void => {
    el.removeEventListener(eventType, listener)
  }
  const listener = (): void => {
    const modelRef = getModelRef()
    if (!modelRef) return
    const flags = getFlags(parsedValue()[1])
    const number = flags.number
    const selectedValue = Array.prototype.filter
      .call(el.options, (o: HTMLOptionElement) => o.selected)
      .map((o: HTMLOptionElement) =>
        number ? looseToNumber(getValue(o)) : getValue(o),
      )
    if (el.multiple) {
      const modelValue = modelRef()
      try {
        pause(modelRef)
        if (isSet(modelValue)) {
          modelValue.clear()
          for (const sel of selectedValue) modelValue.add(sel)
        } else if (isArray(modelValue)) {
          modelValue.splice(0)
          modelValue.push(...selectedValue)
        } else {
          modelRef(selectedValue)
        }
      } finally {
        resume(modelRef)
        trigger(modelRef)
      }
    } else {
      modelRef(selectedValue[0])
    }
  }
  el.addEventListener(eventType, listener)
  return unbinder
}
