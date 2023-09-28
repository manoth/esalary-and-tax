import { Pipe, PipeTransform, NgZone, ChangeDetectorRef, OnDestroy } from '@angular/core';

@Pipe({
    name: 'timeAgo',
    pure: false
})
export class TimeAgoPipe implements PipeTransform, OnDestroy {

    private timer: number | null;
    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        private ngZone: NgZone
    ) { }
    transform(value: any): any {
        this.removeTimer();
        let d = new Date(value);
        let now = new Date();
        let seconds = Math.round(Math.abs(((now.getTime() + (1000 * 60 * 60 * 7)) - d.getTime()) / 1000));
        let timeToUpdate = this.getSecondsUntilUpdate(seconds) * 1000;
        this.timer = this.ngZone.runOutsideAngular(() => {
            if (typeof window !== 'undefined') {
                return window.setTimeout(() => {
                    this.ngZone.run(() => this.changeDetectorRef.markForCheck());
                }, timeToUpdate);
            }
            return null;
        });
        let minutes = Math.round(Math.abs(seconds / 60));
        let hours = Math.round(Math.abs(minutes / 60));
        let days = Math.round(Math.abs(hours / 24));
        let weeks = Math.round(Math.abs(days / 7));
        let months = Math.round(Math.abs(days / 30.416));
        let years = Math.round(Math.abs(days / 365));
        if (seconds < 60) {
            return 'ไม่กี่วินาที่ที่แล้ว';
        } else if (seconds >= 60 && seconds < 3600) {
            return minutes + ' นาทีที่แล้ว';
        } else if (seconds >= 3600 && seconds < 86400) {
            return hours + ' ชั่วโมงที่แล้ว';
        } else if (seconds >= 86400 && seconds < 604800) {
            return days + ' วันที่แล้ว';
        } else if (seconds >= 604800 && seconds < 2592000) {
            return weeks + ' สัปดาห์ที่แล้ว';
        } else if (seconds >= 2592000 && seconds < 31536000) {
            return months + ' เดือนที่แล้ว';
        } else { // (days > 545)
            return years + ' ปีที่แล้ว';
        }
    }
    ngOnDestroy(): void {
        this.removeTimer();
    }
    private removeTimer() {
        if (this.timer) {
            window.clearTimeout(this.timer);
            this.timer = null;
        }
    }
    private getSecondsUntilUpdate(seconds: number) {
        let min = 60;
        let hr = min * 60;
        let day = hr * 24;
        if (seconds < min) { // less than 1 min, update ever 2 secs
            return 2;
        } else if (seconds >= min && seconds < hr) { // less than an hour, update every 30 secs
            return 30;
        } else if (seconds >= hr && seconds < day) { // less then a day, update every 5 mins
            return 300;
        } else { // update every hour
            return 3600;
        }
    }

}