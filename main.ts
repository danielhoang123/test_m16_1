namespace MySensor {

    const SENSOR_ADDR = 0x2A

    /**
     * Read all sensor data
     */
    function readBuffer(): Buffer {
        return pins.i2cReadBuffer(SENSOR_ADDR, 5)
    }

    /**
     * Read sensor 1
     */
    //% block="read eye 1"
    export function eye1(): number {
        return readBuffer()[0]
    }

    /**
     * Read sensor 2
     */
    //% block="read eye 2"
    export function eye2(): number {
        return readBuffer()[1]
    }

    /**
     * Read sensor 3
     */
    //% block="read eye 3"
    export function eye3(): number {
        return readBuffer()[2]
    }

    /**
     * Read sensor 4
     */
    //% block="read eye 4"
    export function eye4(): number {
        return readBuffer()[3]
    }

    /**
     * Read sensor 5
     */
    //% block="read eye 5"
    export function eye5(): number {
        return readBuffer()[4]
    }
}
basic.forever(function () {
    let buf2 = pins.i2cReadBuffer(0x2a, 5)
    lcd.displayText(convertToText(buf2[0]), 1, 1)
    lcd.displayText(convertToText(buf2[1]), 1, 2)
    lcd.displayText(convertToText(buf2[2]), 1, 3)
    lcd.displayText(convertToText(buf2[3]), 1, 4)
    lcd.displayText(convertToText(buf2[4]), 7, 4)
})
