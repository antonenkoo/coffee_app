// js/scale.js — Web Bluetooth scale integration
const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b'
const CHAR_UUID    = 'beb5483e-36e1-4688-b7f5-ea07361b26a8'
const TARE_UUID    = 'beb5483e-36e1-4688-b7f5-ea07361b26a9'
const _NAME_KEY    = 'ble_scale_name'

export class BLEScale {
  constructor({ onWeight, onState }) {
    this._onWeight = onWeight
    this._onState  = onState
    this.device    = null
    this.weight    = null
    this.state     = 'disconnected' // disconnected | connecting | connected
    this._tareChar = null
  }

  get supported() { return !!navigator.bluetooth }

  async _connectToDevice(device) {
    const srv  = await device.gatt.connect()
    const svc  = await srv.getPrimaryService(SERVICE_UUID)
    const char = await svc.getCharacteristic(CHAR_UUID)
    await char.startNotifications()
    char.addEventListener('characteristicvaluechanged', e => {
      const g = parseFloat(new TextDecoder().decode(e.target.value))
      if (!isNaN(g)) { this.weight = g; this._onWeight(g) }
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

  // Silently reconnect to the previously paired device (no user gesture needed).
  // Call on page load; resolves immediately if no prior device is cached.
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
    if (!this._tareChar) return
    try {
      await this._tareChar.writeValueWithoutResponse(new Uint8Array([0x01]))
    } catch (err) {
      console.warn('[BLEScale] tare failed:', err.message)
    }
  }

  disconnect() {
    this.device?.gatt?.disconnect()
  }

  _drop() { this.device = null; this.weight = null; this._tareChar = null; this._set('disconnected') }
  _set(s) { this.state = s; this._onState(s, this.device?.name) }
}
