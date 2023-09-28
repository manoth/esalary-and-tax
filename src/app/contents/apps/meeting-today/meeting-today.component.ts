import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/services';
import * as screenfull from 'screenfull';
declare const $: any;

@Component({
  selector: 'app-meeting-today',
  templateUrl: './meeting-today.component.html',
  styleUrls: ['./meeting-today.component.scss']
})
export class MeetingTodayComponent implements OnInit {

  startIndex = 0;
  meeting: any;
  roomCount: number;
  fullscreenButton: boolean = false;

  constructor(
    private main: MainService
  ) { }

  ngOnInit() {
    document.body.className = 'login-layout light-login';
    this.getMeet().then(() => {
      setTimeout(() => { this.slide(); }, 1000);
    });
    setInterval(() => { this.getMeet(); }, 60 * 60 * 1000);
  }

  fullScreen() {
    if (screenfull.isEnabled) {
      this.fullscreenButton = !this.fullscreenButton;
      screenfull.toggle();
    }
  }

  getMeet() {
    return this.main.get('meetingget/toDay').then((res: any) => {
      this.meeting = res;
      this.roomCount = (res.ok) ? res.data.length : 0;
    });
  }

  slide() {
    $('.animate__animated').addClass('animate__backInLeft').removeClass('animate__backOutRight');
    const slides = Array.from(document.getElementsByClassName('mall-show-slide'));
    if (slides === []) { this.slide(); }
    for (const x of slides) {
      const y = x as HTMLElement;
      y.style.display = 'none';
    }
    if (this.startIndex > slides.length - 1) {
      this.startIndex = 0;
      const slide = slides[this.startIndex] as HTMLElement;
      slide.style.display = 'block';
      this.startIndex++;
    } else {
      const slide = slides[this.startIndex] as HTMLElement;
      slide.style.display = 'block';
      this.startIndex++;
    }
    setTimeout(() => {
      $('.animate__animated').addClass('animate__backOutRight').removeClass('animate__backInLeft');
    }, 9000);
    setTimeout(() => { this.slide() }, 10000);
  }

}
