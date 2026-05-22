basic.forever(function () {
	
})

//% color="#FEBC68" weight=5 icon="\uf00d" block="M16"
namespace MySensor {

    const SENSOR_ADDR = 0x2A

    /**
     * Read raw sensor data
     */
    //% block="read sensor raw"
    export function readSensorRaw(): number[] {

        let result: number[] = []

        // Read 5 bytes from I2C device
        let buf = pins.i2cReadBuffer(SENSOR_ADDR, 5)

        for (let i = 0; i < buf.length; i++) {
            result.push(buf[i])
        }

        return result
    }
}

//% color="#FEBC68" weight=3 icon="\uf017" block="M10"
//% groups="['Get Info Time (Data)', 'Get Info Time (Text)', 'Setting Time', 'Alarm']"
namespace ds3231 {
    export enum Calendar {
        //% block="Day"
        Day = 0,
        //% block="Month"
        Month = 1,
        //% block="Year"
        Year = 2
    }

    export enum Clock {
        //% block="Hour"
        Hour = 0,
        //% block="Minute"
        Minute = 1,
        //% block="Second"
        Second = 2
    }

    export enum Month {
        //% block="Jan"
        Jan = 1,
        //% block="Feb"
        Feb = 2,
        //% block="Mar"
        Mar = 3,
        //% block="Apr"
        Apr = 4,
        //% block="May"
        May = 5,
        //% block="Jun"
        Jun = 6,
        //% block="Jul"
        Jul = 7,
        //% block="Aug"
        Aug = 8,
        //% block="Sep"
        Sep = 9,
        //% block="Oct"
        Oct = 10,
        //% block="Nov"
        Nov = 11,
        //% block="Dec"
        Dec = 12
    }

    export enum Alarm {
        //% block="one time"
        OneTime = 1,
        //% block="always"
        Always = 0
    }

    /**
     * Note: the value "Day of the Week" store in DS3231
     * Have value from [1 - 7], with value 1 mean Sunday, 2 is Monday, and so on ...
     * 
     *      ENUM - DS3231  - ISO_8601 (the Week begin Monday, not Sunday)
     * Sun  0    - 1       - 7
     * Mon  1    - 2       - 1
     * Tue  2    - 3       - 2
     * Wed  3    - 4       - 3
     * Thu  4    - 5       - 4
     * Fri  5    - 6       - 5
     * Sat  6    - 7       - 6
     */
    export enum DayOfWeek {
        Sun, Mon, Tue, Wed, Thu, Fri, Sat
    }

    const alarm: number[] = [-1, -1];   // [Hour:Minute]
    let typeAlarm = Alarm.OneTime;      // Alarm one time!

    /* --------------------------------------------------------------------- */

    const DS3231_I2C_ADDR = 0x68; // Fixed I2C address

    const DS3231_REG_SECOND = 0x00;
    const DS3231_REG_MINUTE = 0x01;
    const DS3231_REG_HOUR = 0x02;
    const DS3231_REG_DAY = 0x03;
    const DS3231_REG_DATE = 0x04;
    const DS3231_REG_MONTH = 0x05;
    const DS3231_REG_YEAR = 0x06;

    /* --------------------------------------------------------------------- */

    /* Set a DS3231 reg */
    export function setReg(reg: number, dat: number) {
        let buf = pins.createBuffer(2);

        buf[0] = reg;
        buf[1] = dat;

        pins.i2cWriteBuffer(DS3231_I2C_ADDR, buf);
    }

    /* Get a DS3231 reg value */
    export function regValue(reg: number): number {
        pins.i2cWriteNumber(DS3231_I2C_ADDR, reg, NumberFormat.UInt8LE);

        return pins.i2cReadNumber(DS3231_I2C_ADDR, NumberFormat.UInt8LE);
    }

    /* --------------------------------------------------------------------- */

    /**
     * Convert a "Binary Coded Decimal" value to Binary
     * 
     * RTC stores time/date values as BCD
     * 
     * Old Recipe:  ( BCD >> 4 ) * 10 + ( BCD & 0x0F )
     * New Recipe:  BCD - 6 * ( BCD >> 4 )
     */
    export function bcdToDec(bcd: number): number {
        return bcd - 6 * (bcd >> 4);
    }

