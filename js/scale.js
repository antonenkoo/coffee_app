// js/scale.js — Web Bluetooth scale integration
const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b'
const CHAR_UUID    = 'beb5483e-36e1-4688-b7f5-ea07361b26a8'
const TARE_UUID    = 'beb5483e-36e1-4688-b7f5-ea07361b26a9'
const _NAME_KEY    = 'ble_scale_name'
const FILTER_SIZE  = 5

export class BLEScale {
  constructor({ onWeight, onState, onFlowRate = null }) {
    this._onWeight   = onWeight
    this._onState    = onState
    this._onFlowRate = onFlowRate
    this.device      = null
    this.weight      = null
    this.flowRate    = 0      // г/с, обновляется из 6-байтового пакета
    this.state       = 'disconnected'
    this._tareChar   = null
    this._buf        = []     // median filter circular buffer
    this._lastRaw    = 0
    this._softTare   = 0      // software tare offset
  }

  get supported() { return !!navigator.bluetooth }

  _filter(raw) {
    this._lastRaw = raw
    this._buf.push(raw)
    if (this._buf.length > FILTER_SIZE) this._buf.shift()
    const sorted = [...this._buf].sort((a, b) => a - b)
    return sorted[Math.floor(sorted.length / 2)]
  }

  async _connectToDevice(device) {
    const srv  = await device.gatt.connect()
    const svc  = await srv.getPrimaryService(SERVICE_UUID)
    const char = await svc.getCharacteristic(CHAR_UUID)
    await char.startNotifications()
    char.addEventListener('characteristicvaluechanged', e => {
      const buf = e.target.value
      let raw, flow = 0

      if (buf.byteLength >= 4) {
        // New firmware: [int32 weight×100 BE][int16 flowRate×10 BE]
        const dv = new DataView(buf.buffer, buf.byteOffset)
        raw = dv.getInt32(0, false) / 100
        if (buf.byteLength >= 6) {
          flow = dv.getInt16(4, false) / 10
        }
      } else {
        // Legacy firmware: plain text float string
        raw = parseFloat(new TextDecoder().decode(buf))
      }

      if (isNaN(raw)) return
      const filtered = this._filter(raw)
      const g = Math.round((filtered - this._softTare) * 10) / 10
      this.weight   = g
      this.flowRate = flow
      this._onWeight(g)
      if (flow > 0 && this._onFlowRate) this._onFlowRate(flow)
    })
    try {
      this._tareChar = await svc.getCharacteristic(TARE_UUID)
    } catch {
      this._tareChar = null
    }
  }

  async connect() {
    if (!this.supported) return
    this._set('connecting')
    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Scale' },
          { namePrefix: 'scale' },
          { namePrefix: 'SCALE' },
          { namePrefix: 'Coffee Scale' },
          { namePrefix: 'coffee scale' },
        ],
        optionalServices: [SERVICE_UUID]
      })
      this.device.addEventListener('gattserverdisconnected', () => this._drop())
      await this._connectToDevice(this.device)
      sessionStorage.setItem(_NAME_KEY, this.device.name || '')
      this._set('connected')
    } catch (err) {
      this._drop()
      if (err.name !== 'NotFoundError') console.warn('[BLEScale]', err.message)
    }
  }

  async autoReconnect() {
    if (!this.supported || this.state !== 'disconnected') return
    if (typeof navigator.bluetooth.getDevices !== 'function') return
    try {
      const devices   = await navigator.bluetooth.getDevices()
      const savedName = sessionStorage.getItem(_NAME_KEY)
      const dev = devices.find(d =>
        savedName ? d.name === savedName : /scale/i.test(d.name || '')
      )
      if (!dev) return
      this._set('connecting')
      this.device = dev
      this.device.addEventListener('gattserverdisconnected', () => this._drop())
      await this._connectToDevice(this.device)
      this._set('connected')
    } catch (err) {
      this._drop()
      console.warn('[BLEScale] autoReconnect:', err.message)
    }
  }

  async tare() {
    if (this._tareChar) {
      try {
        await this._tareChar.writeValueWithoutResponse(new Uint8Array([0x01]))
      } catch (err) {
        console.warn('[BLEScale] tare failed:', err.message)
      }
      await new Promise(r => setTimeout(r, 2800))  // wait for stability + tare on firmware
      this._buf      = []
      this._softTare = 0
    } else {
      this._softTare = this._lastRaw
      this._buf      = []
    }
    this.weight   = 0
    this.flowRate = 0
    this._onWeight(0)
  }

  disconnect() {
    this.device?.gatt?.disconnect()
  }

  _drop() {
    this.device    = null
    this.weight    = null
    this.flowRate  = 0
    this._tareChar = null
    this._buf      = []
    this._softTare = 0
    this._lastRaw  = 0
    this._set('disconnected')
  }

  _set(s) { this.state = s; this._onState(s, this.device?.name) }
}
