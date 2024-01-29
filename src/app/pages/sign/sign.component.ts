import { Component, OnInit, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { MainService, CryptoService } from 'src/app/services';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-sign',
  templateUrl: './sign.component.html',
  styleUrls: ['./sign.component.scss']
})
export class SignComponent implements OnInit {

  private jwtHelper = new JwtHelperService();

  public path: string;
  public overlay: boolean = false;
  public followup = 'followup';
  public sign = 'sign';

  constructor(
    @Inject('TOKENNAME') private tokenName: string,
    @Inject('DEFAULTPATH') private defaultPath: string,
    @Inject('HOSPITALNAME') public hospitalName: string,
    @Inject('HOSPITALNAMEEN') public hospitalNameEn: string,
    private router: Router,
    private route: ActivatedRoute,
    private main: MainService,
    private crypto: CryptoService
  ) { }

  ngOnInit() {
    this.path = this.route.snapshot.url[0].path;
    this.route.queryParams.subscribe(query => {
      (!query.followup) || sessionStorage.setItem(this.followup, query.followup);
      if (query.token && !this.jwtHelper.isTokenExpired(query.token)) {
        localStorage.setItem(this.tokenName, query.token);
        this.checkSignIn(query.token);
      }
    });
    this.route.params.subscribe((params) => {
      if (params.signin) {
        sessionStorage.setItem(this.sign, params.signin);
        this.router.navigate(['/' + this.path]);
      }
    });
    document.body.className = 'login-layout light-login';
    const token = localStorage.getItem(this.tokenName);
    try {
      if (!this.jwtHelper.isTokenExpired(token)) {
        this.checkSignIn(token);
      }
    } catch (err) {
      this.main.logout();
    }
  }

  checkSignIn(token: string) {
    let sign = sessionStorage.getItem(this.sign);
    let followup = sessionStorage.getItem(this.followup);
    let path = sessionStorage.getItem(this.defaultPath);
    if (!sign) {
      (path) ? this.router.navigate([path]) : this.router.navigate(['/']);
      sessionStorage.removeItem(this.defaultPath);
    } else {
      window.location.href = this.crypto.atou(sign) + '?token=' + token + '&followup=' + followup;
      sessionStorage.removeItem(this.sign);
      sessionStorage.removeItem(this.followup);
    }
  }

  onSignIn(e: any) {
    this.main.post('signin', e).then((res: any) => {
      if (res.ok) {
        localStorage.setItem(this.tokenName, res.token);
        this.checkSignIn(res.token);
      } else {
        Swal.fire({
          icon: 'error',
          text: res.err,
          allowOutsideClick: false
        });
      }
    });
  }

  public signUpSuccess: boolean = false;
  public dateNow: any = new Date();
  async onSignUp(e: any) {
    this.overlay = true;
    let hasImage = true;
    if (e.image) {
      const formData: FormData = new FormData();
      formData.append('image', e.image);
      formData.append('cid', e.signUp.cid);
      const res: any = await this.main.post('signup/avatar', formData);
      e.signUp.image = res.image;
      hasImage = res.ok;
      if (!res.ok) {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด !',
          text: 'ในการ Upload รูปภาพ ' + res.err,
          allowOutsideClick: false
        });
      }
    }
    if (hasImage) {
      this.main.post('signup', { signUp: e.signUp }).then((res: any) => {
        this.overlay = false;
        if (res.ok) {
          Swal.fire({
            icon: res.icon,
            title: res.title,
            text: res.text,
            allowOutsideClick: false
          }).then((result) => {
            this.signUpSuccess = true;
            this.dateNow = new Date();
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: res.title,
            text: res.err,
            allowOutsideClick: false
          });
        }
      });
    }
  }

}