    /**
     * Convert a Binary value to BCD format for the RTC registers
     * 
     * The format BCD does not store value DEC in normal format of Binary
     * It use 4 bit corresponding for 10 digit "0-9" that is 10 number from "0-9"
     * With 4bit MSB for "Digit x10", and 4 bit LSB for "Digit x1"
     * 
     * Old Recipe:  ( ( DEC / 10 ) << 4 ) + ( DEC % 10 )
     * New Recipe:  DEC + 6 * ( DEC / 10 )
     */
    export function decToBcd(dec: number): number {
        return dec + 6 * Math.idiv(dec, 10);
    }

    /* --------------------------------------------------------------------- */

    /**
     * To determine this "Date" of Month of Year is what "Day of the Week"?
     * The Week begin Sunday with number 0
     * 
     * Way Tomohiko Sakamoto's used the "Doomsday Algorithm" to determine the Day of the Week!
     */
    export function getDayOfWeek(y: number, m: number, d: number): number {
        const monthTable: number[] = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];

        y -= ((m < 3) ? 1 : 0);

        return ((y + Math.idiv(y, 4) - Math.idiv(y, 100) + Math.idiv(y, 400) + monthTable[m - 1] + d) % 7);
    }

    /**
     * Mapping the value "Day" from "Tomohiko Sakamoto" to "ISO_8601"
     */
    export function getDS3231DayOfWeek(y: number, m: number, d: number): number {
        switch (getDayOfWeek(y, m, d)) {
            case DayOfWeek.Sun: return 1;
            case DayOfWeek.Mon: return 2;
            case DayOfWeek.Tue: return 3;
            case DayOfWeek.Wed: return 4;
            case DayOfWeek.Thu: return 5;
            case DayOfWeek.Fri: return 6;
            case DayOfWeek.Sat: return 7;
            default: return 0;
        }
    }

    /* --------------------------------------------------------------------- */

    //% shim=ds3231::get_DATE
    export function get_DATE(): string {
        return "?";
    }

    //% shim=ds3231::get_TIME
    export function get_TIME(): string {
        return "?";
    }

    //! Use for Debug
    // //% block="DS3231 \\| Print DATE"
    // export function print_DATE(): string {
    //     return get_DATE();
    // }

    //! Use for Debug
    // //% block="DS3231 \\| Print TIME"
    // export function print_TIME(): string {
    //     return get_TIME();
    // }

    /* --------------------------------------------------------------------- */

    /**
     * Get Day, Month, Year data from DS3231
     * @param calendar select get data Day, Month or Year
     */
    //% block="M09 Clock I2C \\| Get $calendar in Calendar"
    //% calendar.defl=ds3231.Calendar.Day
    //% inlineInputMode=inline
    //% weight=11
    //% group="Get Info Time (Data)"
    export function getDayMonthYear(calendar: Calendar): number {
        switch (calendar) {
            case Calendar.Day: return bcdToDec(regValue(DS3231_REG_DATE));
            case Calendar.Month: return bcdToDec(regValue(DS3231_REG_MONTH));
            case Calendar.Year: return bcdToDec(regValue(DS3231_REG_YEAR)) + 2000;
        }
    }

    /**
     * Get "Date of Week" data from DS3231
     */
    //% block="M09 Clock I2C \\| Get Days of the Week"
    //% inlineInputMode=inline
    //% weight=10
    //% group="Get Info Time (Data)"
    export function getDate(): string {
        switch (regValue(DS3231_REG_DAY)) {
            case 1: return "Sun";
            case 2: return "Mon";
            case 3: return "Tue";
            case 4: return "Wed";
            case 5: return "Thu";
            case 6: return "Fri";
            case 7: return "Sat";
            default: return "---";
        }
    }

    /**
     * Get Hour, Minute, Second data from DS3231
     * @param clock select get data Hour, Minute or Second
     */
    //% block="M09 Clock I2C \\| Get $clock in Time now"
    //% clock.defl=ds3231.Clock.Hour
    //% inlineInputMode=inline
    //% weight=9
    //% group="Get Info Time (Data)"
    export function getHourMinuteSecond(clock: Clock): number {
        switch (clock) {
            case Clock.Hour: return bcdToDec(regValue(DS3231_REG_HOUR));
            case Clock.Minute: return bcdToDec(regValue(DS3231_REG_MINUTE));
            case Clock.Second: return bcdToDec(regValue(DS3231_REG_SECOND));
        }
    }

    /**
     * Get aggregated __DATE__ data
     */
    //% block="M09 Clock I2C \\| Get Calendar"
    //% inlineInputMode=inline
    //% weight=8
    //% group="Get Info Time (Text)"
    export function getCalendar(): string {
        let d = bcdToDec(regValue(DS3231_REG_DATE));
        let m = bcdToDec(regValue(DS3231_REG_MONTH));
        let y = bcdToDec(regValue(DS3231_REG_YEAR)) + 2000;

        let t = "";
        t = t + getDate() + ",";
        (d < 10) ? (t = t + "0" + convertToText(d) + "/") : (t = t + convertToText(d) + "/");
        (m < 10) ? (t = t + "0" + convertToText(m) + "/") : (t = t + convertToText(m) + "/");
        t += y;

        return t;
    }

    /**
     * Get aggregated __TIME__ data
     */
    //% block="M09 Clock I2C \\| Get Time now"
    //% inlineInputMode=inline
    //% weight=7
    //% group="Get Info Time (Text)"
    export function getTime(): string {
        let h = bcdToDec(regValue(DS3231_REG_HOUR));
        let m = bcdToDec(regValue(DS3231_REG_MINUTE));
        let s = bcdToDec(regValue(DS3231_REG_SECOND));

        let t = "";
        (h < 10) ? (t = t + "0" + convertToText(h) + ":") : (t = t + convertToText(h) + ":");
        (m < 10) ? (t = t + "0" + convertToText(m) + ":") : (t = t + convertToText(m) + ":");
        (s < 10) ? (t = t + "0" + convertToText(s)) : (t = t + convertToText(s));

        return t;
    }

    // /**
    //  * !
    //  */
    // //% block="DS3231 \\| Set Date & Time this sketch was compiled"
    // //% inlineInputMode=inline
    // //% weight=6
    // //% group="Setting Time"
    // export function setTime_byCompiled() {
    //     let s = "";

    //     s = get_DATE(); // mmm dd yyyy
    //     let DATE = s.split(" ");
    //     s = get_TIME(); // hh:mm:ss
    //     let TIME = s.split(":");

    //     //! Use for Debug
    //     // serial.writeLine(DATE[1] + "-" + DATE[0] + "-" + DATE[2]);
    //     // serial.writeLine(TIME[0] + ":" + TIME[1] + ":" + TIME[2]);

    //     /* ----------------------------------------------------------------- */

    //     let buf = pins.createBuffer(8);

    //     buf[0] = DS3231_REG_SECOND;
    //     buf[1] = decToBcd(parseInt(TIME[2]));
    //     buf[2] = decToBcd(parseInt(TIME[1]));
    //     buf[3] = decToBcd(parseInt(TIME[0]));
    //     buf[4] = decToBcd(getDS3231DayOfWeek(y, m, d));
    //     buf[5] = decToBcd(d);
    //     buf[6] = decToBcd(m);
    //     buf[7] = decToBcd(y - 2000);

    //     pins.i2cWriteBuffer(DS3231_I2C_ADDR, buf);
    // }

    /**
     * Date & Time settings for DS3231
     * @param day choose Day
     * @param month choose Month
     * @param year choose Year
     * @param hour choose Hour
     * @param minute choose Minute
     */
    //% block="M09 Clock I2C \\| Set Day $day Month $month Year $year, $hour Hour : $minute Minute : 0 Second"
    //% day.defl=1 day.min=1 day.max=31
    //% month.defl=ds3231.Month.Jan
    //% year.defl=2022 year.min=2000 year.max=2099
    //% hour.defl=11 hour.min=0 hour.max=23
    //% minute.defl=30 minute.min=0 minute.max=59
    //% inlineInputMode=inline
    //% weight=5
    //% group="Setting Time"
    export function setTime_byChoose(day: number, month: Month, year: number, hour: number, minute: number) {
        let buf = pins.createBuffer(8);

        buf[0] = DS3231_REG_SECOND;
        buf[1] = decToBcd(0);
        buf[2] = decToBcd(minute);
        buf[3] = decToBcd(hour);
        buf[4] = decToBcd(getDS3231DayOfWeek(year, month, day));
        buf[5] = decToBcd(day);
        buf[6] = decToBcd(month);
        buf[7] = decToBcd(year - 2000);

        pins.i2cWriteBuffer(DS3231_I2C_ADDR, buf);
    }

    /**
     * Set the Date & Time for the DS3231 using the command
     * @param setFullTime install by command according to the syntax "ST-dd/mm/yyyy-hh:mm:ss"
     */
    //% block="M09 Clock I2C \\| Setting Date & Time $setFullTime"
    //% setFullTime.defl="ST-15/08/2022-13:13:13"
    //% inlineInputMode=inline
    //% weight=4
    //% group="Setting Time"
    export function setTime_byCommands(setFullTime: string): boolean {
        /**
         * String handling:
         * 
         * The command SetTime input correct is: ST-00/00/0000-00:00:00
         * With value sequence is: ST-Day/Month/Year-Hour:Minute:Second
         */
        if (setFullTime.length == 22) {
            if (setFullTime.includes("ST")) {
                if (setFullTime[2] != '-') return false;
                if (setFullTime[5] != '/') return false;
                if (setFullTime[8] != '/') return false;
                if (setFullTime[13] != '-') return false;
                if (setFullTime[16] != ':') return false;
                if (setFullTime[19] != ':') return false;

                let day = parseInt(setFullTime.substr(3, 2));
                let month = parseInt(setFullTime.substr(6, 2));
                let year = parseInt(setFullTime.substr(9, 4));

                let hour = parseInt(setFullTime.substr(14, 2));
                let minute = parseInt(setFullTime.substr(17, 2));
                let second = parseInt(setFullTime.substr(20, 2));

                /* --------------------------------------------------------- */

                let buf = pins.createBuffer(8);

                buf[0] = DS3231_REG_SECOND;
                buf[1] = decToBcd(second);
                buf[2] = decToBcd(minute);
                buf[3] = decToBcd(hour);
                buf[4] = decToBcd(getDS3231DayOfWeek(year, month, day));
                buf[5] = decToBcd(day);
                buf[6] = decToBcd(month);
                buf[7] = decToBcd(year - 2000);

                pins.i2cWriteBuffer(DS3231_I2C_ADDR, buf);
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * Alarm settings for DS3231
     * @param hour choose Hour
     * @param minute choose Minute
     * @param types alarm once or every day
     */
    //% block="M09 Clock I2C \\| Set Alarm at $hour Hour : $minute Minute $types"
    //% hour.defl=11 hour.min=0 hour.max=23
    //% minute.defl=30 minute.min=0 minute.max=59
    //% types.defl=ds3231.Alarm.OneTime
    //% inlineInputMode=inline
    //% weight=3
    //% group="Alarm"
    //% blockHidden=true
    export function setAlarm_byChoose(hour: number, minute: number, types: Alarm) {
        alarm[0] = hour;
        alarm[1] = minute;
        typeAlarm = types;
    }

    /**
     * Set the Alarm for the DS3231 using the command
     * @param ticks install by command according to the syntax "ST-hh:mm"
     * @param types alarm once or every day
     */
    //% block="M09 Clock I2C \\| Setting Alarm $ticks $types"
    //% ticks.defl="SA-15:30"
    //% types.defl=ds3231.Alarm.OneTime
    //% inlineInputMode=inline
    //% weight=2
    //% group="Alarm"
    //% blockHidden=true
    export function setAlarm_byCommands(ticks: string, types: Alarm): boolean {
        /**
         * String handling:
         * 
         * The command SetTime input correct is: SA-00:00
         * With value sequence is: SA-Hour:Minute
         */
        if (ticks.length == 8) {
            if (ticks.includes("SA")) {
                if (ticks[2] != '-') return false;
                if (ticks[5] != ':') return false;

                alarm[0] = parseInt(ticks.substr(3, 2));
                alarm[1] = parseInt(ticks.substr(6, 2));
                typeAlarm = types;

                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * Update the time to see if it's time for the alarm
     */
    //% block="M09 Clock I2C \\| Check Alarm 💤⏰"
    //% inlineInputMode=inline
    //% weight=1
    //% group="Alarm"
    //% blockHidden=true
    export function checkAlarm(): boolean {
        if (bcdToDec(regValue(DS3231_REG_HOUR)) == alarm[0]) {
            if (bcdToDec(regValue(DS3231_REG_MINUTE)) == alarm[1]) {
                if (typeAlarm == 1) {   // OneTime
                    alarm[0] = alarm[1] = -1;
                }
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    }
}