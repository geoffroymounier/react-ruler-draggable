import React, { useState, useMemo, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import PropTypes from 'prop-types'
import { useDebounce } from 'use-debounce'
import rulerImg from './exportedRulerHorizontal.png'
import rulerImgVertical from './exportedRulerVertical.png'
import './style.css'

const Cursor = ({value}) => {
  console.log({value})
  return (
        <div draggable={"true"} className={`dragger--circle`} >
          {value.toFixed(0)}
        </div>
  )
}

const Ruler = forwardRef(({
  frictionCoefficient,
  onChanged,
  cursor,
  styleCursorContainer = {},
  longLength,
  incremental,
  shortLength,
  backgroundImage,
  defaultValue,
  disabledDragRuler = false,
  disabledMouseWheel = false,
  disabledCursorDrag = false,
  horizontal,
}, ref) => {
  const FRICTION_COEFF = Math.min(0.99,Math.max(0.01,frictionCoefficient))
  const totalWidth = longLength * 20
  const timerID = useRef(null)
  const counterJS = useRef(null)
  const draggerJS = useRef(
    defaultValue
      ? horizontal
        ? 100 * defaultValue
        : 100 * (1 - defaultValue).toFixed(3)
      : 50
  )
  const dragSomethingRef = useRef()
  const velocityJS = useRef(0)
  const positionJS = useRef(0)
  const inertiaJS = useRef((draggerJS.current * totalWidth) / 100)
  const isDragging = useRef(false)
  const timeJS = useRef(0)

  const inputEl = useRef(null)
  const [loadRaw, setLoad] = useState(0)
  const [liveValue,setLiveValue] = useState(draggerJS.current)
  const [load] = useDebounce(loadRaw, 150)
  const backgroundImageDefault = horizontal ? rulerImg : rulerImgVertical
  const cursorLength = useRef()
  const cursorOffset = useRef()
  const CursorElement = cursor || <Cursor value={liveValue}/>
  const listenMouseEventUp = callback => {
    window.ontouchend = (e) => {
      requestAnimationFrame(() => callback(false))
    }
    window.onmouseup = (e) => {
      requestAnimationFrame(() => callback(false))
    }
  }
  const removeDragGhost = () => {
    if (
      !global.window ||
      !dragSomethingRef.current
    )
      return
      dragSomethingRef.current.addEventListener(
      'dragstart',
      function remove(e) {
        const crt = this.cloneNode(true)
        crt.style.opacity = 0
        document.body.appendChild(crt)
        e.dataTransfer.setDragImage(crt, 0, 0)
      },
      false
    )
  }
  const startCounter = (i,d,inertia) => {
    clearInterval(counterJS.current)
    let timer = 0
    onChanged((100 * inertia) / totalWidth)
    counterJS.current= setInterval(() => {
      timer = timer + 20
      inertia = inertia + d/i
      setLiveValue((100 * inertia) / totalWidth)
      onChanged((100 * inertia) / totalWidth)
      if (timer > (i*20)) {
        clearInterval(counterJS.current)
        counterJS.current = null
      }

    }, 20)
  }
  const velocityResolver = (v, i = 0, d = 0) => {
    if (Math.abs(v) < 0.01) {

      return [i, d]
    }

    return velocityResolver(v * FRICTION_COEFF, i + 1, d + v * FRICTION_COEFF)
  }

  const onDragStart = e => {
    positionJS.current = horizontal ? e.clientX : e.clientY
    velocityJS.current = 0
    isDragging.current = true
  }
  const onTouchStart = e => {
    positionJS.current = horizontal ? e.touches[0].pageX : e.touches[0].pageY
    velocityJS.current = 0
    isDragging.current = true
  }
  const onDragEnd = e => {
    isDragging.current = false
    setLoad(load + 1)
  }
  const onWheel = e => {
    if (disabledMouseWheel) return
    draggerJS.current = (100 * inertiaJS.current) / totalWidth
    const delta = horizontal ? e.deltaX : e.deltaY
    if (Math.abs(delta) > 0) {
      const [i, d] = velocityResolver(-delta)
      inertiaJS.current = Math.min(
        totalWidth,
        Math.max(0, inertiaJS.current + d)
      )
      timeJS.current = i * 20
    }
    velocityJS.current = 0
    setLoad(load + 1)
  }
  const onMouseMove = e => {
    if (!isDragging.current || disabledDragRuler) return
    draggerJS.current = (100 * inertiaJS.current) / totalWidth
    velocityJS.current = horizontal
      ? e.clientX - positionJS.current
      : e.clientY - positionJS.current
    positionJS.current = horizontal ? e.clientX : e.clientY
    if (Math.abs(velocityJS.current) > 1) {
      const [i, d] = velocityResolver(velocityJS.current)
      const initialInertia = inertiaJS.current
      inertiaJS.current = Math.min(
        totalWidth,
        Math.max(0, inertiaJS.current + d)
      )

      timeJS.current = i * 20
      startCounter(i,d,initialInertia)
    }
    velocityJS.current = 0
    setLoad(load + 1)
  }
  const onTouch = e => {
    const { pageX } = e.touches[0]
    const { pageY } = e.touches[0]
    draggerJS.current = (100 * inertiaJS.current) / totalWidth
    velocityJS.current = horizontal
      ? pageX - positionJS.current
      : pageY - positionJS.current
    positionJS.current = horizontal ? pageX : pageY
    if (Math.abs(velocityJS.current) > 1) {
      const [i, d] = velocityResolver(velocityJS.current)
      inertiaJS.current = Math.min(
        totalWidth,
        Math.max(0, inertiaJS.current + d)
      )
      timeJS.current = i * 20
    }
    velocityJS.current = 0
    setLoad(load + 1)
  }
  const onTouchCursor = e => {
    const client = horizontal ? e.touches[0].pageX : e.touches[0].pageY
    const offset = horizontal
      ? inputEl.current.offsetLeft
      : inputEl.current.offsetTop + 45
    draggerJS.current = Math.min(
      100,
      Math.max(0, (100 * (client - offset)) / longLength)
    )
    inertiaJS.current = Math.min(
      totalWidth,
      Math.max(0, (totalWidth * (client - offset)) / longLength)
    )
    timeJS.current = 150
    requestAnimationFrame(() => setLoad(load + 1))
  }
  const onDrag = e => {
    if (!isDragging.current || disabledCursorDrag) return
    const client = horizontal ? e.clientX : e.clientY
    if (client === 0) return
    const offset = horizontal
      ? inputEl.current.offsetLeft + (cursorLength.current/2)
      : inputEl.current.offsetTop + (cursorLength.current/2)
    draggerJS.current = Math.min(
      100,
      Math.max(0, (100 * (client - offset)) / longLength)
    )
    inertiaJS.current = Math.min(
      totalWidth,
      Math.max(0, (totalWidth * (client - offset)) / longLength)
    )
    timeJS.current = 150
    requestAnimationFrame(() => setLoad(load + 1))
  }
  const onUp = (e) => {
    draggerJS.current = Math.max(
      0,
      draggerJS.current - (100 * incremental) / 100
    )
    if (draggerJS.current > 0) {
      inertiaJS.current = Math.min(
        totalWidth,
        Math.max(0, inertiaJS.current * 0.99)
      )
      timeJS.current = 150
    }
  }
  const onDown = (e) => {
    draggerJS.current = Math.min(
      100,
      draggerJS.current + (100 * incremental) / 100
    )
    if (draggerJS.current < 100) {
      inertiaJS.current = Math.min(
        totalWidth,
        Math.max(0, inertiaJS.current * 1.01)
      )
      timeJS.current = 150
    }
  }
  const timer = (load, flow) => {
    setLoad(load + 1)
    timerID.current = setInterval(() => {
      flow === 1 ? onDown() : onUp()
      clearInterval(timerID.current)
      timer(load + 1, flow)
    }, 70)
  }


    useImperativeHandle(ref, () => ({
      pressingUp(e) {
        timer(load, 1)
      },
      pressingDown(e) {
        timer(load, -1)
      },
      stopPressing(e) {
        clearInterval(timerID.current)
      }

    }));
  useMemo(() => {
      if (!counterJS.current) onChanged(draggerJS.current)
  }, [draggerJS.current])
  useEffect(() => {
    const element = dragSomethingRef.current.children[0].getBoundingClientRect()
    cursorLength.current = horizontal ? element.width : element.height
    removeDragGhost()
    listenMouseEventUp(dragging => isDragging.current = dragging)
  }, [])

  return (
      <div>
          <div ref={inputEl} style={{ position: 'relative' }}>
            <div
              className={`ruler ${horizontal && ' horizontal'}`}
              style={{

                width: horizontal ? longLength : shortLength,
                height: horizontal ? shortLength : longLength,
                backgroundImage: `url(${backgroundImage || backgroundImageDefault})`,
                backgroundPositionX: horizontal ? inertiaJS.current : void 0,
                backgroundPositionY: !horizontal ? inertiaJS.current : void 0,
                transition: `all ${timeJS.current}ms cubic-bezier(.35,.7,.42,1)`
              }}
            >
              <div
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                draggable={true}
                onDrag={onDrag}
                onTouchMove={onTouchCursor}
                className={`dragger ${horizontal && 'horizontal'}`}
                ref={dragSomethingRef}
                style={{
                  cursor: isDragging.current ? 'grabbing' : 'grab',
                  transition: `all ${timeJS.current}ms ease-out`,
                  left: horizontal && `${Math.max(1, draggerJS.current)}%`,
                  top: !horizontal && `${Math.max(1, draggerJS.current)}%`,
                  ...styleCursorContainer
                }}
              >
                {CursorElement}
              </div>
              <div
                style={{
                  cursor: isDragging.current ? 'grabbing' : 'grab',
                  width: horizontal ? 6000 : '100%',
                  height: !horizontal ? 6000 : '100%'
                }}

                onWheel={onWheel}
                onMouseMove={onMouseMove}
                onMouseDown={onDragStart}
                onTouchMove={onTouch}
                onTouchStart={onTouchStart}
                onTouchEnd={onDragEnd}
              />
            </div>
          </div>
</div>
  )
})
export default Ruler

Ruler.propTypes = {
  subUnits: PropTypes.array.isRequired,
  propagateAnalytics: PropTypes.func.isRequired,
  minValue: PropTypes.number.isRequired,
  range: PropTypes.number.isRequired,
  conversionRates: PropTypes.array.isRequired,
  decimal: PropTypes.number.isRequired,
  horizontal: PropTypes.bool.isRequired,
  units: PropTypes.array.isRequired,
  showSlide: PropTypes.func.isRequired,
  unknown: PropTypes.string,
  firstItem: PropTypes.bool.isRequired,
  focused: PropTypes.bool.isRequired,
  selectChoices: PropTypes.func.isRequired,
  defaultValue: PropTypes.string,
  label: PropTypes.string.isRequired,
  compulsory: PropTypes.bool.isRequired,
  title: PropTypes.object,
  underline: PropTypes.object,
  icon: PropTypes.string,
  incremental:PropTypes.number,
  id: PropTypes.string.isRequired
}
Ruler.defaultProps = {
  frictionCoefficient : 0.8,
  incremental:1,
  defaultValue: null,
  unknown: null,
  icon: '',
  underline: null,
  title: null
}
