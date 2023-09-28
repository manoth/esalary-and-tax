import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MainService } from 'src/app/services';

import Swal from 'sweetalert2';
declare const $: any;

@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.scss']
})
export class ForgotComponent implements OnInit {

  public loading: boolean = false;
  public forgot = new Forgot();
  // public cid: string;
  public cidError: boolean = false;
  public otpError: boolean = false;
  public otpPage: boolean = false;

  public user: any;

  constructor(
    @Inject('TOKENNAME') private tokenName: string,
    public router: Router,
    public main: MainService
  ) { }

  ngOnInit() {
    $('#cid').focus();
  }

  onSendOtp() {
    if (!this.onOtp(this.forgot.otp)) {
      this.main.post('signin/otp', this.forgot).then((res: any) => {
        if (res.ok) {
          this.onClearInterval();
          Swal.fire({
            icon: 'success',
            title: 'รหัส OTP ถูกต้อง',
            text: 'กรุณาตั้งค่ารหัสผ่านใหม่!',
            allowOutsideClick: false
          }).then((result) => {
            if (result.value) {
              this.otpPage = false;
              this.forgot = new Forgot();
              localStorage.setItem(this.tokenName, res.token);
              this.router.navigate(['/settings/profile']);
            }
          });
        } else {
          Swal.fire({
            icon: 'error',
            text: res.err,
            allowOutsideClick: false
          });
        }
      });
    }
  }

  onCid(cid: string) {
    return this.cidError = (cid && this.checkCID(cid)) ? false : true;
  }

  onOtp(otp: string) {
    return this.otpError = (otp) ? false : true;
  }

  onSubmit() {
    if (!this.onCid(this.forgot.cid)) {
      this.loading = true;
      this.main.post('forgot', { cid: this.forgot.cid }).then((res: any) => {
        this.loading = false;
        if (res.ok) {
          this.otpPage = true;
          this.user = res.user;
          this.otpDate = { minutes: res.count, seconds: '00' };
          this.dateCount(res.user.otp_update, res.count);
          this.forgot.id_otp = res.user.id_otp;
        } else {
          Swal.fire({
            title: 'เกิดข้อผิดพลาด !',
            text: res.err,
            icon: 'error',
            allowOutsideClick: false
          })
        }
      });
    }
  }

  checkCID(cid: string) {
    if (cid.length == 13) {
      let sum = 0;
      for (let i = 0; i < 12; i++) { sum += parseFloat(cid.charAt(i)) * (13 - i); }
      return ((11 - sum % 11) % 10 != parseFloat(cid.charAt(12))) ? false : true;
    } else {
      return false;
    }
  }

  public otpDate: any = { minutes: '00', seconds: '00' };
  public interval: any;
  dateCount(date: any, count: any) {
    this.interval = setInterval(() => {
      const distance = ((new Date(date).getTime() + (1000 * 60 * count)) - new Date().getTime());
      this.otpDate.minutes = ('0' + Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).substr(-2);
      this.otpDate.seconds = ('0' + Math.floor((distance % (1000 * 60)) / 1000)).substr(-2);
      if (this.otpDate.minutes == '00' && this.otpDate.seconds == '00') {
        this.otpDate.minutes = '00';
        this.otpDate.seconds = '00';
        this.onClearInterval();
        Swal.fire({
          icon: 'error',
          title: 'เสียใจด้วย!',
          text: 'คุณหมดเวลาในการทำรายการแล้ว กรุณาทำรายการใหม่.',
          allowOutsideClick: false
        }).then((result) => {
          if (result.value) {
            this.otpPage = false;
            this.forgot = new Forgot();
          }
        });
      }
    }, 1000);
  }

  onClearInterval() {
    clearInterval(this.interval);
  }

}

export class Forgot {
  cid: string;
  id_otp: string;
  otp: string;
}
