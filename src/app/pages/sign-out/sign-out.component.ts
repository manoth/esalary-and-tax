import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MainService, CryptoService } from 'src/app/services';

@Component({
  selector: 'app-sign-out',
  templateUrl: './sign-out.component.html',
  styleUrls: ['./sign-out.component.scss']
})
export class SignOutComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private main: MainService,
    private crypto: CryptoService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(query => {
      if (query.followup) {
        let followup = this.crypto.atou(query.followup);
        this.main.logout(followup);
      } else {
        this.main.logout();
      }
    });
  }

}
