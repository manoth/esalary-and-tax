import { Component, OnInit, Inject } from '@angular/core';
import { MainService } from 'src/app/services';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  public loading: boolean = true;
  public decode: any;
  public profile: any;

  constructor(
    @Inject('TOKENNAME') private tokenName: string,
    private main: MainService
  ) {
    this.main.get('profile').then((res: any) => {
      this.decode = res.data;
      this.profile = { hospcode: res.data.hospcode, workgroup: res.data.workgroup, workgroup_sub: res.data.workgroup_sub };
      this.loading = false;
    });
  }

  ngOnDestroy() {
    this.main.jwtDecode.then();
  }

  ngOnInit() {
  }

  async onSignUp(e: any) {
    this.loading = true;
    let hasImage = true;
    if (e.image) {
      const formData: FormData = new FormData();
      formData.append('image', e.image);
      formData.append('cid', e.signUp.cid);
      const res: any = await this.main.post('profile/avatar', formData);
      e.signUp.image = res.image;
      hasImage = res.ok;
      this.loading = false;
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
      this.loading = true;
      this.main.post('profile', { profile: e.signUp }).then((res: any) => {
        this.loading = false;
        if (res.ok) {
          Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: res.title,
            showConfirmButton: false,
            timer: 1500,
            allowOutsideClick: false
          }).then(() => {
            localStorage.setItem(this.tokenName, res.token);
            this.main.jwtDecode.then();
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
