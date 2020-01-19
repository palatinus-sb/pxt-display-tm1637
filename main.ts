let TubeTab: number[] = [
    0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07,
    0x7f, 0x6f, 0x77, 0x7c, 0x39, 0x5e, 0x79, 0x71
]
/**
 * Display interface for TM1637 chip
 */
//% weight=10 color=#9F79EE icon="\uf108" block="Display"
namespace display {
    /**
     * Create an interface for the TM1637 display
     */
    //% block
    export function createDisplay(clkPin: DigitalPin, dataPin: DigitalPin): TM1637 {
        let display = new TM1637()

        display.buf = pins.createBuffer(4)
        display.clkPin = clkPin
        display.dataPin = dataPin
        display.brightnessLevel = 7
        display.pointFlag = false
        display.clear()

        return display
    }
    export class TM1637 {
        clkPin: DigitalPin
        dataPin: DigitalPin
        brightnessLevel: number
        pointFlag: boolean
        buf: Buffer

        private writeByte(wrData: number) {
            for (let i = 0; i < 8; i++) {
                pins.digitalWritePin(this.clkPin, 0)
                if (wrData & 0x01) pins.digitalWritePin(this.dataPin, 1)
                else pins.digitalWritePin(this.dataPin, 0)
                wrData >>= 1
                pins.digitalWritePin(this.clkPin, 1)
            }

            pins.digitalWritePin(this.clkPin, 0) // Wait for ACK
            pins.digitalWritePin(this.dataPin, 1)
            pins.digitalWritePin(this.clkPin, 1)
        }

        private start() {
            pins.digitalWritePin(this.clkPin, 1)
            pins.digitalWritePin(this.dataPin, 1)
            pins.digitalWritePin(this.dataPin, 0)
            pins.digitalWritePin(this.clkPin, 0)
        }

        private stop() {
            pins.digitalWritePin(this.clkPin, 0)
            pins.digitalWritePin(this.dataPin, 0)
            pins.digitalWritePin(this.clkPin, 1)
            pins.digitalWritePin(this.dataPin, 1)
        }

        private coding(dispData: number): number {
            let pointData = 0

            if (dispData == 0x7f) dispData = 0x00
            else if (dispData == 0x3f) dispData = 0x3f
            else dispData = TubeTab[dispData] + pointData

            return dispData
        }
        /**
         * Show a 4 digits number on display
         */
        //% block
        show(dispData: number, fillWithZeros = false) {
            let def = 0x7f
            if (fillWithZeros)
                def = 0x3f
            if (dispData < 10) {
                this.bit(dispData, 3)
                this.bit(def, 2)
                this.bit(def, 1)
                this.bit(def, 0)

                this.buf[3] = dispData
                this.buf[2] = def
                this.buf[1] = def
                this.buf[0] = def
            }
            else if (dispData < 100) {
                this.bit(dispData % 10, 3)
                this.bit((dispData / 10) % 10, 2)
                this.bit(def, 1)
                this.bit(def, 0)

                this.buf[3] = dispData % 10
                this.buf[2] = (dispData / 10) % 10
                this.buf[1] = def
                this.buf[0] = def
            }
            else if (dispData < 1000) {
                this.bit(dispData % 10, 3)
                this.bit((dispData / 10) % 10, 2)
                this.bit((dispData / 100) % 10, 1)
                this.bit(def, 0)

                this.buf[3] = dispData % 10
                this.buf[2] = (dispData / 10) % 10
                this.buf[1] = (dispData / 100) % 10
                this.buf[0] = def
            }
            else {
                this.bit(dispData % 10, 3)
                this.bit((dispData / 10) % 10, 2)
                this.bit((dispData / 100) % 10, 1)
                this.bit((dispData / 1000) % 10, 0)

                this.buf[3] = dispData % 10
                this.buf[2] = (dispData / 10) % 10
                this.buf[1] = (dispData / 100) % 10
                this.buf[0] = (dispData / 1000) % 10
            }
        }
        /**
         * Show a 4 digits number on display
         */
        //% block
        brightness(level: number) {
            this.brightnessLevel = level

            this.bit(this.buf[0], 0x00)
            this.bit(this.buf[1], 0x01)
            this.bit(this.buf[2], 0x02)
            this.bit(this.buf[3], 0x03)
        }

        /**
         * Show a single number from 0 to 9 at a specified digit of the display
         */
        //% block
        //% advanced=true
        bit(dispData: number, bitAddr: number) {
            if ((dispData == 0x7f) || (dispData == 0x3f) || ((dispData <= 9) && (bitAddr <= 3))) {
                let segData = 0

                if (bitAddr == 1 && this.pointFlag)
                    segData = this.coding(dispData) + 0x80
                else
                    segData = this.coding(dispData)
                this.start()
                this.writeByte(0x44)
                this.stop()
                this.start()
                this.writeByte(bitAddr | 0xc0)
                this.writeByte(segData)
                this.stop()
                this.start()
                this.writeByte(0x88 + this.brightnessLevel)
                this.stop()

                this.buf[bitAddr] = dispData
            }
        }

        /**
         * Turn on or off the colon point on the display
         */
        //% block
        //% advanced=true
        point(b: boolean) {
            this.pointFlag = b
            this.bit(this.buf[1], 0x01)
        }

        /**
         * Clear the display
         */
        //% block
        clear() {
            this.bit(0x7f, 0x00)
            this.bit(0x7f, 0x01)
            this.bit(0x7f, 0x02)
            this.bit(0x7f, 0x03)
        }
    }
}
