import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/services';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  public decode: any;

  constructor(
    private main: MainService
  ) { }

  ngOnInit() {
    this.main.jwtDecode.then((decode: any) => {
      this.decode = decode;
    });
  }

  public get authGuard2() {
    return this.main.authGuard2;
  }

  public get authGuard3() {
    return this.main.authGuard3;
  }

}
