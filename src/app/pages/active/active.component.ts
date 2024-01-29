import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MainService } from 'src/app/services';

@Component({
  selector: 'app-active',
  templateUrl: './active.component.html',
  styleUrls: ['./active.component.scss']
})
export class ActiveComponent implements OnInit {

  public loading: boolean = false;
  public active: boolean;
  public txtActive: string;
  public txtError: string;

  constructor(
    @Inject('HOSPITALNAMEEN') public hospitalNameEn: string,
    private route: ActivatedRoute,
    private main: MainService
  ) { }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.getActive(params.token);
    });
  }

  getActive(token: string) {
    this.main.get('signup/active/' + token).then((res: any) => {
      this.loading = true;
      this.active = res.ok;
      this.txtActive = res.txt;
      this.txtError = res.err;
    });
  }

}
